import { supabase } from './supabase.ts';
import { Profile, Trip, CollegeEvent, BlindDate, MembershipType, ProfileOnboardingData, Comment, VibeCheck, Conversation, Message, BasicProfile, DbProfile, User, AppNotification, Prompt, BlindDateProposal, Ad, MyBlindDateProposal, NotificationPreferences, PrivacySettings, TripBooking, UserStats } from '../types/types.ts';
import { Database, Json } from './database.types.ts';
import { uploadProfilePicture as uploadProfilePicUtil, uploadCommunityMedia } from '../utils/storage.ts';

// Define types for complex queries and RPC responses for better type safety.
type HandleSwipeResponse = Database['public']['Functions']['handle_swipe']['Returns'][number];
type SwipeCandidate = Database['public']['Functions']['get_swipe_candidates']['Returns'][number];
type LikerProfile = Database['public']['Functions']['get_likers']['Returns'][number];
type ConversationRpcResponse = Database['public']['Functions']['get_conversations']['Returns'][number];
type MyDateRpcResponse = Database['public']['Functions']['get_my_dates']['Returns'][number];
type NearbyProposalRpcResponse = Database['public']['Functions']['get_nearby_proposals']['Returns'][number];

type CommentWithAuthor = Omit<Database['public']['Tables']['community_comments']['Row'], 'author_id'> & {
    author: Pick<DbProfile, 'id' | 'name' | 'profile_pics' | 'college' | 'course' | 'tags' | 'bio' | 'prompts'> | null;
}

const MESSAGES_PAGE_SIZE = 30;

// Helper function to calculate age properly accounting for birth month/day
const calculateAge = (birthDate: string | Date): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

// --- AUTH & PROFILE ---
export const getProfile = async (userId: string): Promise<User | null> => {
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error here
        console.error('Error fetching profile:', profileError.message);
        throw profileError;
    }
    if (!profileData) return null;

    const { data: boostData } = await supabase
        .from('profile_boosts')
        .select('boost_end_time')
        .eq('user_id', userId)
        .maybeSingle();

    const age = calculateAge(profileData.dob);
    const boostEndTime = boostData?.boost_end_time ? new Date(boostData.boost_end_time).getTime() : undefined;
    
    const { data: commentsData, error: commentsError } = await supabase
        .from('community_comments')
        .select('id, content, created_at, author:profiles!author_id(id, name, profile_pics, college, course, tags, bio, prompts)')
        .eq('post_id', userId)
        .order('created_at', { ascending: false });

    if (commentsError) {
        console.error("Error fetching comments:", commentsError.message);
        throw commentsError;
    }
    
    const comments: Comment[] = (commentsData || [])
        .filter((c): c is (typeof c & { author: NonNullable<typeof c['author']> }) => c.author !== null)
        .map((c) => ({
            id: c.id,
            author: {
                ...c.author,
                prompts: (c.author.prompts as unknown as Prompt[] | null) || [],
            },
            content: c.content,
            created_at: c.created_at,
        }));

    const finalProfile: User = {
        ...profileData,
        age,
        comments,
        boost_end_time: boostEndTime,
        profile_pics: profileData.profile_pics || [],
        prompts: (profileData.prompts as unknown as Prompt[] | null) || [],
        notification_preferences: (profileData.notification_preferences as unknown as NotificationPreferences) || { matches: true, messages: true, events: false, pushEnabled: false, pushMatches: false, pushMessages: false, pushEvents: false, pushCommunity: false },
        privacy_settings: (profileData.privacy_settings as unknown as PrivacySettings) || { showInSwipe: true },
    };

    return finalProfile;
};

export const createProfile = async (userId: string, email: string, profileData: ProfileOnboardingData, profilePicFile: File): Promise<User> => {
    // Upload profile picture using the storage utility
    const uploadResult = await uploadProfilePicUtil(profilePicFile, userId);

    const newProfileData: Database['public']['Tables']['profiles']['Insert'] = {
        id: userId,
        email: email,
        name: profileData.name,
        dob: profileData.dob,
        gender: profileData.gender,
        bio: profileData.bio,
        course: profileData.course,
        tags: profileData.tags,
        prompts: profileData.prompts as unknown as Json,
        college: email.split('@')[1],
        profile_pics: [uploadResult.url],
        membership: MembershipType.Free,
    };

    const { data: profile, error } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select()
        .single();
    
    if (error) {
        console.error('Error creating profile:', error.message);
        throw error;
    }

    const createdProfile = await getProfile(profile.id);
    if (!createdProfile) throw new Error("Failed to retrieve newly created profile.");
    return createdProfile;
};

export const updateProfile = async (userId: string, profileData: Partial<Database['public']['Tables']['profiles']['Update']>): Promise<User> => {
     const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();
        
    if (error) throw error;
    
    const updatedProfile = await getProfile(data.id);
    if (!updatedProfile) throw new Error("Failed to retrieve updated profile.");
    return updatedProfile;
};

export const updateUserLocation = async (latitude: number, longitude: number) => {
    const { error } = await supabase.rpc('update_user_location', {
        p_lat: latitude,
        p_lon: longitude,
    });
    if (error) {
        console.error("Error updating user location:", error.message);
        throw new Error("Could not update your location.");
    }
};


