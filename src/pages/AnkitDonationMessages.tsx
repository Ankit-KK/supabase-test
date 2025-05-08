
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { ArrowUp, RefreshCw, Link } from "lucide-react";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/ankit/login",
    authKey: "ankitAuth"
  });

  // Function to fetch donations data
  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ankit_donations")
        .select("*")
        .eq("payment_status", "failed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setDonations(data);
        console.log("Donation messages refreshed at:", new Date().toLocaleTimeString(), "count:", data.length);
      } else {
        console.log("No donation messages found during refresh");
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

  // Generate or retrieve OBS link
  const setupObsLink = () => {
    // Check if there's an existing OBS link in sessionStorage
    let storedLink = sessionStorage.getItem("ankitObsLink");
    
    if (!storedLink) {
      // Generate a new link with a random ID
      const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      storedLink = `${window.location.origin}/ankit/obs/${randomId}`;
      sessionStorage.setItem("ankitObsLink", storedLink);
    }
    
    setObsLink(storedLink);
  };

  const regenerateObsLink = () => {
    // Generate a new link with a random ID
    const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newLink = `${window.location.origin}/ankit/obs/${randomId}`;
    
    // Save the new link
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

  useEffect(() => {
    // Fetch initial donations data
    fetchDonations();
    setupObsLink();

    // Set up automatic refresh every 2 minutes (120,000 ms)
    const refreshInterval = setInterval(() => {
      fetchDonations();
    }, 120000);

    // Clean up interval on component unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const handleManualRefresh = () => {
    fetchDonations();
    toast({
      title: "Data refreshed",
      description: "Donation messages have been updated",
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Donation Messages</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/ankit/dashboard")}>
            Back to Dashboard
          </Button>
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button variant="outline" onClick={handleManualRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>OBS Link</CardTitle>
          <CardDescription>Use this link as a browser source in OBS to display donation messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <Input 
                value={obsLink} 
                readOnly 
                className="font-mono text-sm flex-1"
              />
              <Button variant="outline" onClick={copyObsLink}>
                <Link className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={regenerateObsLink}>
                Generate New
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This link will display your donation messages in real-time for your stream.</p>
              <p>Each message will show for 15 seconds before moving to the next one.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Donation Messages</CardTitle>
          <CardDescription>
            Auto-refreshes every 2 minutes - Last updated at {lastRefresh.toLocaleTimeString()}
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
