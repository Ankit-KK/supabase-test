import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDemoStreamerAuth } from "@/hooks/useDemoStreamerAuth";
import { User, AlertCircle, Sparkles } from "lucide-react";

export default function DemoStreamerLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading, error } = useDemoStreamerAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (session && !loading) {
      navigate('/demostreamer/dashboard');
    }
  }, [session, loading, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      const redirectUrl = `${window.location.origin}/demostreamer/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Google sign-in error:', error);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 -right-8 w-32 h-32 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/4 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-pulse delay-500"></div>
        </div>

        <Card className="relative backdrop-blur-sm bg-white/90 border-purple-200 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Demo Streamer Dashboard
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Sign in to access your streaming dashboard
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{error.type}:</strong> {error.message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {isGoogleLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </div>
              )}
            </Button>

            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>
                Secure authentication powered by Google
              </p>
              <p>
                Admin access available for authorized accounts
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            Need access? Contact your administrator to get added to the authorized users list.
          </p>
        </div>
      </div>
    </div>
  );
}