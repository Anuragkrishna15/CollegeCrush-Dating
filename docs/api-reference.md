# CollegeCrush API Reference

This document provides a comprehensive reference for all database functions (RPC calls) available in the CollegeCrush application.

## Table of Contents

1. [Authentication Functions](#authentication-functions)
2. [Matching & Swiping](#matching--swiping)
3. [Messaging](#messaging)
4. [Blind Dates](#blind-dates)
5. [Community Features](#community-features)
6. [User Management](#user-management)
7. [Gamification](#gamification)

## Authentication Functions

### `handle_delete_user()`

Permanently deletes a user account and all associated data.

**Returns:** `unknown`

**Security:** Requires authentication, only affects current user

**Usage:**
```typescript
const { data, error } = await supabase.rpc('handle_delete_user');
```

---

## Matching & Swiping

### `get_swipe_candidates(p_user_id, p_user_gender)`

Retrieves potential matches for swiping based on user preferences and location.

**Parameters:**
- `p_user_id`: UUID of the requesting user
- `p_user_gender`: Gender preference ("Male", "Female", "Other")

**Returns:**
```typescript
{
  bio: string;
  college: string;
  course: string;
  created_at: string;
  dob: string;
  email: string;
  gender: "Male" | "Female" | "Other";
  id: string;
  membership: "Free" | "Trial" | "Premium";
  name: string;
  notification_preferences: Json | null;
  privacy_settings: Json | null;
  profilePics: string[];
  prompts: Json | null;
  tags: string[];
}[]
```

**Usage:**
```typescript
const { data: candidates, error } = await supabase.rpc('get_swipe_candidates', {
  p_user_id: userId,
  p_user_gender: 'Female'
});
```

### `handle_swipe(p_swiper_id, p_swiped_id, p_direction)`

Processes a swipe action and creates matches when mutual.

**Parameters:**
- `p_swiper_id`: UUID of the user swiping
- `p_swiped_id`: UUID of the user being swiped on
- `p_direction`: Swipe direction ("left" | "right")

**Returns:**
```typescript
{
  match_created: boolean;
  conversation_id: string | null;
}[]
```

**Usage:**
```typescript
const { data, error } = await supabase.rpc('handle_swipe', {
  p_swiper_id: userId,
  p_swiped_id: targetUserId,
  p_direction: 'right'
});
```

---

## Messaging

### `get_conversations(p_user_id)`

Retrieves all conversations for a user with latest message details.

**Parameters:**
- `p_user_id`: UUID of the user

**Returns:**
```typescript
{
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_profile_pic: string;
  last_message_text: string;
  last_message_timestamp: string;
  last_message_sender_id: string;
  other_user_membership: "Free" | "Trial" | "Premium";
  unread_count: number;
}[]
```

**Usage:**
```typescript
const { data: conversations, error } = await supabase.rpc('get_conversations', {
  p_user_id: userId
});
```

---

## Blind Dates

### `propose_blind_date(p_cafe, p_date_time, p_meal)`

Creates a blind date proposal and notifies nearby users.

**Parameters:**
- `p_cafe`: Name of the cafe/restaurant
- `p_date_time`: Proposed date and time (timestamptz)
- `p_meal`: Type of meal ("Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks" | "Drinks")

**Returns:** `string` (UUID of created blind date)

**Usage:**
```typescript
const { data: blindDateId, error } = await supabase.rpc('propose_blind_date', {
  p_cafe: 'Starbucks',
  p_date_time: '2024-12-25T14:00:00+05:30',
  p_meal: 'Coffee & Snacks'
});
```

### `accept_proposal(p_date_id, p_acceptor_id)`

Accepts a blind date proposal.

**Parameters:**
- `p_date_id`: UUID of the blind date proposal
- `p_acceptor_id`: UUID of the accepting user

**Returns:** `boolean`

**Usage:**
```typescript
const { data: success, error } = await supabase.rpc('accept_proposal', {
  p_date_id: blindDateId,
  p_acceptor_id: userId
});
```

### `cancel_my_proposal(p_date_id)`

Cancels a blind date proposal created by the current user.

**Parameters:**
- `p_date_id`: UUID of the blind date proposal

**Returns:** `undefined`

**Usage:**
```typescript
const { error } = await supabase.rpc('cancel_my_proposal', {
  p_date_id: blindDateId
});
```

### `get_my_dates(p_user_id)`

Retrieves all blind dates for a user.

**Parameters:**
- `p_user_id`: UUID of the user

**Returns:**
```typescript
{
  id: string;
  cafe: string;
  meal: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks" | "Drinks";
  date_time: string;
  status: "pending" | "accepted" | "completed" | "feedback_submitted";
  is_receiver: boolean;
  other_user_id: string;
  other_user_name: string;
  other_user_profile_pics: string[];
  other_user_membership: "Free" | "Trial" | "Premium";
  other_user_college: string;
  other_user_course: string;
  other_user_tags: string[];
  other_user_bio: string;
  other_user_prompts: Json | null;
  vibe_check_rating: "good" | "bad" | null;
  vibe_check_tags: string[] | null;
}[]
```

### `get_nearby_proposals(p_user_id)`

Retrieves blind date proposals from nearby users.

**Parameters:**
- `p_user_id`: UUID of the requesting user

**Returns:**
```typescript
{
  id: string;
  cafe: string;
  meal: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks" | "Drinks";
  date_time: string;
  proposer_id: string;
  proposer_name: string;
  proposer_profile_pics: string[];
  proposer_membership: "Free" | "Trial" | "Premium";
  proposer_college: string;
  proposer_course: string;
  proposer_tags: string[];
  proposer_bio: string;
  proposer_prompts: Json;
}[]
```

---

## Community Features

### `get_events_with_rsvp(p_user_id)`

Retrieves events with RSVP status for a user.

**Parameters:**
- `p_user_id`: UUID of the user

**Returns:**
```typescript
{
  id: string;
  name: string;
  date: string;
  college: string;
  imageUrl: string;
  created_at: string;
  rsvp_status: "going" | "interested" | "none" | null;
}[]
```

### `book_trip_and_decrement_slot(p_trip_id, p_user_id)`

Books a trip slot and decrements available slots.

**Parameters:**
- `p_trip_id`: UUID of the trip
- `p_user_id`: UUID of the user booking

**Returns:** `boolean`

**Usage:**
```typescript
const { data: success, error } = await supabase.rpc('book_trip_and_decrement_slot', {
  p_trip_id: tripId,
  p_user_id: userId
});
```

---

## User Management

### `get_likers(p_user_id)`

Retrieves users who have liked (right-swiped) the specified user.

**Parameters:**
- `p_user_id`: UUID of the user

**Returns:** Array of user profiles (same structure as swipe candidates)

### `update_user_location(p_lat, p_lon)`

Updates user's location coordinates.

**Parameters:**
- `p_lat`: Latitude (numeric)
- `p_lon`: Longitude (numeric)

**Returns:** `undefined`

**Usage:**
```typescript
const { error } = await supabase.rpc('update_user_location', {
  p_lat: 28.6139,
  p_lon: 77.2090
});
```

---

## Error Handling

All RPC functions return a standard Supabase response:

```typescript
{
  data: T | null;        // Function return value
  error: {
    message: string;     // Error description
    details: string;     // Additional error details
    hint: string;        // Suggestion for fixing the error
    code: string;        // PostgreSQL error code
  } | null;
}
```

### Common Error Codes

- `PGRST116`: Function not found
- `23505`: Unique constraint violation
- `23503`: Foreign key constraint violation
- `42501`: Insufficient privilege
- `23514`: Check constraint violation

### Error Handling Example

```typescript
const { data, error } = await supabase.rpc('handle_swipe', params);

if (error) {
  switch (error.code) {
    case '23505':
      console.error('Duplicate swipe detected');
      break;
    case '42501':
      console.error('Insufficient permissions');
      break;
    default:
      console.error('Database error:', error.message);
  }
  return;
}

// Process successful response
console.log('Swipe processed:', data);
```

## Rate Limiting

- Authentication functions: 10 requests per minute per IP
- Swipe functions: 100 swipes per hour per user (free), unlimited (premium)
- Message functions: 1000 messages per hour per user
- Blind date functions: 5 proposals per day per user (free), unlimited (premium)

## Security Notes

- All functions validate user authentication
- Row Level Security (RLS) policies prevent unauthorized data access
- Input validation prevents SQL injection
- Functions run with appropriate security contexts

## Performance Considerations

- Complex queries use appropriate indexes
- Location-based queries utilize PostGIS for efficiency
- Large result sets are paginated
- Real-time subscriptions use efficient change detection

## Testing

Use the development seed data (`scripts/seeds/development-seed.sql`) for testing:

```bash
# In Supabase SQL Editor
\i scripts/seeds/development-seed.sql
```

This provides sample users, matches, messages, and events for testing all API functions.