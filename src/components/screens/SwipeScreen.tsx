
import * as React from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { fetchProfiles, recordSwipe, fetchAds } from '../../services/api.ts';
import { Profile, MembershipType, Screen, Ad, Swipeable } from '../../types/types.ts';
import ProfileCard from '../ProfileCard.tsx';
import AdCard from '../AdCard.tsx';
import MatchPopup from '../MatchPopup.tsx';
import { useUser } from '../../hooks/useUser.ts';
import EmptyState from '../common/EmptyState.tsx';
import { useNotification } from '../../hooks/useNotification.ts';
import { X, Heart, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import ProfileCardSkeleton from '../skeletons/ProfileCardSkeleton.tsx';

// Fix for framer-motion type errors
const MotionButton: any = motion.button;
const MotionDiv: any = motion.div;

const SWIPE_LIMIT = 20;
const AD_FREQUENCY = 5; // Show an ad every 5 profiles

interface SwipeButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    ariaLabel: string;
    disabled?: boolean;
}

function SwipeButton({ children, onClick, className, ariaLabel, disabled }: SwipeButtonProps) {
    return (
        <MotionButton
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`w-24 h-24 flex items-center justify-center rounded-full bg-zinc-900/50 backdrop-blur-md border border-white/10 shadow-2xl transition-colors disabled:opacity-50 ${className}`}
        >
            {children}
        </MotionButton>
    );
}

interface SwipeScreenProps {
    onProfileClick: (profile: Profile) => void;
    onGoToChat: () => void;
    setActiveScreen: (screen: Screen) => void;
}

const getTodaysSwipeData = () => {
    try {
        const item = window.localStorage.getItem('swipeData');
        if (item) {
            const { date, count } = JSON.parse(item);
            const today = new Date().toISOString().split('T')[0];
            if (date === today) {
                return { count: Number(count) || 0 };
            }
        }
    } catch (error) {
        // Silently fail, default will be returned
    }
    // If no data, or data is from a previous day, reset.
    return { count: 0 };
};


