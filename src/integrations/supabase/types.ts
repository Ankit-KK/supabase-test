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
      ankit_donations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          message: string | null
          name: string
          order_id: string | null
          payment_id: string | null
          payment_status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          message?: string | null
          name: string
          order_id?: string | null
          payment_id?: string | null
          payment_status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          message?: string | null
          name?: string
          order_id?: string | null
          payment_id?: string | null
          payment_status?: string | null
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
          id: string
          include_sound: boolean | null
          message: string | null
          name: string
          order_id: string | null
          payment_id: string | null
          payment_status: string | null
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
          id?: string
          include_sound?: boolean | null
          message?: string | null
          name: string
          order_id?: string | null
          payment_id?: string | null
          payment_status?: string | null
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
          id?: string
          include_sound?: boolean | null
          message?: string | null
          name?: string
          order_id?: string | null
          payment_id?: string | null
          payment_status?: string | null
          voice_file_name?: string | null
          voice_file_size?: number | null
          voice_url?: string | null
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
      streamer_contracts: {
        Row: {
          agreed_to_terms: boolean | null
          created_at: string | null
          hyperchat_cut: number
          id: string
          signature: string
          signed_at: string | null
          streamer_cut: number
          streamer_name: string
          streamer_type: string
        }
        Insert: {
          agreed_to_terms?: boolean | null
          created_at?: string | null
          hyperchat_cut?: number
          id?: string
          signature: string
          signed_at?: string | null
          streamer_cut?: number
          streamer_name: string
          streamer_type: string
        }
        Update: {
          agreed_to_terms?: boolean | null
          created_at?: string | null
          hyperchat_cut?: number
          id?: string
          signature?: string
          signed_at?: string | null
          streamer_cut?: number
          streamer_name?: string
          streamer_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
