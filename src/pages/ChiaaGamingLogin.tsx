
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminSetup from "@/components/AdminSetup";

const ChiaaGamingLogin = () => {
  const [username, setUsername] = useState("chiaa_gaming");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Starting login process for chiaa_gaming");
      
      // Use Supabase Auth with the proper email format
      const email = `${username}@hyperchat.local`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log("Login error:", error.message);
        
        // If user doesn't exist, show setup
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
          toast({
            title: "Account Setup Required",
            description: "Please set up your admin account with a secure password",
          });
          setShowSetup(true);
          setIsLoading(false);
          return;
        }
        
        throw error;
      }

      if (data.user) {
        console.log("Login successful");
        
        // Verify admin status
        const { data: adminType } = await supabase.rpc('get_user_admin_type');
        
        if (adminType === 'chiaa_gaming') {
          toast({
            title: "Login successful",
            description: "Welcome to your secure Chiaa Gaming Dashboard",
          });
          
          navigate("/chiaa_gaming/dashboard");
        } else {
          throw new Error("Access denied - not authorized for chiaa_gaming");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    toast({
      title: "Setup complete",
      description: "You can now log in with your new password",
    });
  };

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black flex items-center justify-center p-4">
        <AdminSetup adminType="chiaa_gaming" onSetupComplete={handleSetupComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/50 border-pink-500/30">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-pink-400">
            Chiaa Gaming Dashboard
          </CardTitle>
          <CardDescription className="text-center text-pink-300">
            Enter your credentials to access the secure dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/30 border-pink-500/50 text-pink-100 placeholder:text-pink-300/70"
                required
                disabled
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
              {isLoading ? "Logging in..." : "Secure Login"}
            </Button>
          </form>
          <div className="mt-4 text-xs text-pink-300/70 text-center">
            🔒 This login uses secure Supabase authentication with audit logging
          </div>
          <div className="mt-2 text-xs text-pink-300/50 text-center">
            First time logging in? You'll be guided through account setup.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChiaaGamingLogin;