export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
    const uploadResult = await uploadProfilePicUtil(file, userId);
    return uploadResult.url;
};

export const deleteAccount = async () => {
    const { error } = await supabase.rpc('delete_user_account');
    if (error) {
        console.error("Error deleting account:", error);
        throw new Error("Could not delete your account. Please contact support.");
    }
};

// --- PAYMENTS & MEMBERSHIP ---
export const updateUserMembership = async (userId: string, plan: MembershipType) => {
    const { error } = await supabase
        .from('profiles')
        .update({ membership: plan })
        .eq('id', userId);
        
    if (error) throw new Error("Could not update membership.");
};

export const recordPayment = async (userId: string, paymentDetails: {
    amount: number;
    plan: MembershipType;
    status: 'completed' | 'failed';
    provider: string;
    provider_order_id?: string;
    provider_payment_id?: string;
}) => {
    const { error } = await supabase.from('payments').insert({
        user_id: userId,
        amount: paymentDetails.amount,
        plan: paymentDetails.plan as unknown as Database['public']['Enums']['subscription_plan'] | null,
        payment_status: paymentDetails.status as unknown as Database['public']['Enums']['payment_status'],
        payment_type: 'membership',
        provider: paymentDetails.provider,
        provider_order_id: paymentDetails.provider_order_id,
        provider_payment_id: paymentDetails.provider_payment_id,
    });

    if (error) {
        console.error("Error recording payment:", error.message);
    }
};

export const boostProfile = async (userId: string) => {
    const boostDurationMinutes = 30;
    const boostEndTime = new Date(Date.now() + boostDurationMinutes * 60 * 1000).toISOString();
    
    const { error } = await supabase
        .from('profile_boosts')
        .upsert({ user_id: userId, boost_end_time: boostEndTime }, { onConflict: 'user_id' });

    if (error) throw new Error("Could not boost profile.");
};


// --- SWIPING & MATCHING ---
export const fetchProfiles = async (currentUserId: string, currentUserGender: 'Male' | 'Female' | 'Other'): Promise<Profile[]> => {
    const { data, error } = await supabase.rpc('get_swipe_candidates', {
        p_user_id: currentUserId,
        p_user_gender: currentUserGender
    });

    if (error) {
        console.error("Error fetching profiles via RPC:", error.message);
        throw error;
    }
    
    return (data || []).map((p: SwipeCandidate): Profile => ({
        ...p,
        profile_pics: p.profilePics || [],
        latitude: null,
        longitude: null,
        age: calculateAge(p.dob),
        prompts: (p.prompts as unknown as Prompt[] | null) || [],
        tags: p.tags || [],
        notification_preferences: (p.notification_preferences as unknown as NotificationPreferences) || { matches: true, messages: true, events: false, pushEnabled: false, pushMatches: false, pushMessages: false, pushEvents: false, pushCommunity: false },
        privacy_settings: (p.privacy_settings as unknown as PrivacySettings) || { showInSwipe: true },
        account_status: 'active',
        is_online: false,
        last_seen: new Date().toISOString(),
        location_updated_at: null,
        profile_completion_score: 0,
        suspension_reason: null,
        suspension_until: null,
        updated_at: p.created_at,
        verification_status: null,
    }));
};

export const recordSwipe = async (swiperId: string, swipedId: string, direction: 'left' | 'right'): Promise<HandleSwipeResponse> => {
     const { data, error } = await supabase.rpc('handle_swipe', {
        p_swiper_id: swiperId,
        p_swiped_id: swipedId,
        p_direction: direction,
    });
    
    if (error) {
        console.error("Error in handle_swipe RPC:", error);
        throw error;
    }
    return data?.[0] || { match_created: false, conversation_id: null };
};

export const fetchLikers = async (userId: string): Promise<Profile[]> => {
    const { data, error } = await supabase.rpc('get_likers', { p_user_id: userId });
    if (error) {
        console.error("Error fetching likers:", error.message);
        throw error;
    }

    return (data || []).map((p: LikerProfile): Profile => ({
        ...p,
        profile_pics: p.profilePics || [],
        latitude: null,
        longitude: null,
        age: calculateAge(p.dob),
        prompts: (p.prompts as unknown as Prompt[] | null) || [],
        tags: p.tags || [],
        notification_preferences: (p.notification_preferences as unknown as NotificationPreferences) || { matches: true, messages: true, events: false, pushEnabled: false, pushMatches: false, pushMessages: false, pushEvents: false, pushCommunity: false },
        privacy_settings: (p.privacy_settings as unknown as PrivacySettings) || { showInSwipe: true },
        account_status: 'active',
        is_online: false,
        last_seen: new Date().toISOString(),
        location_updated_at: null,
        profile_completion_score: 0,
        suspension_reason: null,
        suspension_until: null,
        updated_at: p.created_at,
        verification_status: null,
    }));
};


