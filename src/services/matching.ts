import { Profile, User } from '../types/types.ts';

// User preference settings for matching
export interface MatchingPreferences {
  ageRange: { min: number; max: number };
  maxDistance: number; // in km
  preferredGenders: ('Male' | 'Female' | 'Other')[];
  interests: string[];
  activityWeight: number; // 0-1, how much to weight recent activity
  diversityWeight: number; // 0-1, how much to weight diversity
  compatibilityWeight: number; // 0-1, how much to weight compatibility
}

// Compatibility score result
export interface CompatibilityScore {
  profile: Profile;
  score: number;
  breakdown: {
    interests: number;
    location: number;
    age: number;
    activity: number;
    collaborative: number;
    diversity: number;
  };
}

// A/B testing variant
export type MatchingVariant = 'control' | 'advanced' | 'ml-inspired';

// Collaborative filtering data
interface CollaborativeData {
  likedProfiles: string[];
  swipedProfiles: string[];
  similarUsers: string[];
}

// Diversity tracking
interface DiversityTracker {
  recentColleges: string[];
  recentCourses: string[];
  recentTags: string[];
}

// Main matching service class
export class MatchingService {
  private static instance: MatchingService;
  private collaborativeData: Map<string, CollaborativeData> = new Map();
  private diversityTracker: Map<string, DiversityTracker> = new Map();
  private sortCache: Map<string, { profiles: Profile[], timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): MatchingService {
    if (!MatchingService.instance) {
      MatchingService.instance = new MatchingService();
    }
    return MatchingService.instance;
  }

  // Calculate compatibility score between user and profile
  calculateCompatibilityScore(
    user: User,
    profile: Profile,
    preferences: MatchingPreferences,
    variant: MatchingVariant = 'advanced'
  ): CompatibilityScore {
    const breakdown = {
      interests: this.calculateInterestScore(user, profile),
      location: this.calculateLocationScore(user, profile, preferences),
      age: this.calculateAgeScore(profile, preferences),
      activity: this.calculateActivityScore(profile),
      collaborative: this.calculateCollaborativeScore(user.id, profile),
      diversity: this.calculateDiversityScore(user.id, profile)
    };

    let score = 0;

    if (variant === 'control') {
      // Simple scoring - just basic filters
      score = (breakdown.interests + breakdown.location + breakdown.age) / 3;
    } else if (variant === 'advanced') {
      // Advanced scoring with weights
      score =
        breakdown.interests * preferences.compatibilityWeight +
        breakdown.location * 0.3 +
        breakdown.age * 0.2 +
        breakdown.activity * preferences.activityWeight +
        breakdown.collaborative * 0.1 +
        breakdown.diversity * preferences.diversityWeight;
    } else if (variant === 'ml-inspired') {
      // ML-inspired with collaborative filtering emphasis
      score =
        breakdown.interests * 0.2 +
        breakdown.location * 0.2 +
        breakdown.age * 0.1 +
        breakdown.activity * 0.2 +
        breakdown.collaborative * 0.4 +
        breakdown.diversity * 0.1;
    }

    // Normalize to 0-1
    score = Math.max(0, Math.min(1, score));

    return {
      profile,
      score,
      breakdown
    };
  }

  // Calculate interest compatibility based on shared tags
  private calculateInterestScore(user: User, profile: Profile): number {
    if (!user.tags || !profile.tags) return 0.5;

    const userTags = new Set(user.tags);
    const profileTags = new Set(profile.tags);

    const intersection = new Set([...userTags].filter(x => profileTags.has(x)));
    const union = new Set([...userTags, ...profileTags]);

    return union.size > 0 ? intersection.size / union.size : 0.5; // Jaccard similarity
  }

  // Calculate location proximity score
  private calculateLocationScore(user: User, profile: Profile, preferences: MatchingPreferences): number {
    if (!user.latitude || !user.longitude || !profile.latitude || !profile.longitude) {
      return 0.5; // Neutral score if location not available
    }

    const distance = this.calculateDistance(
      user.latitude, user.longitude,
      profile.latitude, profile.longitude
    );

    if (distance > preferences.maxDistance) return 0;

    // Score decreases linearly with distance
    return Math.max(0, 1 - (distance / preferences.maxDistance));
  }

  // Calculate age preference score
  private calculateAgeScore(profile: Profile, preferences: MatchingPreferences): number {
    const age = profile.age;
    if (age < preferences.ageRange.min || age > preferences.ageRange.max) return 0;

    // Score higher for ages closer to preferred range center
    const rangeCenter = (preferences.ageRange.min + preferences.ageRange.max) / 2;
    const distance = Math.abs(age - rangeCenter);
    const maxDistance = (preferences.ageRange.max - preferences.ageRange.min) / 2;

    return maxDistance > 0 ? Math.max(0, 1 - (distance / maxDistance)) : 1; // If min == max, perfect match
  }

  // Calculate activity score based on recency
  private calculateActivityScore(profile: Profile): number {
    if (!profile.last_seen) return 0.5;

    const lastSeen = new Date(profile.last_seen);
    const now = new Date();
    const hoursSinceActive = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);

