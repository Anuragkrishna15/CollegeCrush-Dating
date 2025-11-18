-- =================================================================
-- COLLEGECRUSH DEVELOPMENT SEED DATA
-- Sample data for testing and development
-- Run after database_setup.sql and storage_setup.sql
-- =================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sample Colleges and Users
INSERT INTO profiles (id, email, name, dob, gender, bio, college, course, profile_pics, tags, prompts, membership, latitude, longitude, notification_preferences, privacy_settings, verification_status, profile_completion_score) VALUES
-- IIT Delhi Users
('550e8400-e29b-41d4-a716-446655440001', 'rahul.sharma@iitd.ac.in', 'Rahul Sharma', '2001-03-15', 'Male', 'Computer Science student passionate about AI and machine learning. Love playing cricket and exploring new cafes.', 'IIT Delhi', 'B.Tech Computer Science', '{"https://example.com/rahul1.jpg", "https://example.com/rahul2.jpg"}', '{"coding", "cricket", "ai", "machine-learning"}', '[{"question": "What are you passionate about?", "answer": "Building AI solutions and playing cricket"}]', 'Free', 28.5440, 77.1926, '{"matches": true, "messages": true, "events": true}', '{"showInSwipe": true, "showOnlineStatus": true}', '{"email_verified": true, "college_verified": true}', 85),

('550e8400-e29b-41d4-a716-446655440002', 'priya.verma@iitd.ac.in', 'Priya Verma', '2001-07-22', 'Female', 'Literature enthusiast and aspiring writer. Love coffee shops, poetry slams, and deep conversations.', 'IIT Delhi', 'B.A. English Literature', '{"https://example.com/priya1.jpg", "https://example.com/priya2.jpg"}', '{"writing", "poetry", "coffee", "literature"}', '[{"question": "Dream travel destination?", "answer": "Prague - the city of a hundred spires"}]', 'Free', 28.5445, 77.1930, '{"matches": true, "messages": true, "events": false}', '{"showInSwipe": true, "showOnlineStatus": true}', '{"email_verified": true, "college_verified": true}', 90),

('550e8400-e29b-41d4-a716-446655440003', 'arjun.kumar@iitd.ac.in', 'Arjun Kumar', '2000-11-08', 'Male', 'Mechanical Engineering student. Avid gamer, fitness enthusiast, and foodie. Always up for adventure!', 'IIT Delhi', 'B.Tech Mechanical Engineering', '{"https://example.com/arjun1.jpg"}', '{"gaming", "fitness", "foodie", "adventure"}', '[{"question": "Favorite hobby?", "answer": "Gaming and trying new restaurants"}]', 'Free', 28.5435, 77.1918, '{"matches": true, "messages": true, "events": true}', '{"showInSwipe": true, "showOnlineStatus": true}', '{"email_verified": true, "college_verified": true}', 75),

-- IIT Bombay Users
('550e8400-e29b-41d4-a716-446655440004', 'isha.patel@iitb.ac.in', 'Isha Patel', '2001-01-30', 'Female', 'Electrical Engineering student. Love music, dance, and solving complex problems. Always learning something new!', 'IIT Bombay', 'B.Tech Electrical Engineering', '{"https://example.com/isha1.jpg", "https://example.com/isha2.jpg", "https://example.com/isha3.jpg"}', '{"music", "dance", "engineering", "learning"}', '[{"question": "What skill would you love to master?", "answer": "Playing the guitar and classical dance"}]', 'Premium', 19.1334, 72.9133, '{"matches": true, "messages": true, "events": true}', '{"showInSwipe": true, "showOnlineStatus": true}', '{"email_verified": true, "college_verified": true}', 95),

('550e8400-e29b-41d4-a716-446655440005', 'vikram.singh@iitb.ac.in', 'Vikram Singh', '2000-09-12', 'Male', 'Civil Engineering student. Photography enthusiast and travel blogger. Love capturing moments and exploring new places.', 'IIT Bombay', 'B.Tech Civil Engineering', '{"https://example.com/vikram1.jpg", "https://example.com/vikram2.jpg"}', '{"photography", "travel", "blogging", "civil-engineering"}', '[{"question": "Best travel memory?", "answer": "Hiking in the Himalayas and capturing the sunrise"}]', 'Free', 19.1340, 72.9140, '{"matches": true, "messages": true, "events": true}', '{"showInSwipe": true, "showOnlineStatus": true}', '{"email_verified": true, "college_verified": true}', 80),

