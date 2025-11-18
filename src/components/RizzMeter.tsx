import * as React from 'react';
import { Message } from '../types/types.ts';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Heart, MessageCircle, Zap } from 'lucide-react';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;

interface RizzMeterProps {
    messages: Message[];
    currentUserId: string;
}

interface RizzAnalysis {
    score: number;
    feedback: string;
    metrics: {
        responseTime: number;
        messageLength: number;
        engagement: number;
        creativity: number;
        confidence: number;
        humor: number;
        empathy: number;
        consistency: number;
    };
}

const RizzMeter: React.FC<RizzMeterProps> = ({ messages, currentUserId }) => {
    const analyzeRizz = React.useMemo((): RizzAnalysis => {
        if (messages.length === 0) {
            return {
                score: 0,
                feedback: "Start a conversation to check your rizz!",
                metrics: {
                    responseTime: 0,
                    messageLength: 0,
                    engagement: 0,
                    creativity: 0,
                    confidence: 0,
                    humor: 0,
                    empathy: 0,
                    consistency: 0
                }
            };
        }

        // Separate messages by sender
        const myMessages = messages.filter(m => m.senderId === currentUserId);
        const theirMessages = messages.filter(m => m.senderId !== currentUserId);

        if (myMessages.length === 0) {
            return {
                score: 0,
                feedback: "Send some messages to get your rizz score!",
                metrics: {
                    responseTime: 0,
                    messageLength: 0,
                    engagement: 0,
                    creativity: 0,
                    confidence: 0,
                    humor: 0,
                    empathy: 0,
                    consistency: 0
                }
            };
        }

        // Calculate various metrics
        let metrics = {
            responseTime: 0,
            messageLength: 0,
            engagement: 0,
            creativity: 0,
            confidence: 0,
            humor: 0,
            empathy: 0,
            consistency: 0
        };

        // 1. Response Time Score (how quickly you respond)
        let totalResponseTime = 0;
        let responseCount = 0;
        
        for (let i = 1; i < messages.length; i++) {
            if (messages[i].senderId === currentUserId && messages[i-1].senderId !== currentUserId) {
                const timeDiff = new Date(messages[i].created_at).getTime() - new Date(messages[i-1].created_at).getTime();
                totalResponseTime += timeDiff;
                responseCount++;
            }
        }
        
        if (responseCount > 0) {
            const avgResponseTime = totalResponseTime / responseCount;
            // Score based on response time (faster is better, but not too fast)
            if (avgResponseTime < 60000) { // Less than 1 minute
                metrics.responseTime = 15; // Too eager
            } else if (avgResponseTime < 300000) { // 1-5 minutes
                metrics.responseTime = 25; // Perfect
            } else if (avgResponseTime < 1800000) { // 5-30 minutes
                metrics.responseTime = 20; // Good
            } else if (avgResponseTime < 3600000) { // 30-60 minutes
                metrics.responseTime = 15; // Okay
            } else {
                metrics.responseTime = 10; // Too slow
            }
        } else {
            metrics.responseTime = 15; // Default
        }

        // 2. Message Length Score
        const avgMessageLength = myMessages.reduce((sum, m) => sum + m.text.length, 0) / myMessages.length;
        
        if (avgMessageLength < 10) {
            metrics.messageLength = 5; // Too short
        } else if (avgMessageLength < 30) {
            metrics.messageLength = 15; // Good for casual
        } else if (avgMessageLength < 100) {
            metrics.messageLength = 20; // Perfect balance
        } else if (avgMessageLength < 200) {
            metrics.messageLength = 15; // Getting long
        } else {
            metrics.messageLength = 10; // Too long
        }

        // 3. Engagement Score (back and forth conversation)
        const conversationRatio = theirMessages.length > 0 ? myMessages.length / theirMessages.length : 0;
        
        if (conversationRatio >= 0.8 && conversationRatio <= 1.2) {
            metrics.engagement = 20; // Balanced conversation
        } else if (conversationRatio < 0.5) {
            metrics.engagement = 10; // They're talking more
        } else if (conversationRatio > 2) {
            metrics.engagement = 10; // You're talking too much
        } else {
            metrics.engagement = 15; // Okay balance
        }

        // 4. Creativity Score (variety in messages)
        const uniqueWords = new Set<string>();
        const commonGreetings = ['hi', 'hello', 'hey', 'sup', 'what\'s up', 'how are you'];
        let hasQuestions = false;
        let hasEmojis = false;
        let hasExclamations = false;

        myMessages.forEach(msg => {
            const words = msg.text.toLowerCase().split(/\s+/);
            words.forEach(word => uniqueWords.add(word));
            
            if (msg.text.includes('?')) hasQuestions = true;
            if (/[\u{1F300}-\u{1F9FF}]/u.test(msg.text)) hasEmojis = true;
            if (msg.text.includes('!')) hasExclamations = true;
        });

        const vocabularyDiversity = uniqueWords.size / Math.max(myMessages.length * 5, 1);
        const hasCommonGreeting = myMessages.some(m => 
            commonGreetings.some(g => m.text.toLowerCase().includes(g))
        );

        metrics.creativity = Math.min(20, 
            (vocabularyDiversity > 0.5 ? 8 : 4) +
            (hasQuestions ? 4 : 0) +
            (hasEmojis ? 3 : 0) +
            (hasExclamations ? 3 : 0) +
            (hasCommonGreeting ? 2 : 0)
        );

        // 5. Confidence Score (based on message patterns)
        const avgSentenceLength = myMessages.map(m => m.text.split(/[.!?]/).length).reduce((a, b) => a + b, 0) / myMessages.length;
        const usesCapitals = myMessages.some(m => /[A-Z]/.test(m.text));
        const usesPunctuation = myMessages.some(m => /[.!?,]/.test(m.text));

        metrics.confidence = Math.min(15,
            (avgSentenceLength > 1 ? 5 : 3) +
            (usesCapitals ? 5 : 2) +
            (usesPunctuation ? 5 : 2)
        );

        // 6. Humor Score (NEW)
        const laughEmojis = ['😂', '🤣', '😆', '😅', '🙈', '😜', '🤪'];
        const hasLaughEmojis = myMessages.some(m => laughEmojis.some(emoji => m.text.includes(emoji)));
        const hasJokeWords = myMessages.some(m => /\b(joke|lmao|lol|haha|funny|hilarious)\b/i.test(m.text));
        const hasQuestionExclamation = myMessages.some(m => m.text.includes('?!') || m.text.includes('!?'));
        const hasSarcasmIndicators = myMessages.some(m => m.text.includes('🙄') || m.text.includes('😏'));

        metrics.humor = Math.min(10,
            (hasLaughEmojis ? 3 : 0) +
            (hasJokeWords ? 3 : 0) +
            (hasQuestionExclamation ? 2 : 0) +
            (hasSarcasmIndicators ? 2 : 0)
        );

        // 7. Empathy Score (NEW)
        const empathyWords = /\b(sorry|understand|feel|hard|difficult|tough|sorry to hear|that sucks|awful|terrible)\b/gi;
        const hasEmpathyWords = myMessages.some(m => empathyWords.test(m.text));
        const hasComfortEmojis = myMessages.some(m => ['🤗', '💕', '❤️', '💙', '💜', '🤝', '🙏'].some(emoji => m.text.includes(emoji)));
        const asksAboutFeelings = myMessages.some(m => /\b(how are you|are you okay|feeling|emotion|stress)\b/gi.test(m.text));

        metrics.empathy = Math.min(10,
            (hasEmpathyWords ? 4 : 0) +
            (hasComfortEmojis ? 3 : 0) +
            (asksAboutFeelings ? 3 : 0)
        );

        // 8. Consistency Score (NEW)
        const messageFrequency = myMessages.length / Math.max(theirMessages.length, 1);
        // Simple time variance calculation
        const messageTimes = myMessages.map(m => new Date(m.created_at).getTime());
        const avgTime = messageTimes.reduce((a, b) => a + b, 0) / messageTimes.length;
        const timeVariance = messageTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / messageTimes.length;
        const consistentLength = Math.abs(avgMessageLength - 50) < 30; // Messages around 50 chars

        metrics.consistency = Math.min(10,
            (messageFrequency >= 0.5 && messageFrequency <= 2 ? 4 : 2) +
            (timeVariance < 3600000 ? 3 : 1) + // Less than 1 hour variance
            (consistentLength ? 3 : 1)
        );

        // Calculate total score
        const totalScore = Object.values(metrics).reduce((sum, val) => sum + val, 0);

        // Generate feedback based on score
        let feedback = "";
        
        if (totalScore >= 80) {
            feedback = "🔥 Legendary rizz! You're absolutely crushing it! Keep that energy up!";
        } else if (totalScore >= 70) {
            feedback = "💯 Great rizz game! You're smooth and engaging. Maybe add a bit more creativity?";
        } else if (totalScore >= 60) {
            feedback = "✨ Solid rizz! You're doing well. Try asking more questions to keep them engaged!";
        } else if (totalScore >= 50) {
            feedback = "👍 Decent rizz! Room for improvement. Mix up your conversation style a bit!";
        } else if (totalScore >= 40) {
            feedback = "💪 You're getting there! Be more confident and show genuine interest!";
        } else if (totalScore >= 30) {
            feedback = "🎯 Keep practicing! Try to be more engaging and ask about their interests!";
        } else {
            feedback = "📈 Time to level up! Start with open-ended questions and show your personality!";
        }

        return {
            score: totalScore,
            feedback,
            metrics
        };
    }, [messages, currentUserId]);

    const { score, feedback, metrics } = analyzeRizz;
    
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'from-green-400 to-emerald-600';
        if (score >= 60) return 'from-yellow-400 to-orange-500';
        if (score >= 40) return 'from-orange-400 to-red-500';
        return 'from-red-400 to-red-600';
    };

    const getMetricColor = (value: number, max: number) => {
        const percentage = (value / max) * 100;
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-yellow-500';
        if (percentage >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <MotionDiv
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-purple-500/30"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-purple-400" />
                    Rizz Meter
                </h3>
                <div className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
                    {score}/100
                </div>
            </div>

            {/* Score Circle */}
            <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-zinc-700"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(score / 100) * 351.86} 351.86`}
                        className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white">{score}</div>
                        <div className="text-xs text-zinc-400">RIZZ</div>
                    </div>
                </div>
            </div>

            {/* Feedback */}
            <p className="text-sm text-zinc-300 text-center mb-6 px-2">{feedback}</p>

            {/* Detailed Metrics */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <Zap size={16} className="text-yellow-400" />
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Response Time</span>
                            <span>{metrics.responseTime}/25</span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${getMetricColor(metrics.responseTime, 25)} transition-all duration-500`}
                                style={{ width: `${(metrics.responseTime / 25) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <MessageCircle size={16} className="text-blue-400" />
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Message Quality</span>
                            <span>{metrics.messageLength}/20</span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${getMetricColor(metrics.messageLength, 20)} transition-all duration-500`}
                                style={{ width: `${(metrics.messageLength / 20) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Heart size={16} className="text-red-400" />
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Engagement</span>
                            <span>{metrics.engagement}/20</span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${getMetricColor(metrics.engagement, 20)} transition-all duration-500`}
                                style={{ width: `${(metrics.engagement / 20) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Sparkles size={16} className="text-purple-400" />
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Creativity</span>
                            <span>{metrics.creativity}/20</span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${getMetricColor(metrics.creativity, 20)} transition-all duration-500`}
                                style={{ width: `${(metrics.creativity / 20) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <TrendingUp size={16} className="text-green-400" />
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Confidence</span>
                            <span>{metrics.confidence}/15</span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getMetricColor(metrics.confidence, 15)} transition-all duration-500`}
                                style={{ width: `${(metrics.confidence / 15) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-lg">😄</span>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Humor</span>
                            <span>{metrics.humor}/10</span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getMetricColor(metrics.humor, 10)} transition-all duration-500`}
                                style={{ width: `${(metrics.humor / 10) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-lg">💝</span>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Empathy</span>
                            <span>{metrics.empathy}/10</span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getMetricColor(metrics.empathy, 10)} transition-all duration-500`}
                                style={{ width: `${(metrics.empathy / 10) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-lg">📊</span>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Consistency</span>
                            <span>{metrics.consistency}/10</span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getMetricColor(metrics.consistency, 10)} transition-all duration-500`}
                                style={{ width: `${(metrics.consistency / 10) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className="mt-6 p-3 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-400 font-semibold mb-2">Pro Tips:</p>
                <ul className="text-xs text-zinc-500 space-y-1">
                    {metrics.responseTime < 15 && <li>• Don't respond too quickly, give them time to miss you!</li>}
                    {metrics.messageLength < 10 && <li>• Try writing longer, more thoughtful messages</li>}
                    {metrics.engagement < 15 && <li>• Keep the conversation balanced, don't dominate!</li>}
                    {metrics.creativity < 10 && <li>• Mix it up! Use questions, emojis, and show personality</li>}
                    {metrics.confidence < 10 && <li>• Be more confident! Use proper grammar and punctuation</li>}
                    {metrics.humor < 5 && <li>• Add some humor! Try jokes, emojis, or playful language</li>}
                    {metrics.empathy < 5 && <li>• Show empathy! Ask about their feelings and be supportive</li>}
                    {metrics.consistency < 5 && <li>• Be consistent! Maintain similar message length and timing</li>}
                </ul>
            </div>

            {/* Trend Analysis */}
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                <p className="text-xs text-blue-300 font-semibold mb-2 flex items-center gap-1">
                    <span className="text-sm">📈</span>
                    Trend Analysis
                </p>
                <p className="text-xs text-zinc-400">
                    {score > 70 ? "Your rizz is improving! Keep up the great work." :
                     score > 50 ? "You're on the right track. Focus on consistency and empathy." :
                     "Room for growth! Try being more engaging and confident in your messages."}
                </p>
            </div>
        </MotionDiv>
    );
};

export default RizzMeter;
