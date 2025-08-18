import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStreamerAuth } from '@/hooks/useStreamerAuth';
import { Gamepad2, Heart, Sparkles, LogIn } from 'lucide-react';

const ChiaGamingLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading } = useStreamerAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (session && !loading) {
      navigate('/chia_gaming/dashboard');
    }
  }, [session, loading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      // Use secure authentication function
      const { data: authResult, error } = await supabase
        .rpc('authenticate_streamer', {
          p_username: formData.username,
          p_password: formData.password
        });

      if (error) {
        console.error('Authentication error:', error);
        toast({
          title: "Login Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        setIsLoggingIn(false);
        return;
      }

      const streamer = authResult?.[0];
      if (!streamer || !streamer.success || streamer.streamer_slug !== 'chia_gaming') {
        toast({
          title: "Login Failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
        setIsLoggingIn(false);
        return;
      }

      // Store session in localStorage
      const session = {
        streamerId: streamer.id,
        streamerSlug: streamer.streamer_slug,
        streamerName: streamer.streamer_name,
        brandColor: streamer.brand_color,
        loginTime: Date.now()
      };

      localStorage.setItem('streamer_session', JSON.stringify(session));

      toast({
        title: "Login Successful!",
        description: `Welcome back, ${streamer.streamer_name}!`,
      });

      // Navigate to dashboard
      navigate('/chia_gaming/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-pink-light via-background to-gaming-pink-light/30 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gaming-pink-primary/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gaming-pink-secondary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gaming-pink-accent/10 rounded-full blur-2xl animate-pulse-glow"></div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-gaming-pink-primary/20 shadow-2xl relative overflow-hidden">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gaming-pink-primary/20 via-gaming-pink-secondary/20 to-gaming-pink-accent/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2 text-gaming-pink-primary">
              <Gamepad2 className="h-8 w-8" />
              <Sparkles className="h-6 w-6 animate-pulse-glow" />
              <Heart className="h-6 w-6 text-gaming-pink-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gaming-pink-primary to-gaming-pink-secondary bg-clip-text text-transparent">
            Chia Gaming Dashboard
          </CardTitle>
          <CardDescription>
            Sign in to access your streaming dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gaming-pink-primary">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleInputChange}
                className="border-gaming-pink-primary/30 focus:border-gaming-pink-primary focus:ring-gaming-pink-primary/20"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gaming-pink-primary">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className="border-gaming-pink-primary/30 focus:border-gaming-pink-primary focus:ring-gaming-pink-primary/20"
                required
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-gaming-pink-primary to-gaming-pink-secondary hover:from-gaming-pink-secondary hover:to-gaming-pink-accent text-gaming-pink-foreground font-medium py-3 relative overflow-hidden group transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100"
            >
              {isLoggingIn ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                  <Sparkles className="h-4 w-4 group-hover:animate-pulse-glow" />
                </div>
              )}
              
              {/* Button shine effect */}
              <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-gaming-pink-primary/20">
            <p className="text-xs text-muted-foreground">
              🎮 Access your streaming dashboard and manage donations
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChiaGamingLogin;