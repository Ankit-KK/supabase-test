
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, HelpCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [helpMessage, setHelpMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Check if admin users exist in the database on component mount
  useEffect(() => {
    const checkAdminUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('user_email, admin_type');
        
        if (error) {
          console.error("Error checking admin users:", error);
          setInfoMessage("There might be an issue with the admin_users table. Contact support if login issues persist.");
          return;
        }

        if (!data || data.length === 0) {
          // If no admin users found, create them
          setInfoMessage("Creating admin users in the database...");
          await createDefaultAdminUsers();
        } else {
          console.log("Admin users exist:", data);
          setInfoMessage(`Admin accounts are configured. You can login with ${data.map(u => u.user_email).join(' or ')}`);
        }
      } catch (err) {
        console.error("Error in admin check:", err);
      }
    };

    checkAdminUsers();
  }, []);
  
  // Function to create default admin users if they don't exist
  const createDefaultAdminUsers = async () => {
    try {
      const adminUsers = [
        { user_email: 'ankitashuk20@gmail.com', admin_type: 'ankit' },
        { user_email: 'harishk0294@gmail.com', admin_type: 'harish' }
      ];
      
      for (const user of adminUsers) {
        const { error } = await supabase
          .from('admin_users')
          .upsert(user, { onConflict: 'user_email' });
        
        if (error) {
          console.error(`Error creating admin user ${user.user_email}:`, error);
        }
      }
      
      setInfoMessage("Admin users have been configured. You can now sign up with ankitashuk20@gmail.com or harishk0294@gmail.com");
    } catch (err) {
      console.error("Error creating admin users:", err);
    }
  };

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate("/admin/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setHelpMessage(null);
    setInfoMessage(null);

    try {
      await signIn(email, password);
      // The redirection is handled in the useEffect above when user state changes
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Login failed. Please check your credentials.");
      setHelpMessage("Only registered admin users with valid credentials can log in. If you need to register first, please use the Signup tab.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setHelpMessage(null);
    setInfoMessage(null);

    try {
      // Check if this is a valid admin email (either ankit or harish)
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('admin_type')
        .eq('user_email', email)
        .maybeSingle();

      if (adminCheckError) {
        throw new Error("Error checking admin status.");
      }

      if (!adminCheck) {
        throw new Error("This email is not registered as an admin. Please use either ankitashuk20@gmail.com or harishk0294@gmail.com.");
      }

      // Create the user in Supabase auth
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // Check if the user already exists
      if (data?.user?.identities?.length === 0) {
        setError("This email is already registered. Please try logging in instead.");
        return;
      }

      setSuccessMessage("Account created successfully! Please check your email for verification link or try logging in.");
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "Registration failed. Please try again.");
      
      // Add helpful message about valid admin emails
      setHelpMessage("Only ankitashuk20@gmail.com (for Ankit) or harishk0294@gmail.com (for Harish) are registered as admin users. The password format should be name+2000 (e.g., ankit2000 or harish2000).");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Admin Portal</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {infoMessage && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>{infoMessage}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Signup</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {helpMessage && (
                <Alert variant="warning" className="mb-4">
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Help</AlertTitle>
                  <AlertDescription>{helpMessage}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ankitashuk20@gmail.com or harishk0294@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="name+2000 (e.g., ankit2000)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert variant="success" className="mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {helpMessage && (
                <Alert variant="warning" className="mb-4">
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Help</AlertTitle>
                  <AlertDescription>{helpMessage}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="ankitashuk20@gmail.com or harishk0294@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="name+2000 (e.g., ankit2000)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing up..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
