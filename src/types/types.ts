import { Database } from '../services/database.types.ts';

export enum Screen {
  Swipe = 'Swipe',
  Likes = 'Likes',
  Dates = 'Dates',
  Chat = 'Chat',
  Community = 'Community',
  Trips = 'Trips',
  Events = 'Events',
  Profile = 'Profile',
  Settings = 'Settings',
  EditProfile = 'EditProfile',
  Notifications = 'Notifications',
  Admin = 'Admin',
}

export enum MembershipType {
   Free = 'Free',
   Trial = 'Trial',
   Premium = 'Premium',
}

export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbNotification = Database['public']['Tables']['notifications']['Row'];
export type Ad = Database['public']['Tables']['ads']['Row'];

export interface Prompt {
  question: string;
  answer: string;
}

export interface BasicProfile {
  id: string;
  name: string;
  profile_pics: string[];
  college: string;
  course: string;
  tags: string[];
  bio: string;
  prompts: Prompt[] | null;
  membership?: MembershipType;
  latitude?: number | null;
  longitude?: number | null;
}


export interface Comment {
    id: string;
    author: BasicProfile;
    content: string;
    created_at: string;
}

export interface NotificationPreferences {
    matches: boolean;
    messages: boolean;
    events: boolean;
    pushEnabled: boolean;
    pushMatches: boolean;
    pushMessages: boolean;
    pushEvents: boolean;
    pushCommunity: boolean;
}

export interface PrivacySettings {
    showInSwipe: boolean;
}

export type Profile = Omit<DbProfile, "prompts" | "notification_preferences" | "privacy_settings"> & {
  age: number;
  boost_end_time?: number;
  prompts: Prompt[] | null;
  notification_preferences: NotificationPreferences;
  privacy_settings: PrivacySettings;
};


export type User = Omit<DbProfile, "prompts" | "notification_preferences" | "privacy_settings"> & {
    age: number;
    comments: Comment[];
    boost_end_time?: number;
    prompts: Prompt[] | null;
    latitude?: number | null;
    longitude?: number | null;
    notification_preferences: NotificationPreferences;
    privacy_settings: PrivacySettings;
};


export interface ProfileOnboardingData {
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bio: string;
  course: string;
  tags: string[];
  prompts: Prompt[];
}

export interface VibeCheck {
    rating: 'good' | 'bad' | null;
    tags: string[];
    stars?: number; // 1-5 star rating
    punctuality?: number; // 1-5
    conversation?: number; // 1-5
    respect?: number; // 1-5
    chemistry?: number; // 1-5
    comments?: string;
}

export interface BlindDate {
  id: string;
  cafe: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Coffee & Snacks';
  dateTime: string;
  status: 'pending' | 'accepted' | 'completed' | 'feedback_submitted';
  otherUser: BasicProfile;
  isReceiver: boolean;
  currentUserVibeCheck?: VibeCheck | null;
}

export interface BlindDateProposal {
  id: string;
  proposer: BasicProfile;
  cafe: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Coffee & Snacks';
  dateTime: string;
  status: 'pending'; // always pending for a proposal
}

export interface MyBlindDateProposal {
  id: string;
  cafe: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Coffee & Snacks';
  dateTime: string;
}


export interface Trip {
  id: string;
  image_url: string | null;
  location: string;
  date: string;
  details: string | null;
  latitude: number | null;
  longitude: number | null;
  fare: number | null;
  slots: number;
  type: 'Couple' | 'Stranger' | 'Group';
}

export interface TripBooking {
  id: number;
  trip_id: string;
  user_id: string;
  status: string;
  payment_status: string;
  special_requests: string | null;
  emergency_contact: any | null;
  created_at: string;
  trip?: Trip; // For joined data
}
export type CollegeEvent = Database['public']['Tables']['events']['Row'] & {
  rsvpStatus: 'going' | 'interested' | 'none';
  organizer?: {
    id: string;
    name: string;
    profile_pics: string[];
  } | null;
};


export interface Message {
  id: string;
  text: string;
  senderId: string;
  created_at: string;
  conversation_id: string;
  is_read: boolean;
}

export interface Conversation {
  id:string;
  otherUser: BasicProfile;
  messages: Message[];
  unread_count: number;
}

export type NotificationType = Database['public']['Enums']['notification_type'];

export type AppNotification = {
  id: string;
  is_read: boolean;
  message: string;
  type: NotificationType;
  created_at: string;
  source_entity_id: string | null;
  user_id: string;
};

export type Swipeable = Profile | Ad;

// Community types
export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: CommunityCategory;
  author: BasicProfile | null; // null for anonymous posts
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  created_at: string;
  userVote?: 'up' | 'down' | null;
  mediaUrls?: string[];
}

export interface CommunityComment {
  id: string;
  postId: string;
  content: string;
  author: BasicProfile | null;
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  userVote?: 'up' | 'down' | null;
  replies?: CommunityComment[];
}

export type CommunityCategory =
  | 'Campus Life'
  | 'Study Tips'
  | 'Dating Advice'
  | 'General Chat'
  | 'Memes'
  | 'Lost & Found'
  | 'Events'
  | 'Study Groups';

// Gamification types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'messages' | 'swipes' | 'likes' | 'profile_views' | 'community_posts';
  target: number;
  progress: number;
  reward: number; // points
  completed: boolean;
  expiresAt: string;
}

export interface UserStats {
  totalSwipes: number;
  totalMatches: number;
  totalMessages: number;
  totalDates: number;
  currentStreak: number;
  longestStreak: number;
  points: number;
  level: number;
  achievements: Achievement[];
  dailyChallenges: DailyChallenge[];
}

// Matching algorithm types
export interface MatchingPreferences {
  ageRange: { min: number; max: number };
  maxDistance: number; // in km
  preferredGenders: ('Male' | 'Female' | 'Other')[];
  interests: string[];
  activityWeight: number; // 0-1, how much to weight recent activity
  diversityWeight: number; // 0-1, how much to weight diversity
  compatibilityWeight: number; // 0-1, how much to weight compatibility
}

export type MatchingVariant = 'control' | 'advanced' | 'ml-inspired';