-- DTU Users
('550e8400-e29b-41d4-a716-446655440006', 'kavya.mehta@dtu.ac.in', 'Kavya Mehta', '2001-05-18', 'Female', 'Information Technology student. Bookworm, movie buff, and amateur chef. Love discussing philosophy and current affairs.', 'DTU', 'B.Tech Information Technology', '{"https://example.com/kavya1.jpg"}', '{"books", "movies", "cooking", "philosophy"}', '[{"question": "Favorite book genre?", "answer": "Psychological thrillers and classic literature"}]', 'Free', 28.7501, 77.1177, '{"matches": true, "messages": true, "events": false}', '{"showInSwipe": true, "showOnlineStatus": true}', '{"email_verified": true, "college_verified": true}', 70),

('550e8400-e29b-41d4-a716-446655440007', 'rohan.gupta@dtu.ac.in', 'Rohan Gupta', '2000-12-03', 'Male', 'Software Engineering student. Tech enthusiast, startup aspirant, and cricket fan. Always building something new!', 'DTU', 'B.Tech Software Engineering', '{"https://example.com/rohan1.jpg", "https://example.com/rohan2.jpg"}', '{"technology", "startups", "cricket", "coding"}', '[{"question": "Tech stack of choice?", "answer": "React, Node.js, and Python for ML"}]', 'Trial', 28.7505, 77.1180, '{"matches": true, "messages": true, "events": true}', '{"showInSwipe": true, "showOnlineStatus": true}', '{"email_verified": true, "college_verified": true}', 88);

-- Sample Swipes (creating some matches)
INSERT INTO swipes (swiper_id, swiped_id, direction, swipe_source) VALUES
-- Rahul swipes right on Priya and Isha
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'right', 'swipe'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'right', 'swipe'),
-- Priya swipes right on Rahul (creating a match)
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'right', 'swipe'),
-- Isha swipes right on Rahul (creating another match)
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'right', 'swipe'),
-- Arjun swipes right on Kavya
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', 'right', 'swipe'),
-- Vikram swipes right on Rohan
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', 'right', 'swipe');

-- Sample Conversations (from matches)
INSERT INTO conversations (user1_id, user2_id, last_message_at, message_count) VALUES
(LEAST('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'), GREATEST('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'), now() - interval '2 hours', 5),
(LEAST('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'), GREATEST('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'), now() - interval '1 hour', 3);

-- Sample Messages
INSERT INTO messages (conversation_id, sender_id, content_type, text, is_read) VALUES
-- Conversation between Rahul and Priya
((SELECT id FROM conversations WHERE (user1_id = '550e8400-e29b-41d4-a716-446655440001' AND user2_id = '550e8400-e29b-41d4-a716-446655440002') OR (user1_id = '550e8400-e29b-41d4-a716-446655440002' AND user2_id = '550e8400-e29b-41d4-a716-446655440001')), '550e8400-e29b-41d4-a716-446655440001', 'text', 'Hey Priya! Saw we matched. Love your bio about literature!', true),
((SELECT id FROM conversations WHERE (user1_id = '550e8400-e29b-41d4-a716-446655440001' AND user2_id = '550e8400-e29b-41d4-a716-446655440002') OR (user1_id = '550e8400-e29b-41d4-a716-446655440002' AND user2_id = '550e8400-e29b-41d4-a716-446655440001')), '550e8400-e29b-41d4-a716-446655440002', 'text', 'Thanks Rahul! Your AI passion sounds really interesting. What projects are you working on?', true),
((SELECT id FROM conversations WHERE (user1_id = '550e8400-e29b-41d4-a716-446655440001' AND user2_id = '550e8400-e29b-41d4-a716-446655440002') OR (user1_id = '550e8400-e29b-41d4-a716-446655440002' AND user2_id = '550e8400-e29b-41d4-a716-446655440001')), '550e8400-e29b-41d4-a716-446655440001', 'text', 'Working on a machine learning project for college recommendations. Pretty cool stuff!', true),

