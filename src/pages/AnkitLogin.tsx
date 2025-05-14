
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authenticateStreamer } from "@/services/streamerAuth";

const AnkitLogin = () => {
  const [username, setUsername] = useState("ankit");
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
        sessionStorage.setItem("ankitAuth", "true");
        
        // If admin access (via master password), store that too
        if (result.isAdmin) {
          sessionStorage.setItem("ankitAdminAuth", "true");
          toast({
            title: "Admin Login successful",
            description: "Welcome to the Ankit Dashboard with admin privileges!",
          });
        } else {
          toast({
            title: "Login successful",
            description: "Welcome to the Ankit Dashboard!",
          });
        }
        
        navigate("/ankit/dashboard");
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
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Ankit Dashboard Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
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

export default AnkitLogin;
