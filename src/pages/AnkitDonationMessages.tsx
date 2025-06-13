
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { Link as LinkIcon, ExternalLink, Monitor, ArrowLeft } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const AnkitDonationMessages = () => {
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [obsLink, setObsLink] = useState<string>("");
  const [showMessages, setShowMessages] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/ankit/login",
    authKey: "ankitAuth"
  });

  // Function to fetch recent donations
  const fetchRecentDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("ankit_donations")
        .select("*")
        .eq("payment_status", "success")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentDonations(data || []);
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: "Could not retrieve recent donations",
      });
    }
  };

  // Set up real-time subscription for new donations
  useEffect(() => {
    const channel = supabase
      .channel('ankit-messages-dashboard')
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
          console.log("New donation received:", newDonation);
          setRecentDonations(prev => [newDonation, ...prev.slice(0, 4)]);
          toast({
            title: "New Donation Received",
            description: `${newDonation.name} donated ₹${Number(newDonation.amount).toLocaleString()}`,
          });
        }
      )
      .subscribe();

    fetchRecentDonations();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Load preferences and generate OBS link
  useEffect(() => {
    const savedPref = localStorage.getItem("ankitShowMessages");
    if (savedPref !== null) {
      setShowMessages(savedPref === "true");
    }
    
    let storedLink = sessionStorage.getItem("ankitObsLink");
    if (!storedLink) {
      const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      storedLink = `${window.location.origin}/ankit/obs/${randomId}?showMessages=${savedPref !== "false"}`;
      sessionStorage.setItem("ankitObsLink", storedLink);
    }
    setObsLink(storedLink);
  }, []);

  const regenerateObsLink = () => {
    const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newLink = `${window.location.origin}/ankit/obs/${randomId}?showMessages=${showMessages}`;
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

  const handleToggleMessages = () => {
    const newValue = !showMessages;
    setShowMessages(newValue);
    localStorage.setItem("ankitShowMessages", newValue.toString());
    
    const hasParam = obsLink.includes("?");
    const baseLink = hasParam ? obsLink.split("?")[0] : obsLink;
    const newLink = `${baseLink}?showMessages=${newValue}`;
    sessionStorage.setItem("ankitObsLink", newLink);
    setObsLink(newLink);
    
    toast({
      title: newValue ? "Messages Enabled" : "Messages Disabled",
      description: newValue ? "Messages will now be shown in OBS" : "Messages will be hidden in OBS",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Monitor className="h-8 w-8" />
          OBS Integration
        </h1>
        <Button variant="outline" onClick={() => navigate("/ankit/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* OBS Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle>OBS Browser Source</CardTitle>
            <CardDescription>Add this URL as a browser source in OBS to display donation alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-messages" 
                checked={showMessages} 
                onCheckedChange={handleToggleMessages} 
              />
              <Label htmlFor="show-messages">Show donation messages in alerts</Label>
            </div>
            
            <div className="space-y-2">
              <Label>OBS Browser Source URL</Label>
              <div className="flex gap-2">
                <Input 
                  value={obsLink} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button variant="outline" onClick={copyObsLink}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={regenerateObsLink} variant="outline" className="flex-1">
                Generate New Link
              </Button>
              <Button onClick={openObsInNewTab} className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>📋 <strong>How to use:</strong></p>
              <p>1. Copy the URL above</p>
              <p>2. In OBS, add a "Browser Source"</p>
              <p>3. Paste the URL and set dimensions (recommended: 800x200)</p>
              <p>4. Donation alerts will appear automatically!</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Donations Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
            <CardDescription>Latest 5 successful donations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent donations
              </p>
            ) : (
              <div className="space-y-3">
                {recentDonations.map((donation) => (
                  <div key={donation.id} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{donation.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(donation.created_at)}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-green-600 mb-1">
                        {formatCurrency(donation.amount)}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{donation.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnkitDonationMessages;
