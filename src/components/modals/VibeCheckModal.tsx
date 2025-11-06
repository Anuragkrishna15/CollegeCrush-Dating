
import * as React from 'react';
import { BlindDate, VibeCheck } from '../../types/types.ts';
import { submitVibeCheck } from '../../services/api.ts';
import { useNotification } from '../../hooks/useNotification.ts';
import { useUser } from '../../hooks/useUser.ts';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import { X, ThumbsUp, ThumbsDown, CheckCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

interface VibeCheckModalProps {
    date: BlindDate;
    onClose: () => void;
    onSubmit?: () => void;
}

const positiveTags = ['Funny', 'Great chat', 'Good Listener', 'Confident', 'Punctual', 'Respectful', 'Charming'];
const constructiveTags = ['A bit shy', 'Not very talkative', 'Seemed distracted', 'Arrogant', 'Late', 'Different vibe'];

const VibeCheckModal: React.FC<VibeCheckModalProps> = ({ date, onClose, onSubmit }) => {
    const [step, setStep] = React.useState<'rating' | 'details' | 'submitted'>('rating');
    const [rating, setRating] = React.useState<'good' | 'bad' | null>(null);
    const [stars, setStars] = React.useState<number>(3);
    const [punctuality, setPunctuality] = React.useState<number>(3);
    const [conversation, setConversation] = React.useState<number>(3);
    const [respect, setRespect] = React.useState<number>(3);
    const [chemistry, setChemistry] = React.useState<number>(3);
    const [comments, setComments] = React.useState<string>('');
    const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);
    const { showNotification } = useNotification();
    const { user } = useUser();

    const handleRatingSelect = (selectedRating: 'good' | 'bad') => {
        setRating(selectedRating);
        setSelectedTags([]); // Reset tags when rating changes
        setStep('details');
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (!user || !rating) return;
        setLoading(true);
        const feedback: VibeCheck = {
            rating,
            tags: selectedTags,
            stars,
            punctuality,
            conversation,
            respect,
            chemistry,
            comments
        };
        try {
            await submitVibeCheck(date.id, user.id, feedback);
            setStep('submitted');
            if (onSubmit) onSubmit();
        } catch (error) {
            showNotification('Failed to submit feedback.', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const relevantTags = rating === 'good' ? positiveTags : constructiveTags;

    const StarRating: React.FC<{ value: number; onChange: (value: number) => void; label: string }> = ({ value, onChange, label }) => (
        <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => onChange(star)}
                        className={`w-6 h-6 ${star <= value ? 'text-yellow-400' : 'text-zinc-600'} hover:text-yellow-400 transition-colors`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );

    const renderContent = () => {
        switch (step) {
            case 'rating':
                return (
                    <MotionDiv key="rating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <h2 className="text-2xl font-bold text-center">VibeCheck</h2>
                        <p className="text-zinc-400 mt-1 text-center">How was your date with {date.otherUser.name}?</p>
                        <div className="flex gap-4 mt-8">
                            <MotionButton whileHover={{scale: 1.05}} whileTap={{ scale: 0.95 }} onClick={() => handleRatingSelect('good')} className="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-zinc-800 rounded-2xl border-2 border-transparent hover:border-green-500 transition-colors">
                                <ThumbsUp size={40} className="text-green-400"/>
                                <span className="text-xl font-semibold">Good Vibe</span>
                            </MotionButton>
                              <MotionButton whileHover={{scale: 1.05}} whileTap={{ scale: 0.95 }} onClick={() => handleRatingSelect('bad')} className="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-zinc-800 rounded-2xl border-2 border-transparent hover:border-red-500 transition-colors">
                                <ThumbsDown size={40} className="text-red-400"/>
                                  <span className="text-xl font-semibold">Bad Vibe</span>
                            </MotionButton>
                        </div>
                    </MotionDiv>
                );
            case 'details':
                  return (
                    <MotionDiv key="details" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}>
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setStep('rating')} className="p-1 text-zinc-400 hover:text-white"><ChevronLeft /></button>
                            <h2 className="text-2xl font-bold">Rate Your Experience</h2>
                        </div>
                        <p className="text-zinc-400 mt-1 pl-8 mb-6">Help us improve future matches!</p>

                        <div className="space-y-4 mb-6">
                            <StarRating value={stars} onChange={setStars} label="Overall Rating" />
                            <StarRating value={punctuality} onChange={setPunctuality} label="Punctuality" />
                            <StarRating value={conversation} onChange={setConversation} label="Conversation" />
                            <StarRating value={respect} onChange={setRespect} label="Respectfulness" />
                            <StarRating value={chemistry} onChange={setChemistry} label="Chemistry" />
                        </div>

                        <div className="mb-4">
                            <label className="text-sm text-zinc-400 block mb-2">Additional Comments (Optional)</label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Share more details about your experience..."
                                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-zinc-400 mb-2">Quick tags (optional):</p>
                            <div className="flex flex-wrap gap-2">
                                {relevantTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-1.5 text-sm rounded-full transition-colors border ${selectedTags.includes(tag) ? 'bg-pink-600 border-pink-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}
                                    >{tag}</button>
                                ))}
                            </div>
                        </div>

                        <MotionButton
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`w-full mt-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-50`}
                        >
                            {loading ? <LoadingSpinner/> : 'Submit Feedback'}
                        </MotionButton>
                    </MotionDiv>
                );
            case 'submitted':
                return (
                      <MotionDiv key="submitted" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                        <CheckCircle size={56} className="mx-auto text-green-400"/>
                        <h2 className="text-2xl font-bold mt-4">Feedback Sent!</h2>
                        <p className="text-zinc-400 mt-2">Thanks for sharing. If you both had a good time, we'll let you know and create a match for you to chat!</p>
                        <MotionButton
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className={`w-full mt-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT}`}
                        >
                            Done
                        </MotionButton>
                      </MotionDiv>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <MotionDiv
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-zinc-950/60 backdrop-blur-xl rounded-3xl w-full max-w-sm p-8 border border-zinc-700 shadow-2xl shadow-purple-500/10"
            >
                {step !== 'submitted' && <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X /></button>}
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </MotionDiv>
        </div>
    );
};

export default VibeCheckModal;
