
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ChiaaGamingLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Starting login process for chiaa_gaming");
      
      // Check admin_users table directly for chiaa_gaming
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("admin_type", "chiaa_gaming")
        .single();

      if (adminError || !adminUser) {
        console.error("Admin user not found:", adminError);
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid credentials",
        });
        return;
      }

      console.log("Admin user found:", adminUser);

      // Check password against password_hash
      if (password === adminUser.password_hash) {
        console.log("Password verified - setting up session");
        
        // Set session storage for authentication - using consistent key names
        sessionStorage.setItem("chiaa_gamingAuth", "true");
        sessionStorage.setItem("chiaa_gamingAdminAuth", "true");
        
        // Trigger storage event to update AuthContext
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'chiaa_gamingAuth',
          newValue: 'true'
        }));

        console.log("Session set up successfully, navigating to dashboard");
        
        toast({
          title: "Login successful",
          description: "Welcome to your dashboard!",
        });
        
        // Navigate to dashboard
        navigate("/chiaa_gaming/dashboard");
      } else {
        console.log("Password mismatch");
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid credentials",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/50 border-pink-500/30">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-pink-400">
            Chiaa Gaming Dashboard
          </CardTitle>
          <CardDescription className="text-center text-pink-300">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/30 border-pink-500/50 text-pink-100 placeholder:text-pink-300/70"
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/30 border-pink-500/50 text-pink-100 placeholder:text-pink-300/70"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChiaaGamingLogin;