// --- CHAT ---
export const fetchConversations = async (userId: string): Promise<Conversation[]> => {
     const { data, error } = await supabase.rpc('get_conversations', { p_user_id: userId });
    
    if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
    }

    const conversations = (data as ConversationRpcResponse[] || []).map((convo) => {
        const otherUser: BasicProfile = {
            id: convo.other_user_id,
            name: convo.other_user_name,
            profile_pics: [convo.other_user_profile_pic],
            membership: convo.other_user_membership as MembershipType,
            college: '', 
            course: '',
            tags: [],
            bio: '',
            prompts: [],
        };
        const lastMessage: Message | undefined = convo.last_message_text ? {
            id: `last-${convo.id}`,
            text: convo.last_message_text,
            senderId: convo.last_message_sender_id,
            created_at: convo.last_message_timestamp,
            conversation_id: convo.id,
            is_read: false, // This is a summary; read status not available here.
        } : undefined;

        return {
            id: convo.id,
            otherUser,
            messages: lastMessage ? [lastMessage] : [],
            unread_count: convo.unread_count || 0,
        };
    });
    
    return conversations;
};

export const getConversationDetails = async (conversationId: string, currentUserId: string): Promise<Conversation | null> => {
    const { data: convoData, error: convoError } = await supabase
        .from('conversations')
        .select('*, user1:profiles!user1_id(*), user2:profiles!user2_id(*)')
        .eq('id', conversationId)
        .single();

    if (convoError || !convoData) {
        console.error("Error fetching conversation details:", convoError?.message);
        return null;
    }
    
    if (!convoData.user1 || !convoData.user2) {
        console.error("Error fetching conversation details: related user profiles not found.");
        return null;
    }
    
    const otherUserData = convoData.user1.id === currentUserId ? convoData.user2 : convoData.user1;
    const otherUser: BasicProfile = {
        id: otherUserData.id,
        name: otherUserData.name,
        profile_pics: otherUserData.profile_pics || [],
        membership: otherUserData.membership as MembershipType,
        college: otherUserData.college,
        course: otherUserData.course,
        tags: otherUserData.tags || [],
        bio: otherUserData.bio,
        prompts: (otherUserData.prompts as unknown as Prompt[] | null) || [],
    };

    const messages = await getMessages(conversationId, 0);

    return {
        id: conversationId,
        otherUser,
        messages: messages,
        unread_count: 0, // This is not needed for the detail view
    };
};


export const getMessages = async (conversationId: string, page: number = 0): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(page * MESSAGES_PAGE_SIZE, (page + 1) * MESSAGES_PAGE_SIZE - 1);

    if (error) {
        console.error("Error fetching messages:", error.message);
        throw error;
    }

    return ((data || []) as any[]).map(msg => ({
        id: msg.id,
        text: msg.text,
        senderId: msg.sender_id,
        created_at: msg.created_at,
        conversation_id: msg.conversation_id,
        is_read: msg.is_read,
    })).reverse();
};

export const sendMessage = async (conversationId: string, text: string, senderId: string): Promise<Message> => {
    const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, text, sender_id: senderId })
        .select()
        .single();
    if (error) throw error;
    return {
        id: (data as any).id,
        text: (data as any).text,
        senderId: (data as any).sender_id,
        created_at: (data as any).created_at,
        conversation_id: (data as any).conversation_id,
        is_read: (data as any).is_read,
    };
};

export const markMessagesAsRead = async (conversationId: string, readerId: string): Promise<void> => {
    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', readerId); // Only mark messages sent by the OTHER person as read

    if (error) {
        console.error("Error marking messages as read:", error.message);
        // Don't throw, as this is a background task and shouldn't crash the UI.
    }
};


// --- TRIPS & EVENTS ---
export const fetchTrips = async (): Promise<Trip[]> => {
    const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((trip) => ({
        id: trip.id,
        image_url: trip.image_url,
        location: trip.destination,
        date: trip.departure_date,
        details: trip.description,
        latitude: trip.latitude,
        longitude: trip.longitude,
        fare: trip.price_per_person,
        slots: (trip.max_participants || 0) - trip.current_participants,
        type: trip.trip_type,
    }));
};

export const bookTrip = async (tripId: string, userId: string): Promise<void> => {
    const { data, error } = await supabase.rpc('book_trip_and_decrement_slot', {
        p_trip_id: tripId,
        p_user_id: userId,
    });

    if (error) {
        console.error('RPC Error:', error);
        throw new Error('An error occurred while booking the trip.');
    }

    if (data === false) {
        throw new Error('This trip is fully booked or you have already booked.');
    }
};

