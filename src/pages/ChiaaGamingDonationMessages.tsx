
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuthProtection } from "@/hooks/useSecureAuthProtection";
import { createSecureObsToken, logSecurityEvent } from "@/services/secureAuth";
import { Link as LinkIcon, ExternalLink, Shield } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const ChiaaGamingDonationMessages = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [obsLink, setObsLink] = useState<string>("");
  const [goalObsLink, setGoalObsLink] = useState<string>("");
  const [showMessages, setShowMessages] = useState<boolean>(true);
  const [showGoal, setShowGoal] = useState<boolean>(false);
  const [goalName, setGoalName] = useState<string>("Support Goal");
  const [goalTarget, setGoalTarget] = useState<number>(500);
  const navigate = useNavigate();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  
  // Use secure auth protection
  const { isAuthenticated, adminType } = useSecureAuthProtection({
    redirectTo: "/chiaa_gaming/login",
    requiredAdminType: "chiaa_gaming"
  });

  // Function to fetch donations data - only from today
  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      
      // Log access to donation messages
      await logSecurityEvent('ACCESS_DONATION_MESSAGES', { table: 'chiaa_gaming_donations' });
      
      // Get today's date in ISO format for filtering
      const today = new Date();
      const todayStart = `${today.toISOString().split('T')[0]}T00:00:00`;
      const todayEnd = `${today.toISOString().split('T')[0]}T23:59:59`;
      
      const { data, error } = await supabase
        .from("chiaa_gaming_donations")
        .select("*")
        .eq("payment_status", "success")
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setDonations(data);
        console.log("Donation messages refreshed at:", new Date().toLocaleTimeString(), "count:", data.length);
      } else {
        console.log("No donation messages found during refresh");
        setDonations([]);
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: "Could not retrieve donation messages",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription for new donations
  useEffect(() => {
    if (!isAuthenticated) return;

    const setupRealtimeSubscription = () => {
      // Clean up existing channel first
      if (channelRef.current) {
        console.log('Cleaning up existing channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create a unique channel name
      const channelName = `chiaa-gaming-donations-dashboard-${Date.now()}`;
      
      channelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chiaa_gaming_donations',
            filter: 'payment_status=eq.success'
          },
          (payload) => {
            const newDonation = payload.new as Donation;
            console.log("New donation received in dashboard via realtime:", newDonation);
            
            // Check if donation is from today
            const donationDate = new Date(newDonation.created_at).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            
            if (donationDate === today) {
              setDonations(prev => {
                // Check if donation already exists to prevent duplicates
                const exists = prev.some(d => d.id === newDonation.id);
                if (exists) return prev;
                return [newDonation, ...prev];
              });
              toast({
                title: "New Donation Received",
                description: `${newDonation.name} donated ₹${Number(newDonation.amount).toLocaleString()}`,
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('Dashboard realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to chiaa_gaming_donations dashboard updates');
          }
        });

      console.log("Dashboard realtime subscription set up for payment_status=success");
    };

    // Setup subscription with a small delay
    const timer = setTimeout(setupRealtimeSubscription, 500);
    
    // Fetch donations once when component mounts
    fetchDonations();
    
    return () => {
      clearTimeout(timer);
      if (channelRef.current) {
        console.log('Component unmounting, cleaning up dashboard channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, toast]);

  // Load preferences from localStorage on component mount
  useEffect(() => {
    const savedPref = localStorage.getItem("chiaaGamingShowMessages");
    if (savedPref !== null) {
      setShowMessages(savedPref === "true");
    }
    
    const savedGoalPref = localStorage.getItem("chiaaGamingShowGoal");
    if (savedGoalPref !== null) {
      setShowGoal(savedGoalPref === "true");
    }
    
    const savedGoalName = localStorage.getItem("chiaaGamingGoalName");
    if (savedGoalName) {
      setGoalName(savedGoalName);
    }
    
    const savedGoalTarget = localStorage.getItem("chiaaGamingGoalTarget");
    if (savedGoalTarget) {
      setGoalTarget(Number(savedGoalTarget));
    }
  }, []);

  // Generate secure OBS links using tokens
  const setupObsLinks = async () => {
    try {
      // Create secure tokens for OBS access
      const messagesToken = await createSecureObsToken('chiaa_gaming');
      const goalToken = await createSecureObsToken('chiaa_gaming');
      
      if (messagesToken && goalToken) {
        const messagesLink = `${window.location.origin}/chiaa_gaming/obs/${messagesToken}?showMessages=${showMessages}&showGoal=false`;
        const goalLink = `${window.location.origin}/chiaa_gaming/obs/${goalToken}?showMessages=false&showGoal=true&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
        
        setObsLink(messagesLink);
        setGoalObsLink(goalLink);
        
        // Cache tokens in session storage
        sessionStorage.setItem("chiaa_gaming_obs_token", messagesToken);
        sessionStorage.setItem("chiaa_gaming_goal_obs_token", goalToken);
      }
    } catch (error) {
      console.error('Error setting up OBS links:', error);
      toast({
        variant: "destructive",
        title: "Failed to generate OBS links",
        description: "Could not create secure OBS access tokens",
      });
    }
  };

  const regenerateMessagesLink = async () => {
    try {
      const newToken = await createSecureObsToken('chiaa_gaming');
      if (newToken) {
        const newLink = `${window.location.origin}/chiaa_gaming/obs/${newToken}?showMessages=${showMessages}&showGoal=false`;
        setObsLink(newLink);
        sessionStorage.setItem("chiaa_gaming_obs_token", newToken);
        
        toast({
          title: "Messages Link Regenerated",
          description: "Your new secure donation messages OBS link has been created",
        });
      }
    } catch (error) {
      console.error('Error regenerating messages link:', error);
      toast({
        variant: "destructive",
        title: "Failed to regenerate link",
        description: "Could not create new secure OBS token",
      });
    }
  };

  const regenerateGoalLink = async () => {
    try {
      const newToken = await createSecureObsToken('chiaa_gaming');
      if (newToken) {
        const newLink = `${window.location.origin}/chiaa_gaming/obs/${newToken}?showMessages=false&showGoal=true&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
        setGoalObsLink(newLink);
        sessionStorage.setItem("chiaa_gaming_goal_obs_token", newToken);
        
        toast({
          title: "Goal Link Regenerated",
          description: "Your new secure goal OBS link has been created",
        });
      }
    } catch (error) {
      console.error('Error regenerating goal link:', error);
      toast({
        variant: "destructive",
        title: "Failed to regenerate link",
        description: "Could not create new secure OBS token",
      });
    }
  };

  const copyMessagesLink = () => {
    navigator.clipboard.writeText(obsLink);
    toast({
      title: "Link Copied",
      description: "Secure donation messages OBS link copied to clipboard",
    });
  };

  const copyGoalLink = () => {
    navigator.clipboard.writeText(goalObsLink);
    toast({
      title: "Link Copied",
      description: "Secure goal OBS link copied to clipboard",
    });
  };

  const openMessagesInNewTab = () => {
    if (obsLink) {
      window.open(obsLink, '_blank');
    }
  };

  const openGoalInNewTab = () => {
    if (goalObsLink) {
      window.open(goalObsLink, '_blank');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setupObsLinks();
    }
  }, [isAuthenticated]);

  // Handle toggle of show messages preference
  const handleToggleMessages = () => {
    const newValue = !showMessages;
    setShowMessages(newValue);
    localStorage.setItem("chiaaGamingShowMessages", newValue.toString());
    
    toast({
      title: newValue ? "Messages Enabled" : "Messages Disabled",
      description: newValue ? "Messages will now be shown in OBS" : "Messages will be hidden in OBS",
    });
  };

  // Handle toggle of show goal preference
  const handleToggleGoal = () => {
    const newValue = !showGoal;
    setShowGoal(newValue);
    localStorage.setItem("chiaaGamingShowGoal", newValue.toString());
    
    toast({
      title: newValue ? "Goal Enabled" : "Goal Disabled",
      description: newValue ? "Goal will now be shown in OBS" : "Goal will be hidden in OBS",
    });
  };

  // Handle goal name change
  const handleGoalNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setGoalName(newName);
    localStorage.setItem("chiaaGamingGoalName", newName);
  };

  // Handle goal target change
  const handleGoalTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTarget = Number(e.target.value);
    setGoalTarget(newTarget);
    localStorage.setItem("chiaaGamingGoalTarget", newTarget.toString());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-pink-100 text-center">
          <Shield className="mx-auto h-12 w-12 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
          <p>Please wait while we verify your secure credentials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pink-100">Secure Donation Messages</h1>
            <div className="flex items-center mt-2 space-x-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/50">
                <Shield className="w-3 h-3 mr-1" />
                Authenticated: {adminType}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/chiaa_gaming/dashboard")} className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20">
              Back to Dashboard
            </Button>
          </div>
        </div>

        <Card className="mb-8 bg-black/50 border-pink-500/30">
          <CardHeader>
            <CardTitle className="text-pink-100">Secure OBS Configuration</CardTitle>
            <CardDescription className="text-pink-300">
              Configure what appears in your OBS overlay with secure token-based access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-6">
              {/* Messages Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input 
                    checked={showMessages} 
                    type="checkbox" 
                    id="show-messages" 
                    className="rounded"
                    onChange={handleToggleMessages}
                  />
                  <Label htmlFor="show-messages" className="text-pink-200">Show donation messages in OBS</Label>
                </div>
              </div>

              {/* Messages OBS Link */}
              <div className="space-y-2">
                <Label className="text-pink-200">Secure Donation Messages OBS Link</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={obsLink} 
                    readOnly 
                    className="font-mono text-sm flex-1 bg-black/30 border-pink-500/50 text-pink-100"
                  />
                  <Button variant="outline" onClick={copyMessagesLink} className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={regenerateMessagesLink} className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20">
                    Generate New
                  </Button>
                  <Button variant="outline" onClick={openMessagesInNewTab} className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </div>
                <p className="text-sm text-pink-300/70 flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  This link uses secure token-based authentication. Each message shows for 12 seconds.
                </p>
              </div>

              {/* Goal Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input 
                    checked={showGoal} 
                    type="checkbox" 
                    id="show-goal" 
                    className="rounded"
                    onChange={handleToggleGoal}
                  />
                  <Label htmlFor="show-goal" className="text-pink-200">Show donation goal in OBS</Label>
                </div>
              </div>

              {/* Goal Configuration */}
              {showGoal && (
                <div className="space-y-4 p-4 bg-pink-900/20 rounded-lg border border-pink-500/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="goal-name" className="text-pink-200">Goal Name</Label>
                      <Input
                        id="goal-name"
                        value={goalName}
                        onChange={handleGoalNameChange}
                        placeholder="Enter goal name"
                        className="mt-1 bg-black/30 border-pink-500/50 text-pink-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="goal-target" className="text-pink-200">Target Amount (₹)</Label>
                      <Input
                        id="goal-target"
                        type="number"
                        value={goalTarget}
                        onChange={handleGoalTargetChange}
                        placeholder="Enter target amount"
                        className="mt-1 bg-black/30 border-pink-500/50 text-pink-100"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Goal OBS Link */}
                  <div className="space-y-2">
                    <Label className="text-pink-200">Secure Goal OBS Link</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={goalObsLink} 
                        readOnly 
                        className="font-mono text-sm flex-1 bg-black/30 border-pink-500/50 text-pink-100"
                      />
                      <Button variant="outline" onClick={copyGoalLink} className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button variant="outline" onClick={regenerateGoalLink} className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20">
                        Generate New
                      </Button>
                      <Button variant="outline" onClick={openGoalInNewTab} className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </Button>
                    </div>
                    <p className="text-sm text-pink-300/70 flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      This link uses secure token-based authentication and displays real-time goal progress.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-pink-500/30">
          <CardHeader>
            <CardTitle className="text-pink-100">Recent Donation Messages</CardTitle>
            <CardDescription className="text-pink-300">
              Messages are updated in real-time with secure authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4 text-pink-200">Loading donation messages...</p>
            ) : donations.length === 0 ? (
              <p className="text-center py-4 text-pink-200">No donation messages found</p>
            ) : (
              <div className="rounded-md border border-pink-500/30">
                <Table>
                  <TableHeader>
                    <TableRow className="border-pink-500/30">
                      <TableHead className="text-pink-200">Date</TableHead>
                      <TableHead className="text-pink-200">Name</TableHead>
                      <TableHead className="text-pink-200">Amount</TableHead>
                      <TableHead className="w-[40%] text-pink-200">Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((donation) => (
                      <TableRow key={donation.id} className="border-pink-500/30">
                        <TableCell className="text-pink-100">{formatDate(donation.created_at)}</TableCell>
                        <TableCell className="text-pink-100">{donation.name}</TableCell>
                        <TableCell className="text-pink-100">₹{Number(donation.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-pink-100">{donation.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChiaaGamingDonationMessages;
