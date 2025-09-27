

import * as React from 'react';

const ChatListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 animate-pulse">
    <div className="w-14 h-14 rounded-full bg-neutral-800"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 rounded bg-neutral-800"></div>
      <div className="h-3 w-2/3 rounded bg-neutral-800"></div>
    </div>
  </div>
);

const ChatSkeleton: React.FC = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <ChatListItemSkeleton key={i} />
    ))}
  </div>
);

export default ChatSkeleton;
