
import * as React from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import BottomNav from './components/BottomNav.tsx';
import LoadingSpinner from './components/LoadingSpinner.tsx';
import ProfileDetailModal from './components/modals/ProfileDetailModal.tsx';
import BookBlindDateModal from './components/modals/BookBlindDateModal.tsx';
import VibeCheckModal from './components/modals/VibeCheckModal.tsx';
import OnboardingScreen from './pages/OnboardingScreen.tsx';
import AuthGate from './pages/AuthGate.tsx';
import TopBar from './components/common/TopBar.tsx';
import ScrollToTopButton from './components/common/ScrollToTopButton.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

import { Screen, Profile, BlindDate, User, AppNotification, Conversation } from './types/types.ts';
import { UserContext } from './hooks/useUser.ts';
import { ThemeProvider } from './hooks/useTheme.ts';
import { PresenceProvider } from './hooks/usePresence.ts';
import { NotificationContext, notificationHandler } from './hooks/useNotification.ts';
import { getProfile, getUnreadNotificationsCount, markAllNotificationsAsRead, getConversationDetails, markNotificationAsRead } from './services/api.ts';
import { supabase } from './services/supabase.ts';
import { pushNotificationService } from './services/pushNotifications.ts';
import SwipeScreen from './pages/SwipeScreen.tsx';

const { lazy, Suspense } = React;

// Lazy load screens for better performance
const DatesScreen = lazy(() => import('./pages/DatesScreen.tsx'));
const ChatScreen = lazy(() => import('./pages/ChatScreen.tsx'));
const CommunityScreen = lazy(() => import('./pages/CommunityScreen.tsx'));
const TripsScreen = lazy(() => import('./pages/TripsScreen.tsx'));
const EventsScreen = lazy(() => import('./pages/EventsScreen.tsx'));
const ProfileScreen = lazy(() => import('./pages/ProfileScreen.tsx'));
const SettingsScreen = lazy(() => import('./pages/SettingsScreen.tsx'));
const EditProfileScreen = lazy(() => import('./pages/EditProfileScreen.tsx'));
const LikesScreen = lazy(() => import('./pages/LikesScreen.tsx'));
const NotificationsScreen = lazy(() => import('./pages/NotificationsScreen.tsx'));
const AdminScreen = lazy(() => import('./pages/AdminScreen'));

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;

