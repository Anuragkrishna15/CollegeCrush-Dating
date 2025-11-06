
import * as React from 'react';
import { motion } from 'framer-motion';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    message: string;
    children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, children }) => (
    <MotionDiv
        className="flex flex-col items-center justify-center text-center p-8 text-zinc-500 bg-zinc-950/50 rounded-2xl border-2 border-dashed border-zinc-800/70 hover:border-zinc-700 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
    >
        <MotionDiv
            className="mb-4 text-zinc-600"
            animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            {icon}
        </MotionDiv>
        <h3 className="text-xl font-bold text-zinc-300 mb-2">{title}</h3>
        <p className="mt-2 max-w-xs text-zinc-400 leading-relaxed">{message}</p>
        {children && (
            <MotionDiv
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                {children}
            </MotionDiv>
        )}
    </MotionDiv>
);

export default EmptyState;
