import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { FileText, PenTool, User, CheckCircle, Lock, Download, RotateCcw } from "lucide-react";
import { authenticateStreamer } from "@/services/streamerAuth";
import jsPDF from "jspdf";

const ContractSigning = () => {
  const [name, setName] = useState("");
  const [signatureType, setSignatureType] = useState<"signature" | "name">("signature");
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminType, setAdminType] = useState<string | null>(null);
  const [hasExistingContract, setHasExistingContract] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  
  // Login form states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Signature canvas states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
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
        setContractData(data);
        setName(data.streamer_name);
        setSignature(data.signature);
      }
    } catch (error) {
      console.error("Error checking existing contract:", error);
    }
  };

  // Signature canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current && hasSignature) {
      const signatureData = canvasRef.current.toDataURL();
      setSignature(signatureData);
    }
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      setSignature("");
    }
  };

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && signatureType === 'signature') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [signatureType]);

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
        description: signatureType === "signature" ? "Please draw your signature." : "Please enter your name for signing.",
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

      // Refresh contract data
      checkExistingContract(adminType!);

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

  const downloadContract = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Set up the PDF styling
    doc.setFontSize(16);
    doc.text('HyperChat Service Agreement', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    let yPosition = 40;
    
    // Contract content
    const contractText = [
      'This Service Agreement ("Agreement") is entered into by and between:',
      '',
      'HyperChat Technologies Pvt. Ltd., a registered MSME under',
      'Udyam Registration No. UP29D0047796, with its principal office at Ghaziabad,',
      `and ${name},`,
      'collectively referred to as the "Parties".',
      '',
      `Effective Date: ${currentDate}`,
      '',
      '1. Purpose',
      'HyperChat provides a fan engagement and donation tool designed for live',
      'streamers. This Agreement outlines the terms under which the Streamer',
      'may access and use the HyperChat platform.',
      '',
      '2. Grant of Access',
      'HyperChat grants the Streamer a non-exclusive, non-transferable license',
      'to use its platform for the purpose of enhancing live streams and enabling',
      'fan support through premium messages, real-time reactions, and related features.',
      '',
      '3. Streamer Responsibilities',
      'The Streamer agrees to:',
      '• Integrate HyperChat into their live streaming sessions',
      '• Maintain an active and respectful community environment',
      '• Not misuse the platform for offensive, illegal, or prohibited content',
      '',
      '4. Revenue Sharing',
      'Revenue will be shared as follows:',
      `• ${contractData?.streamer_cut || 95}% to the Streamer`,
      `• ${contractData?.hyperchat_cut || 5}% to HyperChat (as platform/service fee)`,
      '',
      '5. Term & Termination',
      'This Agreement continues until terminated by either party with 7 days written notice.',
      '',
      'IN WITNESS WHEREOF, the parties have executed this Agreement.',
      '',
      'HyperChat Technologies Pvt. Ltd.',
      'By: Ankit Kumar',
      'Title: Founder',
      `Date: ${currentDate}`,
      '',
      `Streamer: ${name}`,
      `Signature: ${signature.startsWith('data:') ? '[Digital Signature Applied]' : signature}`,
      `Date: ${currentDate}`
    ];

    contractText.forEach((line) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 10, yPosition);
      yPosition += 7;
    });

    // Save the PDF
    doc.save(`HyperChat_Agreement_${adminType}_${currentDate.replace(/\//g, '-')}.pdf`);
    
    toast({
      title: "Contract Downloaded",
      description: "Your signed contract has been downloaded as PDF.",
    });
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
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground mb-6">
              You have already signed the HyperChat Service Agreement on{" "}
              {contractData?.signed_at ? new Date(contractData.signed_at).toLocaleDateString('en-IN') : 'N/A'}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={downloadContract}>
                <Download className="mr-2 h-4 w-4" />
                Download Contract PDF
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Return to Home
              </Button>
            </div>
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
                  <Label htmlFor="signature">Draw Signature</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="name" id="name-sign" />
                  <Label htmlFor="name-sign">Sign with Name</Label>
                </div>
              </RadioGroup>
            </div>

            {signatureType === "signature" ? (
              <div className="space-y-4">
                <Label>Draw Your Signature</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="border border-gray-200 rounded cursor-crosshair w-full max-w-md mx-auto block"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ touchAction: 'none' }}
                  />
                  <div className="flex justify-center mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSignature}
                      disabled={!hasSignature}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear Signature
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Draw your signature in the box above using your mouse or finger
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="signature-input">Type Your Name</Label>
                <Input
                  id="signature-input"
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your name to sign"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your typed name will serve as your signature
                </p>
              </div>
            )}

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
