
import * as React from 'react';
import { Conversation, Message, Profile, MembershipType } from '../../types/types.ts';
import { useUser } from '../../hooks/useUser.ts';
import { useNotification } from '../../hooks/useNotification.ts';
import { usePresence } from '../../hooks/usePresence.ts';
import { getConversationDetails, getMessages, getProfile, markMessagesAsRead } from '../../services/api.ts';
import { messagingService, realtimeManager } from '../../services/messaging.ts';
import { supabase } from '../../services/supabase.ts';
import LoadingSpinner from '../../components/LoadingSpinner.tsx';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import { ArrowLeft, Send, Sparkles, X, Check, CheckCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMessageTime, formatDateSeparator, getOptimizedUrl } from '../../utils/date.ts';
import { IcebreakerGenerator } from '../../components/chat/IcebreakerGenerator.tsx';
import RizzMeter from '../../components/RizzMeter.tsx';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

interface ChatDetailScreenProps {
  conversation: Conversation;
  onBack: () => void;
  onProfileClick: (profile: Profile) => void;
}

type UIMessage = Message & { status?: 'sending' | 'queued' };

interface MessageBubbleProps {
    message: UIMessage;
    isCurrentUser: boolean;
}



const DateSeparator: React.FC<{ date: string }> = ({ date }) => (
    <div className="flex justify-center my-4">
        <span className="bg-primary-800/80 backdrop-blur-sm text-primary-400 text-xs font-semibold px-3 py-1 rounded-full">
            {formatDateSeparator(date)}
        </span>
    </div>
);

const ReadStatusIcon: React.FC<{ isRead: boolean }> = React.memo(({ isRead }) => {
    if (isRead) {
        return <CheckCheck size={16} className="text-primary-400" />;
    }
    return <Check size={16} className="text-white/70" />;
});


const MessageBubble = React.memo(function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
    const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
    const bubbleStyles = isCurrentUser
        ? `bg-gradient-to-r ${PREMIUM_GRADIENT} text-white`
        : 'bg-gradient-to-br from-primary-800 to-primary-700 text-primary-200';
    
    const bubbleShape = isCurrentUser
        ? 'rounded-t-2xl rounded-bl-2xl'
        : 'rounded-t-2xl rounded-br-2xl';

    return (
        <MotionDiv 
            layout
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`flex items-end gap-2 ${alignment} w-full`}
        >
            <div className={`relative max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 shadow-md ${bubbleStyles} ${bubbleShape}`}>
                <p className="break-words whitespace-pre-wrap">{message.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                     <p className={`text-xs ${isCurrentUser ? 'text-white/70' : 'text-primary-500'}`}>{formatMessageTime(message.created_at)}</p>
                     {isCurrentUser && (message.status === 'sending' ? <Clock size={16} className="text-white/70" /> : <ReadStatusIcon isRead={message.is_read} />)}
                </div>
            </div>
        </MotionDiv>
    );
});

