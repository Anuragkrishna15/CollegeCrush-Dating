

import * as React from 'react';
import { supabase } from '../../services/supabase.ts';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

const ALLOWED_DOMAINS = [
    'vitdelhi.ac.in', 'iiitd.ac.in', 'amity.edu', 'jimsindia.org', 
    'mait.ac.in', 'gtbit.org', 'bpitindia.com', 'tips.edu.in', 
    'jamiahamdard.ac.in', 'lpu.co.in', 'mail.lpu.in', 'cumail.in', 
    'chitkara.edu.in', 'davuniversity.org', 'ctgroup.in', 'rimt.ac.in', 
    'acet.ac.in', 'gku.ac.in', 'deshbhagatuniversity.in', 'quest.edu.in', 
    'mru.edu.in', 'ggn.amity.edu', 'bmu.edu.in', 'jgu.edu.in', 
    'asu.apeejay.edu', 'srmuniversity.ac.in', 'dpgitm.ac.in', 
    'starexuniversity.com', 'wctm.in', 'geetauniversity.edu.in', 
    'sharda.ac.in', 'galgotiasuniversity.edu.in', 'bennett.edu.in', 
    'glbitm.ac.in', 'kiet.edu', 'ims-ghaziabad.ac.in', 'iimtindia.net', 
    'abes.ac.in', 'niu.edu.in', 'chitkarauniversity.edu.in',
];

interface AuthScreenProps {
    onBackToLanding?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onBackToLanding }) => {
    const [email, setEmail] = React.useState('');
    const [otp, setOtp] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [otpSent, setOtpSent] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const domain = email.split('@')[1];
        if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
            setError('Your college is not yet supported. Please use a valid email from our partner colleges.');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            setOtpSent(true);
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email'
            });

            if (error) {
                throw error;
            }
            // If the sign-in succeeds, onAuthStateChange in App.tsx will handle the session.
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-white flex flex-col justify-center items-center p-4 font-sans">
              <div className="w-full max-w-sm text-center">
                {onBackToLanding && (
                    <button
                        onClick={onBackToLanding}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 self-start"
                        aria-label="Back to landing page"
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </button>
                )}
                <h1 className="text-5xl font-bold">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">College</span><span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-violet-400">Crush</span>
                </h1>
                <p className="text-zinc-400 mt-2">The exclusive network for college students.</p>

                <MotionDiv 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 bg-zinc-950/70 backdrop-blur-lg border border-white/10 p-8 rounded-2xl"
                >
                    {!otpSent ? (
                        <form onSubmit={handleLogin}>
                            <h2 className="text-xl font-semibold text-left">Verify your student email</h2>
                            <p className="text-sm text-zinc-500 text-left mb-6">Enter your college email to sign in or register.</p>
                            <label htmlFor="email-input" className="sr-only">Email Address</label>
                            <input
                                id="email-input"
                                type="email"
                                placeholder="name@university.ac.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                required
                            />
                            <MotionButton
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={loading}
                                className={`w-full mt-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center`}
                            >
                                {loading ? <LoadingSpinner /> : 'Send Code'}
                            </MotionButton>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <h2 className="text-xl font-semibold text-left">Enter Code</h2>
                            <p className="text-sm text-zinc-500 text-left mb-6">We sent a verification code to {email}.</p>
                             <label htmlFor="otp-input" className="sr-only">Verification Code</label>
                             <input
                               id="otp-input"
                               type="text"
                               inputMode="numeric"
                               pattern="[0-9]*"
                               placeholder="123456"
                               value={otp}
                               onChange={(e) => setOtp(e.target.value)}
                               className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 tracking-widest text-center"
                               required
                           />
                            <MotionButton
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={loading}
                                className={`w-full mt-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center`}
                            >
                                {loading ? <LoadingSpinner /> : 'Verify & Sign In'}
                            </MotionButton>
                             <button type="button" onClick={() => { setOtpSent(false); setError(null); }} className="text-sm text-zinc-400 mt-4 hover:text-white">
                                Use a different email
                            </button>
                        </form>
                    )}
                    {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                </MotionDiv>
            </div>
        </div>
    );
};

export default AuthScreen;
