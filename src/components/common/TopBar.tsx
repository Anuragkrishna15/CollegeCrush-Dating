
import * as React from 'react';
import { Screen } from '../../types/types.ts';
import { Bell, ArrowLeft, Sun, Moon, Monitor, LogOut, Download } from 'lucide-react';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import { useTheme } from '../../hooks/useTheme.ts';
import { useUser } from '../../hooks/useUser.ts';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';

interface TopBarProps {
    activeScreen: Screen;
    unreadCount: number;
    setActiveScreen: (screen: Screen) => void;
}

const screenConfig: Record<string, { title: string; showBackTo?: Screen }> = {
    [Screen.Swipe]: { title: 'CollegeCrush' },
    [Screen.Likes]: { title: 'Who Likes You' },
    [Screen.Dates]: { title: 'Blind Dates' },
    [Screen.Chat]: { title: 'Chats' },
    [Screen.Trips]: { title: 'Getaways' },
    [Screen.Events]: { title: 'College Events' },
    [Screen.Profile]: { title: 'Profile' },
    [Screen.Settings]: { title: 'Settings', showBackTo: Screen.Profile },
    [Screen.EditProfile]: { title: 'Edit Profile', showBackTo: Screen.Profile },
    [Screen.Notifications]: { title: 'Notifications' },
};

const TopBar: React.FC<TopBarProps> = ({ activeScreen, unreadCount, setActiveScreen }) => {
    const config = screenConfig[activeScreen];
    const { theme, toggleTheme } = useTheme();
    const { logout } = useUser();
    const { isInstallable, installPWA } = usePWAInstall();
    if (!config) return null;

    const handleBack = () => {
        if (config.showBackTo) {
            setActiveScreen(config.showBackTo);
        }
    };

    const getThemeIcon = () => {
        switch (theme) {
            case 'light': return <Sun size={20} />;
            case 'dark': return <Moon size={20} />;
            case 'system': return <Monitor size={20} />;
            default: return <Monitor size={20} />;
        }
    };

    const isSwipeScreen = activeScreen === Screen.Swipe;

    return (
        <div className="sticky top-0 left-0 right-0 z-30 bg-zinc-950/70 backdrop-blur-lg p-4 safe-top flex justify-between items-center border-b border-zinc-800/50 h-20">
            <div className="flex items-center gap-2">
                {config.showBackTo && (
                     <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-800">
                        <ArrowLeft />
                    </button>
                )}
                 <h1 className={`font-bold ${isSwipeScreen ? `text-3xl bg-clip-text text-transparent bg-gradient-to-r ${PREMIUM_GRADIENT}` : 'text-2xl'}`}>
                    {config.title}
                </h1>
            </div>

            <div className="flex items-center gap-2">
                {isInstallable && (
                    <button
                        onClick={installPWA}
                        className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-pink-500 hover:text-pink-400"
                        aria-label="Install CollegeCrush as an app"
                    >
                        <Download size={20} />
                    </button>
                )}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                    aria-label={`Current theme: ${theme}. Click to toggle theme.`}
                >
                    {getThemeIcon()}
                </button>
                <button
                    onClick={() => setActiveScreen(Screen.Notifications)}
                    className="relative p-2 rounded-full hover:bg-zinc-800 transition-colors"
                    aria-label={`View notifications (${unreadCount} unread)`}
                >
                    <Bell />
                    {unreadCount > 0 && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-950"></div>
                    )}
                </button>
                <button
                    onClick={logout}
                    className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                    aria-label="Logout and return to landing page"
                >
                    <LogOut />
                </button>
            </div>
        </div>
    );
};

export default TopBar;
