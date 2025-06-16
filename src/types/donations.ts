
import { Database } from "@/integrations/supabase/types";

export type DonationTables = Database["public"]["Tables"];

export interface DonationRecord {
  amount: number;
  payment_status: string;
}

// Updated to include only existing donation tables
export type StreamerTableName = 
  | "ankit_donations"
  | "chiaa_gaming_donations";

// Define the common donation structure that these tables share
export interface DonationRow {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
  include_sound?: boolean; // This column exists in chiaa_gaming_donations
  gif_url?: string; // Optional for chiaa_gaming
  voice_url?: string; // Optional for chiaa_gaming
  voice_file_name?: string; // Optional for chiaa_gaming
  voice_file_size?: number; // Optional for chiaa_gaming
  custom_sound_id?: string; // Custom sound alert ID
  custom_sound_name?: string; // Custom sound alert name
  custom_sound_url?: string; // Custom sound alert URL
}

// Type for GIF and Voice tracking
export interface DonationGif {
  id: string;
  donation_id: string;
  gif_url: string;
  file_name: string;
  file_size: number;
  file_type: 'gif' | 'voice';
  uploaded_at: string;
  displayed_at?: string;
  deleted_at?: string;
  status: 'uploaded' | 'displayed' | 'deleted';
}

// Type for Custom Sound Alerts
export interface CustomSoundAlert {
  id: string;
  name: string;
  file_url: string;
  file_path?: string;
  created_at: string;
}
