

import * as React from 'react';
import { useUser } from '../../hooks/useUser.ts';
import { MembershipType, Screen } from '../../types/types.ts';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import { updateUserMembership, boostProfile, recordPayment } from '../../services/api.ts';
import { initiatePayment } from '../../services/cashfree.ts';
import { useNotification } from '../../hooks/useNotification.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import { Crown, Zap, Settings, LogOut, CheckCircle2, XCircle, ChevronRight, Edit } from 'lucide-react';
import { getOptimizedUrl } from '../../utils/date.ts';
import { motion } from 'framer-motion';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

const PlanFeature: React.FC<{ children: React.ReactNode; included: boolean }> = ({ children, included }) => (
    <li className={`flex items-center gap-3 ${included ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>
        {included ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-zinc-600" />}
        <span>{children}</span>
    </li>
);

interface PlanCardProps {
    plan: MembershipType;
    title: string;
    price: string;
    features: { name: string; included: boolean }[];
    isCurrent: boolean;
    onSelect: (plan: MembershipType) => void;
    loading: boolean;
    isFeatured?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, title, price, features, isCurrent, onSelect, loading, isFeatured = false }) => {
    const isFree = plan === MembershipType.Free;
    
    let buttonText = 'Choose Plan';
    if (isCurrent) {
      buttonText = 'Current Plan';
    } else if (!isFree && loading) {
      buttonText = 'Processing...';
    } else if (isFree && !isCurrent) {
        buttonText = 'Switch to Free';
    }

    return (
        <MotionDiv
            animate={{ scale: isFeatured ? 1.05 : 1, y: isFeatured ? -10 : 0 }}
            whileHover={{ scale: isFeatured ? 1.08 : 1.03 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`relative flex flex-col p-6 rounded-2xl border ${isCurrent ? 'border-pink-500 bg-zinc-900 shadow-lg shadow-pink-500/10' : 'border-zinc-800 bg-zinc-950/70 backdrop-blur-lg'}`}
        >
             {isFeatured && !isCurrent && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 opacity-20 blur-lg -z-10"></div>
            )}
            {isFeatured && (
                <div className={`absolute top-0 -translate-y-1/2 right-6 px-3 py-1 text-xs font-semibold rounded-full text-white bg-gradient-to-r ${PREMIUM_GRADIENT}`}>
                    Most Popular
                </div>
            )}
            <h3 className={`text-2xl font-bold ${isFeatured ? `bg-clip-text text-transparent bg-gradient-to-r ${PREMIUM_GRADIENT}` : ''}`}>{title}</h3>
            <p className="text-zinc-400 mt-1">{price}</p>
            <ul className="space-y-3 mt-6 text-sm flex-1">
                {features.map(f => <PlanFeature key={f.name} included={f.included}>{f.name}</PlanFeature>)}
            </ul>
            <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(plan)}
                disabled={isCurrent || loading}
                className={`w-full mt-8 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-70 ${isCurrent ? 'bg-zinc-700 cursor-default' : isFree ? 'bg-zinc-600 hover:bg-zinc-500' : `bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90`}`}
            >
                {buttonText}
            </MotionButton>
        </MotionDiv>
    );
};


const ProfileScreen: React.FC<{setActiveScreen: (screen: Screen) => void}> = ({setActiveScreen}) => {
    const { user, logout, refetchUser, boostEndTime } = useUser();
    const { showNotification } = useNotification();
    const [loading, setLoading] = React.useState(false);
    const [boostTimeLeft, setBoostTimeLeft] = React.useState<number>(0);
    
    React.useEffect(() => {
        if (boostEndTime) {
            const now = Date.now();
            const timeLeft = Math.floor((boostEndTime - now) / 1000);
            setBoostTimeLeft(timeLeft > 0 ? timeLeft : 0);
        }
    }, [boostEndTime]);

    React.useEffect(() => {
        if (boostTimeLeft > 0) {
            const timer = setTimeout(() => setBoostTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [boostTimeLeft]);

    if (!user) return <div className="p-4 flex justify-center"><LoadingSpinner /></div>;
    
    const handlePlanSelect = async (plan: MembershipType) => {
        if (plan === user.membership || !user) return;

        if (plan === MembershipType.Free) {
            setLoading(true);
            try {
                await updateUserMembership(user.id, plan);
                await refetchUser();
                showNotification("You've switched to the Free plan.", 'info');
            } catch (error) {
                console.error("Failed to update plan:", error);
                showNotification("Could not update your plan. Please try again.", "error");
            } finally {
                setLoading(false);
            }
            return;
        }

        const planDetails = {
            [MembershipType.Trial]: { amount: 49, name: '7-Day Trial' },
            [MembershipType.Premium]: { amount: 149, name: 'Premium' },
        };

        const planInfo = planDetails[plan as keyof typeof planDetails];
        if (!planInfo) return;

        const { amount, name } = planInfo;

        const onSuccess = async (selectedPlan: MembershipType, response: any) => {
            try {
                await updateUserMembership(user.id, selectedPlan);
                 // Log the successful payment
                await recordPayment(user.id, {
                    amount: amount * 100, // store in paise
                    plan: selectedPlan,
                    status: 'completed',
                    provider: 'cashfree',
                    provider_order_id: response?.order_id,
                    provider_payment_id: response?.cf_payment_id,
                });
                await refetchUser();
                showNotification(`Welcome to ${name}! Your upgrade was successful.`, 'success');
            } catch (error: any) {
                console.error("Failed to update membership after payment:", error);
                showNotification("Payment successful, but we had trouble updating your account. Please contact support.", "error");
            } finally {
                setLoading(false);
            }
        };

        const onFailure = (error: any) => {
            console.error("Payment failed", error);
            showNotification(error?.error?.description || "Your payment failed. Please try again.", "error");
            setLoading(false);
        };

        setLoading(true);
        initiatePayment(plan, amount, user, onSuccess, onFailure);
    };

    const handleBoost = async () => {
        if (!user) return;
        try {
            await boostProfile(user.id);
            await refetchUser();
        } catch (error) {
            showNotification("Failed to boost profile.", "error");
        }
    };
    
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const plans = {
        [MembershipType.Free]: {
            title: "Free",
            price: "₹0 / month",
            features: [
                { name: "10 Swipes per day", included: true },
                { name: "See who likes you", included: false },
                { name: "Unlock Comments", included: false },
                { name: "Accept Blind Dates", included: false },
                { name: "Create Blind Dates", included: false },
                { name: "Unlock All Trips", included: false },
                { name: "Ad-Free Experience", included: false },
            ]
        },
        [MembershipType.Trial]: {
            title: "7-Day Trial",
            price: "₹49 / week",
            features: [
                { name: "Unlimited Swipes", included: true },
                { name: "See who likes you", included: false },
                { name: "Unlock Comments", included: true },
                { name: "Accept Blind Dates", included: true },
                { name: "Create Blind Dates", included: false },
                { name: "Unlock All Trips", included: false },
                { name: "Fewer Ads", included: true },
            ]
        },
        [MembershipType.Premium]: {
            title: "Premium",
            price: "₹149 / month",
            features: [
                { name: "Unlimited Swipes", included: true },
                { name: "See who likes you", included: true },
                { name: "Unlock Comments", included: true },
                { name: "Accept Blind Dates", included: true },
                { name: "Create Blind Dates", included: true },
                { name: "Unlock All Trips", included: true },
                { name: "Ad-Free Experience", included: true },
            ]
        }
    };

    return (
        <div className="p-4 md:p-6 pb-28 md:pb-12 space-y-8">
            <div className="flex flex-col items-center text-center">
                <div className="relative p-1 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full">
                    <img src={getOptimizedUrl(user.profilePics[0], { width: 96, height: 96 })} alt={user.name} loading="lazy" className="w-24 h-24 rounded-full object-cover border-4 border-zinc-900" />
                    {user.membership !== MembershipType.Free && (
                         <div className={`absolute -bottom-1 -right-2 p-1 rounded-full bg-gradient-to-r ${PREMIUM_GRADIENT}`}>
                         <Crown size={16} className="text-white"/>
                       </div>
                    )}
                </div>
                <h1 className="text-2xl font-bold mt-4">{user.name}</h1>
                <p className="text-zinc-400">{user.college}</p>
            </div>
            
            <div className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Your Profile</h2>
                    <button onClick={() => setActiveScreen(Screen.EditProfile)} className="flex items-center gap-2 text-sm font-semibold text-pink-400 hover:text-pink-300">
                        <Edit size={16} />
                        Edit
                    </button>
                </div>
                <p className="mt-4 text-zinc-300">{user.bio}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                    {user.tags.map(tag => (
                        <span key={tag} className="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
            </div>

            { (user.membership === MembershipType.Trial || user.membership === MembershipType.Premium) && (
                <div>
                    <MotionButton 
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBoost} 
                        disabled={boostTimeLeft > 0}
                        className={`w-full py-3 rounded-xl font-semibold text-white transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 ${boostTimeLeft > 0 ? 'bg-purple-500/50 cursor-not-allowed' : `bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90`}`}
                    >
                        <Zap size={20} />
                        {boostTimeLeft > 0 ? `Boost Active (${formatTime(boostTimeLeft)})` : 'Boost Profile'}
                    </MotionButton>
                    <p className="text-xs text-center mt-2 text-zinc-400">
                      {user.membership === 'Trial' ? "2 boosts included with your plan." : "Unlimited boosts with 24h cooldown for Premium."}
                    </p>
                </div>
            )}
            
            <div>
              <h2 className="text-center text-3xl font-bold mb-10">Choose Your Plan</h2>
              <div className="grid md:grid-cols-3 gap-8 md:gap-4 lg:gap-8">
                <PlanCard plan={MembershipType.Free} {...plans.Free} isCurrent={user.membership === 'Free'} onSelect={handlePlanSelect} loading={loading} />
                <PlanCard plan={MembershipType.Trial} {...plans.Trial} isCurrent={user.membership === 'Trial'} onSelect={handlePlanSelect} loading={loading} />
                <PlanCard plan={MembershipType.Premium} {...plans.Premium} isCurrent={user.membership === 'Premium'} onSelect={handlePlanSelect} loading={loading} isFeatured={true} />
              </div>
            </div>


            <div className="space-y-2 bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden">
                 <button onClick={() => setActiveScreen(Screen.Settings)} className="w-full text-left flex justify-between items-center p-4 transition-colors hover:bg-zinc-800">
                    <span className="flex items-center gap-3"><Settings size={20}/> Settings</span>
                    <ChevronRight size={20} className="text-zinc-500"/>
                </button>
                 <div className="w-full h-px bg-zinc-800"></div>
                <button onClick={logout} className="w-full text-left flex justify-between items-center p-4 transition-colors hover:bg-zinc-800">
                    <span className="text-red-400 flex items-center gap-3"><LogOut size={20}/> Log Out</span>
                </button>
            </div>
        </div>
    );
};

export default ProfileScreen;
