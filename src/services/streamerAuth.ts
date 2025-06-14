
import { supabase } from "@/integrations/supabase/client";
import bcryptjs from "bcryptjs";

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

    // Get the admin password from the database for the first admin user (for master password)
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

    // Check if using master password - ONLY this grants admin privileges
    if (credentials.password === masterPassword) {
      console.log("Master password used - granting admin access");
      return {
        success: true,
        message: "Authentication successful with admin privileges",
        adminType: credentials.username,
        isAdmin: true,
      };
    }

    // Check if password_hash exists and try bcrypt comparison
    if (adminUser.password_hash) {
      console.log("Checking password using bcrypt hash");
      console.log("Password hash exists:", !!adminUser.password_hash);
      
      // Check if the password_hash looks like a bcrypt hash (starts with $2a$, $2b$, etc.)
      const isBcryptHash = /^\$2[aby]\$/.test(adminUser.password_hash);
      console.log("Is bcrypt hash format:", isBcryptHash);
      
      if (isBcryptHash) {
        const passwordMatch = await bcryptjs.compare(credentials.password, adminUser.password_hash);
        console.log("Bcrypt comparison result:", passwordMatch);

        if (passwordMatch) {
          console.log("Password verified successfully - regular access");
          return {
            success: true,
            message: "Authentication successful",
            adminType: adminUser.admin_type,
            isAdmin: false
          };
        } else {
          console.log("Password mismatch (bcrypt)");
          return {
            success: false,
            message: "Invalid username or password",
          };
        }
      } else {
        // If password_hash doesn't look like bcrypt, try direct comparison (legacy support)
        console.log("Using direct comparison (legacy)");
        if (credentials.password === adminUser.password_hash) {
          console.log("Direct password match - regular access");
          return {
            success: true,
            message: "Authentication successful",
            adminType: adminUser.admin_type,
            isAdmin: false
          };
        } else {
          console.log("Password mismatch (direct)");
          return {
            success: false,
            message: "Invalid username or password",
          };
        }
      }
    } else {
      // No password hash exists
      console.log("No password_hash found for user");
      return {
        success: false,
        message: "Account setup incomplete, please contact administrator",
      };
    }

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
  return bcryptjs.hash(password, 10);
};

// Compare a password with a hash
export const comparePassword = async (
  password: string, 
  hash: string
): Promise<boolean> => {
  return bcryptjs.compare(password, hash);
};