-- Conversation between Rahul and Isha
((SELECT id FROM conversations WHERE (user1_id = '550e8400-e29b-41d4-a716-446655440001' AND user2_id = '550e8400-e29b-41d4-a716-446655440004') OR (user1_id = '550e8400-e29b-41d4-a716-446655440004' AND user2_id = '550e8400-e29b-41d4-a716-446655440001')), '550e8400-e29b-41d4-a716-446655440004', 'text', 'Hi Rahul! Great to match. What got you into AI?', false),
((SELECT id FROM conversations WHERE (user1_id = '550e8400-e29b-41d4-a716-446655440001' AND user2_id = '550e8400-e29b-41d4-a716-446655440004') OR (user1_id = '550e8400-e29b-41d4-a716-446655440004' AND user2_id = '550e8400-e29b-41d4-a716-446655440001')), '550e8400-e29b-41d4-a716-446655440001', 'text', 'Started with curiosity about how things work. Now I am hooked! What about you and engineering?', false);

-- Sample Blind Date Proposals
INSERT INTO blind_dates (requesting_user_id, cafe, proposed_date, proposed_time, meal, status, safety_features, flexible_time) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Blue Tokai', CURRENT_DATE + 7, '14:00:00', 'Coffee & Snacks', 'pending', '["emergency_contact", "location_sharing"]', true),
('550e8400-e29b-41d4-a716-446655440004', 'The Bombay Canteen', CURRENT_DATE + 5, '19:30:00', 'Dinner', 'pending', '["emergency_contact", "check_in_reminders"]', false);

-- Sample Community Posts
INSERT INTO community_posts (title, content, category, author_id, is_anonymous, tags) VALUES
('Best Study Spots in IIT Delhi', 'Hey everyone! What are your favorite places to study on campus? I am looking for quiet spots with good WiFi. The library is always crowded during exams!', 'Study Tips', '550e8400-e29b-41d4-a716-446655440001', false, '{"study", "iit-delhi", "campus-life"}'),
('Dating in College: Tips and Experiences', 'What are your thoughts on dating in college? Any advice for someone new to this? Safety first, always!', 'Dating Advice', NULL, true, '{"dating", "college-life", "advice"}'),
('Weekend Trip Ideas from Mumbai', 'Planning a weekend getaway from IIT Bombay. Any recommendations for nearby hill stations or beaches? Budget: 5k-8k for 2 people.', 'Travel', '550e8400-e29b-41d4-a716-446655440005', false, '{"travel", "weekend", "mumbai"}'),
('Book Recommendations for Summer', 'Summer break is coming up! What books should I add to my reading list? Looking for fiction, self-help, and tech books.', 'Books & Literature', '550e8400-e29b-41d4-a716-446655440002', false, '{"books", "summer", "reading"}');

-- Sample Community Comments
INSERT INTO community_comments (post_id, author_id, content, is_anonymous) VALUES
((SELECT id FROM community_posts WHERE title = 'Best Study Spots in IIT Delhi'), '550e8400-e29b-41d4-a716-446655440002', 'Try the new learning commons in the academic area. Great WiFi and usually quieter than the main library!', false),
((SELECT id FROM community_posts WHERE title = 'Best Study Spots in IIT Delhi'), '550e8400-e29b-41d4-a716-446655440003', 'The hostels have study rooms that are often empty during the day. Plus, you can grab a quick snack from the mess.', false),
((SELECT id FROM community_posts WHERE title = 'Dating in College: Tips and Experiences'), NULL, 'Always meet in public places for first dates. Trust your instincts and don''t hesitate to block/report if something feels off.', true);

