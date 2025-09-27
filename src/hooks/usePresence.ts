
import * as React from 'react';
import { supabase } from '../services/supabase.ts';
import { useUser } from './useUser.ts';

interface PresenceContextType {
    onlineUsers: Set<string>;
}

export const PresenceContext = React.createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
    const { user } = useUser();
    const [onlineUsers, setOnlineUsers] = React.useState(new Set<string>());
    // FIX: Infer RealtimeChannel type from the supabase client to avoid import issues.
    const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);

    React.useEffect(() => {
        if (!user) {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            setOnlineUsers(new Set());
            return;
        }

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        const updateOnlineUsers = () => {
            const presenceState = channel.presenceState();
            const userIds = Object.keys(presenceState).map(key => (presenceState[key][0] as any).user_id as string);
            setOnlineUsers(new Set(userIds));
        };
        
        channel.on('presence', { event: 'sync' }, updateOnlineUsers);
        channel.on('presence', { event: 'join' }, updateOnlineUsers);
        channel.on('presence', { event: 'leave' }, updateOnlineUsers);


        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ online_at: new Date().toISOString(), user_id: user.id });
            }
        });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [user]);

    const value = React.useMemo(() => ({ onlineUsers }), [onlineUsers]);

    return React.createElement(PresenceContext.Provider, { value }, children);
};


export const usePresence = (): PresenceContextType => {
    const context = React.useContext(PresenceContext);
    if (!context) {
        throw new Error('usePresence must be used within a PresenceProvider');
    }
    return context;
};
