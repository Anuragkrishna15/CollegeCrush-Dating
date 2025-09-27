
import * as React from 'react';
import { fetchNotifications } from '../../services/api.ts';
import { AppNotification, NotificationType } from '../../types/types.ts';
import { useUser } from '../../hooks/useUser.ts';
import { useNotification as useToast } from '../../hooks/useNotification.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import EmptyState from '../common/EmptyState.tsx';
import { Bell, Heart, MessageSquare, CalendarCheck, CheckCircle } from 'lucide-react';
import { formatNotificationDate } from '../../utils/date.ts';

interface NotificationsScreenProps {
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: AppNotification) => void;
}

const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case 'new_match':
            return <Heart className="w-6 h-6 text-pink-400" />;
        case 'new_message':
            return <MessageSquare className="w-6 h-6 text-blue-400" />;
        case 'new_blind_date_request':
        case 'blind_date_accepted':
            return <CalendarCheck className="w-6 h-6 text-purple-400" />;
        case 'vibe_check_match':
             return <CheckCircle className="w-6 h-6 text-green-400" />;
        default:
            return <Bell className="w-6 h-6 text-neutral-400" />;
    }
};

const NotificationCard: React.FC<{ notification: AppNotification; onClick: () => void; }> = React.memo(function NotificationCard({ notification, onClick }) {
    return (
        <button onClick={onClick} className={`w-full text-left flex items-start gap-4 p-4 transition-colors duration-300 hover:bg-neutral-800 ${notification.is_read ? 'opacity-60' : 'bg-pink-500/5'}`}>
            <div className="mt-1 flex-shrink-0">
                {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1">
                <p className="text-neutral-200">{notification.message}</p>
            </div>
            <div className="text-xs text-neutral-500 mt-1 flex-shrink-0">
                {formatNotificationDate(notification.created_at)}
            </div>
        </button>
    );
});


const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onMarkAllAsRead, onNotificationClick }) => {
    const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
    const [loading, setLoading] = React.useState(true);
    const { user } = useUser();
    const { showNotification: showToast } = useToast();
    
    React.useEffect(() => {
        if (user) {
            setLoading(true);
            fetchNotifications(user.id)
                .then(setNotifications)
                .catch(err => {
                    console.error("Failed to fetch notifications:", err);
                    showToast("Could not load your notifications.", "error");
                })
                .finally(() => setLoading(false));
        }
    }, [user, showToast]);

    const handleMarkAllReadClick = () => {
        onMarkAllAsRead();
        // Optimistically update the UI
        setNotifications(currentNotifications => 
            currentNotifications.map(n => ({ ...n, is_read: true }))
        );
        showToast("All notifications marked as read.", "success");
    };

    const hasUnread = notifications.some(n => !n.is_read);

    return (
        <div className="relative h-full">
            <div className="p-4 md:p-6">
                 {loading ? (
                    <div className="flex justify-center mt-10">
                        <LoadingSpinner />
                    </div>
                ) : notifications.length > 0 ? (
                    <>
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={handleMarkAllReadClick}
                                disabled={!hasUnread}
                                className="px-4 py-2 text-sm font-semibold text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Mark all as read
                            </button>
                        </div>
                        <div className="divide-y divide-neutral-800 bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800">
                            {notifications.map(n => <NotificationCard key={n.id} notification={n} onClick={() => onNotificationClick(n)} />)}
                        </div>
                    </>
                ) : (
                    <EmptyState 
                        icon={<Bell size={64} />}
                        title="All Caught Up!"
                        message="You have no new notifications. We'll let you know when something new happens."
                    />
                )}
            </div>
        </div>
    );
};

export default NotificationsScreen;
