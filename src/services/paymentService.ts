
import { supabase } from "@/integrations/supabase/client";

type DonationRecord = {
  name: string;
  amount: number;
  message: string;
  order_id: string;
  payment_status: string;
  donationType: "ankit" | "harish" | "mackle" | "rakazone" | "chiaa_gaming" | "cyber_striker" | "mystic_realm" | "retro_arcade" | "space_command" | "battle_arena";
  include_sound?: boolean;
  // Gaming-specific fields
  include_effects?: boolean;
  donation_tier?: string;
  character_class?: string;
  spell_effect?: string;
  powerup_type?: string;
  pixel_animation?: string;
  ship_type?: string;
  warp_effect?: boolean;
  military_rank?: string;
  tactical_effect?: string;
};

/**
 * Creates a payment order via Supabase Edge Function
 */
export const createPaymentOrder = async (orderId: string, amount: number, name: string, donationType: string = "ankit") => {
  try {
    const { data, error } = await supabase.functions.invoke("create-payment-order", {
      body: { orderId, amount, name, donationType },
    });

    if (error) {
      console.error("Error creating payment order:", error);
      throw new Error(error.message || "Failed to create payment order");
    }

    return data;
  } catch (error) {
    console.error("Error in createPaymentOrder:", error);
    throw error;
  }
};

/**
 * Verifies payment status via Supabase Edge Function
 */
export const verifyPayment = async (orderId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("verify-payment", {
      body: { orderId },
    });

    if (error) {
      console.error("Error verifying payment:", error);
      throw new Error(error.message || "Failed to verify payment");
    }

    return data;
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    throw error;
  }
};

/**
 * Creates a donation record in Supabase
 * Only called after payment verification
 */
export const createDonationRecord = async (donation: DonationRecord) => {
  try {
    let tableName;
    
    // Map donation types to table names
    const tableMapping: Record<string, string> = {
      "harish": "harish_donations",
      "mackle": "mackle_donations",
      "rakazone": "rakazone_donations",
      "chiaa_gaming": "chiaa_gaming_donations",
      "cyber_striker": "cyber_striker_donations",
      "mystic_realm": "mystic_realm_donations",
      "retro_arcade": "retro_arcade_donations",
      "space_command": "space_command_donations",
      "battle_arena": "battle_arena_donations",
    };
    
    tableName = tableMapping[donation.donationType] || "ankit_donations";
    
    const recordData: any = {
      name: donation.name,
      amount: donation.amount,
      message: donation.message,
      order_id: donation.order_id,
      payment_status: donation.payment_status
    };
    
    // Add sound support for specific types
    if (["mackle", "rakazone", "chiaa_gaming", "cyber_striker", "mystic_realm", "retro_arcade", "space_command", "battle_arena"].includes(donation.donationType) && donation.include_sound !== undefined) {
      recordData.include_sound = donation.include_sound;
    }
    
    // Add gaming-specific fields based on donation type
    if (donation.donationType === "cyber_striker") {
      if (donation.include_effects !== undefined) recordData.include_effects = donation.include_effects;
      if (donation.donation_tier !== undefined) recordData.donation_tier = donation.donation_tier;
    } else if (donation.donationType === "mystic_realm") {
      if (donation.character_class !== undefined) recordData.character_class = donation.character_class;
      if (donation.spell_effect !== undefined) recordData.spell_effect = donation.spell_effect;
    } else if (donation.donationType === "retro_arcade") {
      if (donation.powerup_type !== undefined) recordData.powerup_type = donation.powerup_type;
      if (donation.pixel_animation !== undefined) recordData.pixel_animation = donation.pixel_animation;
    } else if (donation.donationType === "space_command") {
      if (donation.ship_type !== undefined) recordData.ship_type = donation.ship_type;
      if (donation.warp_effect !== undefined) recordData.warp_effect = donation.warp_effect;
    } else if (donation.donationType === "battle_arena") {
      if (donation.military_rank !== undefined) recordData.military_rank = donation.military_rank;
      if (donation.tactical_effect !== undefined) recordData.tactical_effect = donation.tactical_effect;
    }
    
    console.log(`Creating ${tableName} record with data:`, recordData);
    
    const { error } = await supabase
      .from(tableName)
      .insert(recordData);

    if (error) {
      console.error(`Error creating donation record in ${tableName}:`, error);
      throw new Error(error.message || `Failed to create donation record in ${tableName}`);
    }

    // Clean up session storage after successful record creation
    if (donation.payment_status !== "pending") {
      sessionStorage.removeItem("donationData");
    }

    return true;
  } catch (error) {
    console.error("Error in createDonationRecord:", error);
    throw error;
  }
};
