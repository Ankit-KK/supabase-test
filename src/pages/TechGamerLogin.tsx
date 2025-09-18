import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2 } from 'lucide-react';

const TechGamerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simple email/password authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Check if user has access to TechGamer
      const { data: streamerAccess, error: accessError } = await supabase.rpc('check_streamer_email_allowed', {
        p_streamer_slug: 'techgamer',
        p_email: email
      });

      if (accessError || !streamerAccess) {
        await supabase.auth.signOut();
        throw new Error('You do not have access to TechGamer dashboard');
      }

      // Store session info
      localStorage.setItem('techgamer_session', JSON.stringify({
        user: data.user,
        streamer_slug: 'techgamer',
        logged_in_at: new Date().toISOString()
      }));

      toast({
        title: "Login Successful",
        description: "Welcome to TechGamer dashboard!",
      });

      navigate('/techgamer/dashboard');

    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-blue-500/20 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="h-8 w-8 text-blue-400" />
            <CardTitle className="text-2xl text-white">TechGamer</CardTitle>
          </div>
          <CardDescription className="text-blue-200">
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-blue-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-700/50 border-blue-500/30 text-white"
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-blue-200">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-700/50 border-blue-500/30 text-white"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechGamerLogin;