import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomAuth } from '@/contexts/CustomAuthContext';
import { useCustomUniversalAuth } from '@/hooks/useCustomUniversalAuth';
import { useToast } from '@/hooks/use-toast';

const UniversalLogin = () => {
  const { streamerSlug } = useParams();
  const navigate = useNavigate();
  const { signIn } = useCustomAuth();
  const { toast } = useToast();
  const { session, loading, error } = useCustomUniversalAuth(streamerSlug || '');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.isAuthenticated) {
      navigate(`/${streamerSlug}/dashboard`);
    }
  }, [session, navigate, streamerSlug]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Login Error",
          description: error.message || "Failed to sign in",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove sign up functionality since we're using predefined accounts
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Sign Up Not Available",
      description: "Please use your assigned login credentials to access the dashboard",
      variant: "default"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const streamerName = streamerSlug?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Streamer';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">
            {streamerName} Dashboard
          </CardTitle>
          <CardDescription className="text-slate-300">
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error.message}</p>
              {error.details && (
                <p className="text-red-300 text-xs mt-2">{error.details}</p>
              )}
            </div>
          )}
          
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-1 bg-slate-700">
              <TabsTrigger value="signin" className="text-slate-300 data-[state=active]:text-white">Sign In</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signin" className="mt-4">
              <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                <p className="text-slate-300 text-sm mb-2">Demo Credentials:</p>
                <ul className="text-slate-400 text-xs space-y-1">
                  <li>Ankit: ankit@streamer.com / admin123</li>
                  <li>Demo: demo@streamer.com / admin123</li>
                  <li>Chia Gaming: chia@streamer.com / admin123</li>
                  <li>Tech Gamer: tech@streamer.com / admin123</li>
                  <li>Code Live: code@streamer.com / admin123</li>
                  <li>Music Stream: music@streamer.com / admin123</li>
                  <li>Fitness Flow: fitness@streamer.com / admin123</li>
                  <li>Art Create: art@streamer.com / admin123</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate(`/${streamerSlug}`)}
              className="text-slate-400 hover:text-white"
            >
              ← Back to Donation Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversalLogin;