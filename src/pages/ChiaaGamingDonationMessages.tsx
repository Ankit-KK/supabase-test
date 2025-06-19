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
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { Link as LinkIcon, ExternalLink, Image, Mic, Volume2 } from "lucide-react";
import { generateObsToken, validateSecureId } from "@/utils/secureIdGenerator";
import { validateAndSanitizeInput, sanitizeUrl, escapeHtml } from "@/utils/xssProtection";
import { CSRFProtection } from "@/utils/csrfProtection";
import { SecurityMonitor, SECURITY_EVENTS } from "@/utils/securityMonitoring";

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
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/chiaa_gaming/login",
    authKey: "chiaaGamingAuth"
  });

  // Initialize CSRF protection
  useEffect(() => {
    CSRFProtection.generateToken();
  }, []);

  // Function to fetch donations data - only from today
  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      
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
        // Sanitize donation data to prevent XSS
        const sanitizedData = data.map(donation => ({
          ...donation,
          name: validateAndSanitizeInput(donation.name, 100),
          message: validateAndSanitizeInput(donation.message, 500),
          custom_sound_name: donation.custom_sound_name 
            ? validateAndSanitizeInput(donation.custom_sound_name, 100)
            : undefined,
          gif_url: donation.gif_url ? sanitizeUrl(donation.gif_url) : undefined,
          voice_url: donation.voice_url ? sanitizeUrl(donation.voice_url) : undefined,
          custom_sound_url: donation.custom_sound_url 
            ? sanitizeUrl(donation.custom_sound_url) 
            : undefined,
        }));
        
        setDonations(sanitizedData);
        console.log("Donation messages refreshed at:", new Date().toLocaleTimeString(), "count:", sanitizedData.length);
      } else {
        console.log("No donation messages found during refresh");
        setDonations([]);
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
      SecurityMonitor.logSecurityEvent({
        type: SECURITY_EVENTS.SUSPICIOUS_REQUEST,
        severity: 'medium',
        details: 'Failed to fetch donations: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });
      
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
    fetchDonations();
    
    // Set up real-time subscription with improved handling
    const setupRealtimeSubscription = () => {
      // Clean up existing channel first
      if (channelRef.current) {
        console.log('Cleaning up existing messages channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create a unique channel name for messages using secure ID
      const channelName = `chiaa-gaming-messages-realtime-${generateObsToken()}`;
      
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
            console.log('New donation received in messages via realtime:', payload);
            const newDonation = payload.new as Donation;
            
            // Sanitize the new donation data
            const sanitizedDonation = {
              ...newDonation,
              name: validateAndSanitizeInput(newDonation.name, 100),
              message: validateAndSanitizeInput(newDonation.message, 500),
              custom_sound_name: newDonation.custom_sound_name 
                ? validateAndSanitizeInput(newDonation.custom_sound_name, 100)
                : undefined,
              gif_url: newDonation.gif_url ? sanitizeUrl(newDonation.gif_url) : undefined,
              voice_url: newDonation.voice_url ? sanitizeUrl(newDonation.voice_url) : undefined,
              custom_sound_url: newDonation.custom_sound_url 
                ? sanitizeUrl(newDonation.custom_sound_url) 
                : undefined,
            };
            
            // Check if donation is from today
            const donationDate = new Date(sanitizedDonation.created_at).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            
            if (donationDate === today) {
              setDonations(prev => {
                // Check if donation already exists to prevent duplicates
                const exists = prev.some(d => d.id === sanitizedDonation.id);
                if (exists) {
                  console.log('Donation already exists, skipping duplicate');
                  return prev;
                }
                console.log('Adding new donation to messages list');
                return [sanitizedDonation, ...prev];
              });
              
              toast({
                title: "New Donation Received",
                description: `${sanitizedDonation.name} donated ₹${Number(sanitizedDonation.amount).toLocaleString()}`,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chiaa_gaming_donations',
            filter: 'payment_status=eq.success'
          },
          (payload) => {
            console.log('Donation updated in messages via realtime:', payload);
            const updatedDonation = payload.new as Donation;
            
            // Sanitize the updated donation data
            const sanitizedDonation = {
              ...updatedDonation,
              name: validateAndSanitizeInput(updatedDonation.name, 100),
              message: validateAndSanitizeInput(updatedDonation.message, 500),
              custom_sound_name: updatedDonation.custom_sound_name 
                ? validateAndSanitizeInput(updatedDonation.custom_sound_name, 100)
                : undefined,
              gif_url: updatedDonation.gif_url ? sanitizeUrl(updatedDonation.gif_url) : undefined,
              voice_url: updatedDonation.voice_url ? sanitizeUrl(updatedDonation.voice_url) : undefined,
              custom_sound_url: updatedDonation.custom_sound_url 
                ? sanitizeUrl(updatedDonation.custom_sound_url) 
                : undefined,
            };
            
            // Check if donation is from today
            const donationDate = new Date(sanitizedDonation.created_at).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            
            if (donationDate === today) {
              setDonations(prev => 
                prev.map(donation => 
                  donation.id === sanitizedDonation.id ? sanitizedDonation : donation
                )
              );
            }
          }
        )
        .subscribe((status) => {
          console.log('Messages realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to chiaa_gaming_donations messages realtime updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Messages channel subscription error');
            SecurityMonitor.logSecurityEvent({
              type: SECURITY_EVENTS.SUSPICIOUS_REQUEST,
              severity: 'low',
              details: 'Realtime channel subscription error',
            });
            // Retry subscription after a delay
            setTimeout(setupRealtimeSubscription, 2000);
          } else if (status === 'TIMED_OUT') {
            console.error('Messages channel subscription timed out');
            // Retry subscription after a delay
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
  }, [toast]);

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
      // Sanitize saved goal name
      setGoalName(validateAndSanitizeInput(savedGoalName, 100));
    }
    
    const savedGoalTarget = localStorage.getItem("chiaaGamingGoalTarget");
    if (savedGoalTarget) {
      const target = Number(savedGoalTarget);
      if (target > 0 && target <= 1000000) { // Reasonable limit
        setGoalTarget(target);
      }
    }
  }, []);

  // Generate or retrieve OBS links with secure tokens
  const setupObsLinks = () => {
    let storedMessagesLink = sessionStorage.getItem("chiaaGamingObsLink");
    let storedGoalLink = sessionStorage.getItem("chiaaGamingGoalObsLink");
    
    // Validate existing links have secure tokens
    if (storedMessagesLink) {
      const url = new URL(storedMessagesLink);
      const pathSegments = url.pathname.split('/');
      const tokenSegment = pathSegments[pathSegments.length - 1];
      if (!validateSecureId(tokenSegment)) {
        storedMessagesLink = null; // Regenerate if token is not secure
      }
    }
    
    if (storedGoalLink) {
      const url = new URL(storedGoalLink);
      const pathSegments = url.pathname.split('/');
      const tokenSegment = pathSegments[pathSegments.length - 1];
      if (!validateSecureId(tokenSegment)) {
        storedGoalLink = null; // Regenerate if token is not secure
      }
    }
    
    if (!storedMessagesLink) {
      const secureToken = generateObsToken();
      storedMessagesLink = `${window.location.origin}/chiaa_gaming/obs/${secureToken}?showMessages=${showMessages}&showGoal=false`;
      sessionStorage.setItem("chiaaGamingObsLink", storedMessagesLink);
    }
    
    if (!storedGoalLink) {
      const secureToken = generateObsToken();
      storedGoalLink = `${window.location.origin}/chiaa_gaming/obs/${secureToken}?showMessages=false&showGoal=true&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
      sessionStorage.setItem("chiaaGamingGoalObsLink", storedGoalLink);
    }
    
    setObsLink(storedMessagesLink);
    setGoalObsLink(storedGoalLink);
  };

  const regenerateMessagesLink = () => {
    const secureToken = generateObsToken();
    const newLink = `${window.location.origin}/chiaa_gaming/obs/${secureToken}?showMessages=${showMessages}&showGoal=false`;
    
    sessionStorage.setItem("chiaaGamingObsLink", newLink);
    setObsLink(newLink);
    
    SecurityMonitor.logSecurityEvent({
      type: 'obs_link_regenerated',
      severity: 'low',
      details: 'Messages OBS link regenerated',
    });
    
    toast({
      title: "Messages Link Regenerated",
      description: "Your new donation messages OBS link has been created",
    });
  };

  const regenerateGoalLink = () => {
    const secureToken = generateObsToken();
    const newLink = `${window.location.origin}/chiaa_gaming/obs/${secureToken}?showMessages=false&showGoal=true&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
    
    sessionStorage.setItem("chiaaGamingGoalObsLink", newLink);
    setGoalObsLink(newLink);
    
    SecurityMonitor.logSecurityEvent({
      type: 'obs_link_regenerated',
      severity: 'low',
      details: 'Goal OBS link regenerated',
    });
    
    toast({
      title: "Goal Link Regenerated",
      description: "Your new goal OBS link has been created",
    });
  };

  // Handle toggle of show messages preference
  const handleToggleMessages = () => {
    const newValue = !showMessages;
    setShowMessages(newValue);
    localStorage.setItem("chiaaGamingShowMessages", newValue.toString());
    updateMessagesLink();
    
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
    updateGoalLink();
    
    toast({
      title: newValue ? "Goal Enabled" : "Goal Disabled",
      description: newValue ? "Goal will now be shown in OBS" : "Goal will be hidden in OBS",
    });
  };

  // Handle goal name change with validation
  const handleGoalNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = validateAndSanitizeInput(rawValue, 100);
    
    if (rawValue !== sanitizedValue) {
      SecurityMonitor.logSecurityEvent({
        type: SECURITY_EVENTS.XSS_ATTEMPT,
        severity: 'medium',
        details: 'Potentially malicious input detected in goal name',
      });
    }
    
    setGoalName(sanitizedValue);
    localStorage.setItem("chiaaGamingGoalName", sanitizedValue);
    updateGoalLink();
  };

  // Handle goal target change with validation
  const handleGoalTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTarget = Number(e.target.value);
    
    // Validate reasonable limits
    if (newTarget > 0 && newTarget <= 1000000) {
      setGoalTarget(newTarget);
      localStorage.setItem("chiaaGamingGoalTarget", newTarget.toString());
      updateGoalLink();
    } else if (newTarget > 1000000) {
      SecurityMonitor.logSecurityEvent({
        type: SECURITY_EVENTS.SUSPICIOUS_REQUEST,
        severity: 'low',
        details: 'Unusually high goal target entered',
      });
    }
  };

  // Update messages link with current settings
  const updateMessagesLink = () => {
    if (!obsLink) return;
    
    try {
      const url = new URL(obsLink);
      const pathSegments = url.pathname.split('/');
      const token = pathSegments[pathSegments.length - 1];
      
      if (!validateSecureId(token)) {
        regenerateMessagesLink();
        return;
      }
      
      const newLink = `${url.origin}${url.pathname}?showMessages=${showMessages}&showGoal=false`;
      sessionStorage.setItem("chiaaGamingObsLink", newLink);
      setObsLink(newLink);
    } catch (error) {
      console.error('Error updating messages link:', error);
      regenerateMessagesLink();
    }
  };

  //Update goal link with current settings
  const updateGoalLink = () => {
    if (!goalObsLink) return;
    
    try {
      const url = new URL(goalObsLink);
      const pathSegments = url.pathname.split('/');
      const token = pathSegments[pathSegments.length - 1];
      
      if (!validateSecureId(token)) {
        regenerateGoalLink();
        return;
      }
      
      const newLink = `${url.origin}${url.pathname}?showMessages=false&showGoal=true&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
      sessionStorage.setItem("chiaaGamingGoalObsLink", newLink);
      setGoalObsLink(newLink);
    } catch (error) {
      console.error('Error updating goal link:', error);
      regenerateGoalLink();
    }
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
    // Always show the user's message if it exists, regardless of premium features
    // Message is already sanitized when data is fetched
    if (donation.message && donation.message.trim()) {
      return donation.message;
    }
    
    // If no message but has premium features, show what premium features were used
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

  const copyMessagesLink = () => {
    navigator.clipboard.writeText(obsLink);
    toast({
      title: "Link Copied",
      description: "Donation messages OBS link copied to clipboard",
    });
  };

  const copyGoalLink = () => {
    navigator.clipboard.writeText(goalObsLink);
    toast({
      title: "Link Copied",
      description: "Goal OBS link copied to clipboard",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-pink-100">Donation Messages</h1>
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
            <CardTitle className="text-pink-100">OBS Configuration</CardTitle>
            <CardDescription className="text-pink-300">Configure what appears in your OBS overlay</CardDescription>
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

              {/* Messages OBS Link Section */}
              <div className="space-y-4 p-4 bg-pink-500/10 rounded-lg border border-pink-500/30">
                <div className="flex items-center justify-between">
                  <Label className="text-pink-200 text-lg font-medium">Donation Messages OBS</Label>
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
                  This link will display donation messages. Each message shows for 12 seconds.
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
                        maxLength={100}
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
                        max="1000000"
                      />
                    </div>
                  </div>

                  {/* Goal OBS Link Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-pink-200 text-lg font-medium">Goal OBS</Label>
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
                      This link will only display the donation goal with real-time progress.
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
              Messages are updated in real-time (Today's donations only)
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
                        <TableCell className="text-pink-100" dangerouslySetInnerHTML={{ __html: escapeHtml(donation.name) }} />
                        <TableCell className="text-pink-400 font-semibold">₹{Number(donation.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {renderMediaBadges(donation)}
                          </div>
                        </TableCell>
                        <TableCell className="text-pink-100" dangerouslySetInnerHTML={{ __html: escapeHtml(renderPremiumFeatures(donation)) }} />
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