export const fetchUserTripBookings = async (userId: string): Promise<TripBooking[]> => {
    const { data, error } = await supabase
        .from('trip_bookings')
        .select(`
            *,
            trip:trips(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((booking: any) => ({
        id: booking.id,
        trip_id: booking.trip_id,
        user_id: booking.user_id,
        status: booking.status,
        payment_status: booking.payment_status,
        special_requests: booking.special_requests,
        emergency_contact: booking.emergency_contact,
        created_at: booking.created_at,
        trip: booking.trip ? {
            id: booking.trip.id,
            image_url: booking.trip.image_url,
            location: booking.trip.destination,
            date: booking.trip.departure_date,
            details: booking.trip.description,
            latitude: booking.trip.latitude,
            longitude: booking.trip.longitude,
            fare: booking.trip.price_per_person,
            slots: (booking.trip.max_participants || 0) - booking.trip.current_participants,
            type: booking.trip.trip_type,
        } : undefined,
    }));
};

export const cancelTripBooking = async (bookingId: number): Promise<void> => {
    // First get the booking to find trip_id
    const { data: booking, error: fetchError } = await supabase
        .from('trip_bookings')
        .select('trip_id, status')
        .eq('id', bookingId)
        .single();

    if (fetchError) throw fetchError;
    if (!booking) throw new Error('Booking not found');

    if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
    }

    // Update booking status
    const { error: updateError } = await supabase
        .from('trip_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

    if (updateError) throw updateError;

    // Increment trip current_participants back (decrement slots)
    const { error: incrementError } = await supabase
        .from('trips')
        .update({ current_participants: supabase.raw('current_participants - 1') })
        .eq('id', booking.trip_id);

    if (incrementError) {
        console.error('Error incrementing slots:', incrementError);
        // Don't throw, as booking is cancelled
    }
};

export const fetchEvents = async (userId: string): Promise<CollegeEvent[]> => {
    // Fetch all public events
    const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
            *,
            organizer:profiles!organizer_id(id, name, profile_pics)
        `)
        .eq('is_public', true)
        .eq('is_cancelled', false)
        .order('event_date', { ascending: true });

    if (eventsError) throw eventsError;

    // Fetch user's RSVPs for these events
    const eventIds = eventsData?.map(e => e.id) || [];
    const { data: rsvpsData, error: rsvpsError } = await supabase
        .from('event_rsvps')
        .select('event_id, status')
        .eq('user_id', userId)
        .in('event_id', eventIds);

    if (rsvpsError) throw rsvpsError;

    // Create a map of event_id to rsvp status
    const rsvpMap = new Map(rsvpsData?.map(r => [r.event_id, r.status]) || []);

    return (eventsData || []).map((event: any) => ({
        ...event,
        rsvpStatus: rsvpMap.get(event.id) || 'none',
        organizer: event.organizer ? {
            id: event.organizer.id,
            name: event.organizer.name,
            profile_pics: event.organizer.profile_pics || [],
        } : null,
    })) as CollegeEvent[];
};

export const rsvpEvent = async (eventId: string, userId: string, status: 'going' | 'interested' | 'none') => {
    const { error } = await supabase
        .from('event_rsvps')
        .upsert({ event_id: eventId, user_id: userId, status: status }, { onConflict: 'user_id, event_id' });
    if (error) throw error;
};

// --- BLIND DATES (New Location-Based Flow) ---
export const proposeBlindDate = async (cafe: string, dateTime: string, meal: BlindDate['meal']) => {
    const { data, error } = await supabase.rpc('propose_blind_date', {
        p_cafe: cafe,
        p_date_time: dateTime,
        p_meal: meal,
    });
    if (error) {
        console.error("Error proposing blind date:", error);
        throw new Error(error.message || "Could not propose the date. Please try again.");
    }
    return data;
};

export const fetchNearbyProposals = async (userId: string): Promise<BlindDateProposal[]> => {
    const { data, error } = await supabase.rpc('get_nearby_proposals', { p_user_id: userId });

    if (error) {
        console.error("Error fetching nearby proposals:", error);
        throw error;
    }

    return (data || []).map((p: NearbyProposalRpcResponse): BlindDateProposal => ({
        id: p.id,
        cafe: p.cafe,
        meal: p.meal,
        dateTime: p.date_time,
        status: 'pending',
        proposer: {
            id: p.proposer_id,
            name: p.proposer_name,
            profile_pics: p.proposer_profile_pics || [],
            membership: p.proposer_membership as MembershipType,
            college: p.proposer_college,
            course: p.proposer_course,
            tags: p.proposer_tags || [],
            bio: p.proposer_bio,
            prompts: (p.proposer_prompts as unknown as Prompt[] | null) || [],
        },
    }));
};


export const fetchMyDates = async (userId: string): Promise<BlindDate[]> => {
    const { data, error } = await supabase.rpc('get_my_dates', { p_user_id: userId });
    if (error) {
        console.error("Error fetching my dates via RPC:", error.message);
        throw error;
    }

    return (data || []).map((d: MyDateRpcResponse): BlindDate => {
        const otherUser: BasicProfile = {
            id: d.other_user_id,
            name: d.other_user_name,
            profile_pics: d.other_user_profile_pics || [],
            membership: d.other_user_membership as MembershipType,
            college: d.other_user_college,
            course: d.other_user_course,
            tags: d.other_user_tags || [],
            bio: d.other_user_bio,
            prompts: (d.other_user_prompts as unknown as Prompt[] | null) || [],
        };
        
        const currentUserVibeCheck: VibeCheck | null = d.vibe_check_rating ? {
            rating: d.vibe_check_rating,
            tags: d.vibe_check_tags || []
        } : null;
        
        return {
            id: d.id,
            cafe: d.cafe,
            meal: d.meal,
            dateTime: d.date_time,
            status: d.status,
            otherUser,
            isReceiver: d.is_receiver,
            currentUserVibeCheck
        };
    });
};

export const fetchMyProposals = async (userId: string): Promise<MyBlindDateProposal[]> => {
    const { data, error } = await supabase.rpc('get_my_proposals', { p_user_id: userId });
    if (error) {
        console.error("Error fetching my proposals:", error);
        throw new Error("Could not load your pending proposals.");
    }
    
    return (data || []).map((p: any) => ({
        id: p.id,
        cafe: p.cafe,
        meal: p.meal,
        dateTime: p.date_time,
    }));
};

