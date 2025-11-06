# CollegeCrush Database Functions Documentation

This document provides comprehensive documentation for all database functions, triggers, and procedures used in the CollegeCrush application.

## Table of Contents

1. [Core Functions](#core-functions)
2. [Matching & Swiping](#matching--swiping)
3. [Blind Dates](#blind-dates)
4. [Community Features](#community-features)
5. [Gamification](#gamification)
6. [Triggers](#triggers)
7. [Row Level Security](#row-level-security)

## Core Functions

### `update_user_location(p_lat numeric, p_lon numeric)`

Safely updates a user's location coordinates with validation.

**Parameters:**
- `p_lat`: Latitude (must be between -90 and 90)
- `p_lon`: Longitude (must be between -180 and 180)

**Returns:** void

**Security:** Executed with SECURITY DEFINER, runs as database owner

**Usage:**
```sql
SELECT update_user_location(28.6139, 77.2090);
```

## Matching & Swiping

### `handle_swipe(p_swiper_id uuid, p_swiped_id uuid, p_direction swipe_direction)`

Handles swipe actions and creates matches when mutual.

**Parameters:**
- `p_swiper_id`: UUID of the user performing the swipe
- `p_swiped_id`: UUID of the user being swiped on
- `p_direction`: Either 'left' or 'right'

**Returns:**
```sql
TABLE(match_created boolean, conversation_id uuid)
```

**Logic:**
1. Validates users exist and aren't blocked
2. Records the swipe (insert or update)
3. Updates user statistics
4. If right swipe, checks for mutual match
5. Creates conversation and notifications on match

**Usage:**
```sql
SELECT * FROM handle_swipe('user-1-uuid', 'user-2-uuid', 'right');
```

## Blind Dates

### `propose_blind_date(p_cafe text, p_date_time timestamptz, p_meal meal_type)`

Creates a blind date proposal and notifies nearby users.

**Parameters:**
- `p_cafe`: Name of the cafe/restaurant
- `p_date_time`: Proposed date and time
- `p_meal`: Type of meal (Breakfast, Lunch, Dinner, Coffee & Snacks, Drinks)

**Returns:** UUID of the created blind date

**Logic:**
1. Validates proposer has location set
2. Creates blind date proposal
3. Finds nearby users within 20km using PostGIS
4. Sends notifications to eligible users

**Usage:**
```sql
SELECT propose_blind_date('Starbucks', '2024-12-25 14:00:00+05:30', 'Coffee & Snacks');
```

### `accept_proposal(p_date_id uuid, p_acceptor_id uuid)`

Accepts a blind date proposal.

**Parameters:**
- `p_date_id`: UUID of the blind date proposal
- `p_acceptor_id`: UUID of the accepting user

**Returns:** boolean (success status)

**Logic:**
1. Updates proposal status to 'accepted'
2. Creates notifications for both users

## Community Features

### Community Posts & Comments

The community features use triggers to automatically update comment counts and activity timestamps.

**Key Triggers:**
- `update_community_post_comment_count`: Updates comment count when comments are added/removed
- `update_conversation_last_message`: Updates conversation metadata on new messages

## Gamification

### `update_user_stats(p_user_id uuid)`

Updates comprehensive user statistics and gamification metrics.

**Parameters:**
- `p_user_id`: UUID of the user

**Returns:** void

**Calculates:**
- Total swipes, matches, messages, dates
- Current streak and longest streak
- Points and experience points
- Level based on experience

**Formula:**
```sql
points = (swipes × 1) + (matches × 10) + (messages × 2) + (dates × 20) + (posts × 5) + (comments × 2) + (streak × 5)
level = FLOOR(points / 1000) + 1
```

## Triggers

### Message Triggers

**`trigger_update_conversation_last_message`**
- **Table:** messages
- **Action:** AFTER INSERT
- **Purpose:** Updates conversation last_message_at, message_count, and marks user online

### Comment Triggers

**`trigger_update_comment_count`**
- **Table:** community_comments
- **Action:** AFTER INSERT OR DELETE
- **Purpose:** Maintains accurate comment counts on posts

### Vibe Check Triggers

**`trigger_vibe_check_match`**
- **Table:** vibe_checks
- **Action:** AFTER INSERT
- **Purpose:** Creates permanent matches when both users rate the date positively

### Statistics Triggers

**`trigger_user_stats_*`**
- **Tables:** swipes, conversations, messages, blind_dates, community_posts, community_comments
- **Action:** AFTER INSERT
- **Purpose:** Automatically updates user statistics

## Row Level Security (RLS) Policies

All tables have RLS enabled with policies ensuring users can only access their own data or appropriately shared data.

### Key Policies:

**Profiles:**
- Users can view all profiles for matching
- Users can only modify their own profile

**Messages:**
- Users can only see messages in conversations they're part of

**Blind Dates:**
- Users can see proposals they created or were matched with

**Community Posts:**
- All posts are visible (public forum)
- Anonymous posts hide author information

## Performance Optimizations

### Indexes

The database includes comprehensive indexes for optimal performance:

```sql
-- Core performance indexes
CREATE INDEX CONCURRENTLY idx_profiles_location ON profiles USING gist (point(longitude, latitude));
CREATE INDEX CONCURRENTLY idx_swipes_created_at ON swipes(created_at DESC);
CREATE INDEX CONCURRENTLY idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_blind_dates_date_time ON blind_dates(date_time);

-- Location-based queries
CREATE INDEX CONCURRENTLY idx_events_location ON events USING gist (point(longitude, latitude));
```

### Query Optimization

- RPC functions use efficient queries with proper indexing
- Location queries use PostGIS for geographic operations
- Pagination implemented for large result sets

## Error Handling

All functions include comprehensive error handling:

- Input validation
- Foreign key constraint checks
- Custom error messages for business logic violations
- Graceful handling of notification failures

## Security Considerations

- All functions use `SECURITY DEFINER` where necessary
- Input sanitization and validation
- Block list checks prevent unwanted interactions
- Audit logging for administrative actions

## Maintenance

### Regular Tasks

1. **Statistics Updates:** Triggered automatically on user actions
2. **Notification Cleanup:** Remove expired notifications
3. **Location Updates:** Handle location permission changes
4. **Index Maintenance:** REINDEX periodically for performance

### Monitoring

Key metrics to monitor:
- Function execution times
- Error rates
- User activity patterns
- Database size and growth

## Future Enhancements

Potential improvements:
- Advanced matching algorithms
- A/B testing framework
- Enhanced analytics
- Machine learning integration for recommendations