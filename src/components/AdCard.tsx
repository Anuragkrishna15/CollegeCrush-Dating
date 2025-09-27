
import * as React from 'react';
import { Ad } from '../types/types.ts';
import { motion } from 'framer-motion';
import { getOptimizedUrl } from '../utils/date.ts';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;

interface AdCardProps {
  ad: Ad;
}

const AdCard = React.memo(function AdCard({ ad }: AdCardProps) {
  return (
    <MotionDiv 
        className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 group"
    >
       <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
            <img src={getOptimizedUrl(ad.image_url, { width: 400, height: 600 })} alt={ad.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                Ad
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end">
                <h2 className="text-2xl font-bold text-white [text-shadow:_0_1px_4px_rgb(0_0_0_/_50%)]">
                    {ad.title}
                </h2>
                <p className="text-sm text-zinc-300 mt-1 opacity-80 [text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)]">
                    {new URL(ad.link).hostname}
                </p>
            </div>
       </a>
    </MotionDiv>
  );
});

export default AdCard;