function ChatDetailScreen({ conversation, onBack, onProfileClick }: ChatDetailScreenProps) {
  const { user } = useUser();
  const { showNotification } = useNotification();
  const { onlineUsers } = usePresence();
  const [messages, setMessages] = React.useState<UIMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [newMessage, setNewMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [showRizzMeter, setShowRizzMeter] = React.useState(false);
  const [showRizzButton, setShowRizzButton] = React.useState(false);
  const messagesEndRef = React.useRef<null | HTMLDivElement>(null);
  const textareaRef = React.useRef<null | HTMLTextAreaElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = React.useRef<number | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = React.useState(false);
  const typingTimeoutRef = React.useRef<any>(null);
  // FIX: Infer RealtimeChannel type from the supabase client to avoid import issues.
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastBroadcastTime = React.useRef(0);

  const hasCheckedRizz = React.useRef(false);
  const lastConnectionErrorTime = React.useRef(0);

  const isOtherUserOnline = onlineUsers.has(conversation.otherUser.id);
  const isPremium = conversation.otherUser.membership === MembershipType.Premium;

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto'; // Reset height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
    }
  }, [newMessage]);
  
  const loadInitialMessages = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const fullConvo = await getConversationDetails(conversation.id, user.id);
        if (fullConvo) {
            setMessages(fullConvo.messages);
            setShowRizzButton(fullConvo.messages.length >= 4 && !hasCheckedRizz.current);
            setHasMore(fullConvo.messages.length > 0);
            setCurrentPage(1);
            // Mark messages as read after loading them
            await markMessagesAsRead(conversation.id, user.id);
        } else {
             setHasMore(false);
        }
    } catch (error) {
        showNotification("Failed to load conversation", "error");
    } finally {
        setLoading(false);
    }
  }, [conversation.id, user, showNotification]);

  React.useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);
  
  // Typing indicator subscription
  React.useEffect(() => {
    if (!user) return;
    
    const typingChannel = supabase.channel(`typing:${conversation.id}`, {
        config: { broadcast: { self: false } }
    });
    
    typingChannel.on('broadcast', { event: 'typing' }, () => {
        setIsOtherUserTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsOtherUserTyping(false), 3000);
    }).subscribe();
    
    channelRef.current = typingChannel;

    return () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [conversation.id, user]);

  React.useEffect(() => {
      if (!loading) {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }
  }, [messages, loading]);
  
  const handleLoadMore = React.useCallback(async () => {
    if (!hasMore || loadingMore) return;

    if (scrollContainerRef.current) {
        prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
    }

    setLoadingMore(true);
    try {
        const olderMessages = await getMessages(conversation.id, currentPage);
        if (olderMessages.length > 0) {
            setMessages(prev => [...olderMessages, ...prev]);
            setCurrentPage(prev => prev + 1);
        } else {
            setHasMore(false);
            setLoadingMore(false);
        }
    } catch (error) {
        showNotification("Failed to load older messages", "error");
        setLoadingMore(false);
    }
  }, [hasMore, loadingMore, conversation.id, currentPage, showNotification]);
  
  // Effect for infinite scroll trigger
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 1 && hasMore && !loadingMore) {
        handleLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
        if (container) {
             container.removeEventListener('scroll', handleScroll);
        }
    };
  }, [hasMore, loadingMore, handleLoadMore]);
  
  // Effect to maintain scroll position after loading more messages
  React.useLayoutEffect(() => {
    if (loadingMore && prevScrollHeightRef.current !== null && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollHeightAfter = container.scrollHeight;
        
        container.scrollTop = scrollHeightAfter - prevScrollHeightRef.current;
        
        prevScrollHeightRef.current = null; // Reset for next load
        setLoadingMore(false);
    }
  }, [messages, loadingMore]);

  // Enhanced real-time subscription with better error handling
  React.useEffect(() => {
    if (!user) return;
    
    realtimeManager.subscribeToConversation(
        conversation.id,
        // On new message
        (newMessage) => {
            if (newMessage.senderId !== user.id) {
                setMessages(prev => {
                    if (prev.some(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
                // Mark incoming message as read since user is on the screen
                markMessagesAsRead(conversation.id, user.id);
            }
        },
        // On message update
        (updatedMessage) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === updatedMessage.id
                        ? { ...msg, is_read: updatedMessage.is_read }
                        : msg
                )
            );
        },
        // On error
        (error) => {
            console.error('Realtime subscription error:', error);
            const now = Date.now();
            if (now - lastConnectionErrorTime.current > 30000) { // 30 seconds cooldown
                showNotification('Connection issue. Messages may be delayed.', 'info');
                lastConnectionErrorTime.current = now;
            }
        }
    );
    
    // Listen for retry success events
    const handleRetrySuccess = (event: CustomEvent) => {
        const { tempId } = event.detail;
        // Reload messages to get the actual sent message
        loadInitialMessages();
    };
    
    window.addEventListener('messageRetrySuccess', handleRetrySuccess as EventListener);
    
    return () => {
        realtimeManager.unsubscribeFromConversation(conversation.id);
        window.removeEventListener('messageRetrySuccess', handleRetrySuccess as EventListener);
    };
  }, [conversation.id, user?.id, loadInitialMessages, showNotification]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    const textToSend = newMessage;
    setNewMessage('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: UIMessage = {
        id: tempId,
        text: textToSend,
        senderId: user.id,
        created_at: new Date().toISOString(),
        conversation_id: conversation.id,
        is_read: false,
        status: 'sending',
    };
    
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);

    try {
        const sentMessage = await messagingService.sendMessageWithRetry(conversation.id, textToSend, user.id);
        // Replace optimistic message with the real one from the server
        setMessages(prevMessages => 
            prevMessages.map(msg => msg.id === tempId ? sentMessage : msg)
        );
    } catch(err: any) {
        if (err.tempId) {
            // Message is queued for retry, show a different status
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === tempId
                        ? { ...msg, status: 'queued' as any }
                        : msg
                )
            );
            showNotification("Message queued. Will retry sending.", "info");
        } else {
            // Complete failure, revert
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempId));
            setNewMessage(textToSend); // Restore text to input
            showNotification(err.message || "Failed to send message", "error");
        }
    } finally {
        setIsSending(false);
    }
  };
  
  const handleTyping = () => {
    const now = Date.now();
    if (now - lastBroadcastTime.current > 1500) { // 1.5 second throttle
        lastBroadcastTime.current = now;
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing'
            });
        }
    }
  };

  const handleSelectIcebreaker = (icebreaker: string) => {
    setNewMessage(icebreaker);
    textareaRef.current?.focus();
  };

  const handleHeaderClick = async () => {
    try {
      const fullProfile = await getProfile(conversation.otherUser.id);
      if (fullProfile) {
          onProfileClick(fullProfile);
      } else {
          showNotification("Could not load profile.", "error");
      }
    } catch (error) {
        showNotification("Could not load profile.", "error");
    }
  };
  
  const handleRizzCheck = () => {
    if (!user) return;
    setShowRizzButton(false);
    setShowRizzMeter(true);
    hasCheckedRizz.current = true;
  };

   const renderMessagesWithSeparators = () => {
        const messageElements: React.ReactNode[] = [];
        let lastDate: string | null = null;

        messages.forEach((msg, index) => {
            const currentDate = new Date(msg.created_at).toDateString();
            if (currentDate !== lastDate) {
                messageElements.push(<DateSeparator key={`sep-${currentDate}`} date={msg.created_at} />);
                lastDate = currentDate;
            }
            messageElements.push(
                <MessageBubble key={msg.id} message={msg} isCurrentUser={msg.senderId === user?.id} />
            );
        });
        return messageElements;
    };


  if (!user || loading) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="h-full flex flex-col bg-primary-950">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center p-4 border-b border-primary-800 bg-primary-950/70 backdrop-blur-lg sticky top-0 z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-primary-800 mr-2">
            <ArrowLeft />
        </button>
        <button onClick={handleHeaderClick} className="flex items-center text-left hover:bg-primary-800 p-1 rounded-lg transition-colors">
            <div className={`relative w-10 h-10 rounded-full p-0.5 flex-shrink-0 ${isPremium ? `bg-gradient-to-br ${PREMIUM_GRADIENT}` : ''}`}>
                <img src={getOptimizedUrl(conversation.otherUser.profile_pics[0], { width: 40, height: 40 })} alt={conversation.otherUser.name} loading="lazy" className="w-full h-full rounded-full object-cover border-2 border-primary-900"/>
            </div>
            <div className="ml-3">
                <h2 className="font-bold text-lg">{conversation.otherUser.name}</h2>
                <div className="relative h-4"> {/* Reserve space for the typing indicator */}
                    <AnimatePresence>
                        {isOtherUserOnline ? (
                             <MotionDiv
                                key="online-indicator"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-xs text-primary-400 font-semibold absolute bottom-0 left-0"
                            >
                                Online
                            </MotionDiv>
                        ) : isOtherUserTyping && (
                            <MotionDiv
                                key="typing-indicator"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.3 }}
                                className="text-xs text-primary-400 absolute bottom-0 left-0"
                            >
                                typing...
                            </MotionDiv>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto p-4 space-y-2 bg-primary-950">
        {loadingMore && (
            <div className="flex justify-center py-4">
                <LoadingSpinner />
            </div>
        )}
        <AnimatePresence initial={false}>
            {renderMessagesWithSeparators()}
        </AnimatePresence>
        <div ref={messagesEndRef} />
        
        <AnimatePresence>
            {showRizzButton && (
                 <MotionDiv
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-4 right-4 z-20"
                 >
                    <button 
                        onClick={handleRizzCheck}
                        className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <Sparkles size={16} /> Check Rizz
                    </button>
                </MotionDiv>
            )}
            {showRizzMeter && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <MotionDiv
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-full max-w-md mx-auto"
                    >
                        <button
                            onClick={() => setShowRizzMeter(false)}
                            className="absolute -top-3 -right-3 z-10 bg-primary-800 rounded-full p-2 text-primary-400 hover:text-white shadow-lg transition-colors"
                        >
                            <X size={24}/>
                        </button>
                        <RizzMeter messages={messages.filter(m => !m.status)} currentUserId={user?.id || ''} />
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>

      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-primary-800 bg-primary-950/70 backdrop-blur-lg">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 relative">
                {!newMessage.trim() && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <IcebreakerGenerator otherUser={conversation.otherUser} onSelect={handleSelectIcebreaker} />
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={e => {
                        setNewMessage(e.target.value);
                        handleTyping();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className={`w-full p-3 bg-primary-800 border border-primary-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none max-h-32 ${!newMessage.trim() ? 'pl-12' : ''}`}
                />
            </div>
            <MotionButton
              aria-label="Send message"
              whileTap={{ scale: 0.9 }}
              type="submit" disabled={isSending || !newMessage.trim()} className={`p-3 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${PREMIUM_GRADIENT}`}>
                 <Send />
            </MotionButton>
        </form>
      </div>
    </div>
  );
};
export default ChatDetailScreen;
