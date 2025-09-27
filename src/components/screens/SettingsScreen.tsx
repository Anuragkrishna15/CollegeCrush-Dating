

import * as React from 'react';
import { Screen, NotificationPreferences, PrivacySettings } from '../../types/types.ts';
import { User, Bell, Shield, Trash2, ChevronRight, Moon, Sun, Monitor, MessageSquare, FileText } from 'lucide-react';
import { useUser } from '../../hooks/useUser.ts';
import { useTheme } from '../../hooks/useTheme.ts';
import { deleteAccount, updateProfile } from '../../services/api.ts';
import { useNotification } from '../../hooks/useNotification.ts';
import { FEEDBACK_EMAIL } from '../../constants/constants.ts';

const SettingsScreen: React.FC<{setActiveScreen: (screen: Screen) => void}> = ({ setActiveScreen }) => {
    const { user, logout, refetchUser } = useUser();
    const { showNotification } = useNotification();
    const [isDeleting, setIsDeleting] = React.useState(false);
    
    const defaultNotifications = { matches: true, messages: true, events: false };
    const defaultPrivacy = { showInSwipe: true };

    const [notifications, setNotifications] = React.useState<NotificationPreferences>(defaultNotifications);
    const [privacy, setPrivacy] = React.useState<PrivacySettings>(defaultPrivacy);
    const isInitialized = React.useRef(false);

    // Effect to populate settings from user object when it loads
    React.useEffect(() => {
        if (user) {
            setNotifications(user.notification_preferences || defaultNotifications);
            setPrivacy(user.privacy_settings || defaultPrivacy);
            // Use a ref to ensure this only happens once, preventing save-on-load
            setTimeout(() => {
                isInitialized.current = true;
            }, 500);
        }
    }, [user]);

     // Debounced effect to save settings to the backend
    React.useEffect(() => {
        if (!isInitialized.current || !user) {
            return;
        }

        const handler = setTimeout(async () => {
            try {
                await updateProfile(user.id, {
                    notification_preferences: notifications as any,
                    privacy_settings: privacy as any,
                });
                refetchUser(); // refetch user to update context state
                showNotification('Settings saved', 'success');
            } catch (error) {
                showNotification('Could not save settings.', 'error');
            }
        }, 1000); // 1-second debounce

        return () => {
            clearTimeout(handler);
        };
    }, [notifications, privacy, user, showNotification, refetchUser]);
    
    const handleDeleteAccount = async () => {
        const confirmation = confirm("Are you sure you want to delete your account? This action is irreversible and will permanently delete all your data, including your profile, matches, and conversations.");
        if (confirmation) {
            setIsDeleting(true);
            try {
                await deleteAccount();
                showNotification("Your account has been successfully deleted.", "success");
                await logout();
            } catch (error: any) {
                showNotification(error.message, "error");
                setIsDeleting(false);
            }
        }
    }

    const SettingItem: React.FC<{icon: React.ReactNode, label: string, onClick?: () => void, hasNav?: boolean}> = ({icon, label, onClick, hasNav = false}) => (
        <button onClick={onClick} className="w-full text-left flex justify-between items-center p-4 hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-4">
                {icon}
                <span className="text-base">{label}</span>
            </div>
            {hasNav && <ChevronRight size={20} className="text-zinc-500"/>}
        </button>
    );

    const ToggleItem: React.FC<{icon: React.ReactNode, label: string, isEnabled: boolean, onToggle: () => void}> = ({icon, label, isEnabled, onToggle}) => (
        <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-4">
                {icon}
                <span className="text-base">{label}</span>
            </div>
            <button onClick={onToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isEnabled ? 'bg-pink-600' : 'bg-zinc-700'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
    
    const ThemeSwitcher = () => {
        const { theme, toggleTheme } = useTheme();

        const getIcon = () => {
            switch (theme) {
                case 'light': return <Sun />;
                case 'dark': return <Moon />;
                case 'system': return <Monitor />;
            }
        };
        const getLabel = () => {
            switch (theme) {
                case 'light': return 'Light';
                case 'dark': return 'Dark';
                case 'system': return 'System Default';
            }
        }
        return (
             <SettingItem icon={getIcon()} label={`Theme: ${getLabel()}`} onClick={toggleTheme} />
        )
    };


    return (
        <div className="relative h-full">
            <div className="p-4 md:p-6 space-y-8 pb-12">
                {/* Account Section */}
                <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                    <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Account</h3>
                    <div className="divide-y divide-zinc-800">
                        <SettingItem icon={<User />} label="Edit Profile" onClick={() => setActiveScreen(Screen.EditProfile)} hasNav />
                    </div>
                </div>
                
                 {/* Theme Section */}
                <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                     <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Appearance</h3>
                     <div className="divide-y divide-zinc-800">
                        <ThemeSwitcher />
                     </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                     <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Notifications</h3>
                     <div className="divide-y divide-zinc-800">
                        <ToggleItem icon={<Bell />} label="New Matches & Likes" isEnabled={notifications.matches} onToggle={() => setNotifications(p => ({...p, matches: !p.matches}))} />
                        <ToggleItem icon={<Bell />} label="New Messages" isEnabled={notifications.messages} onToggle={() => setNotifications(p => ({...p, messages: !p.messages}))} />
                        <ToggleItem icon={<Bell />} label="Event Reminders" isEnabled={notifications.events} onToggle={() => setNotifications(p => ({...p, events: !p.events}))} />
                    </div>
                </div>

                {/* Privacy Section */}
                <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                     <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Privacy</h3>
                     <div className="divide-y divide-zinc-800">
                        <ToggleItem icon={<Shield />} label="Show me on Swipe" isEnabled={privacy.showInSwipe} onToggle={() => setPrivacy(p => ({...p, showInSwipe: !p.showInSwipe}))} />
                     </div>
                </div>

                {/* Feedback & Support Section */}
                <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                    <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Feedback & Support</h3>
                    <div className="divide-y divide-zinc-800">
                        <SettingItem icon={<MessageSquare />} label="Send Feedback" onClick={() => window.location.href = `mailto:${FEEDBACK_EMAIL}`} />
                    </div>
                </div>

                {/* Legal Section */}
                <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                    <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Legal</h3>
                    <div className="divide-y divide-zinc-800">
                        <SettingItem icon={<FileText />} label="Terms of Service" onClick={() => alert("Terms of Service page will be added here.")} hasNav />
                        <SettingItem icon={<Shield />} label="Privacy Policy" onClick={() => alert("Privacy Policy page will be added here.")} hasNav />
                    </div>
                </div>
                
                {/* Danger Zone */}
                <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                     <div className="divide-y divide-zinc-800">
                        <button onClick={handleDeleteAccount} disabled={isDeleting} className="w-full text-left flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                           <Trash2 />
                           <span className="text-base font-semibold">{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
                        </button>
                     </div>
                </div>

                <div className="text-center text-xs text-zinc-600 pt-4">
                    CollegeCrush Beta v0.1.0
                </div>

            </div>
        </div>
    );
};

export default SettingsScreen;
