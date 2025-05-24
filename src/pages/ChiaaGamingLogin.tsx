
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { authenticateStreamer, isStreamerAuthenticated } from "@/services/streamerAuth";
import { Heart, Gamepad2, Sparkles, Lock } from "lucide-react";

const ChiaaGamingLogin = () => {
  const [credentials, setCredentials] = useState({
    username: "chiaa_gaming",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isStreamerAuthenticated("chiaa_gaming")) {
      navigate("/chiaa-gaming/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authenticateStreamer(credentials);
      
      if (result.success) {
        if (result.isAdmin) {
          sessionStorage.setItem("chiaa_gamingAdminAuth", "true");
        }
        sessionStorage.setItem("chiaa_gamingAuth", "true");
        
        toast({
          title: "Welcome back! 💖",
          description: result.message,
        });
        
        navigate("/chiaa-gaming/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background */}
      <div 
        className="absolute inset-0 opacity-95"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(219, 39, 119, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(168, 85, 247, 0.25) 0%, transparent 50%),
            linear-gradient(135deg, #fef7ff 0%, #faf5ff 25%, #fdf2f8 50%, #f0f9ff 75%, #fef7ff 100%)
          `
        }}
      />

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 opacity-15 animate-float">
          <Heart size={60} className="text-pink-500" />
        </div>
        <div className="absolute top-32 right-20 opacity-15 animate-bounce">
          <Gamepad2 size={50} className="text-purple-500" />
        </div>
        <div className="absolute bottom-32 left-20 opacity-15 animate-pulse">
          <Sparkles size={45} className="text-pink-600" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-lg bg-white/95 border-pink-300 shadow-2xl shadow-pink-500/25">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Heart className="h-8 w-8 text-pink-600 animate-pulse" />
              <CardTitle className="text-2xl bg-gradient-to-r from-pink-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                Chiaa Gaming
              </CardTitle>
              <Sparkles className="h-8 w-8 text-purple-600 animate-pulse" />
            </div>
            <CardDescription className="text-pink-800 font-medium">
              Admin Dashboard Login 🎮
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-semibold text-pink-900">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="border-pink-400 focus:border-pink-600 focus:ring-pink-600 bg-white text-gray-900 placeholder:text-gray-500"
                  required
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-pink-900">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="border-pink-400 focus:border-pink-600 focus:ring-pink-600 bg-white text-gray-900 placeholder:text-gray-500"
                  required
                  placeholder="Enter your password"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white font-bold py-3 shadow-lg shadow-pink-500/30 transition-all duration-300 hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>Login</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => navigate("/chiaa-gaming")}
                className="text-pink-700 border-pink-400 hover:bg-pink-100 hover:border-pink-500"
              >
                ← Back to Donation Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChiaaGamingLogin;
