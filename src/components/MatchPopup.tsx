
import * as React from 'react';
import { Profile } from '../types/types.ts';
import { useUser } from '../hooks/useUser.ts';
import { PREMIUM_GRADIENT } from '../constants/constants.ts';
import LoadingSpinner from './LoadingSpinner.tsx';
import { getOptimizedUrl } from '../utils/date.ts';
import { motion } from 'framer-motion';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionImg: any = motion.img;
const MotionButton: any = motion.button;

interface MatchPopupProps {
  matchedProfile: Profile;
  onClose: () => void;
  onGoToChat: () => void;
}

const MatchPopup: React.FC<MatchPopupProps> = ({ matchedProfile, onClose, onGoToChat }) => {
  const { user: currentUser } = useUser();

  if (!currentUser) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <LoadingSpinner />
        </div>
    );
  }
  
  const handleSendMessageClick = () => {
    onGoToChat();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <MotionDiv 
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="relative bg-zinc-950/80 backdrop-blur-lg rounded-3xl w-full max-w-sm text-center p-8 border border-pink-500/50 shadow-2xl shadow-pink-500/20"
      >
        <h2 className={`text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${PREMIUM_GRADIENT} [text-shadow:_0_2px_10px_rgb(236_72_153_/_50%)]`}>
          It's a Match!
        </h2>
        <p className="text-zinc-400 mt-2">
          You and {matchedProfile.name} have liked each other.
        </p>
        <div className="flex justify-center items-center my-8 space-x-[-2rem]">
          <MotionImg 
            initial={{x: 50, rotate: 15}} animate={{x:0, rotate: -10}} transition={{type: 'spring', delay: 0.2}}
            src={getOptimizedUrl(currentUser.profile_pics[0], { width: 128, height: 128 })} alt="You" loading="lazy" className="w-32 h-32 rounded-full object-cover border-4 border-pink-500 shadow-md" />
          <MotionImg 
            initial={{x: -50, rotate: -15}} animate={{x:0, rotate: 10}} transition={{type: 'spring', delay: 0.2}}
            src={getOptimizedUrl(matchedProfile.profile_pics[0], { width: 128, height: 128 })} alt={matchedProfile.name} loading="lazy" className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 shadow-md" />
        </div>
        <MotionButton 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessageClick} className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/30`}>
          Send a Message
        </MotionButton>
        <button onClick={onClose} className="w-full mt-3 py-3 rounded-xl font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors">
          Keep Swiping
        </button>
      </MotionDiv>
    </div>
  );
};

export default MatchPopup;
