
import * as React from 'react';
import { Profile, User, MembershipType } from '../../types/types.ts';
import { useUser } from '../../hooks/useUser.ts';
import { useNotification } from '../../hooks/useNotification.ts';
import { postComment, getProfile } from '../../services/api.ts';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import { motion } from 'framer-motion';
import ReportBlockModal from './ReportBlockModal.tsx';
import { X, MessageSquare, ChevronLeft, ChevronRight, Flag, Lock, Crown } from 'lucide-react';
import { formatCommentDate, getOptimizedUrl } from '../../utils/date.ts';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;

interface ProfileDetailModalProps {
    profile: Profile;
    onClose: () => void;
}

function ProfileDetailModal({ profile: initialProfile, onClose }: ProfileDetailModalProps) {
    const { user } = useUser();
    const { showNotification } = useNotification();
    const [fullProfile, setFullProfile] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [newComment, setNewComment] = React.useState('');
    const [isCommenting, setIsCommenting] = React.useState(false);
    const [showReportModal, setShowReportModal] = React.useState(false);
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const modalContentRef = React.useRef<HTMLDivElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    
    React.useEffect(() => {
        setLoading(true);
        getProfile(initialProfile.id)
            .then(profileData => {
                if (profileData) {
                    setFullProfile(profileData);
                }
            })
            .catch((err: any) => {
                console.error("Failed to load full profile:", err.message || err);
                showNotification("Could not load profile details.", "error");
                onClose();
            })
            .finally(() => setLoading(false));
    }, [initialProfile.id, showNotification, onClose]);
    
    React.useEffect(() => {
        // Disable body scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Auto-growing textarea effect
    React.useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [newComment]);

    const canComment = user?.membership === MembershipType.Trial || user?.membership === MembershipType.Premium;

    const scrollToIndex = (index: number) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                left: index * scrollRef.current.clientWidth,
                behavior: 'smooth',
            });
            setCurrentImageIndex(index);
        }
    };
    
    const handleNext = () => {
        if (!fullProfile) return;
        const nextIndex = (currentImageIndex + 1) % fullProfile.profilePics.length;
        scrollToIndex(nextIndex);
    };

    const handlePrev = () => {
        if (!fullProfile) return;
        const prevIndex = (currentImageIndex - 1 + fullProfile.profilePics.length) % fullProfile.profilePics.length;
        scrollToIndex(prevIndex);
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const index = Math.round(scrollLeft / clientWidth);
            setCurrentImageIndex(index);
        }
    };
    
    const handlePostComment = async () => {
        if (!newComment.trim() || !user || !fullProfile) return;
        setIsCommenting(true);
        try {
            const addedComment = await postComment(fullProfile.id, user.id, newComment);
            setFullProfile(prev => prev ? { ...prev, comments: [addedComment, ...prev.comments] } : null);
            setNewComment('');
            showNotification('Comment posted!', 'success');
        } catch (error) {
            console.error('Failed to post comment', error);
            showNotification('Failed to post comment.', 'error');
        } finally {
            setIsCommenting(false);
        }
    };

    const handleReportSuccess = () => {
        setShowReportModal(false);
        onClose();
    };

    return (
        <>
        <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <MotionDiv
                ref={modalContentRef}
                layout
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className="relative bg-zinc-950/60 backdrop-blur-xl w-full max-w-lg h-[90vh] rounded-3xl border border-zinc-700 shadow-2xl flex flex-col overflow-hidden"
                onClick={(e: any) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 z-30 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors">
                    <X />
                </button>

                {loading || !fullProfile ? (
                    <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
                ) : (
                    <>
                    <div className="relative w-full aspect-square max-h-[50vh] flex-shrink-0 group">
                        <div ref={scrollRef} onScroll={handleScroll} className="w-full h-full flex overflow-x-scroll snap-x snap-mandatory scrollbar-hide">
                            {fullProfile.profilePics.map(pic => (
                                <img key={pic} src={getOptimizedUrl(pic, { width: 500, height: 500 })} alt={fullProfile.name} className="w-full h-full object-cover snap-center flex-shrink-0" />
                            ))}
                        </div>

                         {fullProfile.profilePics.length > 1 && (
                            <>
                                <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft /></button>
                                <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight /></button>
                                <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                                    {fullProfile.profilePics.map((_, i) => (
                                        <button key={i} onClick={() => scrollToIndex(i)} className={`w-2 h-2 rounded-full transition-colors ${currentImageIndex === i ? 'bg-white' : 'bg-white/50'}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-3xl font-bold flex items-center">{fullProfile.name}, <span className="font-light ml-2">{fullProfile.age}</span>
                                {fullProfile.membership === MembershipType.Premium && <Crown size={22} className="ml-3 text-yellow-400" />}
                            </h2>
                            <p className="text-zinc-400 mt-1">{fullProfile.college} &middot; {fullProfile.course}</p>
                            
                            <p className="mt-4 text-zinc-300">{fullProfile.bio}</p>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {fullProfile.tags.map(tag => (
                                    <span key={tag} className="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full">{tag}</span>
                                ))}
                            </div>

                             {(fullProfile.prompts && fullProfile.prompts.length > 0) && (
                                <div className="mt-6 space-y-4">
                                    {fullProfile.prompts.map(prompt => (
                                        <div key={prompt.question} className="bg-zinc-900 rounded-xl p-4">
                                            <p className="text-sm text-zinc-400 font-semibold">{prompt.question}</p>
                                            <p className="text-white mt-1 text-lg">{prompt.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {user && user.id !== fullProfile.id && (
                                <button onClick={() => setShowReportModal(true)} className="w-full mt-6 text-left flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors">
                                    <span className="flex items-center gap-2 text-sm text-red-400 font-semibold"><Flag size={16}/> Report or Block {fullProfile.name}</span>
                                    <ChevronRight className="text-zinc-500" size={18} />
                                </button>
                            )}
                        </div>
                        
                        <div className="p-6 border-t border-zinc-800">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                            <MessageSquare size={20} className={`bg-clip-text text-transparent bg-gradient-to-r ${PREMIUM_GRADIENT}`} />
                                Comments ({fullProfile.comments.length})
                            </h3>
                            
                            {canComment && user && user.id !== fullProfile.id ? (
                                <div className="mt-4 flex items-start gap-3">
                                    <img src={getOptimizedUrl(user.profilePics[0], { width: 36, height: 36 })} alt="Your avatar" loading="lazy" className="w-9 h-9 rounded-full object-cover" />
                                    <div className="flex-1">
                                        <textarea 
                                            ref={textareaRef}
                                            value={newComment} 
                                            onChange={(e) => setNewComment(e.target.value)} 
                                            placeholder="Leave a nice comment..." 
                                            rows={1} 
                                            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm resize-none overflow-hidden"
                                        ></textarea>
                                        <button onClick={handlePostComment} disabled={isCommenting || !newComment.trim()} className="mt-2 px-4 py-1.5 bg-pink-600 text-white text-sm font-semibold rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 flex justify-center items-center w-24 h-8">
                                            {isCommenting ? <LoadingSpinner className="h-5 w-5" /> : "Post"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                user && user.id !== fullProfile.id && (
                                    <div className="mt-4 p-4 bg-zinc-900 border border-dashed border-zinc-700 rounded-lg text-center">
                                        <Lock className="mx-auto text-zinc-500 mb-2"/>
                                        <h4 className={`font-bold bg-clip-text text-transparent bg-gradient-to-r ${PREMIUM_GRADIENT}`}>Unlock Comments</h4>
                                        <p className="text-sm text-zinc-400 mt-1">Upgrade to Premium to leave comments on profiles.</p>
                                    </div>
                                )
                            )}

                            <div className="mt-6 space-y-5">
                                {fullProfile.comments.map(comment => (
                                    <div key={comment.id} className="flex items-start gap-3">
                                        <img src={getOptimizedUrl(comment.author.profilePics[0], { width: 36, height: 36 })} alt={comment.author.name} loading="lazy" className="w-9 h-9 rounded-full object-cover" />
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <p className="font-semibold text-sm">{comment.author.name}</p>
                                                <p className="text-xs text-zinc-500">{formatCommentDate(comment.created_at)}</p>
                                            </div>
                                            <p className="text-zinc-300 text-sm">{comment.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    </>
                )}
            </MotionDiv>
        </MotionDiv>
        {showReportModal && user && (
            <ReportBlockModal 
                reportingUser={user} 
                reportedProfile={fullProfile!} 
                onClose={() => setShowReportModal(false)}
                onSuccess={handleReportSuccess}
            />
        )}
        </>
    );
}

export default ProfileDetailModal;