export const acceptProposal = async (dateId: string, acceptorId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('accept_proposal', {
        p_date_id: dateId,
        p_acceptor_id: acceptorId
    });
    if (error) {
        console.error("Error accepting proposal:", error);
        throw new Error("Failed to accept date. It might have already been taken.");
    }
    return data || false;
};

export const cancelMyProposal = async (dateId: string): Promise<void> => {
    const { error } = await supabase.rpc('cancel_my_proposal', { p_date_id: dateId });
    if (error) {
        console.error("Error cancelling proposal:", error);
        throw new Error("Could not cancel your proposal.");
    }
};


export const submitVibeCheck = async (dateId: string, userId: string, feedback: VibeCheck) => {
     const { error } = await supabase
        .from('vibe_checks')
        .insert({
            blind_date_id: dateId,
            user_id: userId,
            rating: feedback.rating,
            tags: feedback.tags
        });
    if (error) throw error;
};

export const postComment = async (profileId: string, authorId: string, text: string): Promise<Comment> => {
    const { data, error } = await supabase
        .from('community_comments')
        .insert({ post_id: profileId, author_id: authorId, content: text })
        .select('id, content, created_at, author:profiles!author_id(id, name, profile_pics, college, course, tags, bio, prompts)')
        .single();

    if (error) throw error;
    if (!data?.author) throw new Error("Comment author not found");

    const typedData = data as CommentWithAuthor;

    return {
        id: typedData.id,
        content: typedData.content,
        created_at: typedData.created_at,
        author: {
            ...typedData.author,
            prompts: (typedData.author.prompts as unknown as Prompt[] | null) || [],
        }
    };
};

// --- COMMUNITY FEATURES ---
export const createCommunityPost = async (
    title: string,
    content: string,
    category: string,
    isAnonymous: boolean = false,
    mediaFiles?: File[]
): Promise<any> => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    let mediaUrls: string[] = [];

    // Upload media files if provided
    if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
            try {
                const uploadResult = await uploadCommunityMedia(file, userId);
                mediaUrls.push(uploadResult.url);
            } catch (error) {
                console.error('Error uploading media:', error);
                // Continue with other uploads
            }
        }
    }

    const { data, error } = await supabase
        .from('community_posts')
        .insert({
            title: title.trim(),
            content: content.trim(),
            category,
            author_id: isAnonymous ? null : userId,
            is_anonymous: isAnonymous,
            media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const fetchCommunityPosts = async (
    category?: string,
    limit: number = 20,
    offset: number = 0
): Promise<any[]> => {
    let query = supabase
        .from('community_posts')
        .select(`
            id,
            title,
            content,
            category,
            author_id,
            is_anonymous,
            upvotes,
            downvotes,
            comment_count,
            created_at,
            media_urls,
            author:profiles!author_id(id, name, profile_pics, college, course, tags, bio, prompts)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (category && category !== 'All') {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        author: post.is_anonymous ? null : post.author ? {
            id: post.author.id,
            name: post.author.name,
            profile_pics: post.author.profile_pics || [],
            college: post.author.college,
            course: post.author.course,
            tags: post.author.tags || [],
            bio: post.author.bio,
            prompts: (post.author.prompts as unknown as Prompt[] | null) || [],
        } : null,
        isAnonymous: post.is_anonymous,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        commentCount: post.comment_count,
        created_at: post.created_at,
        mediaUrls: post.media_urls || [],
    }));
};

export const voteOnPost = async (postId: string, voteType: 'up' | 'down'): Promise<void> => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Check if user already voted
    const { data: existingVote } = await supabase
        .from('community_votes')
        .select('vote_type')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

    if (existingVote) {
        if (existingVote.vote_type === voteType) {
            // Remove vote
            await supabase
                .from('community_votes')
                .delete()
                .eq('user_id', userId)
                .eq('post_id', postId);

            // Update post vote counts
            const updateField = voteType === 'up' ? 'upvotes' : 'downvotes';
            await supabase
                .from('community_posts')
                .update({ [updateField]: supabase.raw(`${updateField} - 1`) })
                .eq('id', postId);
        } else {
            // Change vote
            await supabase
                .from('community_votes')
                .update({ vote_type: voteType })
                .eq('user_id', userId)
                .eq('post_id', postId);

            // Update post vote counts
            const incrementField = voteType === 'up' ? 'upvotes' : 'downvotes';
            const decrementField = voteType === 'up' ? 'downvotes' : 'upvotes';
            await supabase
                .from('community_posts')
                .update({
                    [incrementField]: supabase.raw(`${incrementField} + 1`),
                    [decrementField]: supabase.raw(`${decrementField} - 1`)
                })
                .eq('id', postId);
        }
    } else {
        // Add new vote
        await supabase
            .from('community_votes')
            .insert({
                user_id: userId,
                post_id: postId,
                vote_type: voteType
            });

        // Update post vote counts
        const updateField = voteType === 'up' ? 'upvotes' : 'downvotes';
        await supabase
            .from('community_posts')
            .update({ [updateField]: supabase.raw(`${updateField} + 1`) })
            .eq('id', postId);
    }
};

export const createCommunityComment = async (
    postId: string,
    content: string,
    isAnonymous: boolean = false,
    parentId?: string
): Promise<any> => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('community_comments')
        .insert({
            post_id: postId,
            content: content.trim(),
            author_id: isAnonymous ? null : userId,
            is_anonymous: isAnonymous,
            parent_id: parentId || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const fetchCommunityComments = async (postId: string): Promise<any[]> => {
    const { data, error } = await supabase
        .from('community_comments')
        .select(`
            id,
            post_id,
            content,
            author_id,
            is_anonymous,
            upvotes,
            downvotes,
            created_at,
            parent_id,
            depth,
            author:profiles!author_id(id, name, profile_pics, college, course, tags, bio, prompts)
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((comment: any) => ({
        id: comment.id,
        postId: comment.post_id,
        content: comment.content,
        author: comment.is_anonymous ? null : comment.author ? {
            id: comment.author.id,
            name: comment.author.name,
            profile_pics: comment.author.profile_pics || [],
            college: comment.author.college,
            course: comment.author.course,
            tags: comment.author.tags || [],
            bio: comment.author.bio,
            prompts: (comment.author.prompts as unknown as Prompt[] | null) || [],
        } : null,
        isAnonymous: comment.is_anonymous,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
        created_at: comment.created_at,
        parentId: comment.parent_id,
        depth: comment.depth,
    }));
};

// --- MISC ---
export const reportOrBlock = async (reportingUserId: string, reportedUserId: string, reason: string, type: 'report' | 'block') => {
    const { error } = await supabase
        .from('reports_blocks')
        .insert({
            reporter_id: reportingUserId,
            reported_user_id: reportedUserId,
            reason: reason,
            type: type
        });
    if (error) throw error;
};

// --- Notifications ---
export const fetchNotifications = async (userId: string): Promise<AppNotification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(notification => ({
        ...notification,
        source_entity_id: null,
    }));
};

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error("Error fetching unread count:", error);
        return 0;
    }
    return count || 0;
};

