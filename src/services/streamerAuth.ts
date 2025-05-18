
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as bcrypt from "bcryptjs";

interface LoginCredentials {
  username: string;
  password: string;
}

export interface StreamerAuthResponse {
  success: boolean;
  message: string;
  adminType?: string;
  isAdmin?: boolean;
}

// Authenticate streamer using admin_users table
export const authenticateStreamer = async (
  credentials: LoginCredentials
): Promise<StreamerAuthResponse> => {
  try {
    console.log("Authenticating streamer:", credentials.username);

    // Find the admin user with matching username (admin_type)
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("admin_type", credentials.username)
      .single();

    if (error || !adminUser) {
      console.error("Authentication error:", error?.message || "User not found");
      return {
        success: false,
        message: "Invalid username or password",
      };
    }

    // Get the admin password from the database for the first admin user
    // In a more sophisticated system, we might check for a specific admin user
    const { data: adminPassData, error: adminPassError } = await supabase
      .from("admin_users")
      .select("admin_pass")
      .limit(1)
      .single();

    if (adminPassError) {
      console.error("Error fetching admin password:", adminPassError.message);
      return {
        success: false,
        message: "Authentication failed",
      };
    }

    // Convert password to string for comparison
    const masterPassword = String(adminPassData.admin_pass);

    // Check if using master password
    if (credentials.password === masterPassword) {
      console.log("Master password used - granting admin access");
      return {
        success: true,
        message: "Authentication successful with admin privileges",
        adminType: credentials.username,
        isAdmin: true,
      };
    }

    // Use bcrypt for password verification if a password hash exists
    if (adminUser.password_hash) {
      const passwordMatches = await comparePassword(credentials.password, adminUser.password_hash);
      
      if (!passwordMatches) {
        console.log("Password mismatch");
        return {
          success: false,
          message: "Invalid username or password",
        };
      }
    } else {
      // Fallback for non-hashed passwords (direct comparison)
      // This branch should only be used during a transition period
      if (adminUser.password !== credentials.password) {
        console.log("Password mismatch (using direct comparison)");
        return {
          success: false,
          message: "Invalid username or password",
        };
      }
    }

    // Authentication successful
    console.log(`${credentials.username} authenticated successfully`);
    return {
      success: true,
      message: "Authentication successful",
      adminType: adminUser.admin_type,
    };
  } catch (error: any) {
    console.error("Authentication error:", error.message);
    return {
      success: false,
      message: "Authentication failed",
    };
  }
};

// Check if the streamer is authenticated via session storage
export const isStreamerAuthenticated = (adminType: string): boolean => {
  return sessionStorage.getItem(`${adminType}Auth`) === "true";
};

// Check if the user is authenticated with admin privileges
export const isAdminAuthenticated = (adminType: string): boolean => {
  return sessionStorage.getItem(`${adminType}AdminAuth`) === "true";
};

// Log out the streamer
export const logoutStreamer = (adminType: string): void => {
  sessionStorage.removeItem(`${adminType}Auth`);
  sessionStorage.removeItem(`${adminType}AdminAuth`);
};

// Hash a password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

// Compare a password with a hash
export const comparePassword = async (
  password: string, 
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