const App: React.FC = () => {
  const [session, setSession] = React.useState<any | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [boostEndTime, setBoostEndTime] = React.useState<number | undefined>();
  const [loading, setLoading] = React.useState(true);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [activeScreen, setActiveScreenState] = React.useState<Screen>(Screen.Swipe);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Modal States
  const [selectedProfile, setSelectedProfile] = React.useState<Profile | null>(null);
  const [isBookingDate, setIsBookingDate] = React.useState(false);
  const [vibeCheckDate, setVibeCheckDate] = React.useState<BlindDate | null>(null);
  
  // Lifted state for chat navigation
  const [activeConversation, setActiveConversation] = React.useState<Conversation | null>(null);

  const notificationContextValue = React.useMemo(() => ({ showNotification: notificationHandler }), []);

  const logout = React.useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBoostEndTime(undefined);
    setActiveScreenState(Screen.Swipe);
    setActiveConversation(null);
    setProfileError(null);
    setUnreadCount(0);
    setLoading(false);
  }, []);

  const refetchUser = React.useCallback(async () => {
    if (!session?.user?.id) {
      console.log('App: No session user ID, skipping refetch');
      return;
    }
    try {
      console.log('App: Refetching user profile for ID:', session.user.id);
      setLoading(true);
      setProfileError(null);
      const profile = await getProfile(session.user.id);
      console.log('App: Profile fetched:', profile ? 'Success' : 'Null');
      setUser(profile);
      setBoostEndTime(profile?.boost_end_time);
    } catch (error: any) {
      console.error("Error refetching profile:", error.message || error);
      setUser(null);
      setProfileError("We couldn't load your profile. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  const setActiveScreen = (screen: Screen) => {
    // Reset active conversation when navigating away from the chat screen
    if (activeScreen === Screen.Chat && screen !== Screen.Chat) {
      setActiveConversation(null);
    }
    setActiveScreenState(screen);
  };
  
  React.useEffect(() => {
    console.log('App: Initializing auth session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('App: Session loaded:', session ? 'Present' : 'Null');
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('App: Auth state change:', _event, session ? 'Session present' : 'No session');
        setSession(session);
        if (_event === 'SIGNED_OUT') {
            setUser(null);
            setProfileError(null);
            setBoostEndTime(undefined);
            setActiveScreenState(Screen.Swipe);
            setActiveConversation(null);
            setUnreadCount(0);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (session?.user?.id) {
      refetchUser();

      getUnreadNotificationsCount(session.user.id).then(setUnreadCount);

      const channel = supabase.channel(`notifications-for-${session.user.id}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
        }, async (payload: any) => {
            const newNotification = payload.new;
            if (newNotification && 'message' in newNotification) {
                notificationHandler((newNotification as AppNotification).message, 'info');
                setUnreadCount(prev => prev + 1);

                // Check if we should send push notification
                if (user?.notification_preferences) {
                    const notificationType = getNotificationType(newNotification.type);
                    if (pushNotificationService.shouldSendPush(user.notification_preferences, notificationType)) {
                        await pushNotificationService.sendPushNotification(
                            session.user.id,
                            'CollegeCrush',
                            newNotification.message,
                            { type: newNotification.type, id: newNotification.id }
                        );
                    }
                }
            }
        })
        .on('system', { event: 'error' }, (error) => {
            // Only treat as error if it's actually an error, not a success message
            if (error?.status !== 'ok') {
                console.error('Notification subscription error:', error);
            }
        })
        .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
      setUnreadCount(0);
    }
  }, [session, refetchUser]);

  React.useEffect(() => {
    if (user?.notification_preferences) {
      pushNotificationService.initialize(user.notification_preferences);
    }
  }, [user]);
  
  const contextValue = React.useMemo(() => ({ user, loading, logout, refetchUser, boostEndTime }), [user, loading, logout, refetchUser, boostEndTime]);

  const getPageTitle = (screen: Screen) => {
    switch (screen) {
      case Screen.Swipe: return 'Swipe - CollegeCrush';
      case Screen.Likes: return 'Likes - CollegeCrush';
      case Screen.Dates: return 'Dates - CollegeCrush';
      case Screen.Chat: return 'Chat - CollegeCrush';
      case Screen.Community: return 'Community - CollegeCrush';
      case Screen.Trips: return 'Trips - CollegeCrush';
      case Screen.Events: return 'Events - CollegeCrush';
      case Screen.Profile: return 'Profile - CollegeCrush';
      case Screen.Settings: return 'Settings - CollegeCrush';
      case Screen.EditProfile: return 'Edit Profile - CollegeCrush';
      case Screen.Notifications: return 'Notifications - CollegeCrush';
      case Screen.Admin: return 'Admin - CollegeCrush';
      default: return 'CollegeCrush - Exclusive Dating for College Students';
    }
  };

  const handleGoToChat = (conversation?: Conversation) => {
    setActiveConversation(conversation || null);
    setActiveScreen(Screen.Chat);
  };
  
  const handleProfileUpdate = React.useCallback(async () => {
      await refetchUser();
      setActiveScreen(Screen.Profile);
  }, [refetchUser]);

  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
        await markAllNotificationsAsRead(user.id);
        setUnreadCount(0);
    } catch (error: any) {
        console.error("Error marking notifications as read:", error.message || error);
        notificationHandler("Could not mark notifications as read.", "error");
    }
  };

  const getNotificationType = (type: string): 'matches' | 'messages' | 'events' | 'community' => {
    switch (type) {
      case 'new_match':
      case 'vibe_check_match':
        return 'matches';
      case 'new_message':
        return 'messages';
      case 'new_blind_date_request':
      case 'blind_date_accepted':
      case 'event_reminder':
        return 'events';
      case 'community_post':
      case 'community_comment':
        return 'community';
      default:
        return 'messages';
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
       if (!user) return;

       setLoading(true);
       const wasUnread = !notification.is_read;

       try {
            if (notification.source_entity_id) {
                 switch (notification.type) {
                     case 'new_message':
                     case 'new_match':
                     case 'vibe_check_match': {
                         const convo = await getConversationDetails(notification.source_entity_id, user.id);
                         if (convo) {
                             setActiveConversation(convo);
                             setActiveScreen(Screen.Chat);
                         } else {
                             throw new Error("Could not load the conversation.");
                         }
                         break;
                     }
                     case 'new_blind_date_request':
                     case 'blind_date_accepted':
                         setActiveScreen(Screen.Dates);
                         break;
                     default:
                         // For notifications without a direct link, do nothing.
                         break;
                 }
            }

           if (wasUnread) {
             await markNotificationAsRead(notification.id);
             setUnreadCount(prev => Math.max(0, prev - 1));
           }
       } catch (error: any) {
           notificationHandler(error.message || "Could not open notification.", "error");
       } finally {
           setLoading(false);
       }
   };

  const renderScreen = () => {
    console.log('App: Rendering screen:', activeScreen);
    switch (activeScreen) {
      case Screen.Swipe:
        return <SwipeScreen onProfileClick={setSelectedProfile} onGoToChat={handleGoToChat} setActiveScreen={setActiveScreen} />;
      case Screen.Likes:
        return <LikesScreen onProfileClick={setSelectedProfile} setActiveScreen={setActiveScreen} />;
      case Screen.Dates:
        return <DatesScreen onBookDate={() => setIsBookingDate(true)} onVibeCheck={setVibeCheckDate} setActiveScreen={setActiveScreen} />;
      case Screen.Chat:
        return <ChatScreen
                    onProfileClick={setSelectedProfile}
                    activeConversation={activeConversation}
                    setActiveConversation={setActiveConversation}
                />;
      case Screen.Community:
        return <CommunityScreen />;
      case Screen.Trips:
        return <TripsScreen />;
      case Screen.Events:
        return <EventsScreen />;
      case Screen.Profile:
        return <ProfileScreen setActiveScreen={setActiveScreen} />;
      case Screen.Settings:
        return <SettingsScreen setActiveScreen={setActiveScreen} />;
      case Screen.EditProfile:
        return <EditProfileScreen onProfileUpdate={handleProfileUpdate} />;
      case Screen.Notifications:
        return <NotificationsScreen onMarkAllAsRead={handleMarkAllAsRead} onNotificationClick={handleNotificationClick} />;
      case Screen.Admin:
        return <AdminScreen />;
      default:
        return <SwipeScreen onProfileClick={setSelectedProfile} onGoToChat={handleGoToChat} setActiveScreen={setActiveScreen} />;
    }
  };
  
  const AppContent = () => {
    if (loading) {
       return (
        <div className="bg-transparent min-h-screen flex items-center justify-center">
            <LoadingSpinner />
        </div>
       );
    }
    if (!session) {
        return <AuthGate />;
    }

    if (profileError) {
        return (
            <div className="bg-transparent min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold text-red-500">An Error Occurred</h2>
                <p className="text-zinc-400 mt-2">{profileError}</p>
                <button onClick={refetchUser} className="mt-6 px-6 py-2 bg-pink-600 rounded-lg font-semibold hover:bg-pink-700 transition-colors">
                    Retry
                </button>
                <button onClick={logout} className="mt-4 text-sm text-zinc-500 hover:text-white transition-colors">
                    Log Out
                </button>
            </div>
        );
    }
    
    // This now correctly identifies ONLY new users
    if (!user) {
        return <OnboardingScreen onProfileCreated={refetchUser} />;
    }

    return (
        <>
          <Helmet>
            <title>{getPageTitle(activeScreen)}</title>
          </Helmet>
          <div className="md:flex h-screen w-full bg-transparent font-sans">
            <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
            <main className="flex-1 h-full flex flex-col bg-zinc-950 md:bg-zinc-950/50 md:backdrop-blur-lg md:rounded-l-3xl md:border-l md:border-zinc-800 relative">
             <TopBar activeScreen={activeScreen} setActiveScreen={setActiveScreen} unreadCount={unreadCount} />
             <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
                <AnimatePresence mode="wait">
                    <MotionDiv
                        key={activeScreen}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="h-full w-full"
                    >
                       <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                            {renderScreen()}
                       </Suspense>
                    </MotionDiv>
                </AnimatePresence>
             </div>
           </main>
           <ScrollToTopButton />
         </div>
       </>
   );
  }

  return (
    <HelmetProvider>
      <ThemeProvider>
        <UserContext.Provider value={contextValue}>
        <PresenceProvider>
        <NotificationContext.Provider value={notificationContextValue}>
        <Toaster 
          position="top-center"
          toastOptions={{
            className: '',
            style: {
              margin: '40px',
              background: 'rgba(39, 39, 42, 0.7)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              border: '1px solid #3f3f46',
            },
          }}
        />

        {selectedProfile && <ProfileDetailModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />}
        {isBookingDate && user && user.latitude && user.longitude && <BookBlindDateModal onClose={() => setIsBookingDate(false)} userLocation={{ latitude: user.latitude, longitude: user.longitude }} />}
        {vibeCheckDate && user && <VibeCheckModal date={vibeCheckDate} onClose={() => setVibeCheckDate(null)} />}

        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>

        </NotificationContext.Provider>
        </PresenceProvider>
        </UserContext.Provider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
