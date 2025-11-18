import { supabase } from './supabase.ts';
import { NotificationPreferences } from '../types/types.ts';

// VAPID keys - In production, these should be environment variables
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BKxQzQy8q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8'; // Placeholder - replace with actual key
const VAPID_PRIVATE_KEY = import.meta.env.VITE_VAPID_PRIVATE_KEY || 'BKxQzQy8q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8'; // Placeholder - replace with actual key

// Warn if using placeholder keys
if (VAPID_PUBLIC_KEY === 'BKxQzQy8q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8') {
    console.warn('WARNING: Using placeholder VAPID keys. Push notifications will not work. Please set VITE_VAPID_PUBLIC_KEY and VITE_VAPID_PRIVATE_KEY environment variables.');
}

export class PushNotificationService {
    private static instance: PushNotificationService;
    private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
    private pushSubscription: PushSubscription | null = null;

    private constructor() {}

    static getInstance(): PushNotificationService {
        if (!PushNotificationService.instance) {
            PushNotificationService.instance = new PushNotificationService();
        }
        return PushNotificationService.instance;
    }

    // Check if push notifications are supported
    isSupported(): boolean {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    }

    // Register service worker
    async registerServiceWorker(): Promise<void> {
        if (!this.isSupported()) {
            throw new Error('Push notifications are not supported in this browser');
        }

        try {
            this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully');
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }

    // Request notification permission
    async requestPermission(): Promise<NotificationPermission> {
        if (!this.isSupported()) {
            throw new Error('Push notifications are not supported in this browser');
        }

        const permission = await Notification.requestPermission();
        return permission;
    }

    // Subscribe to push notifications
    async subscribeToPush(): Promise<PushSubscription | null> {
        if (!this.serviceWorkerRegistration) {
            await this.registerServiceWorker();
        }

        if (!this.serviceWorkerRegistration) {
            throw new Error('Service worker not registered');
        }

        try {
            const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer
            });

            this.pushSubscription = subscription;
            console.log('Push subscription created:', subscription);

            // Store subscription in database
            await this.storeSubscription(subscription);

            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            throw error;
        }
    }

    // Unsubscribe from push notifications
    async unsubscribeFromPush(): Promise<void> {
        if (this.pushSubscription) {
            await this.pushSubscription.unsubscribe();
            this.pushSubscription = null;

            // Remove subscription from database
            await this.removeSubscription();
        }
    }

    // Get current subscription
    async getSubscription(): Promise<PushSubscription | null> {
        if (!this.serviceWorkerRegistration) {
            await this.registerServiceWorker();
        }

        if (!this.serviceWorkerRegistration) {
            return null;
        }

        const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
        this.pushSubscription = subscription;
        return subscription;
    }

    // Store subscription in database
    private async storeSubscription(subscription: PushSubscription): Promise<void> {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const subscriptionData = {
            user_id: user.user.id,
            endpoint: subscription.endpoint,
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert(subscriptionData, { onConflict: 'user_id' });

        if (error) {
            console.error('Failed to store push subscription:', error);
        }
    }

    // Remove subscription from database
    private async removeSubscription(): Promise<void> {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.user.id);

        if (error) {
            console.error('Failed to remove push subscription:', error);
        }
    }

    // Send push notification (server-side function would call this)
    async sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<void> {
        // This would typically be called from a server-side function
        // For now, we'll simulate it by calling a Supabase Edge Function

        try {
            const { error } = await supabase.functions.invoke('send-push-notification', {
                body: {
                    userId,
                    title,
                    body,
                    data
                }
            });

            if (error) {
                console.error('Failed to send push notification:', error);
            }
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }

    // Check if user should receive push notification based on preferences
    shouldSendPush(userPreferences: NotificationPreferences, notificationType: 'matches' | 'messages' | 'events' | 'community'): boolean {
        if (!userPreferences.pushEnabled) return false;

        switch (notificationType) {
            case 'matches':
                return userPreferences.pushMatches;
            case 'messages':
                return userPreferences.pushMessages;
            case 'events':
                return userPreferences.pushEvents;
            case 'community':
                return userPreferences.pushCommunity;
            default:
                return false;
        }
    }

    // Utility function to convert VAPID key
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Utility function to convert ArrayBuffer to base64
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // Initialize push notifications for a user
    async initialize(userPreferences: NotificationPreferences): Promise<void> {
        if (!this.isSupported()) {
            console.log('Push notifications not supported');
            return;
        }

        try {
            // Register service worker
            await this.registerServiceWorker();

            // Check permission
            const permission = await this.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission not granted');
                return;
            }

            // Subscribe if push is enabled
            if (userPreferences.pushEnabled) {
                const subscription = await this.getSubscription();
                if (!subscription) {
                    await this.subscribeToPush();
                }
            } else {
                // Unsubscribe if push is disabled
                await this.unsubscribeFromPush();
            }
        } catch (error) {
            console.error('Failed to initialize push notifications:', error);
        }
    }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();