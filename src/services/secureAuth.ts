
import { supabase } from "@/integrations/supabase/client";

export interface SecureAuthResult {
  success: boolean;
  message: string;
  isAdmin: boolean;
  adminType?: string;
}

export const authenticateSecurely = async (credentials: {
  username: string;
  password: string;
}): Promise<SecureAuthResult> => {
  try {
    // First authenticate with Supabase Auth using email/password
    const email = `${credentials.username}@hyperchat.local`; // Convert username to email format
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: credentials.password,
    });

    if (error) {
      // Log failed authentication attempt
      await supabase.rpc('log_access_attempt', {
        p_action: 'FAILED_LOGIN_ATTEMPT',
        p_table_name: 'admin_users'
      });
      
      return {
        success: false,
        message: "Invalid credentials",
        isAdmin: false,
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: "Authentication failed",
        isAdmin: false,
      };
    }

    // Verify admin status through secure function
    const { data: adminData, error: adminError } = await supabase.rpc('get_user_admin_type');
    
    if (adminError || !adminData) {
      await supabase.rpc('log_access_attempt', {
        p_action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        p_table_name: 'admin_users'
      });
      
      return {
        success: false,
        message: "Access denied",
        isAdmin: false,
      };
    }

    // Log successful authentication
    await supabase.rpc('log_access_attempt', {
      p_action: 'SUCCESSFUL_LOGIN',
      p_table_name: 'admin_users'
    });

    return {
      success: true,
      message: "Authentication successful",
      isAdmin: true,
      adminType: adminData,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      message: "Authentication service error",
      isAdmin: false,
    };
  }
};

export const createSecureObsToken = async (adminType: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('create_obs_token', {
      p_admin_type: adminType
    });

    if (error) {
      console.error("Token creation error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Secure token creation failed:", error);
    return null;
  }
};

export const validateObsAccess = async (token: string, adminType: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('validate_obs_token', {
      p_token: token,
      p_admin_type: adminType
    });

    return !error && data === true;
  } catch (error) {
    console.error("Token validation failed:", error);
    return false;
  }
};

export const logSecurityEvent = async (action: string, details?: any) => {
  try {
    await supabase.rpc('log_access_attempt', {
      p_action: action,
      p_table_name: details?.table || null,
      p_record_id: details?.recordId || null
    });
  } catch (error) {
    console.error("Security logging failed:", error);
  }
};
