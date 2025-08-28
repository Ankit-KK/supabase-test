import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useNewStreamerAuth } from '@/hooks/useNewStreamerAuth';
import { LogIn, User, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NewStreamerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useNewStreamerAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/newstreamer/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const result = await login(username.trim(), password);
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to dashboard...",
        });
        navigate('/newstreamer/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            New Streamer Login
          </h1>
          <p className="text-muted-foreground">
            Access your streamer dashboard
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/95 border-emerald-200 dark:border-emerald-800 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <LogIn className="w-5 h-5" />
              Login
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-400"
                  disabled={isLoggingIn}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-400"
                  disabled={isLoggingIn}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-800">
              <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-lg">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-2">
                  <strong>Demo Credentials:</strong>
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Username: newstreamer<br />
                  Password: password123
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Link 
                to="/newstreamer" 
                className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Donation Page
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewStreamerLogin;