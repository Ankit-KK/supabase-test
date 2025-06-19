
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { Link as LinkIcon, ExternalLink } from "lucide-react";
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
}

const AnkitDonationMessages = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [obsLink, setObsLink] = useState<string>("");
  const [goalObsLink, setGoalObsLink] = useState<string>("");
  const [showMessages, setShowMessages] = useState<boolean>(true);
  const [showGoal, setShowGoal] = useState<boolean>(false);
  const [goalName, setGoalName] = useState<string>("Support Goal");
  const [goalTarget, setGoalTarget] = useState<number>(500);
  const navigate = useNavigate();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/ankit/login",
    authKey: "ankitAuth"
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
        .from("ankit_donations")
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
        }));
        
        setDonations(sanitizedData);
        console.log("Donation messages refreshed at:", new Date().toLocaleTimeString(), "count:", sanitizedData.length);
      } else {
        console.log("No donation messages found during refresh");
        setDonations([]);
      }
      
      setLastRefresh(new Date());
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
    const setupRealtimeSubscription = () => {
      // Clean up existing channel first
      if (channelRef.current) {
        console.log('Cleaning up existing channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create a unique channel name using secure token
      const channelName = `ankit-donations-dashboard-${generateObsToken()}`;
      
      channelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'ankit_donations',
            filter: 'payment_status=eq.success'
          },
          (payload) => {
            const newDonation = payload.new as Donation;
            console.log("New donation received in dashboard via realtime:", newDonation);
            
            // Sanitize the new donation data
            const sanitizedDonation = {
              ...newDonation,
              name: validateAndSanitizeInput(newDonation.name, 100),
              message: validateAndSanitizeInput(newDonation.message, 500),
            };
            
            // Check if donation is from today
            const donationDate = new Date(sanitizedDonation.created_at).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            
            if (donationDate === today) {
              setDonations(prev => {
                // Check if donation already exists to prevent duplicates
                const exists = prev.some(d => d.id === sanitizedDonation.id);
                if (exists) return prev;
                return [sanitizedDonation, ...prev];
              });
              toast({
                title: "New Donation Received",
                description: `${sanitizedDonation.name} donated ₹${Number(sanitizedDonation.amount).toLocaleString()}`,
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('Dashboard realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to ankit_donations dashboard updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Dashboard channel subscription error');
            SecurityMonitor.logSecurityEvent({
              type: SECURITY_EVENTS.SUSPICIOUS_REQUEST,
              severity: 'low',
              details: 'Realtime channel subscription error',
            });
          } else if (status === 'TIMED_OUT') {
            console.error('Dashboard channel subscription timed out');
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
  }, [toast]);

  // Load preferences from localStorage on component mount
  useEffect(() => {
    const savedPref = localStorage.getItem("ankitShowMessages");
    if (savedPref !== null) {
      setShowMessages(savedPref === "true");
    }
    
    const savedGoalPref = localStorage.getItem("ankitShowGoal");
    if (savedGoalPref !== null) {
      setShowGoal(savedGoalPref === "true");
    }
    
    const savedGoalName = localStorage.getItem("ankitGoalName");
    if (savedGoalName) {
      // Sanitize saved goal name
      setGoalName(validateAndSanitizeInput(savedGoalName, 100));
    }
    
    const savedGoalTarget = localStorage.getItem("ankitGoalTarget");
    if (savedGoalTarget) {
      const target = Number(savedGoalTarget);
      if (target > 0 && target <= 1000000) { // Reasonable limit
        setGoalTarget(target);
      }
    }
  }, []);

  // Generate or retrieve OBS links with secure tokens
  const setupObsLinks = () => {
    let storedMessagesLink = sessionStorage.getItem("ankitObsLink");
    let storedGoalLink = sessionStorage.getItem("ankitGoalObsLink");
    
    // Validate existing links have secure tokens
    if (storedMessagesLink) {
      try {
        const url = new URL(storedMessagesLink);
        const pathSegments = url.pathname.split('/');
        const tokenSegment = pathSegments[pathSegments.length - 1];
        if (!validateSecureId(tokenSegment)) {
          storedMessagesLink = null; // Regenerate if token is not secure
        }
      } catch {
        storedMessagesLink = null;
      }
    }
    
    if (storedGoalLink) {
      try {
        const url = new URL(storedGoalLink);
        const pathSegments = url.pathname.split('/');
        const tokenSegment = pathSegments[pathSegments.length - 1];
        if (!validateSecureId(tokenSegment)) {
          storedGoalLink = null; // Regenerate if token is not secure
        }
      } catch {
        storedGoalLink = null;
      }
    }
    
    if (!storedMessagesLink) {
      const secureToken = generateObsToken();
      storedMessagesLink = `${window.location.origin}/ankit/obs/${secureToken}?showMessages=${showMessages}&showGoal=false`;
      sessionStorage.setItem("ankitObsLink", storedMessagesLink);
    }
    
    if (!storedGoalLink) {
      const secureToken = generateObsToken();
      storedGoalLink = `${window.location.origin}/ankit/obs/${secureToken}?showMessages=false&showGoal=true&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
      sessionStorage.setItem("ankitGoalObsLink", storedGoalLink);
    }
    
    setObsLink(storedMessagesLink);
    setGoalObsLink(storedGoalLink);
  };

  const regenerateMessagesLink = () => {
    const secureToken = generateObsToken();
    const newLink = `${window.location.origin}/ankit/obs/${secureToken}?showMessages=${showMessages}&showGoal=false`;
    
    sessionStorage.setItem("ankitObsLink", newLink);
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
    const newLink = `${window.location.origin}/ankit/obs/${secureToken}?showMessages=false&showGoal=true&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
    
    sessionStorage.setItem("ankitGoalObsLink", newLink);
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

  useEffect(() => {
    setupObsLinks();
  }, []);

  // Handle toggle of show messages preference
  const handleToggleMessages = () => {
    const newValue = !showMessages;
    setShowMessages(newValue);
    localStorage.setItem("ankitShowMessages", newValue.toString());
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
    localStorage.setItem("ankitShowGoal", newValue.toString());
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
    localStorage.setItem("ankitGoalName", sanitizedValue);
    updateGoalLink();
  };

  // Handle goal target change with validation
  const handleGoalTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTarget = Number(e.target.value);
    
    // Validate reasonable limits
    if (newTarget > 0 && newTarget <= 1000000) {
      setGoalTarget(newTarget);
      localStorage.setItem("ankitGoalTarget", newTarget.toString());
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
      sessionStorage.setItem("ankitObsLink", newLink);
      setObsLink(newLink);
    } catch (error) {
      console.error('Error updating messages link:', error);
      regenerateMessagesLink();
    }
  };

  // Update goal link with current settings
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
      sessionStorage.setItem("ankitGoalObsLink", newLink);
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Donation Messages</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/ankit/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>OBS Configuration</CardTitle>
          <CardDescription>Configure what appears in your OBS overlay</CardDescription>
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
                <Label htmlFor="show-messages">Show donation messages in OBS</Label>
              </div>
            </div>

            {/* Messages OBS Link */}
            <div className="space-y-2">
              <Label>Donation Messages OBS Link</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  value={obsLink} 
                  readOnly 
                  className="font-mono text-sm flex-1"
                />
                <Button variant="outline" onClick={copyMessagesLink}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" onClick={regenerateMessagesLink}>
                  Generate New
                </Button>
                <Button variant="outline" onClick={openMessagesInNewTab}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
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
                <Label htmlFor="show-goal">Show donation goal in OBS</Label>
              </div>
            </div>

            {/* Goal Configuration */}
            {showGoal && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="goal-name">Goal Name</Label>
                    <Input
                      id="goal-name"
                      value={goalName}
                      onChange={handleGoalNameChange}
                      placeholder="Enter goal name"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="goal-target">Target Amount (₹)</Label>
                    <Input
                      id="goal-target"
                      type="number"
                      value={goalTarget}
                      onChange={handleGoalTargetChange}
                      placeholder="Enter target amount"
                      className="mt-1"
                      min="1"
                      max="1000000"
                    />
                  </div>
                </div>

                {/* Goal OBS Link */}
                <div className="space-y-2">
                  <Label>Goal OBS Link</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={goalObsLink} 
                      readOnly 
                      className="font-mono text-sm flex-1"
                    />
                    <Button variant="outline" onClick={copyGoalLink}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" onClick={regenerateGoalLink}>
                      Generate New
                    </Button>
                    <Button variant="outline" onClick={openGoalInNewTab}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This link will only display the donation goal with real-time progress.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Donation Messages</CardTitle>
          <CardDescription>
            Messages are updated in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Loading donation messages...</p>
          ) : donations.length === 0 ? (
            <p className="text-center py-4">No donation messages found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-[40%]">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>{formatDate(donation.created_at)}</TableCell>
                      <TableCell dangerouslySetInnerHTML={{ __html: escapeHtml(donation.name) }} />
                      <TableCell>₹{Number(donation.amount).toLocaleString()}</TableCell>
                      <TableCell dangerouslySetInnerHTML={{ __html: escapeHtml(donation.message) }} />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnkitDonationMessages;
