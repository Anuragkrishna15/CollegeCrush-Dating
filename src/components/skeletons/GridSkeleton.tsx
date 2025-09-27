
import * as React from 'react';

const ProfileCardSkeleton: React.FC = () => (
    <div className="aspect-square bg-neutral-900 rounded-2xl animate-pulse"></div>
);

const TripCardSkeleton: React.FC = () => (
    <div className="bg-neutral-900 rounded-2xl animate-pulse">
        <div className="h-48 bg-neutral-800 rounded-t-2xl"></div>
        <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 rounded bg-neutral-800"></div>
            <div className="h-3 w-1/2 rounded bg-neutral-800"></div>
            <div className="h-10 w-full rounded bg-neutral-800 mt-4"></div>
        </div>
    </div>
);

const EventCardSkeleton: React.FC = () => (
    <div className="bg-neutral-900 rounded-2xl animate-pulse">
        <div className="h-32 bg-neutral-800 rounded-t-2xl"></div>
        <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 rounded bg-neutral-800"></div>
            <div className="h-3 w-1/2 rounded bg-neutral-800"></div>
        </div>
    </div>
);


interface GridSkeletonProps {
    count?: number;
    cardType: 'profile' | 'trip' | 'event';
}

const GridSkeleton: React.FC<GridSkeletonProps> = ({ count = 6, cardType }) => {
    let gridClasses = "grid grid-cols-2 md:grid-cols-3 gap-4";
    let CardComponent = ProfileCardSkeleton;

    switch (cardType) {
        case 'trip':
            gridClasses = "space-y-6";
            CardComponent = TripCardSkeleton;
            count = 3; // Trips are full-width, so show fewer
            break;
        case 'event':
            gridClasses = "space-y-4";
            CardComponent = EventCardSkeleton;
            count = 4; // Events are full-width, so show fewer
            break;
        case 'profile':
        default:
            // Default classes are already set
            break;
    }

    return (
        <div className={gridClasses}>
            {[...Array(count)].map((_, i) => (
                <CardComponent key={i} />
            ))}
        </div>
    );
};

export default GridSkeleton;
