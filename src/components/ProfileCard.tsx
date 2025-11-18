
import * as React from 'react';
import { Profile, MembershipType } from '../types/types.ts';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { getOptimizedUrl } from '../utils/date.ts';
import { PREMIUM_GRADIENT } from '../constants/constants.ts';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;

interface ProfileCardProps {
  profile: Profile;
  onClick: () => void;
}

const ProfileCard = React.memo(function ProfileCard({ profile, onClick }: ProfileCardProps) {
  return (
    <MotionDiv
        className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-transparent cursor-pointer group p-px"
        onClick={onClick}
        role="button"
        aria-label={`View profile of ${profile.name}, ${profile.age} years old from ${profile.college}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
        <MotionDiv
            className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${PREMIUM_GRADIENT} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
        ></MotionDiv>
        <div className="relative w-full h-full bg-black/40 rounded-[23px] overflow-hidden backdrop-blur-sm">
        {profile.profile_pics && profile.profile_pics.length > 1 && (
            <div className="absolute top-3 inset-x-3 z-10 h-1 flex items-center gap-1.5">
                {profile.profile_pics.map((pic, i) => (
                    <div key={pic} className={`h-full flex-1 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`} />
                ))}
            </div>
        )}
        {profile.profile_pics && profile.profile_pics[0] && (
            <img src={getOptimizedUrl(profile.profile_pics[0], { width: 400, height: 600 })} alt={profile.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end">
            <div>
            <h2 className="text-3xl font-bold text-white flex items-center">
                {profile.name}, <span className="font-light ml-2">{profile.age}</span>
                {profile.membership === MembershipType.Premium && (
                    <Crown size={20} className="ml-2 text-yellow-400" />
                )}
            </h2>
            <p className="text-zinc-300 text-sm mt-1">{profile.college}</p>
            </div>
            <p className="text-zinc-300 text-sm mt-3 line-clamp-2">{profile.bio}</p>
            <div className="flex flex-wrap gap-2 mt-4">
            {(profile.tags || []).slice(0, 4).map((tag) => (
                <span key={tag} className="bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                {tag}
                </span>
            ))}
            </div>
        </div>
       </div>
    </MotionDiv>
  );
});

export default ProfileCard;
