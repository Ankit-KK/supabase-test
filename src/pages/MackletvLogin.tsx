
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isStreamerAuthenticated, authenticateStreamer } from "@/services/streamerAuth";

const MackletvLogin = () => {
  const [email, setEmail] = useState("mackletv@example.com");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already logged in
    if (isStreamerAuthenticated("mackletv")) {
      navigate("/mackletv/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authenticateStreamer("mackletv", email, password);
      
      if (result.success) {
        // Set authentication status in session storage
        sessionStorage.setItem("mackletvAuth", "true");
        
        toast({
          title: "Login successful",
          description: "Welcome back to your dashboard!",
        });
        navigate("/mackletv/dashboard");
      } else {
        toast({
          title: "Authentication failed",
          description: result.message || "Please check your credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">MackleTv Admin Login</CardTitle>
            <CardDescription>
              Login to access your donation dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">
                    Demo credentials (for development only):<br />
                    Email: mackletv@example.com<br />
                    Password: changeme
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MackletvLogin;
