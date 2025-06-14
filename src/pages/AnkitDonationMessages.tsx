import React, { useState, useEffect } from "react";
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
import { ObsConfigProvider, useObsConfig } from "@/contexts/ObsConfigContext";

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
  const [showMessages, setShowMessages] = useState<boolean>(true);
  const [showGoal, setShowGoal] = useState<boolean>(false);
  const [goalName, setGoalName] = useState<string>("Support Goal");
  const [goalTarget, setGoalTarget] = useState<number>(500);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/ankit/login",
    authKey: "ankitAuth"
  });

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
        .eq("payment_status", "success") // Changed from "failed" to "success"
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
      
      setLastRefresh(new Date());
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
    const channel = supabase
      .channel('ankit-donations-dashboard')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ankit_donations',
          filter: 'payment_status=eq.success' // Changed from "failed" to "success"
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log("New donation received in dashboard via realtime:", newDonation);
          
          // Check if donation is from today
          const donationDate = new Date(newDonation.created_at).toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];
          
          if (donationDate === today) {
            setDonations(prev => [newDonation, ...prev]);
            toast({
              title: "New Donation Received",
              description: `${newDonation.name} donated ₹${Number(newDonation.amount).toLocaleString()}`,
            });
          }
        }
      )
      .subscribe();

    console.log("Dashboard realtime subscription set up for payment_status=success");
    
    // Fetch donations once when component mounts
    fetchDonations();
    
    return () => {
      supabase.removeChannel(channel);
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
      setGoalName(savedGoalName);
    }
    
    const savedGoalTarget = localStorage.getItem("ankitGoalTarget");
    if (savedGoalTarget) {
      setGoalTarget(Number(savedGoalTarget));
    }
    
    // Store the preference on URL for OBS to check
    const currentLink = sessionStorage.getItem("ankitObsLink");
    if (currentLink) {
      const hasParam = currentLink.includes("?");
      const baseLink = hasParam ? currentLink.split("?")[0] : currentLink;
      const newLink = `${baseLink}?showMessages=${savedPref !== "false"}&showGoal=${savedGoalPref === "true"}&goalName=${encodeURIComponent(savedGoalName || "Support Goal")}&goalTarget=${savedGoalTarget || 500}`;
      sessionStorage.setItem("ankitObsLink", newLink);
      setObsLink(newLink);
    }
  }, []);

  // Generate or retrieve OBS link
  const setupObsLink = () => {
    let storedLink = sessionStorage.getItem("ankitObsLink");
    
    if (!storedLink) {
      const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      storedLink = `${window.location.origin}/ankit/obs/${randomId}?showMessages=${showMessages}&showGoal=${showGoal}&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
      sessionStorage.setItem("ankitObsLink", storedLink);
    }
    
    setObsLink(storedLink);
  };

  const regenerateObsLink = () => {
    const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newLink = `${window.location.origin}/ankit/obs/${randomId}?showMessages=${showMessages}&showGoal=${showGoal}&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
    
    sessionStorage.setItem("ankitObsLink", newLink);
    setObsLink(newLink);
    
    toast({
      title: "OBS Link Regenerated",
      description: "Your new OBS link has been created",
    });
  };

  const copyObsLink = () => {
    navigator.clipboard.writeText(obsLink);
    toast({
      title: "Link Copied",
      description: "OBS link copied to clipboard",
    });
  };

  const openObsInNewTab = () => {
    if (obsLink) {
      window.open(obsLink, '_blank');
    }
  };

  useEffect(() => {
    setupObsLink();
  }, []);

  // Handle toggle of show messages preference
  const handleToggleMessages = () => {
    const newValue = !showMessages;
    setShowMessages(newValue);
    localStorage.setItem("ankitShowMessages", newValue.toString());
    updateObsLink();
    
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
    updateObsLink();
    
    toast({
      title: newValue ? "Goal Enabled" : "Goal Disabled",
      description: newValue ? "Goal will now be shown in OBS" : "Goal will be hidden in OBS",
    });
  };

  // Handle goal name change
  const handleGoalNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setGoalName(newName);
    localStorage.setItem("ankitGoalName", newName);
    updateObsLink();
  };

  // Handle goal target change
  const handleGoalTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTarget = Number(e.target.value);
    setGoalTarget(newTarget);
    localStorage.setItem("ankitGoalTarget", newTarget.toString());
    updateObsLink();
  };

  // Update OBS link with current settings
  const updateObsLink = () => {
    const hasParam = obsLink.includes("?");
    const baseLink = hasParam ? obsLink.split("?")[0] : obsLink;
    const newLink = `${baseLink}?showMessages=${showMessages}&showGoal=${showGoal}&goalName=${encodeURIComponent(goalName)}&goalTarget=${goalTarget}`;
    sessionStorage.setItem("ankitObsLink", newLink);
    setObsLink(newLink);
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
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* OBS Link */}
            <div className="flex items-center space-x-2">
              <Input 
                value={obsLink} 
                readOnly 
                className="font-mono text-sm flex-1"
              />
              <Button variant="outline" onClick={copyObsLink}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={regenerateObsLink}>
                Generate New
              </Button>
              <Button variant="outline" onClick={openObsInNewTab}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This link will display your donation messages and goal in real-time for your stream.</p>
              <p>Each message will show for 12 seconds before moving to the next one.</p>
            </div>
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
                      <TableCell>{donation.name}</TableCell>
                      <TableCell>₹{Number(donation.amount).toLocaleString()}</TableCell>
                      <TableCell>{donation.message}</TableCell>
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
