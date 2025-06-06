
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authenticateStreamer } from "@/services/streamerAuth";
import { getStreamerConfig } from "@/config/streamerConfigs";
import { Heart, Gamepad2, Sparkles, Lock } from "lucide-react";

const StreamerLogin = () => {
  const { streamerName } = useParams<{ streamerName: string }>();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const config = getStreamerConfig(streamerName || "");
  
  if (!config) {
    return <div>Streamer not found</div>;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authenticateStreamer({
        username: config.name,
        password,
      });

      if (result.success) {
        sessionStorage.setItem(config.authKey, "true");
        
        if (result.isAdmin) {
          sessionStorage.setItem(`${config.name}AdminAuth`, "true");
          toast({
            title: "Admin Login successful",
            description: `Welcome to the ${config.displayName} Dashboard with admin privileges!`,
          });
        } else {
          toast({
            title: "Login successful",
            description: `Welcome to the ${config.displayName} Dashboard!`,
          });
        }
        
        navigate(`/${config.name}/dashboard`);
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An unexpected error occurred during login",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Special styling for Chiaa Gaming
  if (config.name === "chiaa_gaming") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-95"
          style={{
            background: config.theme.backgroundColor
          }}
        />

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
          <Card className={`backdrop-blur-lg ${config.theme.cardBackground} border-${config.theme.borderColor} shadow-2xl shadow-pink-500/25`}>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Heart className="h-8 w-8 text-pink-600 animate-pulse" />
                <CardTitle className="text-2xl bg-gradient-to-r from-pink-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                  {config.displayName}
                </CardTitle>
                <Sparkles className="h-8 w-8 text-purple-600 animate-pulse" />
              </div>
              <CardDescription className="text-pink-800 font-medium">
                Admin Dashboard Login 🎮
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="block text-sm font-semibold text-pink-900">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={config.name}
                    className="border-pink-400 focus:border-pink-600 focus:ring-pink-600 bg-white text-gray-900 placeholder:text-gray-500"
                    required
                    disabled
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="block text-sm font-semibold text-pink-900">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-pink-400 focus:border-pink-600 focus:ring-pink-600 bg-white text-gray-900 placeholder:text-gray-500"
                    required
                    placeholder="Enter your password"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-${config.theme.primaryColor} to-${config.theme.secondaryColor} hover:from-pink-700 hover:to-purple-800 text-white font-bold py-3 shadow-lg shadow-pink-500/30 transition-all duration-300 hover:scale-105`}
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
                  onClick={() => navigate(`/${config.name}`)}
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
  }

  // Special styling for Rakazone
  if (config.name === "rakazone") {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-background" 
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('${config.features.backgroundUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Card className={`w-full max-w-md border-${config.theme.borderColor} ${config.theme.cardBackground}`}>
          <CardHeader className="text-center">
            {config.features.hasLogo && (
              <div className="flex justify-center mb-4">
                <img 
                  src={config.features.logoUrl} 
                  alt={`${config.displayName} Logo`} 
                  className="h-20 w-20"
                />
              </div>
            )}
            <CardTitle className={`text-2xl text-${config.theme.primaryColor}`}>
              {config.displayName} Dashboard Login
            </CardTitle>
            <CardDescription className="text-gray-300">
              Enter your password to access the dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-200">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={config.name}
                  placeholder={config.name}
                  required
                  disabled
                  className={`bg-black/50 border-${config.theme.borderColor}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className={`bg-black/50 border-${config.theme.borderColor} focus:border-${config.theme.primaryColor}`}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className={`w-full bg-gradient-to-r from-${config.theme.gradientFrom} to-${config.theme.gradientTo} hover:from-red-800 hover:to-red-950`} 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log in"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Default styling for other streamers
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{config.displayName} Dashboard Login</CardTitle>
          <CardDescription>
            Enter your password to access the dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={config.name}
                placeholder={config.name}
                required
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default StreamerLogin;