function SwipeScreen({ onProfileClick, onGoToChat, setActiveScreen }: SwipeScreenProps) {
    const [profiles, setProfiles] = React.useState<Profile[]>([]);
    const [ads, setAds] = React.useState<Ad[]>([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [showMatchPopup, setShowMatchPopup] = React.useState(false);
    const [matchedProfile, setMatchedProfile] = React.useState<Profile | null>(null);
    const [swipesToday, setSwipesToday] = React.useState(getTodaysSwipeData().count);
    const { user } = useUser();
    const { showNotification } = useNotification();
    const [swipeDirection, setSwipeDirection] = React.useState<'left' | 'right' | null>(null);
    const [isSwiping, setIsSwiping] = React.useState(false);

    // For drag gestures
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30], { clamp: false });
    const likeOpacity = useTransform(x, [10, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, -10], [1, 0]);


    const swipeDeck = React.useMemo((): Swipeable[] => {
        if (!user || user.membership !== MembershipType.Free || ads.length === 0 || profiles.length === 0) {
            return profiles;
        }
        const interleaved: Swipeable[] = [];
        let adIndex = 0;
        for (let i = 0; i < profiles.length; i++) {
            interleaved.push(profiles[i]);
            // After every AD_FREQUENCY profiles, show an ad
            if ((i + 1) % AD_FREQUENCY === 0) {
                interleaved.push(ads[adIndex % ads.length]);
                adIndex++;
            }
        }
        return interleaved;
    }, [profiles, ads, user]);

    const loadData = React.useCallback(() => {
        if (user) {
            setLoading(true);
            setError(null);
            setCurrentIndex(0); // Reset index on new data load

            // Check if we have cached profiles
            const cachedProfiles = localStorage.getItem('swipeProfiles');
            if (cachedProfiles) {
                try {
                    const parsedProfiles = JSON.parse(cachedProfiles);
                    if (parsedProfiles.length > 0) {
                        setProfiles(parsedProfiles);
                        setAds(user.membership === MembershipType.Free ? [] : []); // Load ads separately if needed
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    // Invalid cache, fetch new
                }
            }

            Promise.all([
                fetchProfiles(user.id, user.gender),
                user.membership === MembershipType.Free ? fetchAds() : Promise.resolve([] as Ad[])
            ])
            .then(([fetchedProfiles, fetchedAds]) => {
                setProfiles(fetchedProfiles);
                setAds(fetchedAds);
                // Cache the profiles
                localStorage.setItem('swipeProfiles', JSON.stringify(fetchedProfiles));
            })
            .catch(error => {
                setError("Could not load cards. Please check your connection and try again.");
            })
            .finally(() => setLoading(false));
        }
    }, [user]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const advanceProfile = React.useCallback(() => {
        setCurrentIndex(prevIndex => {
            const newIndex = prevIndex + 1;
            // Update cached profiles by removing swiped ones
            setProfiles(currentProfiles => {
                const remaining = currentProfiles.slice(newIndex);
                localStorage.setItem('swipeProfiles', JSON.stringify(remaining));
                return remaining;
            });
            return newIndex;
        });
        setSwipeDirection(null);
        setIsSwiping(false);
        x.set(0); // Reset motion value for the next card
    }, [x]);

    const handleSwipe = React.useCallback(async (direction: 'left' | 'right') => {
        if (!user || currentIndex >= swipeDeck.length || isSwiping) return;

        const swipedItem = swipeDeck[currentIndex];
        setSwipeDirection(direction);
        setIsSwiping(true);

        // Type guard to check if it's a profile
        if (!('link' in swipedItem)) {
            const swipedUser = swipedItem as Profile;

            if (user.membership === MembershipType.Free && swipesToday >= SWIPE_LIMIT) {
                showNotification("Daily swipe limit reached. Upgrade for more!", 'error');
                setSwipeDirection(null);
                setIsSwiping(false);
                return;
            }

            try {
                const result = await recordSwipe(user.id, swipedUser.id, direction);
                if (direction === 'right') {
                    if (result && result.match_created) {
                        setMatchedProfile(swipedUser);
                        setShowMatchPopup(true);
                        showNotification(`You matched with ${swipedUser.name}!`, 'success');
                    }
                }
                const newSwipeCount = swipesToday + 1;
                setSwipesToday(newSwipeCount);
                if (user.membership === MembershipType.Free) {
                    const today = new Date().toISOString().split('T')[0];
                    window.localStorage.setItem('swipeData', JSON.stringify({ date: today, count: newSwipeCount }));
                }
            } catch (error) {
                showNotification("Something went wrong, please try again.", "error");
            }
        }
        // For both profiles and ads, advance is handled by AnimatePresence onExitComplete
    }, [user, currentIndex, swipeDeck, swipesToday, showNotification]);

    const currentItem = !loading && !error && swipeDeck.length > 0 && currentIndex < swipeDeck.length ? swipeDeck[currentIndex] : null;
    const isCurrentItemAd = currentItem && 'link' in currentItem;
    const swipesLeft = user?.membership === MembershipType.Free ? SWIPE_LIMIT - swipesToday : Infinity;

    const cardVariants = {
        initial: { scale: 0.95, y: -25, opacity: 0.8 },
        animate: { scale: 1, y: 0, opacity: 1 },
        exit: (direction: 'left' | 'right') => ({
            x: direction === 'left' ? -300 : 300,
            opacity: 0,
            rotate: direction === 'left' ? -20 : 20,
            transition: { duration: 0.3 }
        })
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden relative">
            
            {showMatchPopup && matchedProfile && <MatchPopup matchedProfile={matchedProfile} onClose={() => setShowMatchPopup(false)} onGoToChat={onGoToChat} />}
            
            <div className="flex-1 w-full relative flex items-center justify-center pt-2">
                {loading ? <div className="w-full h-full max-h-[700px] max-w-md"><ProfileCardSkeleton /></div> : error ? (
                     <div className="text-center p-4">
                        <AlertTriangle size={48} className="mx-auto text-red-500" />
                        <p className="mt-4 text-zinc-300">{error}</p>
                        <button onClick={loadData} className="mt-4 px-4 py-2 bg-pink-600 rounded-lg font-semibold hover:bg-pink-700 transition-colors">
                            Retry
                        </button>
                    </div>
                ) : swipeDeck.length > 0 ? (
                    <div className="w-full h-full max-h-[700px] max-w-md relative">
                       {/* Next card in deck, for peeking */}
                       {currentIndex + 1 < swipeDeck.length && (
                         <MotionDiv
                           key={swipeDeck[currentIndex + 1].id}
                           className="absolute w-full h-full"
                           style={{ zIndex: 0 }}
                           initial={{ scale: 0.95, y: -25, opacity: 0.8 }}
                           animate={{ scale: 0.95, y: -25, opacity: 0.8 }}
                         >
                            {'link' in swipeDeck[currentIndex + 1] ? <AdCard ad={swipeDeck[currentIndex+1] as Ad} /> : <ProfileCard profile={swipeDeck[currentIndex + 1] as Profile} onClick={() => onProfileClick(swipeDeck[currentIndex + 1] as Profile)} />}
                         </MotionDiv>
                       )}
                       
                       {/* Top card */}
                       {currentItem && (
                         <AnimatePresence>
                           <MotionDiv
                              key={currentItem.id}
                              className="absolute w-full h-full"
                              style={{ zIndex: 1, x, rotate }}
                              variants={cardVariants}
                              initial="initial"
                              animate={swipeDirection ? "exit" : "animate"}
                              custom={swipeDirection}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              drag={'link' in currentItem ? false : (isSwiping ? false : "x")}
                              dragConstraints={false}
                              dragElastic={0.5}
                              dragMomentum={false}
                              onAnimationComplete={(definition) => {
                                  if (definition === "exit") advanceProfile();
                              }}
                              onDragEnd={(_, { offset, velocity }) => {
                                  if (isSwiping) return;
                                  const swipePower = Math.abs(offset.x) * velocity.x;
                                  if (swipePower < -2000) {
                                      handleSwipe('left');
                                  } else if (swipePower > 2000) {
                                      handleSwipe('right');
                                  }
                              }}
                           >
                             <div className="relative w-full h-full">
                               {'link' in currentItem ? (
                                 <AdCard ad={currentItem} />
                               ) : (
                                <>
                                 <ProfileCard profile={currentItem as Profile} onClick={() => onProfileClick(currentItem as Profile)} />
                                 {/* Swipe feedback overlays */}
                                 <MotionDiv style={{ opacity: likeOpacity }} className="absolute top-10 left-10 text-green-400 font-bold text-5xl tracking-widest border-4 border-green-400 px-6 py-2 rounded-xl -rotate-20 transform-gpu">LIKE</MotionDiv>
                                 <MotionDiv style={{ opacity: nopeOpacity }} className="absolute top-10 right-10 text-red-500 font-bold text-5xl tracking-widest border-4 border-red-500 px-4 py-2 rounded-xl rotate-20 transform-gpu">NOPE</MotionDiv>
                                </>
                               )}
                             </div>
                           </MotionDiv>
                         </AnimatePresence>
                       )}

                       {/* Empty state shown after last card animates out */}
                       {currentIndex >= swipeDeck.length && (
                         <EmptyState
                             icon={<Users size={64} />}
                             title="That's everyone for now!"
                             message="No new profiles match your preferences. Check back later or adjust your filters."
                         >
                             <button onClick={loadData} className="mt-6 flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg font-semibold hover:bg-zinc-700 transition-colors text-white">
                                <RefreshCw size={16} />
                                Refresh
                             </button>
                         </EmptyState>
                       )}
                    </div>
                ) : (
                    <EmptyState
                        icon={<Users size={64} />}
                        title="That's everyone for now!"
                        message="No new profiles match your preferences. Check back later or adjust your filters."
                     >
                        <button onClick={loadData} className="mt-6 flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg font-semibold hover:bg-zinc-700 transition-colors text-white">
                           <RefreshCw size={16} />
                           Refresh
                        </button>
                    </EmptyState>
                )}
            </div>
            
            <div className="flex flex-col items-center justify-center w-full pt-4 h-36">
                {user?.membership === MembershipType.Free && currentItem && !isCurrentItemAd && (
                    <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                        Swipes left today: <span className="font-bold text-black dark:text-white">{swipesLeft > 0 ? swipesLeft : 0}</span>
                    </div>
                )}

                {currentItem && !isCurrentItemAd && (
                    <div className="flex items-center justify-center space-x-6 md:space-x-8 w-full">
                        <SwipeButton onClick={() => handleSwipe('left')} ariaLabel="Swipe left (reject)" className="text-red-500" disabled={!!swipeDirection || isSwiping}>
                            <X size={40} strokeWidth={3} />
                        </SwipeButton>
                        <SwipeButton onClick={() => handleSwipe('right')} ariaLabel="Swipe right (like)" className="text-pink-500" disabled={!!swipeDirection || isSwiping}>
                            <Heart size={48} fill="currentColor" />
                        </SwipeButton>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SwipeScreen;
