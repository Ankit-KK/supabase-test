export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        }
        Relationships: []
      }
      battle_arena_donations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          include_sound: boolean
          message: string
          military_rank: string | null
          name: string
          order_id: string
          payment_status: string
          tactical_effect: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          include_sound?: boolean
          message: string
          military_rank?: string | null
          name: string
          order_id: string
          payment_status?: string
          tactical_effect?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          include_sound?: boolean
          message?: string
          military_rank?: string | null
          name?: string
          order_id?: string
          payment_status?: string
          tactical_effect?: string | null
        }
        Relationships: []
      }
      chiaa_gaming_donations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          include_sound: boolean
          message: string
          name: string
          order_id: string
          payment_status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          include_sound?: boolean
          message: string
          name: string
          order_id: string
          payment_status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          include_sound?: boolean
          message?: string
          name?: string
          order_id?: string
          payment_status?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      cyber_striker_donations: {
        Row: {
          amount: number
          created_at: string | null
          donation_tier: string | null
          id: string
          include_effects: boolean | null
          include_sound: boolean
          message: string
          name: string
          order_id: string
          payment_status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          donation_tier?: string | null
          id?: string
          include_effects?: boolean | null
          include_sound?: boolean
          message: string
          name: string
          order_id: string
          payment_status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          donation_tier?: string | null
          id?: string
          include_effects?: boolean | null
          include_sound?: boolean
          message?: string
          name?: string
          order_id?: string
          payment_status?: string
        }
        Relationships: []
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
      extracted_resumes: {
        Row: {
          created_at: string | null
          education: Json | null
          experience: Json | null
          file_path: string
          id: string
          personal_info: Json | null
          skills: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          education?: Json | null
          experience?: Json | null
          file_path: string
          id?: string
          personal_info?: Json | null
          skills?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          education?: Json | null
          experience?: Json | null
          file_path?: string
          id?: string
          personal_info?: Json | null
          skills?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      harish_donations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          include_gif: boolean | null
          message: string
          name: string
          order_id: string
          payment_status: string
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
        }
        Relationships: []
      }
      mackle_donations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          include_gif: boolean | null
          include_sound: boolean
          message: string
          name: string
          order_id: string
          payment_status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          include_gif?: boolean | null
          include_sound?: boolean
          message: string
          name: string
          order_id: string
          payment_status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          include_gif?: boolean | null
          include_sound?: boolean
          message?: string
          name?: string
          order_id?: string
          payment_status?: string
        }
        Relationships: []
      }
      mystic_realm_donations: {
        Row: {
          amount: number
          character_class: string | null
          created_at: string | null
          id: string
          include_sound: boolean
          message: string
          name: string
          order_id: string
          payment_status: string
          spell_effect: string | null
        }
        Insert: {
          amount: number
          character_class?: string | null
          created_at?: string | null
          id?: string
          include_sound?: boolean
          message: string
          name: string
          order_id: string
          payment_status?: string
          spell_effect?: string | null
        }
        Update: {
          amount?: number
          character_class?: string | null
          created_at?: string | null
          id?: string
          include_sound?: boolean
          message?: string
          name?: string
          order_id?: string
          payment_status?: string
          spell_effect?: string | null
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
      rakazone_donations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          include_sound: boolean
          message: string
          name: string
          order_id: string
          payment_status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          include_sound?: boolean
          message: string
          name: string
          order_id: string
          payment_status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          include_sound?: boolean
          message?: string
          name?: string
          order_id?: string
          payment_status?: string
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
      space_command_donations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          include_sound: boolean
          message: string
          name: string
          order_id: string
          payment_status: string
          ship_type: string | null
          warp_effect: boolean | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          include_sound?: boolean
          message: string
          name: string
          order_id: string
          payment_status?: string
          ship_type?: string | null
          warp_effect?: boolean | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          include_sound?: boolean
          message?: string
          name?: string
          order_id?: string
          payment_status?: string
          ship_type?: string | null
          warp_effect?: boolean | null
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
      check_username_exists: {
        Args:
          | { username: string }
          | { username_to_check: string; exclude_user_id: string }
        Returns: {
          username_exists: boolean
        }[]
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
      update_user_profile: {
        Args: { user_id: string; new_username: string }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
