import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversalAuth } from '@/hooks/useUniversalAuth';
import { useToast } from '@/hooks/use-toast';

const UniversalLogin = () => {
  const { streamerSlug } = useParams();
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const { session, loading, error } = useUniversalAuth(streamerSlug || '');

  useEffect(() => {
    if (session?.isAuthenticated) {
      navigate(`/${streamerSlug}/dashboard`);
    }
  }, [session, navigate, streamerSlug]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Login Error",
          description: error.message || "Failed to sign in with Google",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
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
          
          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Sign in with Google
          </Button>
          
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