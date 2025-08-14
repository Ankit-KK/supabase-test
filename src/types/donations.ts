import { Database } from "@/integrations/supabase/types";

export type DonationTables = Database["public"]["Tables"];

export interface DonationRecord {
  amount: number;
  payment_status: string;
}

// Common donation structure for remaining tables
export interface DonationRow {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}