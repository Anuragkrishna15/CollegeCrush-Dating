import * as React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Flame, Star, Award, Zap, TrendingUp, Calendar } from 'lucide-react';
import { Achievement, DailyChallenge, UserStats } from '../types/types.ts';
import { useUser } from '../hooks/useUser.ts';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

// User stats will be loaded from API

interface GamificationPanelProps {
  compact?: boolean;
  onClose?: () => void;
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({ compact = false, onClose }) => {
  const [userStats, setUserStats] = React.useState<UserStats | null>(null);
  const { user } = useUser();

  const levelProgress = userStats ? ((userStats.points % 1000) / 1000) * 100 : 0;

  if (compact) {
    if (!userStats) {
      return (
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900/95 backdrop-blur-lg rounded-2xl p-4 border border-purple-500/30"
        >
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
          </div>
        </MotionDiv>
      );
    }

    return (
      <MotionDiv
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900/95 backdrop-blur-lg rounded-2xl p-4 border border-purple-500/30"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-400" size={20} />
            <span className="text-white font-semibold">Level {userStats.level}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="text-purple-400" size={16} />
            <span className="text-purple-300 font-bold">{userStats.points}</span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Progress to Level {userStats.level + 1}</span>
            <span>{userStats.points % 1000}/1000</span>
          </div>
          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Flame className="text-orange-400" size={14} />
            <span className="text-zinc-300">{userStats.currentStreak} day streak</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="text-green-400" size={14} />
            <span className="text-zinc-300">{userStats.achievements.length} badges</span>
          </div>
        </div>
      </MotionDiv>
    );
  }

  if (!userStats) {
    return (
      <div className="h-full flex flex-col bg-zinc-950">
        <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-400" />
              Achievements
            </h1>
            {onClose && (
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white"
              >
                ✕
              </MotionButton>
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-400" />
            Achievements
          </h1>
          {onClose && (
            <MotionButton
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white"
            >
              ✕
            </MotionButton>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Level & Stats */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30"
        >
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-white mb-2">Level {userStats.level}</div>
            <div className="flex items-center justify-center gap-2 text-purple-300">
              <Zap size={20} />
              <span className="text-xl font-bold">{userStats.points} Points</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>Progress to Level {userStats.level + 1}</span>
              <span>{userStats.points % 1000}/1000</span>
            </div>
            <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                <Flame size={16} />
                <span className="font-bold">{userStats.currentStreak}</span>
              </div>
              <div className="text-xs text-zinc-400">Day Streak</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                <Award size={16} />
                <span className="font-bold">{userStats.achievements.length}</span>
              </div>
              <div className="text-xs text-zinc-400">Badges</div>
            </div>
          </div>
        </MotionDiv>

        {/* Daily Challenges */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="text-blue-400" />
            Daily Challenges
          </h2>
          <div className="space-y-3">
            {userStats.dailyChallenges.map((challenge) => (
              <MotionDiv
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{challenge.title}</h3>
                    <p className="text-zinc-400 text-sm">{challenge.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-purple-300">
                    <Zap size={14} />
                    <span className="text-sm font-bold">+{challenge.reward}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Progress</span>
                    <span>{challenge.progress}/{challenge.target}</span>
                  </div>
                  <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        challenge.completed ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {challenge.completed && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Award size={14} />
                    <span>Completed! Points awarded.</span>
                  </div>
                )}
              </MotionDiv>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="text-yellow-400" />
            Badges Earned
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {userStats.achievements.map((achievement) => (
              <MotionDiv
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-xl p-4 text-center"
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h3 className="text-white font-semibold mb-1">{achievement.name}</h3>
                <p className="text-zinc-400 text-xs mb-2">{achievement.description}</p>
                <div className="text-xs text-zinc-500">
                  {new Date(achievement.unlockedAt!).toLocaleDateString()}
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-400" />
            Your Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{userStats.totalSwipes}</div>
              <div className="text-xs text-zinc-400">Total Swipes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400 mb-1">{userStats.totalMatches}</div>
              <div className="text-xs text-zinc-400">Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{userStats.totalMessages}</div>
              <div className="text-xs text-zinc-400">Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">{userStats.totalDates}</div>
              <div className="text-xs text-zinc-400">Dates</div>
            </div>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default GamificationPanel;