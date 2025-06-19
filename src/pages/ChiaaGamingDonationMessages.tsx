import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuthProtection } from "@/hooks/useSecureAuthProtection";
import { createSecureObsToken, logSecurityEvent } from "@/services/secureAuth";
import { Link as LinkIcon, ExternalLink, Image, Mic, Volume2 } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
  gif_url?: string;
  voice_url?: string;
  custom_sound_name?: string;
  custom_sound_url?: string;
  include_sound?: boolean;
}

const ChiaaGamingDonationMessages = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [obsLink, setObsLink] = useState<string>("");
  const [goalObsLink, setGoalObsLink] = useState<string>("");
  const [showMessages, setShowMessages] = useState<boolean>(true);
  const [showGoal, setShowGoal] = useState<boolean>(false);
  const [goalName, setGoalName] = useState<string>("Gaming Goal");
  const [goalTarget, setGoalTarget] = useState<number>(1000);
  const navigate = useNavigate();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  
  // Use secure auth protection
  const { isAuthenticated } = useSecureAuthProtection({
    redirectTo: "/chiaa_gaming/login",
    requiredAdminType: "chiaa_gaming"
  });

  // Function to fetch donations data with security logging
  const fetchDonations = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      
      // Log data access attempt
      await logSecurityEvent('ACCESS_DONATIONS_DATA', { table: 'chiaa_gaming_donations' });
      
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

      if (error) {
        await logSecurityEvent('FAILED_DATA_ACCESS', { 
          table: 'chiaa_gaming_donations', 
          error: error.message 
        });
        throw error;
      }
      
      if (data && data.length > 0) {
        setDonations(data);
        console.log("Donation messages refreshed at:", new Date().toLocaleTimeString(), "count:", data.length);
        await logSecurityEvent('SUCCESSFUL_DATA_ACCESS', { 
          table: 'chiaa_gaming_donations', 
          count: data.length 
        });
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
    
    fetchDonations();
    
    // Set up real-time subscription with improved handling
    const setupRealtimeSubscription = () => {
      // Clean up existing channel first
      if (channelRef.current) {
        console.log('Cleaning up existing messages channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create a unique channel name for messages
      const channelName = `chiaa-gaming-messages-realtime-${Date.now()}`;
      
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
          async (payload) => {
            console.log('New donation received in messages via realtime:', payload);
            const newDonation = payload.new as Donation;
            
            // Log realtime event
            await logSecurityEvent('REALTIME_DONATION_RECEIVED', { 
              table: 'chiaa_gaming_donations',
              recordId: newDonation.id 
            });
            
            // Check if donation is from today
            const donationDate = new Date(newDonation.created_at).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            
            if (donationDate === today) {
              setDonations(prev => {
                // Check if donation already exists to prevent duplicates
                const exists = prev.some(d => d.id === newDonation.id);
                if (exists) {
                  console.log('Donation already exists, skipping duplicate');
                  return prev;
                }
                console.log('Adding new donation to messages list');
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
          console.log('Messages realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to chiaa_gaming_donations messages realtime updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Messages channel subscription error');
            setTimeout(setupRealtimeSubscription, 2000);
          } else if (status === 'TIMED_OUT') {
            console.error('Messages channel subscription timed out');
            setTimeout(setupRealtimeSubscription, 2000);
          }
        });

      console.log('Real-time subscription set up for chiaa_gaming_donations messages');
    };

    // Setup subscription with a delay
    const timer = setTimeout(setupRealtimeSubscription, 1000);

    return () => {
      clearTimeout(timer);
      if (channelRef.current) {
        console.log('Messages component unmounting, cleaning up channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [toast, isAuthenticated]);

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

  // Generate secure OBS links with tokens
  const setupObsLinks = async () => {
    try {
      // Create secure tokens for OBS access
      const messagesToken = await createSecureObsToken('chiaa_gaming');
      const goalToken = await createSecureObsToken('chiaa_gaming');
      
      if (messagesToken && goalToken) {
        const messagesLink = `${window.location.origin}/chiaa_gaming/obs/secure?token=${messagesToken}&showMessages=${showMessages}&showGoal=false`;
        const goalLink = `${window.location.origin}/chiaa_gaming/obs/secure?token=${goalToken}&showMessages=false&showGoal=true&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
        
        setObsLink(messagesLink);
        setGoalObsLink(goalLink);
        
        // Store tokens securely (short term)
        sessionStorage.setItem("chiaa_gaming_messages_token", messagesToken);
        sessionStorage.setItem("chiaa_gaming_goal_token", goalToken);
        
        await logSecurityEvent('OBS_TOKENS_CREATED', { table: 'obs_access_tokens' });
      } else {
        toast({
          variant: "destructive",
          title: "Security Error",
          description: "Failed to create secure OBS tokens",
        });
      }
    } catch (error) {
      console.error("Failed to setup secure OBS links:", error);
      toast({
        variant: "destructive",
        title: "Security Error",
        description: "Failed to setup secure OBS access",
      });
    }
  };

  const regenerateMessagesLink = async () => {
    const token = await createSecureObsToken('chiaa_gaming');
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create secure token",
      });
      return;
    }
    
    const newLink = `${window.location.origin}/chiaa_gaming/obs/secure?token=${token}&showMessages=${showMessages}&showGoal=false`;
    setObsLink(newLink);
    sessionStorage.setItem("chiaa_gaming_messages_token", token);
    
    await logSecurityEvent('OBS_TOKEN_REGENERATED', { table: 'obs_access_tokens', type: 'messages' });
    
    toast({
      title: "Secure Link Regenerated",
      description: "Your new secure donation messages OBS link has been created",
    });
  };

  const regenerateGoalLink = async () => {
    const token = await createSecureObsToken('chiaa_gaming');
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create secure token",
      });
      return;
    }
    
    const newLink = `${window.location.origin}/chiaa_gaming/obs/secure?token=${token}&showMessages=false&showGoal=true&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
    setGoalObsLink(newLink);
    sessionStorage.setItem("chiaa_gaming_goal_token", token);
    
    await logSecurityEvent('OBS_TOKEN_REGENERATED', { table: 'obs_access_tokens', type: 'goal' });
    
    toast({
      title: "Secure Link Regenerated",
      description: "Your new secure goal OBS link has been created",
    });
  };

  // ... keep existing code (copy functions, open functions, toggle handlers, etc.)
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

  const handleToggleMessages = () => {
    const newValue = !showMessages;
    setShowMessages(newValue);
    localStorage.setItem("chiaaGamingShowMessages", newValue.toString());
    
    toast({
      title: newValue ? "Messages Enabled" : "Messages Disabled",
      description: newValue ? "Messages will now be shown in OBS" : "Messages will be hidden in OBS",
    });
  };

  const handleToggleGoal = () => {
    const newValue = !showGoal;
    setShowGoal(newValue);
    localStorage.setItem("chiaaGamingShowGoal", newValue.toString());
    
    toast({
      title: newValue ? "Goal Enabled" : "Goal Disabled",
      description: newValue ? "Goal will now be shown in OBS" : "Goal will be hidden in OBS",
    });
  };

  const handleGoalNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setGoalName(newName);
    localStorage.setItem("chiaaGamingGoalName", newName);
  };

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

  const renderPremiumFeatures = (donation: Donation) => {
    // ... keep existing code (premium features rendering)
    if (donation.message && donation.message.trim()) {
      return donation.message;
    }
    
    const features = [];
    
    if (donation.gif_url) {
      features.push("GIF shared");
    }
    
    if (donation.voice_url) {
      features.push("Voice message");
    }
    
    if (donation.custom_sound_name || donation.custom_sound_url) {
      features.push(`Custom sound: ${donation.custom_sound_name || 'Audio'}`);
    }
    
    return features.length > 0 ? features.join(", ") : "No message";
  };

  const renderMediaBadges = (donation: Donation) => {
    // ... keep existing code (media badges rendering)
    const badges = [];
    
    if (donation.gif_url) {
      badges.push(
        <Badge key="gif" variant="secondary" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50">
          <Image className="w-3 h-3 mr-1" />
          GIF
        </Badge>
      );
    }
    
    if (donation.voice_url) {
      badges.push(
        <Badge key="voice" variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/50">
          <Mic className="w-3 h-3 mr-1" />
          Voice
        </Badge>
      );
    }
    
    if (donation.custom_sound_name || donation.custom_sound_url) {
      badges.push(
        <Badge key="sound" variant="secondary" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/50">
          <Volume2 className="w-3 h-3 mr-1" />
          Sound
        </Badge>
      );
    }
    
    return badges;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-pink-100 text-center">
          <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
          <p>Please wait while we verify your credentials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-pink-100">Secure Donation Messages</h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/chiaa_gaming/dashboard")}
              className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
            >
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
                  <div className="checkbox-wrapper-10">
                    <input 
                      checked={showMessages} 
                      type="checkbox" 
                      id="show-messages" 
                      className="tgl tgl-flip"
                      onChange={handleToggleMessages}
                    />
                    <label 
                      htmlFor="show-messages" 
                      data-tg-on="On" 
                      data-tg-off="Off" 
                      className="tgl-btn"
                    ></label>
                  </div>
                  <Label htmlFor="show-messages" className="text-pink-200">Show donation messages in OBS</Label>
                </div>
              </div>

              {/* Secure Messages OBS Link Section */}
              <div className="space-y-4 p-4 bg-pink-500/10 rounded-lg border border-pink-500/30">
                <div className="flex items-center justify-between">
                  <Label className="text-pink-200 text-lg font-medium">Secure Donation Messages OBS</Label>
                  <div className="flex items-center space-x-2">
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
                </div>
                <Input 
                  value={obsLink} 
                  readOnly 
                  className="font-mono text-sm bg-black/30 border-pink-500/50 text-pink-100"
                />
                <p className="text-sm text-pink-300/70">
                  🔒 This secure link uses time-limited tokens and will display donation messages. Each message shows for 12 seconds.
                </p>
              </div>

              {/* Goal Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="checkbox-wrapper-10">
                    <input 
                      checked={showGoal} 
                      type="checkbox" 
                      id="show-goal" 
                      className="tgl tgl-flip"
                      onChange={handleToggleGoal}
                    />
                    <label 
                      htmlFor="show-goal" 
                      data-tg-on="On" 
                      data-tg-off="Off" 
                      className="tgl-btn"
                    ></label>
                  </div>
                  <Label htmlFor="show-goal" className="text-pink-200">Show donation goal in OBS</Label>
                </div>
              </div>

              {/* Goal Configuration */}
              {showGoal && (
                <div className="space-y-4 p-4 bg-pink-500/10 rounded-lg border border-pink-500/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="goal-name" className="text-pink-200">Goal Name</Label>
                      <Input
                        id="goal-name"
                        value={goalName}
                        onChange={handleGoalNameChange}
                        placeholder="Enter goal name"
                        className="mt-1 bg-black/30 border-pink-500/50 text-pink-100 placeholder:text-pink-300/70"
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
                        className="mt-1 bg-black/30 border-pink-500/50 text-pink-100 placeholder:text-pink-300/70"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Secure Goal OBS Link Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-pink-200 text-lg font-medium">Secure Goal OBS</Label>
                      <div className="flex items-center space-x-2">
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
                    </div>
                    <Input 
                      value={goalObsLink} 
                      readOnly 
                      className="font-mono text-sm bg-black/30 border-pink-500/50 text-pink-100"
                    />
                    <p className="text-sm text-pink-300/70">
                      🔒 This secure link uses time-limited tokens and will only display the donation goal with real-time progress.
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
              Messages are updated in real-time with secure access controls (Today's donations only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4 text-pink-200">Loading donation messages...</p>
            ) : donations.length === 0 ? (
              <p className="text-center py-4 text-pink-300">No donation messages found</p>
            ) : (
              <div className="rounded-md border border-pink-500/30">
                <Table>
                  <TableHeader>
                    <TableRow className="border-pink-500/30">
                      <TableHead className="text-pink-200">Date</TableHead>
                      <TableHead className="text-pink-200">Name</TableHead>
                      <TableHead className="text-pink-200">Amount</TableHead>
                      <TableHead className="text-pink-200">Media</TableHead>
                      <TableHead className="w-[40%] text-pink-200">Message/Features</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((donation) => (
                      <TableRow key={donation.id} className="border-pink-500/20 hover:bg-pink-500/10">
                        <TableCell className="text-pink-100">{formatDate(donation.created_at)}</TableCell>
                        <TableCell className="text-pink-100">{donation.name}</TableCell>
                        <TableCell className="text-pink-400 font-semibold">₹{Number(donation.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {renderMediaBadges(donation)}
                          </div>
                        </TableCell>
                        <TableCell className="text-pink-100">{renderPremiumFeatures(donation)}</TableCell>
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
