import * as React from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for framer-motion type errors
const MotionButton: any = motion.button;

const ScrollToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <MotionButton
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={scrollToTop}
                    className="fixed bottom-20 right-4 z-50 p-3 bg-pink-600 text-white rounded-full shadow-lg hover:bg-pink-700 transition-colors"
                    aria-label="Scroll to top"
                >
                    <ChevronUp size={24} />
                </MotionButton>
            )}
        </AnimatePresence>
    );
};

export default ScrollToTopButton;