    // Score decreases over time, active within 24h = 1.0, within week = 0.5, etc.
    if (hoursSinceActive < 24) return 1.0;
    if (hoursSinceActive < 168) return 0.7; // 1 week
    if (hoursSinceActive < 720) return 0.4; // 1 month
    return 0.1;
  }

  // Collaborative filtering score
  private calculateCollaborativeScore(userId: string, profile: Profile): number {
    const userData = this.collaborativeData.get(userId);
    if (!userData) return 0.5;

    // Find users who liked similar profiles
    const similarUsers = userData.similarUsers;
    if (similarUsers.length === 0) return 0.5;

    // Check if similar users also liked this profile
    // This is a simplified version - in reality, you'd query the database
    const likedBySimilar = similarUsers.some(user => {
      const similarData = this.collaborativeData.get(user);
      return similarData?.likedProfiles.includes(profile.id);
    });

    return likedBySimilar ? 0.8 : 0.3;
  }

  // Diversity score to avoid showing similar profiles
  private calculateDiversityScore(userId: string, profile: Profile): number {
    const tracker = this.diversityTracker.get(userId);
    if (!tracker) return 0.5;

    // Penalize if college/course/tags are too similar to recent profiles
    let penalty = 0;

    if (tracker.recentColleges.includes(profile.college)) penalty += 0.2;
    if (tracker.recentCourses.includes(profile.course)) penalty += 0.2;

    const sharedTags = profile.tags.filter(tag => tracker.recentTags.includes(tag));
    penalty += profile.tags.length > 0 ? (sharedTags.length / profile.tags.length) * 0.3 : 0;

    return Math.max(0, 1 - penalty);
  }

  // Update collaborative data when user likes/swipes
  updateCollaborativeData(userId: string, profileId: string, liked: boolean): void {
    let userData = this.collaborativeData.get(userId);
    if (!userData) {
      userData = {
        likedProfiles: [],
        swipedProfiles: [],
        similarUsers: []
      };
      this.collaborativeData.set(userId, userData);
    }

    userData.swipedProfiles.push(profileId);
    if (liked) {
      userData.likedProfiles.push(profileId);
    }

    // Keep only recent data (last 100 actions)
    if (userData.swipedProfiles.length > 100) {
      userData.swipedProfiles = userData.swipedProfiles.slice(-100);
      userData.likedProfiles = userData.likedProfiles.slice(-100);
    }

    // Update similar users (simplified - in reality, compute similarity)
    this.updateSimilarUsers(userId);
  }

  // Update diversity tracker
  updateDiversityTracker(userId: string, profile: Profile): void {
    let tracker = this.diversityTracker.get(userId);
    if (!tracker) {
      tracker = {
        recentColleges: [],
        recentCourses: [],
        recentTags: []
      };
      this.diversityTracker.set(userId, tracker);
    }

    tracker.recentColleges.push(profile.college);
    tracker.recentCourses.push(profile.course);
    tracker.recentTags.push(...profile.tags);

    // Keep only recent 10 profiles
    if (tracker.recentColleges.length > 10) {
      tracker.recentColleges = tracker.recentColleges.slice(-10);
      tracker.recentCourses = tracker.recentCourses.slice(-10);
      tracker.recentTags = tracker.recentTags.slice(-10);
    }
  }

  // Sort profiles by compatibility score with performance optimizations
  sortProfilesByCompatibility(
    user: User,
    profiles: Profile[],
    preferences: MatchingPreferences,
    variant: MatchingVariant = 'advanced'
  ): Profile[] {
    // Create cache key based on user ID and preferences
    const cacheKey = `${user.id}_${JSON.stringify(preferences)}_${variant}`;

    // Check cache first
    const cached = this.sortCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.profiles;
    }

    // Performance optimization: limit profiles to sort for better performance
    const maxProfilesToSort = 200;
    const profilesToSort = profiles.length > maxProfilesToSort
      ? profiles.slice(0, maxProfilesToSort)
      : profiles;

    const scored = profilesToSort.map(profile =>
      this.calculateCompatibilityScore(user, profile, preferences, variant)
    );

    // Sort by score descending, then by some randomization for equal scores
    scored.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.01) {
        // Add small random factor for equal scores to prevent same order
        return Math.random() - 0.5;
      }
      return b.score - a.score;
    });

    const sortedProfiles = scored.map(item => item.profile);

    // Cache the result
    this.sortCache.set(cacheKey, {
      profiles: sortedProfiles,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.sortCache.size > 50) {
      this.cleanOldCacheEntries();
    }

    return sortedProfiles;
  }

  private cleanOldCacheEntries(): void {
    const now = Date.now();
    for (const [key, value] of this.sortCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.sortCache.delete(key);
      }
    }
  }

  // Clear cache for a specific user when preferences change
  clearCacheForUser(userId: string): void {
    for (const key of this.sortCache.keys()) {
      if (key.startsWith(`${userId}_`)) {
        this.sortCache.delete(key);
      }
    }
  }

  // Get default preferences
  getDefaultPreferences(): MatchingPreferences {
    return {
      ageRange: { min: 18, max: 25 },
      maxDistance: 50, // 50km
      preferredGenders: ['Male', 'Female', 'Other'],
      interests: [],
      activityWeight: 0.3,
      diversityWeight: 0.2,
      compatibilityWeight: 0.5
    };
  }

  // A/B testing - assign variant based on user ID
  assignVariant(userId: string): MatchingVariant {
    const hash = this.simpleHash(userId);
    const bucket = hash % 100;

    if (bucket < 33) return 'control';
    if (bucket < 66) return 'advanced';
    return 'ml-inspired';
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private updateSimilarUsers(userId: string): void {
    // Simplified: find users with similar liked profiles
    // In reality, this would be computed periodically on the backend
    const userData = this.collaborativeData.get(userId);
    if (!userData) return;

    const similarUsers: string[] = [];
    for (const [otherUserId, otherData] of this.collaborativeData.entries()) {
      if (otherUserId === userId) continue;

      const intersection = userData.likedProfiles.filter(id =>
        otherData.likedProfiles.includes(id)
      );

      if (intersection.length >= 3) { // At least 3 shared likes
        similarUsers.push(otherUserId);
      }
    }

    userData.similarUsers = similarUsers.slice(0, 10); // Top 10 similar users
  }
}

// Export singleton instance
export const matchingService = MatchingService.getInstance();