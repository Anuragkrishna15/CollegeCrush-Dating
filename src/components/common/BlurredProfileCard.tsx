import * as React from 'react';
import { Profile, BasicProfile } from '../../types/types.ts';
import { getOptimizedUrl } from '../../utils/date.ts';

interface BlurredProfileCardProps {
    profile: Profile | BasicProfile;
}

const BlurredProfileCard: React.FC<BlurredProfileCardProps> = ({ profile }) => {
    return (
        <div className="relative aspect-square rounded-2xl overflow-hidden">
            <img
                src={getOptimizedUrl(profile.profilePics[0], { width: 250, height: 250 })}
                alt={profile.name}
                loading="lazy"
                className="w-full h-full object-cover filter blur-sm"
            />
            <div className="absolute inset-0 bg-black/50 flex items-end p-3">
                <p className="text-white font-bold text-sm truncate">???, ???</p>
            </div>
        </div>
    );
};

export default BlurredProfileCard;