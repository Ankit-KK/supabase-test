
import { supabase } from "@/integrations/supabase/client";

export interface StreamerStatus {
  isOnline: boolean;
  lastActive: string;
}

// Check if a streamer is online
export const checkStreamerStatus = async (streamerType: "ankit" | "harish"): Promise<StreamerStatus> => {
  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("is_online, last_active")
      .eq("admin_type", streamerType)
      .single();

    if (error) {
      console.error("Error checking streamer status:", error);
      return { isOnline: false, lastActive: new Date().toISOString() };
    }

    return { 
      isOnline: !!data?.is_online, 
      lastActive: data?.last_active || new Date().toISOString() 
    };
  } catch (error) {
    console.error("Error in checkStreamerStatus:", error);
    return { isOnline: false, lastActive: new Date().toISOString() };
  }
};

// Update the streamer's online status
export const updateStreamerStatus = async (
  streamerType: "ankit" | "harish",
  isOnline: boolean
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("admin_users")
      .update({
        is_online: isOnline,
        last_active: new Date().toISOString(),
      })
      .eq("admin_type", streamerType);

    if (error) {
      console.error("Error updating streamer status:", error);
    } else {
      // Update local storage to sync across tabs
      sessionStorage.setItem(`${streamerType}Auth`, isOnline ? "true" : "");
      
      // Dispatch a custom event for cross-tab communication
      const event = new CustomEvent("streamerStatusChange", {
        detail: { streamer: streamerType, isOnline }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error("Error in updateStreamerStatus:", error);
  }
};

// Verify streamer credentials
export const verifyStreamerCredentials = async (
  username: string,
  password: string
): Promise<{ isValid: boolean; streamerType: "ankit" | "harish" | null }> => {
  try {
    // Find the admin user with matching username
    const { data, error } = await supabase
      .from("admin_users")
      .select("admin_type, password_hash")
      .or(`admin_type.eq.${username},user_email.eq.${username}`);

    if (error || !data || data.length === 0) {
      console.error("Error or no user found:", error);
      return { isValid: false, streamerType: null };
    }

    const user = data[0];
    
    // Compare the password (in a real app, we'd use a proper password hashing library)
    if (user.password_hash === password) {
      return { isValid: true, streamerType: user.admin_type as "ankit" | "harish" };
    }

    return { isValid: false, streamerType: null };
  } catch (error) {
    console.error("Error in verifyStreamerCredentials:", error);
    return { isValid: false, streamerType: null };
  }
};

// Login as streamer
export const loginStreamer = async (
  username: string,
  password: string
): Promise<{ success: boolean; streamerType: "ankit" | "harish" | null; message: string }> => {
  try {
    const { isValid, streamerType } = await verifyStreamerCredentials(username, password);

    if (isValid && streamerType) {
      // Update the streamer's status to online
      await updateStreamerStatus(streamerType, true);
      
      // Store auth state in session storage
      sessionStorage.setItem(`${streamerType}Auth`, "true");
      
      return { 
        success: true, 
        streamerType, 
        message: `Welcome to the ${streamerType.charAt(0).toUpperCase() + streamerType.slice(1)} Dashboard!` 
      };
    }

    return { 
      success: false, 
      streamerType: null, 
      message: "Invalid username or password" 
    };
  } catch (error) {
    console.error("Error in loginStreamer:", error);
    return { 
      success: false, 
      streamerType: null, 
      message: "An error occurred during login" 
    };
  }
};

// Logout streamer
export const logoutStreamer = async (
  streamerType: "ankit" | "harish"
): Promise<void> => {
  try {
    // Update the streamer's status to offline
    await updateStreamerStatus(streamerType, false);
    
    // Remove auth state from session storage
    sessionStorage.removeItem(`${streamerType}Auth`);
    
  } catch (error) {
    console.error("Error in logoutStreamer:", error);
  }
};

// Check if the user has an active streamer session
export const hasStreamerSession = (streamerType: "ankit" | "harish"): boolean => {
  return sessionStorage.getItem(`${streamerType}Auth`) === "true";
};

// Setup a listener for storage events to sync across tabs
export const setupStreamerStatusListener = (
  streamerType: "ankit" | "harish", 
  callback: (isOnline: boolean) => void
): () => void => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === `${streamerType}Auth`) {
      callback(event.newValue === "true");
    }
  };
  
  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{streamer: string, isOnline: boolean}>;
    if (customEvent.detail?.streamer === streamerType) {
      callback(customEvent.detail.isOnline);
    }
  };
  
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener("streamerStatusChange", handleCustomEvent);
  
  // Return a function to remove the listeners
  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener("streamerStatusChange", handleCustomEvent);
  };
};
