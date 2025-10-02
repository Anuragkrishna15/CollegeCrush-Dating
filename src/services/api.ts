import { supabase } from './supabase.ts';
import { Profile, Trip, CollegeEvent, BlindDate, MembershipType, ProfileOnboardingData, Comment, VibeCheck, Conversation, Message, BasicProfile, DbProfile, User, AppNotification, Prompt, BlindDateProposal, Ad, MyBlindDateProposal, NotificationPreferences, PrivacySettings } from '../types/types.ts';
import { Database, Json } from './database.types.ts';

// Define types for complex queries and RPC responses for better type safety.
type HandleSwipeResponse = Database['public']['Functions']['handle_swipe']['Returns'][number];
type SwipeCandidate = Database['public']['Functions']['get_swipe_candidates']['Returns'][number];
type LikerProfile = Database['public']['Functions']['get_likers']['Returns'][number];
type ConversationRpcResponse = Database['public']['Functions']['get_conversations']['Returns'][number];
type MyDateRpcResponse = Database['public']['Functions']['get_my_dates']['Returns'][number];
type NearbyProposalRpcResponse = Database['public']['Functions']['get_nearby_proposals']['Returns'][number];

type CommentWithAuthor = Omit<Database['public']['Tables']['comments']['Row'], 'author_id'> & {
    author: Pick<DbProfile, 'id' | 'name' | 'profilePics' | 'college' | 'course' | 'tags' | 'bio' | 'prompts'> | null;
}

const MESSAGES_PAGE_SIZE = 30;

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

    const age = new Date().getFullYear() - new Date(profileData.dob).getFullYear();
    const boostEndTime = boostData?.boost_end_time ? new Date(boostData.boost_end_time).getTime() : undefined;
    
    const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, text, created_at, author:profiles!author_id(id, name, profilePics, college, course, tags, bio, prompts)')
        .eq('profile_id', userId)
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
            text: c.text,
            created_at: c.created_at,
        }));

    const finalProfile: User = {
        ...profileData,
        age,
        comments,
        boost_end_time: boostEndTime,
        profilePics: profileData.profilePics || [],
        prompts: (profileData.prompts as unknown as Prompt[] | null) || [],
        notification_preferences: (profileData.notification_preferences as unknown as NotificationPreferences) || { matches: true, messages: true, events: false },
        privacy_settings: (profileData.privacy_settings as unknown as PrivacySettings) || { showInSwipe: true },
    };

    return finalProfile;
};

export const createProfile = async (userId: string, email: string, profileData: ProfileOnboardingData, profilePicFile: File): Promise<User> => {
    const fileExt = profilePicFile.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pics')
        .upload(filePath, profilePicFile);

    if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);
    if (!uploadData) throw new Error('File upload failed.');

    const { data: urlData } = supabase.storage.from('profile-pics').getPublicUrl(uploadData.path);

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
        profilePics: [urlData.publicUrl],
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
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('profile-pics')
        .upload(filePath, file);

    if (uploadError) {
        throw new Error(`Storage Error: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from('profile-pics').getPublicUrl(filePath);
    return data.publicUrl;
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
        ...paymentDetails,
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
        latitude: null,
        longitude: null,
        age: new Date().getFullYear() - new Date(p.dob).getFullYear(),
        prompts: (p.prompts as unknown as Prompt[] | null) || [],
        notification_preferences: (p.notification_preferences as unknown as NotificationPreferences) || { matches: true, messages: true, events: false },
        privacy_settings: (p.privacy_settings as unknown as PrivacySettings) || { showInSwipe: true },
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
        latitude: null,
        longitude: null,
        age: new Date().getFullYear() - new Date(p.dob).getFullYear(),
        prompts: (p.prompts as unknown as Prompt[] | null) || [],
        notification_preferences: (p.notification_preferences as unknown as NotificationPreferences) || { matches: true, messages: true, events: false },
        privacy_settings: (p.privacy_settings as unknown as PrivacySettings) || { showInSwipe: true },
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
            profilePics: [convo.other_user_profile_pic],
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
        profilePics: otherUserData.profilePics,
        membership: otherUserData.membership as MembershipType,
        college: otherUserData.college,
        course: otherUserData.course,
        tags: otherUserData.tags,
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
    return data || [];
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

export const fetchEvents = async (userId: string): Promise<CollegeEvent[]> => {
    const { data, error } = await supabase.rpc('get_events_with_rsvp', { p_user_id: userId });
    if (error) throw error;

    return (data || []).map((event: any) => ({
        ...event,
        rsvpStatus: event.rsvp_status || 'none',
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
            profilePics: p.proposer_profile_pics,
            membership: p.proposer_membership as MembershipType,
            college: p.proposer_college,
            course: p.proposer_course,
            tags: p.proposer_tags,
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
            profilePics: d.other_user_profile_pics,
            membership: d.other_user_membership as MembershipType,
            college: d.other_user_college,
            course: d.other_user_course,
            tags: d.other_user_tags,
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
        .from('comments')
        .insert({ profile_id: profileId, author_id: authorId, text: text })
        .select('id, text, created_at, author:profiles!author_id(id, name, profilePics, college, course, tags, bio, prompts)')
        .single<CommentWithAuthor>();
        
    if (error || !data?.author) throw error || new Error("Comment author not found");

    return {
        id: data.id,
        text: data.text,
        created_at: data.created_at,
        author: {
            ...data.author,
            prompts: (data.author.prompts as unknown as Prompt[] | null) || [],
        }
    };
};

// --- MISC ---
export const reportOrBlock = async (reportingUserId: string, reportedUserId: string, reason: string, type: 'report' | 'block') => {
    const { error } = await supabase
        .from('reports_blocks')
        .insert({
            reporting_user_id: reportingUserId,
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
    return data || [];
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
