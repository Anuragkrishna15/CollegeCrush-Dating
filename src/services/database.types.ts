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
      achievements: {
        Row: {
          achievement_id: string
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_completed: boolean
          name: string
          points_reward: number
          progress_current: number | null
          progress_target: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          is_completed?: boolean
          name: string
          points_reward?: number
          progress_current?: number | null
          progress_target?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_completed?: boolean
          name?: string
          points_reward?: number
          progress_current?: number | null
          progress_target?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_actions: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          reason: string | null
          target_id: string
          target_type: string
          user_agent: string | null
          admin_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          reason?: string | null
          target_id: string
          target_type: string
          user_agent?: string | null
          admin_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          reason?: string | null
          target_id?: string
          target_type?: string
          user_agent?: string | null
          admin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ads: {
        Row: {
          advertiser_info: Json | null
          budget_daily: number | null
          budget_total: number | null
          click_count: number
          content: string | null
          created_at: string
          end_date: string | null
          id: string
          image_url: string | null
          impression_count: number
          is_active: boolean
          link_url: string | null
          priority: number
          spent_daily: number
          spent_total: number
          start_date: string | null
          target_audience: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          advertiser_info?: Json | null
          budget_daily?: number | null
          budget_total?: number | null
          click_count?: number
          content?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number
          is_active?: boolean
          link_url?: string | null
          priority?: number
          spent_daily?: number
          spent_total?: number
          start_date?: string | null
          target_audience?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          advertiser_info?: Json | null
          budget_daily?: number | null
          budget_total?: number | null
          click_count?: number
          content?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number
          is_active?: boolean
          link_url?: string | null
          priority?: number
          spent_daily?: number
          spent_total?: number
          start_date?: string | null
          target_audience?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blind_dates: {
        Row: {
          alternative_times: Json | null
          cafe: string
          cancellation_reason: string | null
          completed_at: string | null
          created_at: string
          date_time: string
          estimated_cost: number | null
          feedback_submitted_at: string | null
          flexible_time: boolean
          id: string
          meal: Database["public"]["Enums"]["meal_type"]
          meeting_point: string | null
          proposed_date: string
          proposed_time: string
          requested_user_id: string | null
          requesting_user_id: string
          safety_features: Json | null
          special_requests: string | null
          status: Database["public"]["Enums"]["blind_date_status"]
          updated_at: string | null
        }
        Insert: {
          alternative_times?: Json | null
          cafe: string
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_cost?: number | null
          feedback_submitted_at?: string | null
          flexible_time?: boolean
          id?: string
          meal: Database["public"]["Enums"]["meal_type"]
          meeting_point?: string | null
          proposed_date: string
          proposed_time: string
          requested_user_id?: string | null
          requesting_user_id: string
          safety_features?: Json | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["blind_date_status"]
          updated_at?: string | null
        }
        Update: {
          alternative_times?: Json | null
          cafe?: string
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_cost?: number | null
          feedback_submitted_at?: string | null
          flexible_time?: boolean
          id?: string
          meal?: Database["public"]["Enums"]["meal_type"]
          meeting_point?: string | null
          proposed_date?: string
          proposed_time?: string
          requested_user_id?: string | null
          requesting_user_id?: string
          safety_features?: Json | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["blind_date_status"]
          updated_at?: string | null
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
      community_comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          depth: number
          downvotes: number
          id: string
          is_anonymous: boolean
          is_deleted: boolean
          parent_id: string | null
          post_id: string
          updated_at: string | null
          upvotes: number
          deleted_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          depth?: number
          downvotes?: number
          id?: string
          is_anonymous?: boolean
          is_deleted?: boolean
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          upvotes?: number
          deleted_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          depth?: number
          downvotes?: number
          id?: string
          is_anonymous?: boolean
          is_deleted?: boolean
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          upvotes?: number
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      community_posts: {
        Row: {
          author_id: string | null
          category: string
          comment_count: number
          content: string
          created_at: string
          event_data: Json | null
          id: string
          is_anonymous: boolean
          is_deleted: boolean
          is_pinned: boolean
          last_activity_at: string
          media_urls: string[] | null
          poll_data: Json | null
          tags: string[] | null
          title: string
          updated_at: string | null
          upvotes: number
          downvotes: number
          view_count: number
          deleted_at: string | null
          deletion_reason: string | null
        }
        Insert: {
          author_id?: string | null
          category: string
          comment_count?: number
          content: string
          created_at?: string
          event_data?: Json | null
          id?: string
          is_anonymous?: boolean
          is_deleted?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          media_urls?: string[] | null
          poll_data?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          upvotes?: number
          downvotes?: number
          view_count?: number
          deleted_at?: string | null
          deletion_reason?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string
          comment_count?: number
          content?: string
          created_at?: string
          event_data?: Json | null
          id?: string
          is_anonymous?: boolean
          is_deleted?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          media_urls?: string[] | null
          poll_data?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          upvotes?: number
          downvotes?: number
          view_count?: number
          deleted_at?: string | null
          deletion_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_votes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_votes_user_id_fkey"
            columns: ["user_id"]
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
          is_active: boolean
          last_message_at: string | null
          message_count: number
          updated_at: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          message_count?: number
          updated_at?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          message_count?: number
          updated_at?: string | null
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
      daily_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          progress: number
          reward_data: Json | null
          reward_points: number
          reward_type: string
          target: number
          title: string
          type: string
          category: string
          description: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          progress?: number
          reward_data?: Json | null
          reward_points: number
          reward_type?: string
          target: number
          title: string
          type: string
          category: string
          description: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          progress?: number
          reward_data?: Json | null
          reward_points?: number
          reward_type?: string
          target?: number
          title?: string
          type?: string
          category?: string
          description?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          category: string
          college: string
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_time: string | null
          id: string
          image_url: string | null
          is_cancelled: boolean
          is_public: boolean
          latitude: number | null
          longitude: number | null
          location: string
          max_attendees: number | null
          name: string
          organizer_id: string | null
          price: number
          requires_approval: boolean
          tags: string[] | null
          updated_at: string | null
          current_attendees: number
          cancellation_reason: string | null
        }
        Insert: {
          category: string
          college: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_cancelled?: boolean
          is_public?: boolean
          latitude?: number | null
          longitude?: number | null
          location: string
          max_attendees?: number | null
          name: string
          organizer_id?: string | null
          price?: number
          requires_approval?: boolean
          tags?: string[] | null
          updated_at?: string | null
          current_attendees?: number
          cancellation_reason?: string | null
        }
        Update: {
          category?: string
          college?: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_cancelled?: boolean
          is_public?: boolean
          latitude?: number | null
          longitude?: number | null
          location?: string
          max_attendees?: number | null
          name?: string
          organizer_id?: string | null
          price?: number
          requires_approval?: boolean
          tags?: string[] | null
          updated_at?: string | null
          current_attendees?: number
          cancellation_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      event_rsvps: {
        Row: {
          additional_guests: number
          created_at: string
          event_id: string
          special_requests: string | null
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
        }
        Insert: {
          additional_guests?: number
          created_at?: string
          event_id: string
          special_requests?: string | null
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
        }
        Update: {
          additional_guests?: number
          created_at?: string
          event_id?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"]
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
      messages: {
        Row: {
          content_type: string
          conversation_id: string
          created_at: string
          id: string
          is_deleted: boolean
          is_read: boolean
          media_url: string | null
          metadata: Json | null
          read_at: string | null
          reactions: Json | null
          reply_to_message_id: string | null
          sender_id: string
          text: string | null
          updated_at: string | null
        }
        Insert: {
          content_type?: string
          conversation_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_read?: boolean
          media_url?: string | null
          metadata?: Json | null
          read_at?: string | null
          reactions?: Json | null
          reply_to_message_id?: string | null
          sender_id: string
          text?: string | null
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_read?: boolean
          media_url?: string | null
          metadata?: Json | null
          read_at?: string | null
          reactions?: Json | null
          reply_to_message_id?: string | null
          sender_id?: string
          text?: string | null
          updated_at?: string | null
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
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
          category: string
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          priority: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          priority?: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          priority?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_type: string
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          processed_at: string | null
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          provider_refund_id: string | null
          refunded_at: string | null
          refund_amount: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          processed_at?: string | null
          provider: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_refund_id?: string | null
          refunded_at?: string | null
          refund_amount?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          processed_at?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_refund_id?: string | null
          refunded_at?: string | null
          refund_amount?: number | null
          user_id?: string
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
          boost_multiplier: number
          boost_type: string
          created_at: string
          id: string
          impressions_count: number
          is_active: boolean
          matches_count: number
          user_id: string
        }
        Insert: {
          boost_end_time: string
          boost_multiplier?: number
          boost_type?: string
          created_at?: string
          id?: string
          impressions_count?: number
          is_active?: boolean
          matches_count?: number
          user_id: string
        }
        Update: {
          boost_end_time?: string
          boost_multiplier?: number
          boost_type?: string
          created_at?: string
          id?: string
          impressions_count?: number
          is_active?: boolean
          matches_count?: number
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
          account_status: string
          bio: string
          college: string
          course: string
          created_at: string
          dob: string
          email: string
          gender: Database["public"]["Enums"]["gender_enum"]
          id: string
          is_online: boolean
          last_seen: string
          latitude: number | null
          longitude: number | null
          location_updated_at: string | null
          membership: Database["public"]["Enums"]["membership_type"]
          name: string
          notification_preferences: Json | null
          privacy_settings: Json | null
          profile_completion_score: number
          profile_pics: string[]
          prompts: Json | null
          suspension_reason: string | null
          suspension_until: string | null
          tags: string[]
          updated_at: string | null
          verification_status: Json | null
        }
        Insert: {
          account_status?: string
          bio?: string
          college: string
          course: string
          created_at?: string
          dob: string
          email: string
          gender: Database["public"]["Enums"]["gender_enum"]
          id: string
          is_online?: boolean
          last_seen?: string
          latitude?: number | null
          longitude?: number | null
          location_updated_at?: string | null
          membership?: Database["public"]["Enums"]["membership_type"]
          name: string
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          profile_completion_score?: number
          profile_pics?: string[]
          prompts?: Json | null
          suspension_reason?: string | null
          suspension_until?: string | null
          tags?: string[]
          updated_at?: string | null
          verification_status?: Json | null
        }
        Update: {
          account_status?: string
          bio?: string
          college?: string
          course?: string
          created_at?: string
          dob?: string
          email?: string
          gender?: Database["public"]["Enums"]["gender_enum"]
          id?: string
          is_online?: boolean
          last_seen?: string
          latitude?: number | null
          longitude?: number | null
          location_updated_at?: string | null
          membership?: Database["public"]["Enums"]["membership_type"]
          name?: string
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          profile_completion_score?: number
          profile_pics?: string[]
          prompts?: Json | null
          suspension_reason?: string | null
          suspension_until?: string | null
          tags?: string[]
          updated_at?: string | null
          verification_status?: Json | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          device_id: string | null
          device_type: string
          id: string
          is_active: boolean
          last_used_at: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          device_type: string
          id?: string
          is_active?: boolean
          last_used_at?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          device_type?: string
          id?: string
          is_active?: boolean
          last_used_at?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reports_blocks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_comment_id: string | null
          reported_post_id: string | null
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          resolution_notes: string | null
          severity: string
          status: string
          type: Database["public"]["Enums"]["report_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_comment_id?: string | null
          reported_post_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          severity?: string
          status?: string
          type: Database["public"]["Enums"]["report_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_comment_id?: string | null
          reported_post_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          severity?: string
          status?: string
          type?: Database["public"]["Enums"]["report_type"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_blocks_reported_comment_id_fkey"
            columns: ["reported_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_blocks_reported_post_id_fkey"
            columns: ["reported_post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_blocks_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_blocks_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_blocks_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      rizz_scores: {
        Row: {
          conversation_id: string
          created_at: string
          feedback: Json | null
          id: string
          message_id: string | null
          metrics: Json
          score: number
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          feedback?: Json | null
          id?: string
          message_id?: string | null
          metrics?: Json
          score: number
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          feedback?: Json | null
          id?: string
          message_id?: string | null
          metrics?: Json
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rizz_scores_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rizz_scores_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rizz_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          features: Json | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          features?: Json | null
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          features?: Json | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      swipes: {
        Row: {
          created_at: string
          direction: Database["public"]["Enums"]["swipe_direction"]
          id: number
          swiped_id: string
          swiper_id: string
          swipe_source: string
        }
        Insert: {
          created_at?: string
          direction: Database["public"]["Enums"]["swipe_direction"]
          id?: number
          swiped_id: string
          swiper_id: string
          swipe_source?: string
        }
        Update: {
          created_at?: string
          direction?: Database["public"]["Enums"]["swipe_direction"]
          id?: number
          swiped_id?: string
          swiper_id?: string
          swipe_source?: string
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
          emergency_contact: Json | null
          id: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          special_requests: string | null
          status: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emergency_contact?: Json | null
          id?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          special_requests?: string | null
          status?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emergency_contact?: Json | null
          id?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          special_requests?: string | null
          status?: string
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
          departure_date: string
          description: string | null
          destination: string
          id: string
          image_url: string | null
          is_cancelled: boolean
          itinerary: Json | null
          latitude: number | null
          longitude: number | null
          max_participants: number | null
          organizer_id: string
          price_per_person: number | null
          requirements: Json | null
          return_date: string | null
          total_cost: number | null
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at: string | null
          current_participants: number
          cancellation_reason: string | null
        }
        Insert: {
          created_at?: string
          departure_date: string
          description?: string | null
          destination: string
          id?: string
          image_url?: string | null
          is_cancelled?: boolean
          itinerary?: Json | null
          latitude?: number | null
          longitude?: number | null
          max_participants?: number | null
          organizer_id: string
          price_per_person?: number | null
          requirements?: Json | null
          return_date?: string | null
          total_cost?: number | null
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at?: string | null
          current_participants?: number
          cancellation_reason?: string | null
        }
        Update: {
          created_at?: string
          departure_date?: string
          description?: string | null
          destination?: string
          id?: string
          image_url?: string | null
          is_cancelled?: boolean
          itinerary?: Json | null
          latitude?: number | null
          longitude?: number | null
          max_participants?: number | null
          organizer_id?: string
          price_per_person?: number | null
          requirements?: Json | null
          return_date?: string | null
          total_cost?: number | null
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string | null
          current_participants?: number
          cancellation_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_stats: {
        Row: {
          created_at: string
          current_streak: number
          experience_points: number
          id: string
          last_activity_at: string
          level: number
          longest_streak: number
          points: number
          total_blind_dates: number
          total_community_comments: number
          total_community_posts: number
          total_dates: number
          total_matches: number
          total_messages: number
          total_swipes: number
          updated_at: string | null
          user_id: string
          weekly_stats: Json | null
        }
        Insert: {
          created_at?: string
          current_streak?: number
          experience_points?: number
          id?: string
          last_activity_at?: string
          level?: number
          longest_streak?: number
          points?: number
          total_blind_dates?: number
          total_community_comments?: number
          total_community_posts?: number
          total_dates?: number
          total_matches?: number
          total_messages?: number
          total_swipes?: number
          updated_at?: string | null
          user_id: string
          weekly_stats?: Json | null
        }
        Update: {
          created_at?: string
          current_streak?: number
          experience_points?: number
          id?: string
          last_activity_at?: string
          level?: number
          longest_streak?: number
          points?: number
          total_blind_dates?: number
          total_community_comments?: number
          total_community_posts?: number
          total_dates?: number
          total_matches?: number
          total_messages?: number
          total_swipes?: number
          updated_at?: string | null
          user_id?: string
          weekly_stats?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      vibe_checks: {
        Row: {
          appearance: number | null
          blind_date_id: string
          chemistry: number | null
          comments: string | null
          communication: number | null
          confidence: number | null
          consistency: number | null
          conversation: number | null
          created_at: string
          empathy: number | null
          humor: number | null
          id: string
          is_anonymous: boolean
          overall_rating: Database["public"]["Enums"]["vibe_rating"] | null
          punctuality: number | null
          reliability: number | null
          respect: number | null
          response_time: number | null
          tags: string[] | null
          user_id: string
          would_meet_again: boolean | null
        }
        Insert: {
          appearance?: number | null
          blind_date_id: string
          chemistry?: number | null
          comments?: string | null
          communication?: number | null
          confidence?: number | null
          consistency?: number | null
          conversation?: number | null
          created_at?: string
          empathy?: number | null
          humor?: number | null
          id?: string
          is_anonymous?: boolean
          overall_rating?: Database["public"]["Enums"]["vibe_rating"] | null
          punctuality?: number | null
          reliability?: number | null
          respect?: number | null
          response_time?: number | null
          tags?: string[] | null
          user_id: string
          would_meet_again?: boolean | null
        }
        Update: {
          appearance?: number | null
          blind_date_id?: string
          chemistry?: number | null
          comments?: string | null
          communication?: number | null
          confidence?: number | null
          consistency?: number | null
          conversation?: number | null
          created_at?: string
          empathy?: number | null
          humor?: number | null
          id?: string
          is_anonymous?: boolean
          overall_rating?: Database["public"]["Enums"]["vibe_rating"] | null
          punctuality?: number | null
          reliability?: number | null
          respect?: number | null
          response_time?: number | null
          tags?: string[] | null
          user_id?: string
          would_meet_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vibe_checks_blind_date_id_fkey"
            columns: ["blind_date_id"]
            isOneToOne: false
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
      blind_date_status: "pending" | "accepted" | "completed" | "feedback_submitted" | "cancelled" | "expired"
      gender_enum: "Male" | "Female" | "Other"
      meal_type: "Breakfast" | "Lunch" | "Dinner" | "Coffee & Snacks" | "Drinks"
      membership_type: "Free" | "Trial" | "Premium"
      notification_type: "new_match" | "new_message" | "new_blind_date_request" | "blind_date_accepted" | "vibe_check_match" | "community_post" | "achievement_unlocked" | "daily_challenge_completed" | "profile_boost_expired" | "subscription_expiring" | "system_announcement"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      report_type: "report" | "block"
      rsvp_status: "going" | "interested" | "none"
      subscription_plan: "monthly" | "quarterly" | "yearly"
      swipe_direction: "left" | "right"
      trip_type: "Couple" | "Stranger" | "Group"
      vibe_rating: "good" | "bad" | "neutral"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
