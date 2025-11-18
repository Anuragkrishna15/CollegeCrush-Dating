import * as React from 'react';
import { bookTrip } from '../../services/api.ts';
import { useNotification } from '../../hooks/useNotification.ts';
import { useUser } from '../../hooks/useUser.ts';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import { X, MapPin, Calendar, IndianRupee, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Trip } from '../../types/types.ts';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

interface BookTripModalProps {
    trip: Trip;
    onClose: () => void;
    onSuccess: () => void;
}

const BookTripModal: React.FC<BookTripModalProps> = ({ trip, onClose, onSuccess }) => {
    const [loading, setLoading] = React.useState(false);
    const { showNotification } = useNotification();
    const { user } = useUser();

    const handleConfirm = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await bookTrip(trip.id, user.id);
            showNotification('Trip booked successfully!', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            showNotification(error.message || 'Failed to book trip.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <MotionDiv
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-zinc-950/60 backdrop-blur-xl rounded-3xl w-full max-w-md p-6 border border-zinc-700 shadow-2xl"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                    <X />
                </button>

                <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                    Confirm Booking
                </h2>

                <div className="space-y-4">
                    <div className="bg-zinc-900/50 rounded-xl p-4">
                        <h3 className="font-semibold text-lg text-white mb-2">{trip.location}</h3>
                        <div className="space-y-2 text-sm text-zinc-300">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>{trip.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={16} />
                                <span>{trip.type} Trip</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <IndianRupee size={16} />
                                <span>{trip.fare?.toLocaleString('en-IN')} per person</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>{trip.slots} slots left</span>
                            </div>
                        </div>
                        {trip.details && (
                            <p className="text-sm text-zinc-400 mt-3">{trip.details}</p>
                        )}
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <p className="text-sm text-yellow-200">
                            By confirming this booking, you agree to the trip terms and conditions.
                            Payment will be processed upon confirmation.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <MotionButton
                        onClick={handleConfirm}
                        disabled={loading}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center`}
                    >
                        {loading ? <LoadingSpinner /> : 'Confirm Booking'}
                    </MotionButton>
                </div>
            </MotionDiv>
        </div>
    );
};

export default BookTripModal;