
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authenticateStreamer } from "@/services/streamerAuth";

const RakazoneLogin = () => {
  const [username] = useState("rakazone");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authenticateStreamer({
        username,
        password,
      });

      if (result.success) {
        // Store auth state in session storage
        sessionStorage.setItem("rakazoneAuth", "true");
        
        // If admin access (via master password), store that too
        if (result.isAdmin) {
          sessionStorage.setItem("rakazoneAdminAuth", "true");
          toast({
            title: "Admin Login successful",
            description: "Welcome to the Rakazone Dashboard with admin privileges!",
          });
        } else {
          toast({
            title: "Login successful",
            description: "Welcome to the Rakazone Dashboard!",
          });
        }
        
        navigate("/rakazone/dashboard");
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-background" 
      style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/lovable-uploads/27e5dfd7-9e94-4323-83d7-c758e1f525a2.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
      <Card className="w-full max-w-md border-red-500/30 bg-black/80">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/495326f5-a1c6-47a4-9e68-39f8372910a9.png" 
              alt="Rakazone Gaming" 
              className="h-20 w-20"
            />
          </div>
          <CardTitle className="text-2xl text-red-500">Rakazone Dashboard Login</CardTitle>
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
                value={username}
                placeholder="rakazone"
                required
                disabled
                className="bg-black/50 border-red-500/30"
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
                className="bg-black/50 border-red-500/30 focus:border-red-500"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950" 
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RakazoneLogin;
