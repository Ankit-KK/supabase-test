
import { Database } from "@/integrations/supabase/types";

export type DonationTables = Database["public"]["Tables"];

export interface DonationRecord {
  amount: number;
  payment_status: string;
}

// Updated to support chiaa_gaming donations with its own table
export type StreamerTableName = "ankit_donations" | "chiaa_gaming_donations";

// Define the common donation structure that these tables share
export interface DonationRow {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}
