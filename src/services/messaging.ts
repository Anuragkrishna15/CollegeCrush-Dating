import { supabase } from './supabase.ts';
import { Message } from '../types/types.ts';

// Enhanced messaging service with retry logic and better error handling
export class MessagingService {
    private static instance: MessagingService;
    private retryQueue: Map<string, { message: any, retries: number }> = new Map();
    private maxRetries = 3;
    private retryDelay = 1000; // Start with 1 second
    private retryIntervalId: NodeJS.Timeout | null = null;

    private constructor() {
        // Start retry processor
        this.processRetryQueue();
    }

    static getInstance(): MessagingService {
        if (!MessagingService.instance) {
            MessagingService.instance = new MessagingService();
        }
        return MessagingService.instance;
    }

    async sendMessageWithRetry(
        conversationId: string, 
        text: string, 
        senderId: string
    ): Promise<Message> {
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        
        try {
            // First attempt
            const message = await this.attemptSendMessage(conversationId, text, senderId);
            return message;
        } catch (error) {
            console.error('Initial send failed, adding to retry queue:', error);
            
            // Add to retry queue
            this.retryQueue.set(tempId, {
                message: { conversationId, text, senderId },
                retries: 0
            });
            
            // Return a temporary message for optimistic UI
            throw {
                tempId,
                error: 'Message queued for retry',
                originalError: error
            };
        }
    }

    private async attemptSendMessage(
        conversationId: string,
        text: string,
        senderId: string
    ): Promise<Message> {
        // Check connection status first
        const isOnline = await this.checkConnection();
        if (!isOnline) {
            throw new Error('No connection available');
        }

        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                text,
                sender_id: senderId
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        if (!data) {
            throw new Error('No data returned from message insert');
        }

        // Transform the database response to match Message type
        const message: Message = {
            id: data.id,
            text: data.text,
            senderId: data.sender_id,
            created_at: data.created_at,
            conversation_id: data.conversation_id,
            is_read: data.is_read
        };

        return message;
    }

    private async checkConnection(): Promise<boolean> {
        try {
            // Quick ping to check if Supabase is reachable
            const { error } = await supabase
                .from('profiles')
                .select('id')
                .limit(1)
                .single();
            
            return !error;
        } catch {
            return false;
        }
    }

    private async processRetryQueue() {
        this.retryIntervalId = setInterval(async () => {
            if (this.retryQueue.size === 0) return;

            const isOnline = await this.checkConnection();
            if (!isOnline) return;

            for (const [tempId, item] of this.retryQueue.entries()) {
                if (item.retries >= this.maxRetries) {
                    console.error(`Message ${tempId} failed after ${this.maxRetries} retries`);
                    this.retryQueue.delete(tempId);
                    continue;
                }

                try {
                    const { conversationId, text, senderId } = item.message;
                    await this.attemptSendMessage(conversationId, text, senderId);

                    console.log(`Message ${tempId} sent successfully after ${item.retries} retries`);
                    this.retryQueue.delete(tempId);

                    // Notify UI of successful send (you can emit an event here)
                    this.notifyMessageSent(tempId);
                } catch (error) {
                    item.retries++;
                    console.log(`Retry ${item.retries} failed for message ${tempId}`);
                }
            }
        }, this.retryDelay);
    }

    private notifyMessageSent(tempId: string) {
        // Emit a custom event that the UI can listen to
        window.dispatchEvent(new CustomEvent('messageRetrySuccess', { 
            detail: { tempId } 
        }));
    }

    // Get pending messages count
    getPendingMessagesCount(): number {
        return this.retryQueue.size;
    }

    // Clear retry queue (useful for logout)
    clearRetryQueue() {
        this.retryQueue.clear();
        if (this.retryIntervalId) {
            clearInterval(this.retryIntervalId);
            this.retryIntervalId = null;
        }
    }
}

// Enhanced real-time subscription manager
export class RealtimeSubscriptionManager {
    private subscriptions: Map<string, any> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 2000;

    async subscribeToConversation(
        conversationId: string,
        onNewMessage: (message: Message) => void,
        onMessageUpdate: (message: Message) => void,
        onError?: (error: any) => void
    ) {
        // Unsubscribe from existing subscription if any
        this.unsubscribeFromConversation(conversationId);

        try {
            const channel = supabase
                .channel(`messages:${conversationId}`)
                .on('postgres_changes', 
                    { 
                        event: 'INSERT', 
                        schema: 'public', 
                        table: 'messages',
                        filter: `conversation_id=eq.${conversationId}`
                    }, 
                    (payload) => {
                        if (payload.new) {
                            const dbMessage = payload.new as any;
                            const message: Message = {
                                id: dbMessage.id,
                                text: dbMessage.text,
                                senderId: dbMessage.sender_id,
                                created_at: dbMessage.created_at,
                                conversation_id: dbMessage.conversation_id,
                                is_read: dbMessage.is_read
                            };
                            onNewMessage(message);
                        }
                    }
                )
                .on('postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${conversationId}`
                    },
                    (payload) => {
                        if (payload.new) {
                            const dbMessage = payload.new as any;
                            const message: Message = {
                                id: dbMessage.id,
                                text: dbMessage.text,
                                senderId: dbMessage.sender_id,
                                created_at: dbMessage.created_at,
                                conversation_id: dbMessage.conversation_id,
                                is_read: dbMessage.is_read
                            };
                            onMessageUpdate(message);
                        }
                    }
                )
                .on('system', { event: 'error' }, (error) => {
                    // Only treat as error if it's actually an error, not a success message
                    if (error?.status !== 'ok') {
                        console.error('Realtime subscription error:', error);
                        if (onError) onError(error);
                        this.handleReconnect(conversationId, onNewMessage, onMessageUpdate, onError);
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`Successfully subscribed to conversation ${conversationId}`);
                        this.reconnectAttempts = 0;
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error(`Failed to subscribe to conversation ${conversationId}`);
                        this.handleReconnect(conversationId, onNewMessage, onMessageUpdate, onError);
                    }
                });

            this.subscriptions.set(conversationId, channel);
        } catch (error) {
            console.error('Error setting up subscription:', error);
            if (onError) onError(error);
        }
    }

    private async handleReconnect(
        conversationId: string,
        onNewMessage: (message: Message) => void,
        onMessageUpdate: (message: Message) => void,
        onError?: (error: any) => void
    ) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`Max reconnection attempts reached for conversation ${conversationId}`);
            if (onError) onError(new Error('Max reconnection attempts reached'));
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        setTimeout(() => {
            this.subscribeToConversation(conversationId, onNewMessage, onMessageUpdate, onError);
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    unsubscribeFromConversation(conversationId: string) {
        const channel = this.subscriptions.get(conversationId);
        if (channel) {
            supabase.removeChannel(channel);
            this.subscriptions.delete(conversationId);
        }
    }

    unsubscribeAll() {
        for (const [id, channel] of this.subscriptions.entries()) {
            supabase.removeChannel(channel);
        }
        this.subscriptions.clear();
    }
}

// Export singleton instances
export const messagingService = MessagingService.getInstance();
export const realtimeManager = new RealtimeSubscriptionManager();
