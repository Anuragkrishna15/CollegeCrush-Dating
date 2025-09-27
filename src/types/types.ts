import { Database } from '../services/database.types.ts';

export enum Screen {
  Swipe = 'Swipe',
  Likes = 'Likes',
  Dates = 'Dates',
  Chat = 'Chat',
  Trips = 'Trips',
  Events = 'Events',
  Profile = 'Profile',
  Settings = 'Settings',
  EditProfile = 'EditProfile',
  Notifications = 'Notifications',
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
  profilePics: string[];
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
    text: string;
    created_at: string;
}

export interface NotificationPreferences {
    matches: boolean;
    messages: boolean;
    events: boolean;
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


export type Trip = Database['public']['Tables']['trips']['Row'];
export type CollegeEvent = Database['public']['Tables']['events']['Row'] & {
  rsvpStatus: 'going' | 'interested' | 'none';
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
