

import * as React from 'react';
import { Conversation, Profile } from '../types/types.ts';
import ChatListScreen from './chat/ChatListScreen.tsx';
import ChatDetailScreen from './chat/ChatDetailScreen.tsx';

interface ChatScreenProps {
    onProfileClick: (profile: Profile) => void;
    activeConversation: Conversation | null;
    setActiveConversation: (conversation: Conversation | null) => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ onProfileClick, activeConversation, setActiveConversation }) => {
  if (activeConversation) {
    return <ChatDetailScreen 
              conversation={activeConversation} 
              onBack={() => setActiveConversation(null)} 
              onProfileClick={onProfileClick} 
            />;
  }

  return <ChatListScreen onConversationSelect={setActiveConversation} />;
};

export default ChatScreen;
