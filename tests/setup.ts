// Test setup configuration for CollegeCrush
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock Supabase client for tests
import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  })),
}));

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@college.edu',
    name: 'Test User',
    college: 'Test College',
    course: 'Computer Science',
    gender: 'Male' as const,
    dob: '2000-01-01',
    bio: 'Test bio',
    profilePics: ['pic1.jpg'],
    tags: ['coding', 'gaming'],
    membership: 'Free' as const,
    ...overrides,
  }),

  createMockProfile: (overrides = {}) => ({
    id: 'test-profile-id',
    name: 'Test Profile',
    college: 'Test College',
    course: 'Computer Science',
    bio: 'Test bio',
    profilePics: ['pic1.jpg', 'pic2.jpg'],
    tags: ['coding', 'music'],
    prompts: [],
    gender: 'Female' as const,
    dob: '2000-01-01',
    email: 'test@college.edu',
    membership: 'Free' as const,
    latitude: 28.6139,
    longitude: 77.2090,
    ...overrides,
  }),
};