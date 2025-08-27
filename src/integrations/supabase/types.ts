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
            referencedRelation: "public_streamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chia_gaming_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
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
          streamer_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          streamer_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          streamer_id?: string
          token?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          id: string
          ip_address: string
          page_path: string
          user_agent: string | null
          visited_at: string | null
        }
        Insert: {
          id?: string
          ip_address: string
          page_path: string
          user_agent?: string | null
          visited_at?: string | null
        }
        Update: {
          id?: string
          ip_address?: string
          page_path?: string
          user_agent?: string | null
          visited_at?: string | null
        }
        Relationships: []
      }
      predefined_queries: {
        Row: {
          created_at: string
          description: string | null
          id: string
          query_text: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          query_text: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          query_text?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
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
      streamers: {
        Row: {
          brand_color: string | null
          brand_logo_url: string | null
          created_at: string | null
          hyperemotes_enabled: boolean | null
          hyperemotes_min_amount: number | null
          id: string
          obs_token: string | null
          password: string | null
          streamer_name: string
          streamer_slug: string
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          brand_color?: string | null
          brand_logo_url?: string | null
          created_at?: string | null
          hyperemotes_enabled?: boolean | null
          hyperemotes_min_amount?: number | null
          id?: string
          obs_token?: string | null
          password?: string | null
          streamer_name: string
          streamer_slug: string
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          brand_color?: string | null
          brand_logo_url?: string | null
          created_at?: string | null
          hyperemotes_enabled?: boolean | null
          hyperemotes_min_amount?: number | null
          id?: string
          obs_token?: string | null
          password?: string | null
          streamer_name?: string
          streamer_slug?: string
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
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
            referencedRelation: "public_streamers"
            referencedColumns: ["id"]
          },
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
          mobile_number: string
          name: string
          youtube_channel: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          mobile_number: string
          name: string
          youtube_channel?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
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
      public_streamers: {
        Row: {
          brand_color: string | null
          brand_logo_url: string | null
          created_at: string | null
          hyperemotes_enabled: boolean | null
          hyperemotes_min_amount: number | null
          id: string | null
          streamer_name: string | null
          streamer_slug: string | null
          updated_at: string | null
        }
        Insert: {
          brand_color?: string | null
          brand_logo_url?: string | null
          created_at?: string | null
          hyperemotes_enabled?: boolean | null
          hyperemotes_min_amount?: number | null
          id?: string | null
          streamer_name?: string | null
          streamer_slug?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_color?: string | null
          brand_logo_url?: string | null
          created_at?: string | null
          hyperemotes_enabled?: boolean | null
          hyperemotes_min_amount?: number | null
          id?: string | null
          streamer_name?: string | null
          streamer_slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
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
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_ip_address: string
          p_max_requests?: number
          p_window_minutes?: number
        }
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
      get_active_obs_token: {
        Args: { streamer_id: string }
        Returns: string
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
      get_streamer_moderator_count: {
        Args: { p_streamer_id: string }
        Returns: number
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
      get_visitor_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_visits: number
          unique_visitors: number
        }[]
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      update_user_profile: {
        Args: { new_username: string; user_id: string }
        Returns: undefined
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
