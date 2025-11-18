
import * as React from 'react';
import { fetchMyDates, acceptProposal, updateUserLocation, fetchNearbyProposals, cancelMyProposal, fetchMyProposals } from '../services/api.ts';
import { BlindDate, MembershipType, Screen, MyBlindDateProposal, BlindDateProposal } from '../types/types.ts';
import { PREMIUM_GRADIENT } from '../constants/constants.ts';
import { useUser } from '../hooks/useUser.ts';
import { useNotification } from '../hooks/useNotification.ts';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import ScrollToTopButton from '../components/common/ScrollToTopButton.tsx';
import EmptyState from '../components/common/EmptyState.tsx';
import { CalendarX2, Clock, MapPin, Lock, CheckCircle, Hourglass, Inbox, Compass, Trash2, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOptimizedUrl } from '../utils/date.ts';
import BlurredProfileCard from '../components/common/BlurredProfileCard.tsx';

// Fix for framer-motion type errors
const MotionButton: any = motion.button;
const MotionDiv: any = motion.div;

const ProposalCard: React.FC<{ proposal: BlindDateProposal, onAccept: (id: string) => void, isProcessing: boolean }> = ({ proposal, onAccept, isProcessing }) => (
    <div className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
            <div className="w-16 h-16 flex-shrink-0">
                <BlurredProfileCard profile={proposal.proposer} />
            </div>
            <div>
                <p className="font-bold text-lg">{proposal.proposer.name.split(' ')[0]} proposed a date</p>
                <p className="text-sm text-zinc-400">Accept to reveal their profile!</p>
            </div>
        </div>
        <div className="border-t border-zinc-800 pt-3 space-y-2 text-sm">
            <p className="flex items-center gap-2"><MapPin size={14} className="text-purple-400"/> {proposal.cafe}</p>
            <p className="flex items-center gap-2"><Clock size={14} className="text-purple-400"/> {new Date(proposal.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
        <MotionButton
            whileTap={{ scale: 0.95 }}
            onClick={() => onAccept(proposal.id)}
            disabled={isProcessing}
            className={`relative w-full mt-2 py-2.5 text-sm rounded-lg bg-gradient-to-r ${PREMIUM_GRADIENT} text-white font-semibold transition-opacity disabled:opacity-70 overflow-hidden`}
        >
            <div className="absolute inset-0 animate-shimmer"></div>
            {isProcessing ? 'Accepting...' : 'Accept & Reveal'}
        </MotionButton>
    </div>
);

const MyProposalCard: React.FC<{ proposal: MyBlindDateProposal, onCancel: (id: string) => void, isProcessing: boolean }> = ({ proposal, onCancel, isProcessing }) => (
    <div className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="space-y-1 text-sm">
            <p className="font-semibold text-white">Your Proposal</p>
            <p className="flex items-center gap-2 text-zinc-400"><MapPin size={14} /> {proposal.cafe}</p>
            <p className="flex items-center gap-2 text-zinc-400"><Clock size={14} /> {new Date(proposal.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
        <MotionButton
            whileTap={{ scale: 0.95 }}
            onClick={() => onCancel(proposal.id)}
            disabled={isProcessing}
            className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            aria-label="Cancel proposal"
        >
            {isProcessing ? <LoadingSpinner /> : <Trash2 size={18} />}
        </MotionButton>
    </div>
);


const getStatusInfo = (status: BlindDate['status'], isPast: boolean) => {
    switch (status) {
        case 'pending': return { text: 'Pending', color: 'bg-yellow-500/10 text-yellow-300' };
        case 'accepted': return isPast ? { text: 'Awaiting VibeCheck', color: 'bg-blue-500/10 text-blue-300' } : { text: 'Upcoming', color: 'bg-green-500/10 text-green-300' };
        case 'completed': return { text: 'Completed', color: 'bg-zinc-500/10 text-zinc-300' };
        case 'feedback_submitted': return { text: 'Completed', color: 'bg-zinc-500/10 text-zinc-300' };
        default: return { text: status, color: 'bg-zinc-500/10 text-zinc-300' };
    }
}

const MyDateCard: React.FC<{ date: BlindDate; onVibeCheck: (date: BlindDate) => void; isPast: boolean; }> = ({ date, onVibeCheck, isPast }) => {
    const statusInfo = getStatusInfo(date.status, isPast);

    const renderAction = () => {
        if (date.currentUserVibeCheck) {
            return <p className="text-sm text-center text-green-400 font-semibold flex items-center justify-center gap-2"><CheckCircle size={16}/> VibeCheck Submitted!</p>;
        }
        if (isPast && date.status === 'accepted') {
            return (
                <MotionButton whileTap={{ scale: 0.95 }} onClick={() => onVibeCheck(date)} className={`w-full text-sm py-2.5 rounded-lg bg-gradient-to-r ${PREMIUM_GRADIENT} text-white font-semibold`}>
                    Submit VibeCheck
                </MotionButton>
            );
        }
        return null;
    };

    return (
        <div className="bg-zinc-950/70 backdrop-blur-lg border border-zinc-800 rounded-2xl flex shadow-lg">
            <div className="flex-shrink-0 w-28 flex flex-col items-center justify-center bg-zinc-900 rounded-l-2xl border-r-2 border-dashed border-zinc-700 p-2 text-center">
                 <img src={getOptimizedUrl(date.otherUser.profile_pics[0], { width: 64, height: 64 })} alt={date.otherUser.name} className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"/>
                 <p className="font-bold text-sm mt-2 truncate">{date.otherUser.name}</p>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-lg text-white">Blind Date</p>
                        <span className={`text-xs font-semibold capitalize px-2 py-1 rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-zinc-400">
                        <p className="flex items-center gap-2"><MapPin size={14}/> {date.cafe}</p>
                        <p className="flex items-center gap-2"><Clock size={14}/> {new Date(date.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                </div>
                <div className="mt-3">
                    {renderAction()}
                </div>
            </div>
        </div>
    )
}

interface DatesScreenProps {
    onBookDate: () => void;
    onVibeCheck: (date: BlindDate) => void;
    setActiveScreen: (screen: Screen) => void;
}

const DatesScreen: React.FC<DatesScreenProps> = ({ onBookDate, onVibeCheck, setActiveScreen }) => {
    const [myDates, setMyDates] = React.useState<BlindDate[]>([]);
    const [myProposals, setMyProposals] = React.useState<MyBlindDateProposal[]>([]);
    const [nearbyProposals, setNearbyProposals] = React.useState<BlindDateProposal[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [processingId, setProcessingId] = React.useState<string | null>(null);
    const { user, refetchUser } = useUser();
    const { showNotification } = useNotification();
    
    const [locationStatus, setLocationStatus] = React.useState<'prompt' | 'loading' | 'granted' | 'denied'>('prompt');

    const canCreateDate = user?.membership === MembershipType.Premium;

    const loadAllData = React.useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            // Load each data source individually to prevent one failure from blocking others
            try {
                const fetchedMyDates = await fetchMyDates(user.id);
                setMyDates(fetchedMyDates);
            } catch (err) {
                console.error("Error loading my dates:", err);
                setMyDates([]);
            }

            try {
                const fetchedNearby = await fetchNearbyProposals(user.id);
                setNearbyProposals(fetchedNearby);
            } catch (err) {
                console.error("Error loading nearby proposals:", err);
                setNearbyProposals([]);
            }

            try {
                const fetchedMyProposals = await fetchMyProposals(user.id);
                setMyProposals(fetchedMyProposals);
            } catch (err) {
                console.error("Error loading my proposals:", err);
                setMyProposals([]);
            }
        } finally {
            setLoading(false);
        }
    }, [user, showNotification]);

    const requestLocation = React.useCallback(() => {
        if (!("geolocation" in navigator)) {
            setLocationStatus('denied');
            showNotification("Geolocation is not supported by your browser.", "error");
            return;
        }
        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await updateUserLocation(latitude, longitude);
                    await refetchUser(); // refetch user to get updated location on context
                    setLocationStatus('granted');
                } catch (error) {
                    showNotification("Could not save your location.", "error");
                    setLocationStatus('denied');
                }
            },
            (error) => {
                showNotification("Location access denied. This feature requires your location.", "error");
                setLocationStatus('denied');
            }
        );
    }, [showNotification, refetchUser]);

    React.useEffect(() => {
        if (user?.latitude && user?.longitude) {
            setLocationStatus('granted');
        } else if (user) {
            // If user exists but location doesn't, we need to ask.
            setLocationStatus('prompt');
        }
    }, [user]);

    React.useEffect(() => {
        if (locationStatus === 'granted') {
            loadAllData();
        }
    }, [locationStatus, loadAllData]);

    const handleAccept = async (id: string) => {
        if (!user) return;
        setProcessingId(id);
        try {
            const success = await acceptProposal(id, user.id);
            if (success) {
                showNotification("Date accepted! It's now in your upcoming dates.", "success");
                loadAllData(); // Refresh all data
            } else {
                showNotification("This date is no longer available.", "error");
                setNearbyProposals(prev => prev.filter(p => p.id !== id));
            }
        } catch (error: any) {
            showNotification(error.message, "error");
        } finally {
            setProcessingId(null);
        }
    };
    
    const handleCancelProposal = async (id: string) => {
        setProcessingId(id);
        try {
            await cancelMyProposal(id);
            showNotification("Proposal cancelled.", "info");
            setMyProposals(prev => prev.filter(p => p.id !== id));
        } catch (error: any) {
            showNotification(error.message || "Failed to cancel proposal.", "error");
        } finally {
            setProcessingId(null);
        }
    };
    
    // UI Render states
    if (user?.membership !== MembershipType.Premium) {
        return (
            <MotionDiv initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center p-8">
                <Lock className="w-16 h-16 text-yellow-400 mb-6" />
                <h2 className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${PREMIUM_GRADIENT}`}>Unlock Blind Dates</h2>
                <p className="text-zinc-400 mt-3 max-w-sm">Upgrade to Premium to propose and accept exciting blind dates with students near you.</p>
                <MotionButton whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05, y: -5 }} onClick={() => setActiveScreen(Screen.Profile)} className={`mt-8 w-full max-w-xs py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} shadow-lg shadow-pink-500/30`}>Upgrade to Premium</MotionButton>
            </MotionDiv>
        );
    }
    
    if (locationStatus !== 'granted') {
        return (
             <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Compass className="w-16 h-16 text-purple-400 mb-6" />
                <h2 className="text-2xl font-bold">Location is Key for Blind Dates</h2>
                <p className="text-zinc-400 mt-3 max-w-sm">We need your location to find date proposals from other students near you. Your location is kept private and safe.</p>
                <MotionButton onClick={requestLocation} disabled={locationStatus === 'loading'} className={`mt-8 w-full max-w-xs py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-500`}>
                    {locationStatus === 'loading' ? <LoadingSpinner /> : 'Enable Location'}
                </MotionButton>
             </div>
        )
    }

    return (
        <div className="relative h-full">
            <div className="p-4 md:p-8 pb-48 md:pb-12">
                {loading ? (
                    <div className="mt-6 flex justify-center"><LoadingSpinner /></div>
                ) : (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-300 px-1 mb-3">Available Dates Near You</h2>
                            {nearbyProposals.length > 0 ? (
                                <div className="space-y-4">
                                    {nearbyProposals.map(p => <ProposalCard key={p.id} proposal={p} onAccept={handleAccept} isProcessing={processingId === p.id} />)}
                                </div>
                            ) : <EmptyState icon={<Inbox size={48} />} title="No Proposals Nearby" message="No one has proposed a date in your area yet. Why not be the first?" />}
                        </div>

                         <div>
                            <h2 className="text-lg font-semibold text-zinc-300 px-1 mb-3">My Pending Proposals</h2>
                            {myProposals.length > 0 ? (
                                <div className="space-y-4">
                                    {myProposals.map(p => <MyProposalCard key={p.id} proposal={p} onCancel={handleCancelProposal} isProcessing={processingId === p.id} />)}
                                </div>
                            ) : <EmptyState icon={<Hourglass size={48} />} title="No Open Proposals" message="Propose a new date and it will show up here while you wait for someone to accept." />}
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-zinc-300 px-1 mb-3">My Confirmed & Past Dates</h2>
                            {myDates.length > 0 ? (
                                <div className="space-y-4">
                                   {myDates.map(d => {
                                        const isPast = new Date(d.dateTime) < new Date();
                                        return <MyDateCard key={d.id} date={d} onVibeCheck={onVibeCheck} isPast={isPast} />
                                   })}
                                </div>
                            ) : <EmptyState icon={<CalendarX2 size={48} />} title="No Dates Yet" message="Accept a proposal or have yours accepted. Your confirmed dates will appear here." />}
                        </div>
                    </div>
                )}
            </div>
            <div className="fixed bottom-24 md:bottom-8 inset-x-0 z-10 px-4 pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto">
                    <MotionButton whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} onClick={onBookDate} disabled={!canCreateDate} className={`relative overflow-hidden w-full py-4 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 bg-gradient-to-r ${PREMIUM_GRADIENT}`}>
                        <div className="absolute inset-0 animate-shimmer"></div>
                        <Ticket /> Propose a New Date
                    </MotionButton>
                </div>
            </div>
            <ScrollToTopButton />
        </div>
    );
};

export default DatesScreen;
