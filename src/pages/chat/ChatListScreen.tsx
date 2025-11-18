
import * as React from 'react';
import { Conversation, MembershipType, Message } from '../../types/types.ts';
import { fetchConversations, getConversationDetails } from '../../services/api.ts';
import { useUser } from '../../hooks/useUser.ts';
import { usePresence } from '../../hooks/usePresence.ts';
import ChatSkeleton from '../../components/skeletons/ChatSkeleton.tsx';
import EmptyState from '../../components/common/EmptyState.tsx';
import { MessageSquare } from 'lucide-react';
import { formatMessageTime, getOptimizedUrl } from '../../utils/date.ts';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import { supabase } from '../../services/supabase.ts';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

interface ConversationItemProps {
    conversation: Conversation;
    isOnline: boolean;
    onClick: () => void;
    currentUserId: string;
}

const ConversationItem: React.FC<ConversationItemProps> = React.memo(({ conversation, onClick, currentUserId, isOnline }) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const isPremium = conversation.otherUser.membership === MembershipType.Premium;

    return (
        <MotionButton
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={onClick}
            className="w-full text-left flex items-center gap-4 p-4 hover:bg-primary-800/50 rounded-xl transition-colors duration-200"
        >
            <div className="relative flex-shrink-0">
                <div className={`relative w-14 h-14 rounded-full p-0.5 ${isPremium ? `bg-gradient-to-br ${PREMIUM_GRADIENT}` : ''}`}>
                    <img src={getOptimizedUrl(conversation.otherUser.profile_pics[0], { width: 56, height: 56 })} alt={conversation.otherUser.name} loading="lazy" className="w-full h-full rounded-full object-cover border-2 border-primary-900"/>
                </div>
                {isOnline && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-primary-900"></div>}
            </div>
            <div className="flex-1 overflow-hidden">
                <h3 className="font-bold truncate">{conversation.otherUser.name}</h3>
                <p className="text-sm text-primary-400 truncate">
                    {lastMessage ? `${lastMessage.senderId === currentUserId ? 'You: ' : ''}${lastMessage.text}` : "Say hello!"}
                </p>
            </div>
            <div className="flex flex-col items-end gap-1 self-start mt-1">
                <span className="text-xs text-primary-500">
                    {lastMessage ? formatMessageTime(lastMessage.created_at) : ''}
                </span>
                {conversation.unread_count > 0 && (
                    <div className="w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {conversation.unread_count}
                    </div>
                )}
            </div>
        </MotionButton>
    );
});

const ChatListScreen: React.FC<{ onConversationSelect: (conversation: Conversation) => void; }> = ({ onConversationSelect }) => {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useUser();
  const { onlineUsers } = usePresence();

  const loadConversations = React.useCallback(async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
          const convos = await fetchConversations(user.id);
          setConversations(convos);
      } catch(err) {
          console.error("Failed to fetch conversations", err);
      } finally {
          setLoading(false);
      }
  }, [user]);

  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  React.useEffect(() => {
    if (!user) return;
    
    // RLS on the messages table ensures the user only receives updates for their own conversations.
    // This is a highly performant approach that updates the UI in place without re-fetching the entire list.
    const channel = supabase.channel(`chat-list-updates-for-${user.id}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            },
            (payload) => {
                // FIX: The real-time payload from Supabase uses snake_case keys (e.g., sender_id)
                // which mismatches the app's camelCase Message type (senderId). This fix
                // correctly handles the incoming payload by mapping it to the Message type,
                // preventing a TypeScript error and ensuring data consistency in the state.
                const newMessagePayload = payload.new as any; // The payload from Supabase has snake_case keys

                // Ignore messages sent by the current user
                if (newMessagePayload.sender_id === user.id) {
                    return;
                }
                
                // Create a Message object that matches the application's type definition (camelCase)
                const newMessage: Message = {
                    id: newMessagePayload.id,
                    text: newMessagePayload.text,
                    senderId: newMessagePayload.sender_id,
                    created_at: newMessagePayload.created_at,
                    conversation_id: newMessagePayload.conversation_id,
                    is_read: newMessagePayload.is_read,
                };
                
                setConversations(currentConvos => {
                    const convoIndex = currentConvos.findIndex(c => c.id === newMessage.conversation_id);

                    // If conversation is not in the current list, it's a new match. Reload the list.
                    if (convoIndex === -1) {
                        loadConversations();
                        return currentConvos;
                    }

                    // Conversation exists, so we update it in place.
                    const convoToUpdate = { ...currentConvos[convoIndex] };
                    convoToUpdate.messages = [newMessage]; // Update with the latest message
                    convoToUpdate.unread_count = (convoToUpdate.unread_count || 0) + 1;

                    // Remove the old version of the conversation
                    const remainingConvos = currentConvos.filter(c => c.id !== newMessage.conversation_id);
                    
                    // Add the updated conversation to the top and set the new state
                    return [convoToUpdate, ...remainingConvos];
                });
            }
        )
        .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    }

  }, [user, loadConversations]);
  
  const handleConversationClick = async (convo: Conversation) => {
      if (!user) return;
      const detailedConvo = await getConversationDetails(convo.id, user.id);
      if (detailedConvo) {
        onConversationSelect(detailedConvo);
      }
  };

  return (
    <div className="p-4 md:p-6">
        {loading ? (
          <ChatSkeleton />
        ) : conversations.length > 0 && user?.id ? (
          <div className="space-y-2">
            <AnimatePresence>
                {conversations.map(convo => (
                  <ConversationItem 
                    key={convo.id} 
                    conversation={convo} 
                    onClick={() => handleConversationClick(convo)} 
                    currentUserId={user.id}
                    isOnline={onlineUsers.has(convo.otherUser.id)}
                  />
                ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
                icon={<MessageSquare className="w-16 h-16 text-primary-600" />}
                title="No Chats Yet"
                message="When you match with someone, your conversation will appear here. Time to get swiping!"
            />
          </div>
        )}
    </div>
  );
};
export default ChatListScreen;
