export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          admin_pass: number
          admin_type: string
          created_at: string | null
          id: string
          is_online: boolean | null
          last_active: string | null
          password_hash: string
          user_email: string
        }
        Insert: {
          admin_pass?: number
          admin_type: string
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          last_active?: string | null
          password_hash?: string
          user_email: string
        }
        Update: {
          admin_pass?: number
          admin_type?: string
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          last_active?: string | null
          password_hash?: string
          user_email?: string
        }
        Relationships: []
      }
      ankit_donations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          include_gif: boolean | null
          message: string
          name: string
          order_id: string
          payment_status: string
          selected_emoji: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          include_gif?: boolean | null
          message: string
          name: string
          order_id: string
          payment_status?: string
          selected_emoji?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          include_gif?: boolean | null
          message?: string
          name?: string
          order_id?: string
          payment_status?: string
          selected_emoji?: string | null
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
      chiaa_gaming_donations: {
        Row: {
          amount: number
          created_at: string | null
          custom_sound_name: string | null
          custom_sound_url: string | null
          gif_url: string | null
          hyperemotes_enabled: boolean | null
          id: string
          include_sound: boolean | null
          message: string
          name: string
          order_id: string
          payment_status: string
          voice_file_name: string | null
          voice_file_size: number | null
          voice_url: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          custom_sound_name?: string | null
          custom_sound_url?: string | null
          gif_url?: string | null
          hyperemotes_enabled?: boolean | null
          id?: string
          include_sound?: boolean | null
          message?: string
          name: string
          order_id: string
          payment_status?: string
          voice_file_name?: string | null
          voice_file_size?: number | null
          voice_url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          custom_sound_name?: string | null
          custom_sound_url?: string | null
          gif_url?: string | null
          hyperemotes_enabled?: boolean | null
          id?: string
          include_sound?: boolean | null
          message?: string
          name?: string
          order_id?: string
          payment_status?: string
          voice_file_name?: string | null
          voice_file_size?: number | null
          voice_url?: string | null
        }
        Relationships: []
      }
      custom_sound_alerts: {
        Row: {
          created_at: string | null
          file_path: string | null
          file_url: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          file_url: string
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          file_url?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      donation_gifs: {
        Row: {
          deleted_at: string | null
          displayed_at: string | null
          donation_id: string | null
          file_name: string
          file_size: number
          file_type: string | null
          gif_url: string
          id: string
          last_played_at: string | null
          status: string | null
          uploaded_at: string | null
        }
        Insert: {
          deleted_at?: string | null
          displayed_at?: string | null
          donation_id?: string | null
          file_name: string
          file_size: number
          file_type?: string | null
          gif_url: string
          id?: string
          last_played_at?: string | null
          status?: string | null
          uploaded_at?: string | null
        }
        Update: {
          deleted_at?: string | null
          displayed_at?: string | null
          donation_id?: string | null
          file_name?: string
          file_size?: number
          file_type?: string | null
          gif_url?: string
          id?: string
          last_played_at?: string | null
          status?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_gifs_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "chiaa_gaming_donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          message: string
          name: string
          order_id: string | null
          payment_status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          message: string
          name: string
          order_id?: string | null
          payment_status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          message?: string
          name?: string
          order_id?: string | null
          payment_status?: string | null
        }
        Relationships: []
      }
      obs_access_tokens: {
        Row: {
          admin_type: string
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          token: string
        }
        Insert: {
          admin_type: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          token: string
        }
        Update: {
          admin_type?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
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
      streamer_contracts: {
        Row: {
          agreed_to_terms: boolean
          hyperchat_cut: number | null
          id: string
          signature: string
          signed_at: string | null
          streamer_cut: number | null
          streamer_name: string
          streamer_type: string
        }
        Insert: {
          agreed_to_terms?: boolean
          hyperchat_cut?: number | null
          id?: string
          signature: string
          signed_at?: string | null
          streamer_cut?: number | null
          streamer_name: string
          streamer_type: string
        }
        Update: {
          agreed_to_terms?: boolean
          hyperchat_cut?: number | null
          id?: string
          signature?: string
          signed_at?: string | null
          streamer_cut?: number | null
          streamer_name?: string
          streamer_type?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      can_access_chiaa_gaming_data: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_streamer_data: {
        Args: { streamer_type: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_ip_address: string
          p_endpoint: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_username_exists: {
        Args:
          | { username: string }
          | { username_to_check: string; exclude_user_id: string }
        Returns: boolean
      }
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_obs_token: {
        Args: { p_admin_type: string }
        Returns: string
      }
      create_visits_table: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_page_visitor_stats: {
        Args: { page: string }
        Returns: {
          total_visits: number
          unique_visitors: number
        }[]
      }
      get_user_admin_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          id: string
          username: string
          created_at: string
          updated_at: string
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
          p_table_name?: string
          p_record_id?: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          event_type: string
          event_details?: string
          ip_address?: string
        }
        Returns: undefined
      }
      sanitize_text_input: {
        Args: { input_text: string }
        Returns: string
      }
      update_user_profile: {
        Args: { user_id: string; new_username: string }
        Returns: undefined
      }
      validate_donation_input: {
        Args: { p_name: string; p_message: string; p_amount: number }
        Returns: boolean
      }
      validate_obs_token: {
        Args: { p_token: string; p_admin_type: string }
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
