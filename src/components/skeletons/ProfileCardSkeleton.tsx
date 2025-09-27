
import * as React from 'react';

const ProfileCardSkeleton: React.FC = () => (
    <div className="relative w-full h-full bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col justify-end animate-pulse">
        <div className="absolute inset-0 bg-zinc-800"></div>
        <div className="relative z-10 space-y-3">
            <div className="h-8 w-3/4 bg-zinc-700 rounded-md"></div>
            <div className="h-4 w-1/2 bg-zinc-700 rounded-md"></div>
            <div className="h-4 w-full bg-zinc-700 rounded-md"></div>
            <div className="h-4 w-5/6 bg-zinc-700 rounded-md"></div>
            <div className="flex gap-2 pt-2">
                <div className="h-6 w-20 bg-zinc-700 rounded-full"></div>
                <div className="h-6 w-24 bg-zinc-700 rounded-full"></div>
                <div className="h-6 w-16 bg-zinc-700 rounded-full"></div>
            </div>
        </div>
    </div>
);

export default ProfileCardSkeleton;
