
import * as React from 'react';
import { proposeBlindDate } from '../../services/api.ts';
import { useNotification } from '../../hooks/useNotification.ts';
import { useUser } from '../../hooks/useUser.ts';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import { X, MapPin, Calendar, Clock, Utensils, Sparkles } from 'lucide-react';
import { BlindDate } from '../../types/types.ts';
import { motion } from 'framer-motion';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

interface BookBlindDateModalProps {
    onClose: () => void;
    userLocation?: { latitude: number; longitude: number; }
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Coffee & Snacks'];

const DEFAULT_LOCATIONS = [
    'Central Park Cafe',
    'Main Street Coffee',
    'Downtown Diner',
    'Riverside Restaurant',
    'Campus Corner Cafe',
    'Starbucks',
    'Local Coffee Shop',
    'Other (specify below)'
];

// Enhanced safety features
const SAFETY_FEATURES = [
    { id: 'location_sharing', label: 'Share live location during date', icon: '📍' },
    { id: 'emergency_contact', label: 'Emergency contact notification', icon: '🚨' },
    { id: 'check_in', label: 'Automatic check-in reminders', icon: '⏰' },
    { id: 'sos_button', label: 'Quick SOS button in chat', icon: '🆘' }
];

const BookBlindDateModal: React.FC<BookBlindDateModalProps> = ({ onClose }) => {
    const [selectedLocation, setSelectedLocation] = React.useState('Central Park Cafe');
    const [customLocation, setCustomLocation] = React.useState('');
    const [date, setDate] = React.useState('');
    const [time, setTime] = React.useState('');
    const [selectedMeal, setSelectedMeal] = React.useState('Coffee & Snacks');
    const [loading, setLoading] = React.useState(false);
    const [safetyFeatures, setSafetyFeatures] = React.useState<string[]>(['location_sharing', 'emergency_contact']);
    const [flexibleTime, setFlexibleTime] = React.useState(false);
    const [alternativeTime, setAlternativeTime] = React.useState('');
    const { showNotification } = useNotification();
    const { user } = useUser();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const location = selectedLocation === 'Other (specify below)' ? customLocation : selectedLocation;
        if (!location.trim() || !date || !time) {
            showNotification('Please fill out all fields.', 'error');
            return;
        }

        const dateTime = new Date(`${date}T${time}`);
        if (isNaN(dateTime.getTime())) {
            showNotification('Invalid date or time provided.', 'error');
            return;
        }
        if (dateTime < new Date()) {
            showNotification('You cannot propose a date in the past.', 'error');
            return;
        }

        setLoading(true);
        try {
            await proposeBlindDate(location.trim(), dateTime.toISOString(), selectedMeal as BlindDate['meal']);
            showNotification('Date proposal posted! We\'ll notify you if someone accepts.', 'success');
            onClose();
        } catch (error: any) {
            showNotification(error.message || 'Failed to propose date.', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <MotionDiv
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-zinc-950/60 backdrop-blur-xl rounded-3xl w-full max-w-sm p-8 border border-zinc-700 shadow-2xl shadow-purple-500/10"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                    <X />
                </button>

                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                    <Sparkles className="text-purple-400" />
                    Propose a Blind Date
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-zinc-400 flex items-center gap-2 mb-2">
                            <MapPin size={16} />
                            Location
                        </label>
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                            required
                        >
                            {DEFAULT_LOCATIONS.map(location => <option key={location} value={location}>{location}</option>)}
                        </select>
                        {selectedLocation === 'Other (specify below)' && (
                            <input
                                type="text"
                                placeholder="Enter custom location"
                                value={customLocation}
                                onChange={(e) => setCustomLocation(e.target.value)}
                                className="w-full p-3 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                                required
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-zinc-400 flex items-center gap-2 mb-2">
                                <Calendar size={16} />
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                min={today}
                                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-zinc-400 flex items-center gap-2 mb-2">
                                <Clock size={16} />
                                Time
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-zinc-400 flex items-center gap-2 mb-2">
                            <Utensils size={16} />
                            Meal Type
                        </label>
                        <select
                            value={selectedMeal}
                            onChange={(e) => setSelectedMeal(e.target.value)}
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            required
                        >
                            {MEAL_TYPES.map(meal => <option key={meal} value={meal}>{meal}</option>)}
                        </select>
                    </div>

                    {/* Flexible Scheduling */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="flexible"
                                checked={flexibleTime}
                                onChange={(e) => setFlexibleTime(e.target.checked)}
                                className="w-4 h-4 text-purple-600 bg-zinc-800 border-zinc-700 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="flexible" className="text-sm text-zinc-300">
                                I'm flexible with timing
                            </label>
                        </div>

                        {flexibleTime && (
                            <div>
                                <label className="text-sm text-zinc-400 flex items-center gap-2 mb-2">
                                    <Clock size={16} />
                                    Alternative Time (Optional)
                                </label>
                                <input
                                    type="time"
                                    value={alternativeTime}
                                    onChange={(e) => setAlternativeTime(e.target.value)}
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                />
                            </div>
                        )}
                    </div>

                    {/* Safety Features */}
                    <div>
                        <label className="text-sm text-zinc-400 mb-3 block flex items-center gap-2">
                            <span className="text-green-400">🛡️</span>
                            Safety Features
                        </label>
                        <div className="space-y-2">
                            {SAFETY_FEATURES.map(feature => (
                                <div key={feature.id} className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id={feature.id}
                                        checked={safetyFeatures.includes(feature.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSafetyFeatures(prev => [...prev, feature.id]);
                                            } else {
                                                setSafetyFeatures(prev => prev.filter(f => f !== feature.id));
                                            }
                                        }}
                                        className="w-4 h-4 text-green-600 bg-zinc-800 border-zinc-700 rounded focus:ring-green-500"
                                    />
                                    <label htmlFor={feature.id} className="text-sm text-zinc-300 flex items-center gap-2">
                                        <span>{feature.icon}</span>
                                        {feature.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <MotionButton
                        type="submit"
                        disabled={loading}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full mt-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center`}
                    >
                        {loading ? <LoadingSpinner /> : 'Post Date Proposal'}
                    </MotionButton>
                </form>
            </MotionDiv>
        </div>
    );
};

export default BookBlindDateModal;
