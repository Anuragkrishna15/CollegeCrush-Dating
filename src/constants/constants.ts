

import * as React from 'react';
import { Screen } from '../types/types.ts';
import { Heart, Star, CalendarPlus, MessageSquare, Briefcase, GraduationCap, UserCircle } from 'lucide-react';

export const NAV_ITEMS = [
  { screen: Screen.Swipe, label: 'Swipe', icon: Heart },
  { screen: Screen.Likes, label: 'Likes', icon: Star },
  { screen: Screen.Chat, label: 'Chat', icon: MessageSquare },
  { screen: Screen.Dates, label: 'Dates', icon: CalendarPlus },
  { screen: Screen.Trips, label: 'Trips', icon: Briefcase },
  { screen: Screen.Events, label: 'Events', icon: GraduationCap },
  { screen: Screen.Profile, label: 'Profile', icon: UserCircle },
];

export const PREMIUM_GRADIENT = "from-pink-500 via-purple-500 to-indigo-500";

export const FEEDBACK_EMAIL = "collegecrush15@gmail.com";
