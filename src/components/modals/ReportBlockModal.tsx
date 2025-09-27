

import * as React from 'react';
import { Profile } from '../../types/types.ts';
import { useNotification } from '../../hooks/useNotification.ts';
import { reportOrBlock } from '../../services/api.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;

interface ReportBlockModalProps {
    reportingUser: Profile;
    reportedProfile: Profile;
    onClose: () => void;
    onSuccess: () => void;
}

const reportReasons = [
    "Inappropriate Photos",
    "Feels like spam",
    "Underage",
    "Inappropriate Messages",
    "Something else",
];

function ReportBlockModal({ reportingUser, reportedProfile, onClose, onSuccess }: ReportBlockModalProps) {
    const [selectedReason, setSelectedReason] = React.useState("");
    const [otherReason, setOtherReason] = React.useState("");
    const [actionType, setActionType] = React.useState<'report' | 'block'>('report');
    const [loading, setLoading] = React.useState(false);
    const { showNotification } = useNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const reason = selectedReason === "Something else" ? otherReason : selectedReason;
        if (!reason) {
            showNotification("Please select a reason.", "error");
            return;
        }

        setLoading(true);
        try {
            await reportOrBlock(reportingUser.id, reportedProfile.id, reason, actionType);
            showNotification(
                actionType === 'block' 
                    ? `${reportedProfile.name} has been blocked.`
                    : `Report submitted. Thank you.`,
                "success"
            );
            onSuccess();
        } catch (error) {
            showNotification(`Failed to ${actionType} profile.`, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <MotionDiv
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-zinc-950/60 backdrop-blur-xl rounded-3xl w-full max-w-sm p-8 border border-zinc-700 shadow-lg"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                    <X />
                </button>
                <h2 className="text-2xl font-bold capitalize">{actionType} {reportedProfile.name}</h2>
                <p className="text-zinc-400 mt-1 text-sm">
                    {actionType === 'block'
                        ? "You will not see their profile again, and they won't see yours."
                        : "Your report is anonymous. If someone is in immediate danger, call emergency services."
                    }
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="flex gap-2 p-1 bg-zinc-800 rounded-lg">
                        <button type="button" onClick={() => setActionType('report')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${actionType === 'report' ? 'bg-pink-600 text-white' : 'text-zinc-300'}`}>Report</button>
                        <button type="button" onClick={() => setActionType('block')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${actionType === 'block' ? 'bg-red-600 text-white' : 'text-zinc-300'}`}>Block</button>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-400">Reason</label>
                        <div className="space-y-2 mt-2">
                        {reportReasons.map(reason => (
                            <label key={reason} className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg has-[:checked]:bg-pink-900/50 has-[:checked]:border-pink-500 border border-transparent transition-colors">
                                <input type="radio" name="reason" value={reason} checked={selectedReason === reason} onChange={(e) => setSelectedReason(e.target.value)} className="accent-pink-500" />
                                <span>{reason}</span>
                            </label>
                        ))}
                        </div>
                    </div>

                    {selectedReason === "Something else" && (
                        <textarea
                            value={otherReason}
                            onChange={(e) => setOtherReason(e.target.value)}
                            placeholder="Please provide details..."
                            className="mt-1 block w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                            rows={3}
                        />
                    )}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full mt-4 py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50 flex justify-center items-center ${actionType === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-pink-600 hover:bg-pink-700'}`}
                    >
                        {loading ? <LoadingSpinner /> : `Submit ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
                    </button>
                </form>
            </MotionDiv>
        </MotionDiv>
    );
};

export default ReportBlockModal;
