export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ads: {
        Row: {
          created_at: string
          id: string
          image_url: string
          link: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          link: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          link?: string
          title?: string
        }
        Relationships: []
      }
      blind_dates: {
        Row: {
          cafe: string
          created_at: string
          date_time: string | null
          id: string
          meal: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks"
          requested_user_id: string | null
          requesting_user_id: string
          status: "pending" | "accepted" | "completed" | "feedback_submitted"
          time: string
        }
        Insert: {
          cafe: string
          created_at?: string
          date_time?: string | null
          id?: string
          meal: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks"
          requested_user_id?: string | null
          requesting_user_id: string
          status?: "pending" | "accepted" | "completed" | "feedback_submitted"
          time: string
        }
        Update: {
          cafe?: string
          created_at?: string
          date_time?: string | null
          id?: string
          meal?: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks"
          requested_user_id?: string | null
          requesting_user_id?: string
          status?: "pending" | "accepted" | "completed" | "feedback_submitted"
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "blind_dates_requested_user_id_fkey"
            columns: ["requested_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blind_dates_requesting_user_id_fkey"
            columns: ["requesting_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          author_id: string
          created_at: string
          id: string
          profile_id: string
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          profile_id: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          status: "going" | "interested" | "none"
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          status: "going" | "interested" | "none"
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          status?: "going" | "interested" | "none"
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          college: string
          created_at: string
          date: string
          id: string
          imageUrl: string
          name: string
        }
        Insert: {
          college: string
          created_at?: string
          date: string
          id?: string
          imageUrl: string
          name: string
        }
        Update: {
          college?: string
          created_at?: string
          date?: string
          id?: string
          imageUrl?: string
          name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          source_entity_id: string | null
          type: "new_match" | "new_message" | "new_blind_date_request" | "blind_date_accepted" | "vibe_check_match"
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          source_entity_id?: string | null
          type: "new_match" | "new_message" | "new_blind_date_request" | "blind_date_accepted" | "vibe_check_match"
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          source_entity_id?: string | null
          type?: "new_match" | "new_message" | "new_blind_date_request" | "blind_date_accepted" | "vibe_check_match"
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          created_at: string
          user_id: string
          amount: number
          currency: string
          plan: "Free" | "Trial" | "Premium"
          status: string
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          amount: number
          currency?: string
          plan: "Free" | "Trial" | "Premium"
          status: string
          provider: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          amount?: number
          currency?: string
          plan?: "Free" | "Trial" | "Premium"
          status?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profile_boosts: {
        Row: {
          boost_end_time: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          boost_end_time: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          boost_end_time?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_boosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          bio: string
          college: string
          course: string
          created_at: string
          dob: string
          email: string
          gender: "Male" | "Female" | "Other"
          id: string
          latitude: number | null
          longitude: number | null
          membership: "Free" | "Trial" | "Premium"
          name: string
          notification_preferences: Json | null
          privacy_settings: Json | null
          profilePics: string[]
          prompts: Json | null
          tags: string[]
        }
        Insert: {
          bio: string
          college: string
          course: string
          created_at?: string
          dob: string
          email: string
          gender: "Male" | "Female" | "Other"
          id: string
          latitude?: number | null
          longitude?: number | null
          membership?: "Free" | "Trial" | "Premium"
          name: string
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          profilePics: string[]
          prompts?: Json | null
          tags: string[]
        }
        Update: {
          bio?: string
          college?: string
          course?: string
          created_at?: string
          dob?: string
          email?: string
          gender?: "Male" | "Female" | "Other"
          id?: string
          latitude?: number | null
          longitude?: number | null
          membership?: "Free" | "Trial" | "Premium"
          name?: string
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          profilePics?: string[]
          prompts?: Json | null
          tags?: string[]
        }
        Relationships: []
      }
      reports_blocks: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_user_id: string
          reporting_user_id: string
          type: "report" | "block"
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_user_id: string
          reporting_user_id: string
          type: "report" | "block"
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_user_id?: string
          reporting_user_id?: string
          type?: "report" | "block"
        }
        Relationships: [
          {
            foreignKeyName: "reports_blocks_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_blocks_reporting_user_id_fkey"
            columns: ["reporting_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      swipes: {
        Row: {
          created_at: string
          direction: "left" | "right"
          id: number
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string
          direction: "left" | "right"
          id?: number
          swiped_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string
          direction?: "left" | "right"
          id?: number
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      trip_bookings: {
        Row: {
          created_at: string
          id: number
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      trips: {
        Row: {
          created_at: string
          date: string
          details: string
          id: string
          imageUrl: string
          location: string
          fare: number
          slots: number
          type: "Couple" | "Stranger"
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          created_at?: string
          date: string
          details?: string
          id?: string
          imageUrl: string
          location: string
          fare?: number
          slots: number
          type: "Couple" | "Stranger"
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          details?: string
          id?: string
          imageUrl?: string
          location?: string
          fare?: number
          slots?: number
          type?: "Couple" | "Stranger"
          latitude?: number | null
          longitude?: number | null
        }
        Relationships: []
      }
      vibe_checks: {
        Row: {
          blind_date_id: string
          created_at: string
          id: string
          rating: "good" | "bad" | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          blind_date_id: string
          created_at?: string
          id?: string
          rating?: "good" | "bad" | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          blind_date_id?: string
          created_at?: string
          id?: string
          rating?: "good" | "bad" | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibe_checks_blind_date_id_fkey"
            columns: ["blind_date_id"]
            isOneToOne: true
            referencedRelation: "blind_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vibe_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_proposal: {
        Args: {
          p_date_id: string
          p_acceptor_id: string
        }
        Returns: boolean
      }
      book_trip_and_decrement_slot: {
        Args: {
          p_trip_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      cancel_my_proposal: {
        Args: {
          p_date_id: string
        }
        Returns: undefined
      }
      create_blind_date_request: {
        Args: {
          p_requesting_user_id: string
          p_cafe: string
          p_time: string
          p_meal: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks"
        }
        Returns: string | null
      }
      delete_user_account: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_conversations: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          other_user_id: string
          other_user_name: string
          other_user_profile_pic: string
          last_message_text: string
          last_message_timestamp: string
          last_message_sender_id: string
          other_user_membership: "Free" | "Trial" | "Premium"
          unread_count: number
        }[]
      }
      get_events_with_rsvp: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          name: string
          date: string
          college: string
          imageUrl: string
          created_at: string
          rsvp_status: "going" | "interested" | "none" | null
        }[]
      }
      get_likers: {
        Args: {
          p_user_id: string
        }
        Returns: {
          bio: string
          college: string
          course: string
          created_at: string
          dob: string
          email: string
          gender: "Male" | "Female" | "Other"
          id: string
          membership: "Free" | "Trial" | "Premium"
          name: string
          notification_preferences: Json | null
          privacy_settings: Json | null
          profilePics: string[]
          prompts: Json | null
          tags: string[]
        }[]
      }
      get_my_dates: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          cafe: string
          meal: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks"
          date_time: string
          status: "pending" | "accepted" | "completed" | "feedback_submitted"
          is_receiver: boolean
          other_user_id: string
          other_user_name: string
          other_user_profile_pics: string[]
          other_user_membership: "Free" | "Trial" | "Premium"
          other_user_college: string
          other_user_course: string
          other_user_tags: string[]
          other_user_bio: string
          other_user_prompts: Json | null
          vibe_check_rating: "good" | "bad" | null
          vibe_check_tags: string[] | null
        }[]
      }
      get_my_proposals: {
        Args: {
          p_user_id: string
        }
        Returns: {
          cafe: string
          created_at: string
          date_time: string | null
          id: string
          meal: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks"
          requested_user_id: string | null
          requesting_user_id: string
          status: "pending" | "accepted" | "completed" | "feedback_submitted"
          time: string
        }[]
      }
      get_nearby_proposals: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          cafe: string
          meal: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks"
          date_time: string
          proposer_id: string
          proposer_name: string
          proposer_profile_pics: string[]
          proposer_membership: "Free" | "Trial" | "Premium"
          proposer_college: string
          proposer_course: string
          proposer_tags: string[]
          proposer_bio: string
          proposer_prompts: Json
        }[]
      }
      get_swipe_candidates: {
        Args: {
          p_user_id: string
          p_user_gender: "Male" | "Female" | "Other"
        }
        Returns: {
          bio: string
          college: string
          course: string
          created_at: string
          dob: string
          email: string
          gender: "Male" | "Female" | "Other"
          id: string
          membership: "Free" | "Trial" | "Premium"
          name: string
          notification_preferences: Json | null
          privacy_settings: Json | null
          profilePics: string[]
          prompts: Json | null
          tags: string[]
        }[]
      }
      handle_delete_user: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      handle_swipe: {
        Args: {
          p_swiper_id: string
          p_swiped_id: string
          p_direction: "left" | "right"
        }
        Returns: {
          match_created: boolean
          conversation_id: string | null
        }[]
      }
      propose_blind_date: {
        Args: {
          p_cafe: string
          p_date_time: string
          p_meal: string
        }
        Returns: string
      }
      update_user_location: {
        Args: {
          p_lat: number
          p_lon: number
        }
        Returns: undefined
      }
    }
    Enums: {
      meal_type: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks"
      notification_type: "new_match" | "new_message" | "new_blind_date_request" | "blind_date_accepted" | "vibe_check_match"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
