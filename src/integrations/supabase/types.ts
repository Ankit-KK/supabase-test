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
      abdevil_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          selected_gif_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abdevil_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
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
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ankit_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          password_hash: string
          role: string
          streamer_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          password_hash: string
          role?: string
          streamer_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          role?: string
          streamer_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_users_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      bongflick_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          selected_gif_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bongflick_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      chiaa_gaming_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
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
      damask_plays_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          selected_gif_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "damask_plays_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      looteriya_gaming_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "looteriya_gaming_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      mriqmaster_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          selected_gif_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mriqmaster_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      neko_xenpai_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          selected_gif_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neko_xenpai_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      notyourkween_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          selected_gif_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notyourkween_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          streamer_id: string | null
          token: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          streamer_id?: string | null
          token: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          streamer_id?: string | null
          token?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obs_tokens_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
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
      sagarujjwalgaming_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          selected_gif_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sagarujjwalgaming_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      sizzors_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
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
          pusher_group: number | null
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
          pusher_group?: number | null
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
          pusher_group?: number | null
          streamer_name?: string
          streamer_slug?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      streamers_moderators: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          mod_name: string
          streamer_id: string
          telegram_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          mod_name: string
          streamer_id: string
          telegram_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          mod_name?: string
          streamer_id?: string
          telegram_user_id?: string
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
      thunderx_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          selected_gif_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thunderx_donations_streamer_id_fkey"
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
      vipbhai_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          audio_played_at: string | null
          created_at: string | null
          id: string
          is_hyperemote: boolean | null
          message: string | null
          message_visible: boolean | null
          mod_notified: boolean | null
          moderation_status: string | null
          name: string
          order_id: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          selected_gif_id: string | null
          streamer_id: string | null
          temp_voice_data: string | null
          tts_audio_url: string | null
          updated_at: string | null
          voice_message_url: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          audio_played_at?: string | null
          created_at?: string | null
          id?: string
          is_hyperemote?: boolean | null
          message?: string | null
          message_visible?: boolean | null
          mod_notified?: boolean | null
          moderation_status?: string | null
          name?: string
          order_id?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          selected_gif_id?: string | null
          streamer_id?: string | null
          temp_voice_data?: string | null
          tts_audio_url?: string | null
          updated_at?: string | null
          voice_message_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vipbhai_donations_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
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
      add_admin_email: { Args: { p_email: string }; Returns: boolean }
      add_streamer_auth_email: {
        Args: { p_email: string; p_streamer_slug: string }
        Returns: boolean
      }
      add_streamer_moderator:
        | {
            Args: {
              p_mod_name: string
              p_streamer_id: string
              p_telegram_user_id: string
              p_user_id: string
            }
            Returns: {
              created_at: string
              id: string
              is_active: boolean
              mod_name: string
              telegram_user_id: string
            }[]
          }
        | {
            Args: {
              p_mod_name: string
              p_streamer_id: string
              p_telegram_user_id: string
            }
            Returns: {
              created_at: string
              id: string
              is_active: boolean
              mod_name: string
              telegram_user_id: string
            }[]
          }
      assign_email_to_streamer: {
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
      authenticate_streamer_simple: {
        Args: { p_password: string; p_username: string }
        Returns: {
          brand_color: string
          id: string
          streamer_name: string
          streamer_slug: string
          success: boolean
        }[]
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      can_access_admin_emails: { Args: never; Returns: boolean }
      check_and_rotate_expired_tokens: { Args: never; Returns: undefined }
      check_bulk_access_rate_limit: { Args: never; Returns: boolean }
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
      check_username_exists:
        | { Args: { username: string }; Returns: boolean }
        | {
            Args: { exclude_user_id: string; username_to_check: string }
            Returns: {
              username_exists: boolean
            }[]
          }
      cleanup_expired_websocket_connections: { Args: never; Returns: undefined }
      create_visits_table: { Args: never; Returns: boolean }
      encrypt_obs_token: { Args: { token_text: string }; Returns: string }
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
      generate_obs_token: { Args: { p_streamer_id: string }; Returns: string }
      generate_session_token: { Args: never; Returns: string }
      get_active_obs_token: { Args: { streamer_id: string }; Returns: string }
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
      get_alerts_for_obs_token: {
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
      get_ankit_donations: {
        Args: { p_streamer_id: string }
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
          voice_duration_seconds: number
          voice_message_url: string
        }[]
      }
      get_ankit_moderation_donations: {
        Args: { p_streamer_id: string }
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
          voice_duration_seconds: number
          voice_message_url: string
        }[]
      }
      get_moderator_by_telegram_id: {
        Args: { p_telegram_user_id: string }
        Returns: {
          is_active: boolean
          mod_name: string
          streamer_id: string
          streamer_slug: string
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
      get_safe_streamer_columns: { Args: never; Returns: string[] }
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
      get_streamer_by_email: {
        Args: { user_email: string }
        Returns: {
          is_admin: boolean
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
          streamer_name: string
          streamer_slug: string
        }[]
      }
      get_streamer_donations: {
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
        Args: { p_streamer_id: string }
        Returns: {
          amount: number
          approved_at: string
          approved_by: string
          created_at: string
          id: string
          is_hyperemote: boolean
          message: string
          moderation_status: string
          name: string
          payment_status: string
          rejected_reason: string
          tts_audio_url: string
          voice_message_url: string
        }[]
      }
      get_streamer_moderator_count: {
        Args: { p_streamer_id: string }
        Returns: number
      }
      get_streamer_obs_tokens: {
        Args: { p_streamer_id: string; p_user_id: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          last_used_at: string
          token: string
        }[]
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
      get_user_streamers: {
        Args: { p_user_id: string }
        Returns: {
          brand_color: string
          id: string
          is_admin: boolean
          is_owner: boolean
          streamer_name: string
          streamer_slug: string
        }[]
      }
      get_visitor_stats: {
        Args: never
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
      hash_obs_token: { Args: { token_text: string }; Returns: string }
      hash_password: { Args: { password: string }; Returns: string }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin_email: { Args: { check_email: string }; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
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
      log_sensitive_access:
        | {
            Args: { action: string; record_id?: string; table_name: string }
            Returns: undefined
          }
        | {
            Args: {
              access_reason: string
              access_type: string
              record_id?: string
              table_name: string
            }
            Returns: undefined
          }
      mask_email: { Args: { email: string }; Returns: string }
      mask_mobile: { Args: { mobile: string }; Returns: string }
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
      remove_email_from_streamer: {
        Args: { p_email: string; p_streamer_slug: string }
        Returns: boolean
      }
      remove_streamer_auth_email: {
        Args: { p_email: string; p_streamer_slug: string }
        Returns: boolean
      }
      remove_streamer_moderator:
        | {
            Args: { p_moderator_id: string; p_streamer_id: string }
            Returns: boolean
          }
        | {
            Args: {
              p_moderator_id: string
              p_streamer_id: string
              p_user_id: string
            }
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
      text_to_bytea: { Args: { data: string }; Returns: string }
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
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      validate_donation_amount: { Args: { amount: number }; Returns: boolean }
      validate_donation_input: {
        Args: { p_amount: number; p_message?: string; p_name: string }
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
      validate_session_token: {
        Args: { token: string }
        Returns: {
          email: string
          role: string
          user_id: string
          username: string
        }[]
      }
      validate_streamer_credentials: {
        Args: { p_email: string; p_password: string }
        Returns: {
          brand_color: string
          id: string
          is_valid: boolean
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
      verify_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
      verify_password_simple: {
        Args: { input_password: string; stored_email: string }
        Returns: {
          email: string
          is_valid: boolean
          password_hash: string
          role: string
          user_id: string
          username: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
