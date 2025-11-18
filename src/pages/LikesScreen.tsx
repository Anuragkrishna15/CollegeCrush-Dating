
import * as React from 'react';
import { fetchLikers, getProfile } from '../services/api.ts';
import { Profile, MembershipType, Screen } from '../types/types.ts';
import { useUser } from '../hooks/useUser.ts';
import { useNotification } from '../hooks/useNotification.ts';
import { PREMIUM_GRADIENT } from '../constants/constants.ts';
import { Star, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import EmptyState from '../components/common/EmptyState.tsx';
import GridSkeleton from '../components/skeletons/GridSkeleton.tsx';
import BlurredPlaceholder from '../components/common/BlurredPlaceholder.tsx';
import BlurredProfileCard from '../components/common/BlurredProfileCard.tsx';
import { supabase } from '../services/supabase.ts';
import { getOptimizedUrl } from '../utils/date.ts';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

interface LikesScreenProps {
    onProfileClick: (profile: Profile) => void;
    setActiveScreen: (screen: Screen) => void;
}

const LikesScreen: React.FC<LikesScreenProps> = ({ onProfileClick, setActiveScreen }) => {
    const [likers, setLikers] = React.useState<Profile[]>([]);
    const [loading, setLoading] = React.useState(true);
    const { user } = useUser();
    const { showNotification } = useNotification();
    const isPremium = user?.membership === MembershipType.Premium;

    React.useEffect(() => {
        // Always fetch likers, so we can show blurred images for free users.
        if (user) {
            setLoading(true);
            fetchLikers(user.id)
                .then(setLikers)
                .catch(err => console.error("Failed to fetch likers", err))
                .finally(() => setLoading(false));

            const channel = supabase.channel(`new-likes-for-${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'swipes',
                    filter: `swiped_id=eq.${user.id}`
                }, async (payload: any) => {
                    const newSwipe = payload.new;
                    if (newSwipe && 'direction' in newSwipe && (newSwipe as any).direction === 'right') {
                        try {
                            const likerProfile = await getProfile((newSwipe as any).swiper_id);
                            if (likerProfile) {
                                // Only show toast notification if the current user is Premium
                                if (user.membership === MembershipType.Premium) {
                                    showNotification(`${likerProfile.name} just liked you! ✨`, 'success');
                                }
                                setLikers(currentLikers => {
                                    if (currentLikers.some(l => l.id === likerProfile.id)) {
                                        return currentLikers; // Already in the list
                                    }
                                    return [likerProfile, ...currentLikers];
                                });
                            }
                        } catch (error) {
                            console.error("Failed to fetch new liker's profile", error);
                        }
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            }
        } else {
            setLoading(false);
        }
    }, [user, showNotification]);
    
    const handleUpgradeClick = () => {
        setActiveScreen(Screen.Profile);
    };

    const PremiumView = () => {
        if (likers.length === 0) {
            return (
                <EmptyState
                    icon={<Star size={64} />}
                    title="No Likes Yet"
                    message="Your admirers will appear here once they swipe right on you. Keep swiping!"
                />
            );
        }
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {likers.map((liker) => (
                     <MotionDiv 
                        key={liker.id}
                        layout
                        whileHover={{ y: -5, scale: 1.05 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                        onClick={() => onProfileClick(liker)}
                    >
                        <img src={getOptimizedUrl(liker.profile_pics[0], { width: 250, height: 250 })} alt={liker.name} loading="lazy" className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                            <p className="text-white font-bold text-sm truncate">{liker.name}, {liker.age}</p>
                        </div>
                     </MotionDiv>
                ))}
            </div>
        );
    };
    
    const FreeView = () => {
        const hasLikers = likers.length > 0;
        return (
            <div className="relative">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {hasLikers ? (
                        <>
                            {likers.slice(0, 6).map((liker) => <BlurredProfileCard key={liker.id} profile={liker} />)}
                            {[...Array(Math.max(0, 6 - likers.length))].map((_, i) => <BlurredPlaceholder key={`placeholder-${i}`} />)}
                        </>
                    ) : (
                         [...Array(6)].map((_, i) => <BlurredPlaceholder key={`placeholder-${i}`} />)
                    )}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md z-10 p-4 text-center">
                    <Star className={`w-16 h-16 text-yellow-400`} />
                    <h2 className={`text-2xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r ${PREMIUM_GRADIENT}`}>See Who Likes You!</h2>
                    <p className="text-zinc-300 mt-2 max-w-sm">Upgrade to Premium to see everyone who has already swiped right on you and match instantly.</p>
                    <MotionButton 
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUpgradeClick} className={`w-full max-w-xs mt-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30`}>
                        <Lock size={16}/>
                        Unlock Likes
                    </MotionButton>
                </div>
            </div>
        );
    };

    return (
        <div className="relative h-full p-4 md:p-6">
            {loading ? <GridSkeleton cardType="profile" /> : isPremium ? <PremiumView /> : <FreeView />}
        </div>
    );
};

export default LikesScreen;
