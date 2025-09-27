
import * as React from 'react';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    message: string;
    children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, children }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-500 animate-fade-in bg-zinc-950/50 rounded-2xl border-2 border-dashed border-zinc-800/70">
        <div className="mb-4 text-zinc-600">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-zinc-300">{title}</h3>
        <p className="mt-2 max-w-xs">{message}</p>
        {children && <div className="mt-4">{children}</div>}
    </div>
);

export default EmptyState;
