export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      ankit_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          auto_verified: boolean | null
          cashfree_order_id: string | null
          created_at: string
          emotion_tags: string[] | null
          emotion_tier: string | null
          id: string
          is_hyperemote: boolean | null
          last_verification_attempt: string | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          processing_status: string | null
          rejected_reason: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          tts_segments: Json | null
          updated_at: string
          voice_duration_seconds: number | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          auto_verified?: boolean | null
          cashfree_order_id?: string | null
          created_at?: string
          emotion_tags?: string[] | null
          emotion_tier?: string | null
          id?: string
          is_hyperemote?: boolean | null
          last_verification_attempt?: string | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          processing_status?: string | null
          rejected_reason?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          tts_segments?: Json | null
          updated_at?: string
          voice_duration_seconds?: number | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          auto_verified?: boolean | null
          cashfree_order_id?: string | null
          created_at?: string
          emotion_tags?: string[] | null
          emotion_tier?: string | null
          id?: string
          is_hyperemote?: boolean | null
          last_verification_attempt?: string | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          processing_status?: string | null
          rejected_reason?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          tts_segments?: Json | null
          updated_at?: string
          voice_duration_seconds?: number | null
          voice_message_url?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      chia_gaming_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          auto_verified: boolean | null
          cashfree_order_id: string | null
          created_at: string
          id: string
          is_hyperemote: boolean | null
          last_verification_attempt: string | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          rejected_reason: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          updated_at: string
          voice_duration_seconds: number | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          auto_verified?: boolean | null
          cashfree_order_id?: string | null
          created_at?: string
          id?: string
          is_hyperemote?: boolean | null
          last_verification_attempt?: string | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          rejected_reason?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          updated_at?: string
          voice_duration_seconds?: number | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          auto_verified?: boolean | null
          cashfree_order_id?: string | null
          created_at?: string
          id?: string
          is_hyperemote?: boolean | null
          last_verification_attempt?: string | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          rejected_reason?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          updated_at?: string
          voice_duration_seconds?: number | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chia_gaming_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      demostreamer_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          auto_verified: boolean | null
          cashfree_order_id: string | null
          created_at: string
          emotion_tags: string[] | null
          emotion_tier: string | null
          id: string
          is_hyperemote: boolean | null
          last_verification_attempt: string | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          processing_status: string | null
          rejected_reason: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          tts_segments: Json | null
          updated_at: string
          voice_duration_seconds: number | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          auto_verified?: boolean | null
          cashfree_order_id?: string | null
          created_at?: string
          emotion_tags?: string[] | null
          emotion_tier?: string | null
          id?: string
          is_hyperemote?: boolean | null
          last_verification_attempt?: string | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          processing_status?: string | null
          rejected_reason?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          tts_segments?: Json | null
          updated_at?: string
          voice_duration_seconds?: number | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          auto_verified?: boolean | null
          cashfree_order_id?: string | null
          created_at?: string
          emotion_tags?: string[] | null
          emotion_tier?: string | null
          id?: string
          is_hyperemote?: boolean | null
          last_verification_attempt?: string | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          processing_status?: string | null
          rejected_reason?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          tts_segments?: Json | null
          updated_at?: string
          voice_duration_seconds?: number | null
          voice_message_url?: string | null
        }
        Relationships: []
      }
      obs_token_audit: {
        Row: {
          access_ip: unknown | null
          access_timestamp: string | null
          access_type: string | null
          id: string
          streamer_id: string | null
          success: boolean | null
          token_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_ip?: unknown | null
          access_timestamp?: string | null
          access_type?: string | null
          id?: string
          streamer_id?: string | null
          success?: boolean | null
          token_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_ip?: unknown | null
          access_timestamp?: string | null
          access_type?: string | null
          id?: string
          streamer_id?: string | null
          success?: boolean | null
          token_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obs_token_audit_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obs_token_audit_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "obs_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          rotation_due_at: string | null
          streamer_id: string
          token: string
          token_encrypted: string | null
          token_hash: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          rotation_due_at?: string | null
          streamer_id: string
          token: string
          token_encrypted?: string | null
          token_hash?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          rotation_due_at?: string | null
          streamer_id?: string
          token?: string
          token_encrypted?: string | null
          token_hash?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sensitive_data_access_log: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          record_id: string | null
          session_info: Json | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          session_info?: Json | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          session_info?: Json | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      streamers: {
        Row: {
          brand_color: string | null
          brand_logo_url: string | null
          created_at: string | null
          hyperemotes_enabled: boolean | null
          hyperemotes_min_amount: number | null
          id: string
          last_login_at: string | null
          last_login_email: string | null
          last_login_provider: string | null
          obs_token: string | null
          streamer_name: string
          streamer_slug: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand_color?: string | null
          brand_logo_url?: string | null
          created_at?: string | null
          hyperemotes_enabled?: boolean | null
          hyperemotes_min_amount?: number | null
          id?: string
          last_login_at?: string | null
          last_login_email?: string | null
          last_login_provider?: string | null
          obs_token?: string | null
          streamer_name: string
          streamer_slug: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand_color?: string | null
          brand_logo_url?: string | null
          created_at?: string | null
          hyperemotes_enabled?: boolean | null
          hyperemotes_min_amount?: number | null
          id?: string
          last_login_at?: string | null
          last_login_email?: string | null
          last_login_provider?: string | null
          obs_token?: string | null
          streamer_name?: string
          streamer_slug?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      streamers_auth_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          streamer_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          streamer_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          streamer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streamers_auth_emails_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      streamers_moderators: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          mod_name: string
          streamer_id: string | null
          telegram_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mod_name: string
          streamer_id?: string | null
          telegram_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mod_name?: string
          streamer_id?: string | null
          telegram_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streamers_moderators_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_queries: {
        Row: {
          created_at: string
          id: string
          query_text: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query_text: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query_text?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          instagram_handle: string | null
          mobile_number: string
          name: string
          youtube_channel: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          instagram_handle?: string | null
          mobile_number: string
          name: string
          youtube_channel?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          instagram_handle?: string | null
          mobile_number?: string
          name?: string
          youtube_channel?: string | null
        }
        Relationships: []
      }
      visits: {
        Row: {
          id: string
          ip_address: string
          visited_at: string | null
        }
        Insert: {
          id?: string
          ip_address: string
          visited_at?: string | null
        }
        Update: {
          id?: string
          ip_address?: string
          visited_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_signups_masked: {
        Row: {
          created_at: string | null
          email_masked: string | null
          id: string | null
          instagram_handle: string | null
          mobile_masked: string | null
          name: string | null
          youtube_channel: string | null
        }
        Insert: {
          created_at?: string | null
          email_masked?: never
          id?: string | null
          instagram_handle?: string | null
          mobile_masked?: never
          name?: string | null
          youtube_channel?: string | null
        }
        Update: {
          created_at?: string | null
          email_masked?: never
          id?: string | null
          instagram_handle?: string | null
          mobile_masked?: never
          name?: string | null
          youtube_channel?: string | null
        }
        Relationships: []
      }
      user_signups_secure: {
        Row: {
          created_at: string | null
          data_access_note: string | null
          email_masked: string | null
          id: string | null
          instagram_handle: string | null
          is_masked_data: boolean | null
          mobile_masked: string | null
          name: string | null
          youtube_channel: string | null
        }
        Insert: {
          created_at?: string | null
          data_access_note?: never
          email_masked?: never
          id?: string | null
          instagram_handle?: string | null
          is_masked_data?: never
          mobile_masked?: never
          name?: string | null
          youtube_channel?: string | null
        }
        Update: {
          created_at?: string | null
          data_access_note?: never
          email_masked?: never
          id?: string | null
          instagram_handle?: string | null
          is_masked_data?: never
          mobile_masked?: never
          name?: string | null
          youtube_channel?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_admin_email: {
        Args: { new_admin_email: string }
        Returns: undefined
      }
      add_streamer_auth_email: {
        Args: { p_email: string; p_streamer_slug: string }
        Returns: boolean
      }
      authenticate_streamer: {
        Args: { p_password: string; p_username: string }
        Returns: {
          brand_color: string
          id: string
          streamer_name: string
          streamer_slug: string
          success: boolean
        }[]
      }
      can_access_admin_emails: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_and_rotate_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_bulk_access_rate_limit: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_ip_address: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_server_rate_limit: {
        Args: {
          p_endpoint: string
          p_ip_address: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_streamer_email_allowed: {
        Args: { p_email: string; p_streamer_slug: string }
        Returns: boolean
      }
      check_username_exists: {
        Args:
          | { exclude_user_id: string; username_to_check: string }
          | { username: string }
        Returns: boolean
      }
      create_visits_table: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      encrypt_obs_token: {
        Args: { token_text: string }
        Returns: string
      }
      export_user_signups_for_compliance: {
        Args: { export_reason: string; requested_by?: string }
        Returns: {
          created_at: string
          email_partial: string
          export_id: string
          export_timestamp: string
          instagram_handle: string
          mobile_partial: string
          name: string
          youtube_channel: string
        }[]
      }
      get_active_obs_token: {
        Args: { streamer_id: string }
        Returns: string
      }
      get_admin_streamers: {
        Args: { admin_email: string }
        Returns: {
          brand_color: string
          id: string
          streamer_name: string
          streamer_slug: string
        }[]
      }
      get_alerts_donations: {
        Args: { p_obs_token: string; p_table_name?: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          is_hyperemote: boolean
          message: string
          message_visible: boolean
          moderation_status: string
          name: string
          payment_status: string
          streamer_id: string
          voice_message_url: string
        }[]
      }
      get_ankit_donations_for_streamer: {
        Args: { p_streamer_id: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          is_hyperemote: boolean
          message: string
          message_visible: boolean
          moderation_status: string
          name: string
          payment_status: string
          voice_message_url: string
        }[]
      }
      get_chia_donations_for_streamer: {
        Args: { p_streamer_id: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          is_hyperemote: boolean
          message: string
          message_visible: boolean
          moderation_status: string
          name: string
          payment_status: string
          voice_message_url: string
        }[]
      }
      get_demo_donations_for_streamer: {
        Args: { p_streamer_id: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          is_hyperemote: boolean
          message: string
          message_visible: boolean
          moderation_status: string
          name: string
          payment_status: string
          voice_message_url: string
        }[]
      }
      get_my_moderators: {
        Args: { p_streamer_id: string }
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          mod_name: string
          telegram_user_id: string
        }[]
      }
      get_page_visitor_stats: {
        Args: { page: string }
        Returns: {
          total_visits: number
          unique_visitors: number
        }[]
      }
      get_public_streamer_basic_info: {
        Args: { p_streamer_slug: string }
        Returns: {
          brand_color: string
          id: string
          streamer_name: string
        }[]
      }
      get_public_streamer_data: {
        Args: { p_streamer_slug: string }
        Returns: {
          brand_color: string
          brand_logo_url: string
          hyperemotes_enabled: boolean
          hyperemotes_min_amount: number
          id: string
          streamer_name: string
          streamer_slug: string
        }[]
      }
      get_public_streamer_info: {
        Args: { slug: string }
        Returns: {
          brand_color: string
          brand_logo_url: string
          id: string
          streamer_name: string
          streamer_slug: string
        }[]
      }
      get_recent_donations_public: {
        Args: { p_limit?: number; p_streamer_slug: string }
        Returns: {
          amount: number
          created_at: string
          donor_name: string
          sanitized_message: string
        }[]
      }
      get_safe_streamer_columns: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_sensitive_data_access_stats: {
        Args: { days_back?: number }
        Returns: {
          access_date: string
          bulk_operations: number
          total_accesses: number
          unauthorized_attempts: number
          unique_admins: number
        }[]
      }
      get_signup_secure: {
        Args: { access_reason: string; signup_id: string }
        Returns: {
          created_at: string
          email: string
          id: string
          instagram_handle: string
          mobile_number: string
          name: string
          youtube_channel: string
        }[]
      }
      get_streamer_by_obs_token: {
        Args: { token: string }
        Returns: {
          brand_color: string
          brand_logo_url: string
          id: string
          obs_token: string
          streamer_name: string
          streamer_slug: string
          user_id: string
        }[]
      }
      get_streamer_by_obs_token_v2: {
        Args: { token: string }
        Returns: {
          brand_color: string
          brand_logo_url: string
          id: string
          obs_token: string
          streamer_name: string
          streamer_slug: string
          user_id: string
        }[]
      }
      get_streamer_by_slug: {
        Args: { slug: string }
        Returns: {
          brand_color: string
          brand_logo_url: string
          id: string
          obs_token: string
          streamer_name: string
          streamer_slug: string
          user_id: string
        }[]
      }
      get_streamer_donations: {
        Args:
          | { p_streamer_id: string }
          | { p_streamer_id: string; p_table_name: string }
        Returns: {
          amount: number
          approved_at: string
          approved_by: string
          created_at: string
          id: string
          is_hyperemote: boolean
          message: string
          message_visible: boolean
          moderation_status: string
          name: string
          payment_status: string
          rejected_reason: string
          streamer_id: string
          voice_message_url: string
        }[]
      }
      get_streamer_for_donation: {
        Args: { p_streamer_slug: string }
        Returns: {
          brand_color: string
          brand_logo_url: string
          hyperemotes_enabled: boolean
          hyperemotes_min_amount: number
          id: string
          streamer_name: string
          streamer_slug: string
        }[]
      }
      get_streamer_moderation_donations: {
        Args:
          | { p_streamer_id: string }
          | { p_streamer_id: string; p_table_name: string }
        Returns: {
          amount: number
          approved_at: string
          approved_by: string
          created_at: string
          id: string
          is_hyperemote: boolean
          message: string
          message_visible: boolean
          moderation_status: string
          name: string
          payment_status: string
          rejected_reason: string
          streamer_id: string
          voice_message_url: string
        }[]
      }
      get_streamer_moderator_count: {
        Args: { p_streamer_id: string }
        Returns: number
      }
      get_streamer_public_settings: {
        Args: { slug: string }
        Returns: {
          hyperemotes_enabled: boolean
          hyperemotes_min_amount: number
          id: string
        }[]
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          created_at: string
          id: string
          updated_at: string
          username: string
        }[]
      }
      get_user_signup_full: {
        Args: { access_reason: string; signup_id: string }
        Returns: {
          access_logged_at: string
          created_at: string
          email: string
          id: string
          instagram_handle: string
          mobile_number: string
          name: string
          youtube_channel: string
        }[]
      }
      get_user_signup_with_reason: {
        Args: { access_reason: string; signup_id: string }
        Returns: {
          created_at: string
          email: string
          id: string
          instagram_handle: string
          mobile_number: string
          name: string
          youtube_channel: string
        }[]
      }
      get_user_signups_secure: {
        Args: { access_reason?: string }
        Returns: {
          accessed_at: string
          accessed_by: string
          created_at: string
          email: string
          email_masked: string
          id: string
          instagram_handle: string
          mobile_masked: string
          mobile_number: string
          name: string
          youtube_channel: string
        }[]
      }
      get_visitor_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_visits: number
          unique_visitors: number
        }[]
      }
      get_voice_donations: {
        Args: { p_obs_token: string; p_table_name?: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          is_hyperemote: boolean
          message: string
          message_visible: boolean
          moderation_status: string
          name: string
          payment_status: string
          streamer_id: string
          voice_message_url: string
        }[]
      }
      hash_obs_token: {
        Args: { token_text: string }
        Returns: string
      }
      is_admin_email: {
        Args: { check_email: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_valid_streamer_operation: {
        Args: { streamer_id: string }
        Returns: boolean
      }
      link_streamer_to_current_user: {
        Args: { p_streamer_slug: string }
        Returns: {
          linked: boolean
          streamer_id: string
        }[]
      }
      log_access_attempt: {
        Args: {
          p_action: string
          p_ip_address?: string
          p_record_id?: string
          p_table_name?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          event_details?: string
          event_type: string
          ip_address?: string
        }
        Returns: undefined
      }
      log_security_violation: {
        Args: { details?: string; user_email?: string; violation_type: string }
        Returns: undefined
      }
      log_sensitive_access: {
        Args:
          | {
              access_reason: string
              access_type: string
              record_id?: string
              table_name: string
            }
          | { action: string; record_id?: string; table_name: string }
        Returns: undefined
      }
      mask_email: {
        Args: { email: string }
        Returns: string
      }
      mask_mobile: {
        Args: { mobile: string }
        Returns: string
      }
      record_streamer_login: {
        Args: { p_email: string; p_provider: string; p_streamer_slug: string }
        Returns: undefined
      }
      regenerate_obs_token: {
        Args: {
          p_expires_at?: string
          p_new_token: string
          p_streamer_id: string
        }
        Returns: {
          token: string
        }[]
      }
      remove_admin_email: {
        Args: { remove_email: string }
        Returns: undefined
      }
      remove_streamer_auth_email: {
        Args: { p_email: string; p_streamer_slug: string }
        Returns: boolean
      }
      safe_export_user_signups: {
        Args: { export_reason: string }
        Returns: {
          created_at: string
          email_masked: string
          export_id: string
          export_metadata: Json
          instagram_handle: string
          mobile_masked: string
          name: string
          youtube_channel: string
        }[]
      }
      update_donation_visibility: {
        Args: {
          p_donation_id: string
          p_new_visibility: boolean
          p_streamer_id: string
          p_table_name?: string
        }
        Returns: undefined
      }
      update_streamer_auth_email: {
        Args: {
          p_new_email: string
          p_old_email: string
          p_streamer_slug: string
        }
        Returns: boolean
      }
      update_user_profile: {
        Args: { new_username: string; user_id: string }
        Returns: undefined
      }
      validate_donation_amount: {
        Args: { amount: number }
        Returns: boolean
      }
      validate_donation_insert: {
        Args: {
          p_amount: number
          p_message?: string
          p_name: string
          p_streamer_id?: string
        }
        Returns: boolean
      }
      validate_donation_security: {
        Args: { p_amount: number; p_message?: string; p_name: string }
        Returns: boolean
      }
      validate_obs_token: {
        Args: { token_to_check: string }
        Returns: {
          brand_color: string
          brand_logo_url: string
          is_valid: boolean
          streamer_id: string
          streamer_name: string
          streamer_slug: string
        }[]
      }
      validate_obs_token_secure: {
        Args: { token_to_check: string }
        Returns: {
          brand_color: string
          brand_logo_url: string
          is_valid: boolean
          streamer_id: string
          streamer_name: string
          streamer_slug: string
        }[]
      }
      validate_obs_token_secure_with_audit: {
        Args: {
          client_ip?: string
          client_user_agent?: string
          token_to_check: string
        }
        Returns: {
          brand_color: string
          brand_logo_url: string
          is_valid: boolean
          streamer_id: string
          streamer_name: string
          streamer_slug: string
        }[]
      }
      validate_streamer_ownership: {
        Args: { p_streamer_id: string }
        Returns: boolean
      }
      verify_admin_access_secure: {
        Args: { access_reason?: string }
        Returns: boolean
      }
      verify_admin_access_with_audit: {
        Args: { access_reason?: string; table_name?: string }
        Returns: boolean
      }
      verify_admin_with_audit: {
        Args: { access_reason?: string }
        Returns: boolean
      }
      verify_moderator_access: {
        Args: { p_streamer_slug: string; p_telegram_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
