
import { Database } from "@/integrations/supabase/types";

export type DonationTables = Database["public"]["Tables"];

export interface DonationRecord {
  amount: number;
  payment_status: string;
}

// Only include tables that actually exist in the database
export type StreamerTableName = 
  | "ankit_donations"
  | "mackle_donations";

// Define the common donation structure that these tables share
export interface DonationRow {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}
