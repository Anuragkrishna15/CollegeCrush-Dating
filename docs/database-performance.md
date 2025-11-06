# CollegeCrush Database Performance Guide

This document outlines the database performance optimizations, indexing strategy, and monitoring guidelines for the CollegeCrush application.

## Table of Contents

1. [Index Strategy](#index-strategy)
2. [Query Optimization](#query-optimization)
3. [Performance Monitoring](#performance-monitoring)
4. [Maintenance Tasks](#maintenance-tasks)
5. [Scaling Considerations](#scaling-considerations)

## Index Strategy

### Core Indexes

#### User Profiles
```sql
-- Email lookups (authentication)
CREATE INDEX CONCURRENTLY idx_profiles_email ON profiles(email);

-- Location-based queries (matching, nearby users)
CREATE INDEX CONCURRENTLY idx_profiles_location ON profiles USING gist (point(longitude, latitude));

-- Membership filtering (premium features)
CREATE INDEX CONCURRENTLY idx_profiles_membership ON profiles(membership);

-- Online status (presence indicators)
CREATE INDEX CONCURRENTLY idx_profiles_online_status ON profiles(is_online, last_seen);

-- Verification and account status
CREATE INDEX CONCURRENTLY idx_profiles_verification ON profiles(verification_status);
CREATE INDEX CONCURRENTLY idx_profiles_account_status ON profiles(account_status);

-- College/course filtering
CREATE INDEX CONCURRENTLY idx_profiles_college_course ON profiles(college, course);
```

#### Swiping System
```sql
-- Swipe lookups and duplicate prevention
CREATE INDEX CONCURRENTLY idx_swipes_swiper_id ON swipes(swiper_id);
CREATE INDEX CONCURRENTLY idx_swipes_swiped_id ON swipes(swiped_id);

-- Recent swipe analytics
CREATE INDEX CONCURRENTLY idx_swipes_created_at ON swipes(created_at DESC);
```

#### Messaging
```sql
-- Conversation message retrieval (most important)
CREATE INDEX CONCURRENTLY idx_messages_conversation_id ON messages(conversation_id, created_at DESC);

-- Message sender analytics
CREATE INDEX CONCURRENTLY idx_messages_sender_id ON messages(sender_id);

-- Unread message counts
CREATE INDEX CONCURRENTLY idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
```

#### Conversations
```sql
-- User conversation lookups
CREATE INDEX CONCURRENTLY idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX CONCURRENTLY idx_conversations_user2_id ON conversations(user2_id);

-- Recent conversations (inbox sorting)
CREATE INDEX CONCURRENTLY idx_conversations_last_message ON conversations(last_message_at DESC);
```

### Feature-Specific Indexes

#### Blind Dates
```sql
-- User date lookups
CREATE INDEX CONCURRENTLY idx_blind_dates_requesting_user ON blind_dates(requesting_user_id);
CREATE INDEX CONCURRENTLY idx_blind_dates_requested_user ON blind_dates(requested_user_id);

-- Date scheduling and calendar views
CREATE INDEX CONCURRENTLY idx_blind_dates_date_time ON blind_dates(date_time);
CREATE INDEX CONCURRENTLY idx_blind_dates_proposed_date ON blind_dates(proposed_date);

-- Status filtering
CREATE INDEX CONCURRENTLY idx_blind_dates_status ON blind_dates(status);

-- Flexible time proposals
CREATE INDEX CONCURRENTLY idx_blind_dates_flexible_time ON blind_dates(flexible_time) WHERE flexible_time = true;
```

#### Community Features
```sql
-- Category browsing
CREATE INDEX CONCURRENTLY idx_community_posts_category ON community_posts(category, created_at DESC);

-- User post history
CREATE INDEX CONCURRENTLY idx_community_posts_author ON community_posts(author_id, created_at DESC);

-- Pinned posts (always at top)
CREATE INDEX CONCURRENTLY idx_community_posts_is_pinned ON community_posts(is_pinned, created_at DESC) WHERE is_pinned = true;

-- Active posts only
CREATE INDEX CONCURRENTLY idx_community_posts_is_deleted ON community_posts(is_deleted) WHERE is_deleted = false;

-- Comment threading
CREATE INDEX CONCURRENTLY idx_community_comments_post ON community_comments(post_id, created_at);

-- Active comments only
CREATE INDEX CONCURRENTLY idx_community_comments_is_deleted ON community_comments(is_deleted) WHERE is_deleted = false;
```

#### Gamification
```sql
-- User stats lookups
CREATE INDEX CONCURRENTLY idx_user_stats_user_id ON user_stats(user_id);

-- Achievement history
CREATE INDEX CONCURRENTLY idx_achievements_user_id ON achievements(user_id, unlocked_at DESC);

-- Active challenges
CREATE INDEX CONCURRENTLY idx_daily_challenges_user_expires ON daily_challenges(user_id, expires_at) WHERE completed = false;
```

#### Notifications
```sql
-- User notification inbox
CREATE INDEX CONCURRENTLY idx_notifications_user_id ON notifications(user_id, created_at DESC);

-- Unread notification counts
CREATE INDEX CONCURRENTLY idx_notifications_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;
```

#### Monetization
```sql
-- Payment history
CREATE INDEX CONCURRENTLY idx_payments_user_created ON payments(user_id, created_at DESC);

-- Active subscriptions
CREATE INDEX CONCURRENTLY idx_subscriptions_user_status ON subscriptions(user_id, status);
```

#### Location-Based Features
```sql
-- Event location searches
CREATE INDEX CONCURRENTLY idx_events_location ON events USING gist (point(longitude, latitude));

-- Trip location searches
CREATE INDEX CONCURRENTLY idx_trips_location ON trips USING gist (point(longitude, latitude));
```

#### Moderation
```sql
-- Report queue management
CREATE INDEX CONCURRENTLY idx_reports_blocks_status ON reports_blocks(status, created_at DESC);

-- Push notification tokens
CREATE INDEX CONCURRENTLY idx_push_tokens_user_active ON push_tokens(user_id, is_active) WHERE is_active = true;
```

## Query Optimization

### Most Critical Queries

1. **Swipe Candidates** (`get_swipe_candidates`)
   - Uses location index for proximity filtering
   - Complex WHERE clause optimized with composite indexes

2. **Message Retrieval** (`messages` table queries)
   - Compound index on `(conversation_id, created_at DESC)`
   - Supports pagination and real-time updates

3. **Conversation List** (`get_conversations`)
   - Multiple index lookups for user conversations
   - Aggregates unread counts efficiently

4. **Location-based Blind Dates** (`get_nearby_proposals`)
   - PostGIS spatial queries with distance ordering
   - Efficient for real-time proximity matching

### Optimization Techniques

#### Partial Indexes
```sql
-- Only index active, non-deleted content
WHERE is_deleted = false
WHERE is_active = true
WHERE completed = false
```

#### Composite Indexes
```sql
-- Multi-column indexes for complex WHERE clauses
(user_id, created_at DESC)
(conversation_id, created_at DESC)
(category, created_at DESC)
```

#### Spatial Indexes
```sql
-- PostGIS GiST indexes for location queries
USING gist (point(longitude, latitude))
```

## Performance Monitoring

### Key Metrics to Monitor

#### Database Performance
- Query execution time (>100ms needs optimization)
- Index hit ratio (>95% ideal)
- Cache hit ratio (>90% ideal)
- Connection pool utilization (<80% ideal)

#### Application Performance
- API response times (<500ms target)
- Real-time message delivery (<2s)
- Swipe loading time (<3s)
- Database connection latency

### Monitoring Queries

```sql
-- Slow query identification
SELECT query, total_time, calls, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage analysis
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table bloat monitoring
SELECT schemaname, tablename, n_dead_tup, n_live_tup,
       ROUND(n_dead_tup::float / (n_live_tup + n_dead_tup) * 100, 2) as bloat_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY bloat_ratio DESC;
```

## Maintenance Tasks

### Daily Tasks
```sql
-- Update table statistics
ANALYZE VERBOSE;

-- Clean up expired notifications
DELETE FROM notifications
WHERE expires_at < now() AND expires_at IS NOT NULL;

-- Archive old message read receipts (if needed)
-- Implement based on retention policy
```

### Weekly Tasks
```sql
-- Reindex bloated indexes
REINDEX INDEX CONCURRENTLY index_name;

-- Update vacuum statistics
VACUUM ANALYZE;

-- Monitor index bloat
SELECT * FROM pg_stat_user_indexes
WHERE idx_scan = 0; -- Unused indexes
```

### Monthly Tasks
```sql
-- Full database vacuum (during low traffic)
VACUUM FULL VERBOSE;

-- Archive old data (implement retention policies)
-- Move completed blind dates to archive tables
-- Clean up old notifications and messages
```

## Scaling Considerations

### Read Replicas
- Implement read replicas for analytics queries
- Route real-time writes to primary
- Use read replicas for:
  - User profile lookups
  - Community post browsing
  - Historical message retrieval

### Connection Pooling
- Use PgBouncer for connection pooling
- Configure appropriate pool sizes
- Monitor connection utilization

### Caching Strategy
- Redis for session data and frequently accessed profiles
- CDN for static assets (profile pictures)
- Application-level caching for computed data

### Horizontal Scaling
- Shard by geographic regions for global expansion
- Implement database partitioning for large tables:
  - Messages (by conversation_id)
  - Notifications (by user_id)
  - Analytics data (by date)

## Troubleshooting

### Common Performance Issues

#### Slow Swipe Loading
- Check location index effectiveness
- Verify query plan for `get_swipe_candidates`
- Monitor database connection latency

#### High CPU Usage
- Identify long-running queries
- Check for missing indexes
- Review trigger performance

#### Memory Issues
- Monitor work_mem settings
- Check for memory-intensive queries
- Implement query result limits

### Emergency Procedures

#### Index Recreation
```sql
-- Recreate index without blocking writes
CREATE INDEX CONCURRENTLY new_index_name ON table_name (column_name);
DROP INDEX old_index_name;
ALTER INDEX new_index_name RENAME TO old_index_name;
```

#### Query Optimization
```sql
-- Force index usage (temporary fix)
SELECT * FROM table_name WHERE column = value;
-- Add index hint in application code or create covering index
```

#### Connection Issues
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Terminate idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND now() - state_change > interval '5 minutes';
```

## Best Practices

1. **Always use `CONCURRENTLY`** for index creation in production
2. **Monitor query performance** before and after schema changes
3. **Implement proper pagination** for large result sets
4. **Use appropriate data types** (avoid text for IDs, use enums)
5. **Regular maintenance** prevents performance degradation
6. **Test queries with realistic data volumes**
7. **Implement proper error handling** for database operations
8. **Use transactions** for multi-table operations
9. **Monitor and alert** on performance thresholds
10. **Document schema changes** and performance implications