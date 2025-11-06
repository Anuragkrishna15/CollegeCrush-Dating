
import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className = "",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  return (
    <MotionDiv
      className={`flex items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Loader2 className={`animate-spin text-pink-400 ${sizeClasses[size]}`} />
      <MotionDiv
        className="absolute rounded-full border-2 border-pink-400/20"
        style={{
          width: size === 'sm' ? '24px' : size === 'md' ? '40px' : '64px',
          height: size === 'sm' ? '24px' : size === 'md' ? '40px' : '64px'
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </MotionDiv>
  );
};

export default LoadingSpinner;
