
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
  | "chiaa_gaming_donations";
