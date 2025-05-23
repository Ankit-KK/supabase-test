import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { authenticateStreamer } from "@/services/streamerAuth";
import { Heart, Sparkles } from "lucide-react";

const ChiaGamingLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authenticateStreamer("chia_gaming", email, password);
      if (result.success) {
        toast({
          title: "Welcome back, Chia! 💖",
          description: "Successfully logged in to your dashboard",
        });
        navigate("/chia_gaming/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(219, 39, 119, 0.3) 0%, transparent 50%),
          linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #fdf2f8 100%)
        `
      }}
    >
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 opacity-20">
          <Heart size={60} className="text-pink-400 animate-pulse" />
        </div>
        <div className="absolute bottom-20 right-20 opacity-15">
          <Sparkles size={80} className="text-purple-500 animate-bounce" />
        </div>
      </div>

      <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-2 border-pink-200/50 shadow-xl shadow-pink-300/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Heart className="h-8 w-8 text-pink-500" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Chia Gaming Admin
            </CardTitle>
            <Sparkles className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-pink-700">Welcome back, beautiful! 💕</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-pink-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
                className="bg-white/70 border-pink-300 focus:border-pink-500 focus:ring-pink-400/50"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-pink-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="bg-white/70 border-pink-300 focus:border-pink-500 focus:ring-pink-400/50"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-2 rounded-lg shadow-lg shadow-pink-400/25 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Login</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChiaGamingLogin;
