

import * as React from 'react';
import { Screen, NotificationPreferences, PrivacySettings, MatchingPreferences } from '../types/types.ts';
import { User, Bell, Shield, Trash2, ChevronRight, Moon, Sun, Monitor, MessageSquare, FileText, ShieldCheck, Heart, Settings } from 'lucide-react';
import { useUser } from '../hooks/useUser.ts';
import { useTheme } from '../hooks/useTheme.ts';
import { deleteAccount, updateProfile } from '../services/api.ts';
import { useNotification } from '../hooks/useNotification.ts';
import { pushNotificationService } from '../services/pushNotifications.ts';
import { useMatchingPreferences } from '../hooks/useMatchingPreferences.ts';
import { FEEDBACK_EMAIL } from '../constants/constants.ts';

const SettingsScreen: React.FC<{setActiveScreen: (screen: Screen) => void}> = ({ setActiveScreen }) => {
    const { user, logout, refetchUser } = useUser();
    const { showNotification } = useNotification();
    const { preferences: matchingPrefs, savePreferences, resetToDefaults, variant } = useMatchingPreferences(user?.id);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Check if user is admin
    const isAdmin = React.useMemo(() => {
        if (!user?.email) return false;
        // TODO: Replace with proper admin role check from database
        return user.email.includes('admin') || user.email === 'admin@collegecrush.com';
    }, [user]);
    
    const defaultNotifications = { matches: true, messages: true, events: false, pushEnabled: false, pushMatches: false, pushMessages: false, pushEvents: false, pushCommunity: false };
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
    
    const handlePushNotificationToggle = async (enabled: boolean) => {
        if (enabled && !pushNotificationService.isSupported()) {
            showNotification("Push notifications are not supported in this browser.", "error");
            return;
        }

        if (enabled) {
            try {
                const permission = await pushNotificationService.requestPermission();
                if (permission !== 'granted') {
                    showNotification("Notification permission is required for push notifications.", "error");
                    return;
                }
            } catch (error) {
                showNotification("Failed to request notification permission.", "error");
                return;
            }
        }

        setNotifications(p => ({...p, pushEnabled: enabled}));
    };

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

                {/* Admin Section - Only show for admin users */}
                {isAdmin && (
                    <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                        <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Administration</h3>
                        <div className="divide-y divide-zinc-800">
                            <SettingItem icon={<ShieldCheck />} label="Admin Panel" onClick={() => setActiveScreen(Screen.Admin)} hasNav />
                        </div>
                    </div>
                )}
                
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

                 {/* Push Notifications Section */}
                 {pushNotificationService.isSupported() ? (
                     <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                          <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Push Notifications</h3>
                          <div className="divide-y divide-zinc-800">
                             <ToggleItem icon={<Bell />} label="Enable Push Notifications" isEnabled={notifications.pushEnabled} onToggle={() => handlePushNotificationToggle(!notifications.pushEnabled)} />
                             {notifications.pushEnabled && (
                                 <>
                                     <ToggleItem icon={<Bell />} label="Push: New Matches & Likes" isEnabled={notifications.pushMatches} onToggle={() => setNotifications(p => ({...p, pushMatches: !p.pushMatches}))} />
                                     <ToggleItem icon={<Bell />} label="Push: New Messages" isEnabled={notifications.pushMessages} onToggle={() => setNotifications(p => ({...p, pushMessages: !p.pushMessages}))} />
                                     <ToggleItem icon={<Bell />} label="Push: Event Reminders" isEnabled={notifications.pushEvents} onToggle={() => setNotifications(p => ({...p, pushEvents: !p.pushEvents}))} />
                                     <ToggleItem icon={<Bell />} label="Push: Community Interactions" isEnabled={notifications.pushCommunity} onToggle={() => setNotifications(p => ({...p, pushCommunity: !p.pushCommunity}))} />
                                 </>
                             )}
                         </div>
                     </div>
                 ) : (
                     <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                         <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Push Notifications</h3>
                         <div className="p-4 text-sm text-zinc-500">
                             Push notifications are not supported in this browser. Try using a modern browser like Chrome, Firefox, or Edge.
                         </div>
                     </div>
                 )}

                {/* Privacy Section */}
                <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                     <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Privacy</h3>
                     <div className="divide-y divide-zinc-800">
                        <ToggleItem icon={<Shield />} label="Show me on Swipe" isEnabled={privacy.showInSwipe} onToggle={() => setPrivacy(p => ({...p, showInSwipe: !p.showInSwipe}))} />
                     </div>
                </div>

                {/* Matching Preferences Section */}
                <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                     <h3 className="p-4 text-sm font-semibold text-zinc-400 border-b border-zinc-800">Matching Preferences</h3>
                     <div className="divide-y divide-zinc-800">
                        <div className="p-4">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Age Range</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="18"
                                    max="100"
                                    value={matchingPrefs.ageRange.min}
                                    onChange={(e) => savePreferences({ ageRange: { ...matchingPrefs.ageRange, min: parseInt(e.target.value) || 18 } })}
                                    className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                />
                                <span className="text-zinc-400">to</span>
                                <input
                                    type="number"
                                    min="18"
                                    max="100"
                                    value={matchingPrefs.ageRange.max}
                                    onChange={(e) => savePreferences({ ageRange: { ...matchingPrefs.ageRange, max: parseInt(e.target.value) || 25 } })}
                                    className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                />
                            </div>
                        </div>
                        <div className="p-4">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Maximum Distance (km)</label>
                            <input
                                type="number"
                                min="1"
                                max="500"
                                value={matchingPrefs.maxDistance}
                                onChange={(e) => savePreferences({ maxDistance: parseInt(e.target.value) || 50 })}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                        </div>
                        <div className="p-4">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Preferred Genders</label>
                            <div className="flex flex-wrap gap-2">
                                {['Male', 'Female', 'Other'].map(gender => (
                                    <button
                                        key={gender}
                                        onClick={() => {
                                            const newGenders = matchingPrefs.preferredGenders.includes(gender as any)
                                                ? matchingPrefs.preferredGenders.filter(g => g !== gender)
                                                : [...matchingPrefs.preferredGenders, gender as any];
                                            savePreferences({ preferredGenders: newGenders });
                                        }}
                                        className={`px-3 py-1 rounded-lg text-sm ${
                                            matchingPrefs.preferredGenders.includes(gender as any)
                                                ? 'bg-pink-600 text-white'
                                                : 'bg-zinc-700 text-zinc-300'
                                        }`}
                                    >
                                        {gender}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Algorithm Weights</label>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm text-zinc-400 mb-1">
                                        <span>Compatibility</span>
                                        <span>{Math.round(matchingPrefs.compatibilityWeight * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={matchingPrefs.compatibilityWeight}
                                        onChange={(e) => savePreferences({ compatibilityWeight: parseFloat(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm text-zinc-400 mb-1">
                                        <span>Activity</span>
                                        <span>{Math.round(matchingPrefs.activityWeight * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={matchingPrefs.activityWeight}
                                        onChange={(e) => savePreferences({ activityWeight: parseFloat(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm text-zinc-400 mb-1">
                                        <span>Diversity</span>
                                        <span>{Math.round(matchingPrefs.diversityWeight * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={matchingPrefs.diversityWeight}
                                        onChange={(e) => savePreferences({ diversityWeight: parseFloat(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-400">Algorithm Variant</span>
                                <span className="text-sm text-pink-400 font-medium">{variant}</span>
                            </div>
                        </div>
                        <SettingItem icon={<Settings />} label="Reset to Defaults" onClick={resetToDefaults} />
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
