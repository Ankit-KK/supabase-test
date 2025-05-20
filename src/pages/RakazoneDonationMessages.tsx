import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { Link as LinkIcon } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const RakazoneDonationMessages = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [obsLink, setObsLink] = useState<string>("");
  const [showMessages, setShowMessages] = useState<boolean>(() => {
    // Get saved preference from localStorage or default to true
    const savedPreference = localStorage.getItem("rakazoneShowMessages");
    return savedPreference !== null ? savedPreference === "true" : true;
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/rakazone/login",
    authKey: "rakazoneAuth"
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
        .from("rakazone_donations")
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
      .channel('rakazone-donations-dashboard')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'rakazone_donations',
          filter: 'payment_status=eq.success'
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

  // Load the show messages preference from localStorage on component mount
  useEffect(() => {
    const savedPref = localStorage.getItem("rakazoneShowMessages");
    if (savedPref !== null) {
      setShowMessages(savedPref === "true");
    }
    
    // Restore the OBS link from sessionStorage if it exists
    const currentLink = sessionStorage.getItem("rakazoneObsLink");
    if (currentLink) {
      setObsLink(currentLink);
    }
  }, []);

  // Generate or retrieve OBS link
  const setupObsLink = () => {
    // Check if there's an existing OBS link in sessionStorage
    let storedLink = sessionStorage.getItem("rakazoneObsLink");
    
    if (!storedLink) {
      // Generate a new link with the current timestamp
      regenerateObsLink();
    }
  };

  const regenerateObsLink = () => {
    // Generate a new link with a random string (not UUID format)
    const randomId = Math.random().toString(36).substring(2, 15);
    
    // Include current timestamp in the URL to mark when link was generated
    const timestamp = Date.now();
    const newLink = `${window.location.origin}/rakazone/obs/${randomId}?showMessages=${showMessages}&timestamp=${timestamp}`;
    
    // Save the timestamp separately for easier access
    sessionStorage.setItem("rakazoneObsLinkTimestamp", timestamp.toString());
    
    // Save the new link
    sessionStorage.setItem("rakazoneObsLink", newLink);
    setObsLink(newLink);
    
    toast({
      title: "OBS Link Regenerated",
      description: "Your new OBS link has been created. Only new donations will be shown.",
    });
  };

  const copyObsLink = () => {
    navigator.clipboard.writeText(obsLink);
    toast({
      title: "Link Copied",
      description: "OBS link copied to clipboard",
    });
  };

  useEffect(() => {
    setupObsLink();
  }, []);

  // Handle toggle of show messages preference
  const handleToggleMessages = () => {
    const newValue = !showMessages;
    setShowMessages(newValue);
    localStorage.setItem("rakazoneShowMessages", newValue.toString());
    
    // Update the OBS link with the new preference
    if (obsLink) {
      const url = new URL(obsLink);
      url.searchParams.set("showMessages", newValue.toString());
      
      // Keep the timestamp parameter if it exists
      const timestamp = sessionStorage.getItem("rakazoneObsLinkTimestamp");
      if (timestamp) {
        url.searchParams.set("timestamp", timestamp);
      }
      
      const newLink = url.toString();
      sessionStorage.setItem("rakazoneObsLink", newLink);
      setObsLink(newLink);
    }
    
    toast({
      title: newValue ? "Messages Enabled" : "Messages Disabled",
      description: newValue ? "Messages will now be shown in OBS" : "Messages will be hidden in OBS",
    });
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
    <div className="container mx-auto py-8 px-4"
      style={{
        background: "linear-gradient(rgba(30, 0, 0, 0.95), rgba(30, 0, 0, 0.95))",
        minHeight: "100vh",
      }}
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/495326f5-a1c6-47a4-9e68-39f8372910a9.png" 
            alt="Rakazone Gaming" 
            className="h-12 w-12"
          />
          <h1 className="text-3xl font-bold text-red-500">Donation Messages</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/rakazone/dashboard")} className="border-red-500/30 hover:bg-red-900/20">
            Back to Dashboard
          </Button>
        </div>
      </div>

      <Card className="mb-8 border-red-500/30 bg-black/40">
        <CardHeader>
          <CardTitle className="text-red-400">OBS Link</CardTitle>
          <CardDescription>Use this link as a browser source in OBS to display donation messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="show-messages" 
                  checked={showMessages} 
                  onCheckedChange={handleToggleMessages} 
                  className="data-[state=checked]:bg-red-500"
                />
                <Label htmlFor="show-messages">Show donation messages in OBS</Label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input 
                value={obsLink} 
                readOnly 
                className="font-mono text-sm flex-1 bg-black/50 border-red-500/30"
              />
              <Button variant="outline" onClick={copyObsLink} className="border-red-500/30 hover:bg-red-900/20">
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={regenerateObsLink} className="border-red-500/30 hover:bg-red-900/20">
                Generate New
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This link will display your donation messages in real-time for your stream.</p>
              <p>Each message will show for 15 seconds before moving to the next one.</p>
              <p><strong>Note:</strong> When you regenerate the link, only new donations that arrive after the link is created will be shown.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-500/30 bg-black/40">
        <CardHeader>
          <CardTitle className="text-red-400">Recent Donation Messages</CardTitle>
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
            <div className="rounded-md border border-red-500/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/50 border-b border-red-500/20">
                    <TableHead className="text-red-400">Date</TableHead>
                    <TableHead className="text-red-400">Name</TableHead>
                    <TableHead className="text-red-400">Amount</TableHead>
                    <TableHead className="text-red-400 w-[40%]">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id} className="border-b border-red-500/10">
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

export default RakazoneDonationMessages;
