import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { FileText, PenTool, User, CheckCircle, Lock } from "lucide-react";
import { authenticateStreamer } from "@/services/streamerAuth";

const ContractSigning = () => {
  const [name, setName] = useState("");
  const [signatureType, setSignatureType] = useState<"signature" | "name">("signature");
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminType, setAdminType] = useState<string | null>(null);
  const [hasExistingContract, setHasExistingContract] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Login form states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const navigate = useNavigate();

  // Check if user is authenticated and get admin type
  useEffect(() => {
    const checkAuthStatus = () => {
      const adminTypes = ['ankit', 'harish', 'mackle', 'rakazone', 'chiaa_gaming'];
      let foundAdminType = null;
      
      for (const type of adminTypes) {
        if (sessionStorage.getItem(`${type}Auth`) === "true") {
          foundAdminType = type;
          break;
        }
      }
      
      if (foundAdminType) {
        setAdminType(foundAdminType);
        setIsAuthenticated(true);
        checkExistingContract(foundAdminType);
      }
    };

    checkAuthStatus();
  }, []);

  const checkExistingContract = async (adminType: string) => {
    try {
      const { data, error } = await supabase
        .from("streamer_contracts")
        .select("*")
        .eq("streamer_type", adminType)
        .single();
      
      if (data) {
        setHasExistingContract(true);
      }
    } catch (error) {
      console.error("Error checking existing contract:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginUsername.trim() || !loginPassword.trim()) {
      toast({
        title: "Login Required",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const result = await authenticateStreamer({
        username: loginUsername.trim(),
        password: loginPassword.trim(),
      });

      if (result.success && result.adminType) {
        // Set session storage for authentication
        sessionStorage.setItem(`${result.adminType}Auth`, "true");
        if (result.isAdmin) {
          sessionStorage.setItem(`${result.adminType}AdminAuth`, "true");
        }

        setAdminType(result.adminType);
        setIsAuthenticated(true);
        checkExistingContract(result.adminType);

        toast({
          title: "Login Successful",
          description: "You can now sign the contract.",
        });
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    if (!signature.trim()) {
      toast({
        title: "Signature Required",
        description: signatureType === "signature" ? "Please enter your signature." : "Please enter your name for signing.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("streamer_contracts")
        .insert({
          streamer_name: name.trim(),
          streamer_type: adminType,
          signature: signature.trim(),
          signed_at: new Date().toISOString(),
          agreed_to_terms: true,
          streamer_cut: 95, // Default as per contract
          hyperchat_cut: 5 // Default as per contract
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Contract Signed Successfully",
        description: "Your contract has been signed and saved.",
      });

      // Redirect to appropriate dashboard
      const dashboardRoutes: Record<string, string> = {
        ankit: "/ankit/dashboard",
        harish: "/harish/dashboard",
        mackle: "/mackle/dashboard", 
        rakazone: "/rakazone/dashboard",
        chiaa_gaming: "/chiaa_gaming/dashboard"
      };

      navigate(dashboardRoutes[adminType!] || "/");

    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login form for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-md py-10">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Login to Sign Contract</CardTitle>
            <p className="text-muted-foreground">
              Please login with your admin credentials to access and sign the HyperChat Service Agreement.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasExistingContract) {
    return (
      <div className="container mx-auto max-w-4xl py-10">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Contract Already Signed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              You have already signed the HyperChat Service Agreement.
            </p>
            <Button onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">HyperChat Service Agreement</h1>
        <p className="text-muted-foreground">Please review and sign the service agreement below</p>
      </div>

      {/* Contract Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Service Agreement
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-4 text-sm">
          <div className="text-center font-bold text-lg mb-6">
            HYPERCHAT SERVICE AGREEMENT
          </div>
          
          <p>
            This Service Agreement ("Agreement") is entered into on this [Date] by and between:
          </p>
          
          <p>
            <strong>HyperChat</strong>, a product operated under MSME-registered business (Udyam Registration No. UDYAM-UP-29-0175530) ("Service Provider"), and <strong>[Client Name]</strong>, ("Client").
          </p>

          <div>
            <h3 className="font-bold text-base mb-2">1. Scope of Services</h3>
            <p>HyperChat agrees to provide the following services to the Client:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A personalized stream donation page.</li>
              <li>Customizable alert options including GIF alerts and Voice Message Alerts.</li>
              <li>OBS-compatible integration.</li>
              <li>Hosting and support as outlined in this agreement.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base mb-2">2. Pricing and Payment Terms</h3>
            
            <div className="ml-4">
              <p><strong>One-Time Fees:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Stream Page Setup: ₹399</li>
                <li>Custom GIF Upload Feature: ₹250</li>
                <li>Voice Message Donation Feature: ₹350</li>
              </ul>

              <p className="mt-3"><strong>Bundle Offer:</strong></p>
              <ul className="list-disc pl-6">
                <li>Complete Creator Pack (Page + GIF + Voice): ₹899</li>
              </ul>

              <p className="mt-3"><strong>Monthly Hosting & Support Fee:</strong></p>
              <p className="ml-4">₹500/month<br/>
              Includes cloud hosting, storage for GIFs/voice alerts, platform maintenance, feature updates, and technical support.</p>

              <p className="mt-3"><strong>Revenue Sharing:</strong><br/>
              HyperChat retains 5% of each donation made through the platform as a service fee. The remaining 95% is credited to the Client.</p>

              <p className="mt-3"><strong>Payment Mode:</strong><br/>
              All payments will be processed via UPI to the official HyperChat payment account.</p>

              <p className="mt-3"><strong>Billing Cycle:</strong><br/>
              The monthly maintenance fee is billed in advance every month on the same date as the initial setup payment.</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base mb-2">3. Service Conditions</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Custom features will be activated only after the respective one-time payments are received.</li>
              <li>Hosting and access to premium features will be suspended if the monthly payment is not received within 7 days of due date.</li>
              <li>Voice and GIF uploads are subject to content guidelines; inappropriate or harmful content will be removed without refund.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base mb-2">4. Ownership and Usage</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>The client retains full rights to their content.</li>
              <li>HyperChat reserves the right to showcase anonymized, non-identifiable use cases for promotional purposes.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base mb-2">5. Termination</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Either party may terminate the agreement with 7 days written notice.</li>
              <li>Upon termination, hosted services and custom alert features will be discontinued.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base mb-2">6. Legal Recognition</h3>
            <p>HyperChat operates under Indian laws as an MSME registered business (Udyam Registration No. UDYAM-UP-29-0175530), and this agreement shall be governed accordingly.</p>
          </div>
        </CardContent>
      </Card>

      {/* Signing Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Sign Agreement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Signature Type</Label>
              <RadioGroup
                value={signatureType}
                onValueChange={(value) => setSignatureType(value as "signature" | "name")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="signature" id="signature" />
                  <Label htmlFor="signature">Digital Signature</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="name" id="name-sign" />
                  <Label htmlFor="name-sign">Sign with Name</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature-input">
                {signatureType === "signature" ? "Digital Signature" : "Type Your Name"}
              </Label>
              <Input
                id="signature-input"
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={signatureType === "signature" ? "Enter your signature" : "Type your name to sign"}
                required
                className={signatureType === "signature" ? "font-cursive text-lg" : ""}
              />
              <p className="text-xs text-muted-foreground">
                {signatureType === "signature" 
                  ? "This will serve as your digital signature" 
                  : "Your typed name will serve as your signature"}
              </p>
            </div>

            <Separator />

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p><strong>Signing Date:</strong> {new Date().toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                  <p><strong>Account Type:</strong> {adminType?.replace('_', ' ').toUpperCase()}</p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing Contract..." : "Sign Agreement"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractSigning;
