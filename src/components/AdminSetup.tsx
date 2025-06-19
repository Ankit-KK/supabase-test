
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminSetupProps {
  adminType: string;
  onSetupComplete: () => void;
}

const AdminSetup = ({ adminType, onSetupComplete }: AdminSetupProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "Please make sure both passwords match",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters long",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Setting up admin account for: ${adminType}`);
      
      const { data, error } = await supabase.functions.invoke('setup-admin-auth', {
        body: { adminType, password }
      });

      if (error) {
        console.error('Setup function error:', error);
        throw error;
      }

      console.log('Setup function response:', data);

      toast({
        title: "Setup successful",
        description: data.message || `Admin account for ${adminType} has been configured successfully`,
      });

      onSetupComplete();
    } catch (error: any) {
      console.error('Setup error:', error);
      toast({
        variant: "destructive",
        title: "Setup failed",
        description: error.message || "Failed to setup admin account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-black/50 border-pink-500/30">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-pink-400">
          Setup Admin Account
        </CardTitle>
        <CardDescription className="text-center text-pink-300">
          Create or update a secure password for {adminType} admin access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter new password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/30 border-pink-500/50 text-pink-100 placeholder:text-pink-300/70"
              required
              minLength={8}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-black/30 border-pink-500/50 text-pink-100 placeholder:text-pink-300/70"
              required
              minLength={8}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Setting up..." : "Create/Update Admin Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminSetup;
