
import { Database } from "@/integrations/supabase/types";

export type DonationTables = Database["public"]["Tables"];

export interface DonationRecord {
  amount: number;
  payment_status: string;
}

export type StreamerTableName = 
  | "ankit_donations"
  | "harish_donations"
  | "mackle_donations" 
  | "rakazone_donations"
  | "chiaa_gaming_donations"
  | "cyber_striker_donations"
  | "mystic_realm_donations"
  | "retro_arcade_donations"
  | "space_command_donations"
  | "battle_arena_donations";

export type GamingTheme = 
  | "cyber_striker"
  | "mystic_realm"
  | "retro_arcade"
  | "space_command"
  | "battle_arena";