export const markNotificationAsRead = async (notificationId: string) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) throw error;
};

export const markAllNotificationsAsRead = async (userId: string) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw error;
};

// --- ADS ---
export const fetchAds = async (): Promise<Ad[]> => {
    const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Error fetching ads:", error.message);
        throw error;
    }
    return data || [];
};

// --- ADMIN FUNCTIONS ---
export const deleteCommunityPost = async (postId: string, reason?: string): Promise<void> => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Update post as deleted
    const { error: deleteError } = await supabase
        .from('community_posts')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deletion_reason: reason
        })
        .eq('id', postId);

    if (deleteError) throw deleteError;

    // Log admin action
    await logAdminAction(userId, 'delete_post', `Deleted community post ${postId}`, { postId, reason });
};

export const fetchReports = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('reports_blocks')
        .select(`
            *,
            reporter:profiles!reporter_id(id, name, email),
            reported_user:profiles!reported_user_id(id, name, email),
            reported_post:community_posts!reported_post_id(id, title, content, is_deleted),
            reported_comment:community_comments!reported_comment_id(id, content, is_deleted)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const resolveReport = async (reportId: string, resolution: 'approved' | 'rejected', resolutionNotes?: string): Promise<void> => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('reports_blocks')
        .update({
            status: resolution === 'approved' ? 'resolved' : 'dismissed',
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
            resolution_notes: resolutionNotes
        })
        .eq('id', reportId);

    if (error) throw error;

    // Log admin action
    await logAdminAction(userId, 'resolve_report', `Resolved report ${reportId} as ${resolution}`, { reportId, resolution, resolutionNotes });
};

export const getAppMetrics = async (): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalReports: number;
    recentSignups: number;
}> => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // Get active users (logged in within last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeUsers, error: activeError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', sevenDaysAgo);

    // Get total posts
    const { count: totalPosts, error: postsError } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

    // Get pending reports
    const { count: totalReports, error: reportsError } = await supabase
        .from('reports_blocks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    // Get recent signups
    const { count: recentSignups, error: signupsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

    if (usersError || activeError || postsError || reportsError || signupsError) {
        throw new Error('Failed to fetch metrics');
    }

    return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalPosts: totalPosts || 0,
        totalReports: totalReports || 0,
        recentSignups: recentSignups || 0,
    };
};

export const sendBulkMessage = async (
    targetAudience: 'all' | 'premium' | 'free' | 'active' | 'inactive',
    title: string,
    message: string,
    sendPush: boolean = false
): Promise<void> => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Build query based on target audience
    let query = supabase.from('profiles').select('id, notification_preferences');

    switch (targetAudience) {
        case 'premium':
            query = query.eq('membership', 'Premium');
            break;
        case 'free':
            query = query.eq('membership', 'Free');
            break;
        case 'active':
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            query = query.gte('last_seen', sevenDaysAgo);
            break;
        case 'inactive':
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            query = query.lt('last_seen', thirtyDaysAgo);
            break;
        // 'all' uses the base query
    }

    const { data: users, error } = await query;
    if (error) throw error;

    if (!users || users.length === 0) {
        throw new Error('No users found for the selected audience');
    }

    // Create notifications for each user
    const notifications = users.map(user => ({
        user_id: user.id,
        title,
        message,
        type: 'system_announcement' as const,
        category: 'system',
        priority: 'normal' as const,
    }));

    const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

    if (notificationError) throw notificationError;

    // Send push notifications if requested
    if (sendPush) {
        const pushService = (await import('./pushNotifications.ts')).pushNotificationService;
        for (const user of users) {
            if (user.notification_preferences?.pushEnabled) {
                try {
                    await pushService.sendPushNotification(
                        user.id,
                        'CollegeCrush',
                        message,
                        { type: 'system_announcement' }
                    );
                } catch (pushError) {
                    console.error('Failed to send push notification to user:', user.id, pushError);
                }
            }
        }
    }

    // Log admin action
    await logAdminAction(userId, 'bulk_message', `Sent bulk message to ${targetAudience} audience (${users.length} users)`, {
        targetAudience,
        title,
        message,
        sendPush,
        recipientCount: users.length
    });
};

export const logAdminAction = async (
    adminId: string,
    actionType: string,
    reason: string,
    actionDetails?: any
): Promise<void> => {
    const { error } = await supabase
        .from('admin_actions')
        .insert({
            admin_id: adminId,
            action_type: actionType,
            reason,
            action_details: actionDetails || {}
        });

    if (error) {
        console.error('Failed to log admin action:', error);
        // Don't throw - logging failure shouldn't break the main operation
    }
};

// --- ANALYTICS FUNCTIONS ---
export const getUserActivityAnalytics = async (startDate: string, endDate: string): Promise<{
    dailyActiveUsers: { date: string; count: number }[];
    weeklyActiveUsers: { week: string; count: number }[];
    totalSignups: number;
    newUsersThisPeriod: number;
}> => {
    // Daily active users
    const { data: dailyData, error: dailyError } = await supabase
        .rpc('get_daily_active_users', { start_date: startDate, end_date: endDate });

    // Weekly active users
    const { data: weeklyData, error: weeklyError } = await supabase
        .rpc('get_weekly_active_users', { start_date: startDate, end_date: endDate });

    // Total signups and new users in period
    const { count: totalSignups, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: newUsersThisPeriod, error: newUsersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (dailyError || weeklyError || totalError || newUsersError) {
        console.error('Analytics error:', { dailyError, weeklyError, totalError, newUsersError });
        throw new Error('Failed to fetch user activity analytics');
    }

    return {
        dailyActiveUsers: dailyData || [],
        weeklyActiveUsers: weeklyData || [],
        totalSignups: totalSignups || 0,
        newUsersThisPeriod: newUsersThisPeriod || 0,
    };
};

export const getSwipeMatchAnalytics = async (startDate: string, endDate: string): Promise<{
    totalSwipes: number;
    totalMatches: number;
    matchRate: number;
    swipeTrends: { date: string; swipes: number; matches: number }[];
}> => {
    // Get swipe and match data
    const { data: swipeData, error: swipeError } = await supabase
        .rpc('get_swipe_match_analytics', { start_date: startDate, end_date: endDate });

    if (swipeError) {
        console.error('Swipe analytics error:', swipeError);
        throw new Error('Failed to fetch swipe/match analytics');
    }

    const data = swipeData?.[0] || { total_swipes: 0, total_matches: 0, match_rate: 0, trends: [] };

    return {
        totalSwipes: data.total_swipes || 0,
        totalMatches: data.total_matches || 0,
        matchRate: data.match_rate || 0,
        swipeTrends: data.trends || [],
    };
};

export const getMessagingAnalytics = async (startDate: string, endDate: string): Promise<{
    totalMessages: number;
    activeConversations: number;
    averageMessagesPerConversation: number;
    messagingTrends: { date: string; messages: number; conversations: number }[];
}> => {
    // Get messaging data
    const { data: messageData, error: messageError } = await supabase
        .rpc('get_messaging_analytics', { start_date: startDate, end_date: endDate });

    if (messageError) {
        console.error('Messaging analytics error:', messageError);
        throw new Error('Failed to fetch messaging analytics');
    }

    const data = messageData?.[0] || { total_messages: 0, active_conversations: 0, avg_messages_per_conversation: 0, trends: [] };

    return {
        totalMessages: data.total_messages || 0,
        activeConversations: data.active_conversations || 0,
        averageMessagesPerConversation: data.avg_messages_per_conversation || 0,
        messagingTrends: data.trends || [],
    };
};

export const getCommunityEngagementAnalytics = async (startDate: string, endDate: string): Promise<{
    totalPosts: number;
    totalComments: number;
    totalVotes: number;
    engagementRate: number;
    topCategories: { category: string; count: number }[];
    engagementTrends: { date: string; posts: number; comments: number; votes: number }[];
}> => {
    // Get community data
    const { data: communityData, error: communityError } = await supabase
        .rpc('get_community_analytics', { start_date: startDate, end_date: endDate });

    if (communityError) {
        console.error('Community analytics error:', communityError);
        throw new Error('Failed to fetch community engagement analytics');
    }

    const data = communityData?.[0] || {
        total_posts: 0,
        total_comments: 0,
        total_votes: 0,
        engagement_rate: 0,
        top_categories: [],
        trends: []
    };

    return {
        totalPosts: data.total_posts || 0,
        totalComments: data.total_comments || 0,
        totalVotes: data.total_votes || 0,
        engagementRate: data.engagement_rate || 0,
        topCategories: data.top_categories || [],
        engagementTrends: data.trends || [],
    };
};

export const getEventTripAnalytics = async (startDate: string, endDate: string): Promise<{
    totalEvents: number;
    totalEventParticipants: number;
    totalTrips: number;
    totalTripBookings: number;
    eventParticipationRate: number;
    tripBookingRate: number;
    eventTrends: { date: string; events: number; participants: number }[];
    tripTrends: { date: string; trips: number; bookings: number }[];
}> => {
    // Get events data
    const { data: eventData, error: eventError } = await supabase
        .rpc('get_event_analytics', { start_date: startDate, end_date: endDate });

    // Get trips data
    const { data: tripData, error: tripError } = await supabase
        .rpc('get_trip_analytics', { start_date: startDate, end_date: endDate });

    if (eventError || tripError) {
        console.error('Event/Trip analytics error:', { eventError, tripError });
        throw new Error('Failed to fetch event and trip analytics');
    }

    const eventStats = eventData?.[0] || {
        total_events: 0,
        total_participants: 0,
        participation_rate: 0,
        trends: []
    };

    const tripStats = tripData?.[0] || {
        total_trips: 0,
        total_bookings: 0,
        booking_rate: 0,
        trends: []
    };

    return {
        totalEvents: eventStats.total_events || 0,
        totalEventParticipants: eventStats.total_participants || 0,
        totalTrips: tripStats.total_trips || 0,
        totalTripBookings: tripStats.total_bookings || 0,
        eventParticipationRate: eventStats.participation_rate || 0,
        tripBookingRate: tripStats.booking_rate || 0,
        eventTrends: eventStats.trends || [],
        tripTrends: tripStats.trends || [],
    };
};

export const getRevenueAnalytics = async (startDate: string, endDate: string): Promise<{
    totalRevenue: number;
    premiumSubscriptions: number;
    paymentTrends: { date: string; revenue: number; subscriptions: number }[];
    revenueByPlan: { plan: string; revenue: number; count: number }[];
}> => {
    // Get revenue data
    const { data: revenueData, error: revenueError } = await supabase
        .rpc('get_revenue_analytics', { start_date: startDate, end_date: endDate });

    if (revenueError) {
        console.error('Revenue analytics error:', revenueError);
        throw new Error('Failed to fetch revenue analytics');
    }

    const data = revenueData?.[0] || {
        total_revenue: 0,
        premium_subscriptions: 0,
        trends: [],
        by_plan: []
    };

    return {
        totalRevenue: data.total_revenue || 0,
        premiumSubscriptions: data.premium_subscriptions || 0,
        paymentTrends: data.trends || [],
        revenueByPlan: data.by_plan || [],
    };
};

export const exportAnalyticsData = async (analyticsType: string, startDate: string, endDate: string): Promise<string> => {
    // This would generate CSV or JSON export data
    // For now, return a placeholder - in a real implementation, this would format the data
    const data = await getComprehensiveAnalytics(startDate, endDate);
    return JSON.stringify(data, null, 2);
};

export const getComprehensiveAnalytics = async (startDate: string, endDate: string): Promise<any> => {
    try {
        const [
            userActivity,
            swipeMatch,
            messaging,
            community,
            eventTrip,
            revenue
        ] = await Promise.all([
            getUserActivityAnalytics(startDate, endDate),
            getSwipeMatchAnalytics(startDate, endDate),
            getMessagingAnalytics(startDate, endDate),
            getCommunityEngagementAnalytics(startDate, endDate),
            getEventTripAnalytics(startDate, endDate),
            getRevenueAnalytics(startDate, endDate),
        ]);

        return {
            period: { startDate, endDate },
            userActivity,
            swipeMatch,
            messaging,
            community,
            eventTrip,
            revenue,
            generatedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error fetching comprehensive analytics:', error);
        throw error;
    }
};

export const getUserStats = async (userId: string): Promise<UserStats> => {
    // This is a placeholder implementation. In a real app, you'd query the database for actual stats.
    // For now, return mock data based on some calculations.

    // Mock implementation - replace with actual database queries
    const mockStats: UserStats = {
        totalSwipes: 150,
        totalMatches: 25,
        totalMessages: 120,
        totalDates: 8,
        currentStreak: 5,
        longestStreak: 12,
        points: 1250,
        level: Math.floor(1250 / 1000) + 1,
        achievements: [
            {
                id: 'first_match',
                name: 'First Match',
                description: 'Found your first match!',
                icon: '🎯',
                unlockedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            },
            {
                id: 'message_master',
                name: 'Message Master',
                description: 'Sent 100 messages',
                icon: '💬',
                unlockedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            }
        ],
        dailyChallenges: [
            {
                id: 'swipe_10',
                title: 'Swipe 10 profiles',
                description: 'Keep swiping to find your match!',
                type: 'swipes',
                target: 10,
                progress: 7,
                reward: 50,
                completed: false,
                expiresAt: new Date(Date.now() + 86400000).toISOString(),
            },
            {
                id: 'send_5_messages',
                title: 'Send 5 messages',
                description: 'Start conversations with your matches',
                type: 'messages',
                target: 5,
                progress: 5,
                reward: 25,
                completed: true,
                expiresAt: new Date(Date.now() + 86400000).toISOString(),
            }
        ]
    };

    return mockStats;
};