-- Sample Events
INSERT INTO events (title, description, event_date, event_time, location, college, organizer_id, category, max_attendees, price, tags, latitude, longitude) VALUES
('Freshers Welcome Party', 'Welcome party for new students! Games, music, and lots of fun. Meet your batchmates and seniors.', CURRENT_DATE + 14, '18:00:00', 'IIT Delhi Auditorium', 'IIT Delhi', '550e8400-e29b-41d4-a716-446655440001', 'Social', 200, 0, '{"freshers", "party", "social"}', 28.5440, 77.1926),
('Tech Talk: AI in Healthcare', 'Guest lecture by Dr. Sarah Johnson on applications of AI in healthcare. Open to all branches.', CURRENT_DATE + 21, '15:00:00', 'IIT Bombay Lecture Hall 1', 'IIT Bombay', '550e8400-e29b-41d4-a716-446655440004', 'Academic', 150, 0, '{"ai", "healthcare", "tech-talk"}', 19.1334, 72.9133),
('Hiking Trip to Lonavala', 'Weekend hiking trip to Lonavala. Perfect for nature lovers! Includes transportation and basic amenities.', CURRENT_DATE + 30, '06:00:00', 'IIT Bombay Main Gate', 'IIT Bombay', '550e8400-e29b-41d4-a716-446655440005', 'Adventure', 25, 1500, '{"hiking", "lonavala", "weekend"}', 19.1334, 72.9133);

-- Sample User Stats (will be auto-updated by triggers, but seeding some initial data)
INSERT INTO user_stats (user_id, total_swipes, total_matches, total_messages, points, level, experience_points) VALUES
('550e8400-e29b-41d4-a716-446655440001', 3, 2, 3, 45, 1, 45),
('550e8400-e29b-41d4-a716-446655440002', 1, 1, 2, 25, 1, 25),
('550e8400-e29b-41d4-a716-446655440004', 1, 1, 1, 15, 1, 15);

-- Sample Achievements
INSERT INTO achievements (user_id, achievement_id, name, description, icon, category, points_reward, progress_current, progress_target, is_completed) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'first_match', 'First Match', 'Congratulations on your first match!', 'heart', 'matching', 10, 1, 1, true),
('550e8400-e29b-41d4-a716-446655440001', 'conversation_starter', 'Conversation Starter', 'Start conversations with 5 different people', 'message-circle', 'communication', 25, 2, 5, false);

-- Sample Notifications
INSERT INTO notifications (user_id, type, title, message, data) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'new_match', 'New Match!', 'You matched with Priya Verma!', jsonb_build_object('conversation_id', (SELECT id FROM conversations WHERE (user1_id = '550e8400-e29b-41d4-a716-446655440001' AND user2_id = '550e8400-e29b-41d4-a716-446655440002') OR (user1_id = '550e8400-e29b-41d4-a716-446655440002' AND user2_id = '550e8400-e29b-41d4-a716-446655440001')))),
('550e8400-e29b-41d4-a716-446655440001', 'new_match', 'New Match!', 'You matched with Isha Patel!', jsonb_build_object('conversation_id', (SELECT id FROM conversations WHERE (user1_id = '550e8400-e29b-41d4-a716-446655440001' AND user2_id = '550e8400-e29b-41d4-a716-446655440004') OR (user1_id = '550e8400-e29b-41d4-a716-446655440004' AND user2_id = '550e8400-e29b-41d4-a716-446655440001')))),
('550e8400-e29b-41d4-a716-446655440004', 'new_blind_date_request', 'New Blind Date Proposal!', 'Rahul Sharma has proposed a blind date near you!', jsonb_build_object('blind_date_id', (SELECT id FROM blind_dates WHERE requesting_user_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1)));

-- Update user stats (this will trigger the function to recalculate)
SELECT update_user_stats('550e8400-e29b-41d4-a716-446655440001');
SELECT update_user_stats('550e8400-e29b-41d4-a716-446655440002');
SELECT update_user_stats('550e8400-e29b-41d4-a716-446655440004');

-- =================================================================
-- SEED DATA COMPLETE
-- =================================================================

-- Display summary
SELECT
    'Users created: ' || (SELECT COUNT(*) FROM profiles) as summary1,
    'Matches created: ' || (SELECT COUNT(*) FROM conversations) as summary2,
    'Messages sent: ' || (SELECT COUNT(*) FROM messages) as summary3,
    'Events created: ' || (SELECT COUNT(*) FROM events) as summary4,
    'Community posts: ' || (SELECT COUNT(*) FROM community_posts) as summary5;