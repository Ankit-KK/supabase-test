import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAnkitAuth } from '@/hooks/useAnkitAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

const AnkitLogin = () => {
  const { session, loading, error } = useAnkitAuth();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Redirect if already logged in
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session && session.streamerSlug === 'ankit') {
    return <Navigate to="/ankit/dashboard" replace />;
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    const redirectUrl = `${window.location.origin}/ankit/dashboard`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });
    
    if (error) {
      toast({
        title: "Google Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
    // Don't set loading to false here as the redirect will handle it
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">Ankit Dashboard</CardTitle>
          <CardDescription>
            Sign in with Google to access your streamer dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{error.message}</p>
              {error.type === 'unauthorized' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Contact the administrator to get access to this dashboard.
                </p>
              )}
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="space-y-4">
            <Button 
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center space-x-2"
              size="lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{isGoogleLoading ? "Signing in with Google..." : "Continue with Google"}</span>
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Secure authentication powered by Google</p>
              <p className="mt-2 text-xs">Admin users can access any dashboard</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnkitLogin;