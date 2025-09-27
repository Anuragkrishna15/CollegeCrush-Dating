
import * as React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = "h-10 w-10" }) => {
  return (
    <Loader2 className={`animate-spin text-white ${className}`} />
  );
};

export default LoadingSpinner;
