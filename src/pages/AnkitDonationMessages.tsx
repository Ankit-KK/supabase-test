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

  // Load the show messages preference from localStorage on component mount
  useEffect(() => {
    const savedPref = localStorage.getItem("ankitShowMessages");
    if (savedPref !== null) {
      setShowMessages(savedPref === "true");
    }
    
    // Store the preference on URL for OBS to check
    const currentLink = sessionStorage.getItem("ankitObsLink");
    if (currentLink) {
      const hasParam = currentLink.includes("?");
      const baseLink = hasParam ? currentLink.split("?")[0] : currentLink;
      const newLink = `${baseLink}?showMessages=${savedPref !== "false"}`;
      sessionStorage.setItem("ankitObsLink", newLink);
      setObsLink(newLink);
    }
  }, []);

  // Generate or retrieve OBS link
  const setupObsLink = () => {
    // Check if there's an existing OBS link in sessionStorage
    let storedLink = sessionStorage.getItem("ankitObsLink");
    
    if (!storedLink) {
      // Generate a new link with a random ID
      const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      storedLink = `${window.location.origin}/ankit/obs/${randomId}?showMessages=${showMessages}`;
      sessionStorage.setItem("ankitObsLink", storedLink);
    }
    
    setObsLink(storedLink);
  };

  const regenerateObsLink = () => {
    // Generate a new link with a random ID
    const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newLink = `${window.location.origin}/ankit/obs/${randomId}?showMessages=${showMessages}`;
    
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

  const openObsInNewTab = () => {
    if (obsLink) {
      window.open(obsLink, '_blank');
    }
  };

  const copyHtmlCode = () => {
    const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SVG Checkbox Animation</title>
  <style>
    /* From Uiverse.io by SelfMadeSystem */
    body {
      background-color: #222; /* Optional: for better contrast with white stroke */
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }

    .container {
      cursor: pointer;
    }

    .container input {
      display: none;
    }

    .container svg {
      overflow: visible;
    }

    .path {
      fill: none;
      stroke: white;
      stroke-width: 6;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease;
      stroke-dasharray: 241 9999999;
      stroke-dashoffset: 0;
    }

    .container input:checked ~ svg .path {
      stroke-dasharray: 70.5096664428711 9999999;
      stroke-dashoffset: -262.2723388671875;
    }
  </style>
</head>
<body>

  <label class="container">
    <input type="checkbox">
    <svg viewBox="0 0 64 64" height="2em" width="2em">
      <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
            pathLength="575.0541381835938"
            class="path"></path>
    </svg>
  </label>

</body>
</html>`;
    
    navigator.clipboard.writeText(htmlCode);
    toast({
      title: "HTML Code Copied",
      description: "SVG checkbox animation HTML copied to clipboard",
    });
  };

  useEffect(() => {
    setupObsLink();
  }, []);

  // Handle toggle of show messages preference
  const handleToggleMessages = () => {
    const newValue = !showMessages;
    setShowMessages(newValue);
    localStorage.setItem("ankitShowMessages", newValue.toString());
    
    // Update the OBS link with the new preference
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
          <CardTitle>OBS Link</CardTitle>
          <CardDescription>Use this link as a browser source in OBS to display donation messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <label className="container cursor-pointer" onClick={handleToggleMessages}>
                  <input 
                    type="checkbox" 
                    checked={showMessages} 
                    onChange={() => {}} // Handled by the label click
                    className="hidden"
                  />
                  <svg 
                    viewBox="0 0 64 64" 
                    height="2em" 
                    width="2em"
                    className="overflow-visible"
                  >
                    <path 
                      d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
                      pathLength="575.0541381835938"
                      className={`
                        fill-none stroke-white stroke-[6] rounded-[round] 
                        transition-all duration-500 ease-out
                        ${showMessages 
                          ? 'stroke-dasharray-[70.5096664428711_9999999] stroke-dashoffset-[-262.2723388671875]' 
                          : 'stroke-dasharray-[241_9999999] stroke-dashoffset-0'
                        }
                      `}
                      style={{
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeDasharray: showMessages ? '70.5096664428711 9999999' : '241 9999999',
                        strokeDashoffset: showMessages ? '-262.2723388671875' : '0'
                      }}
                    />
                  </svg>
                </label>
                <Label htmlFor="show-messages" className="cursor-pointer" onClick={handleToggleMessages}>
                  Show donation messages in OBS
                </Label>
              </div>
            </div>
            
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
              <p>This link will display your donation messages in real-time for your stream.</p>
              <p>Each message will show for 12 seconds before moving to the next one.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>SVG Checkbox Animation for OBS</CardTitle>
          <CardDescription>Copy this HTML code to use as a browser source in OBS for animated checkboxes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="bg-gray-100 rounded p-4 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SVG Checkbox Animation</title>
  <style>
    /* From Uiverse.io by SelfMadeSystem */
    body {
      background-color: #222; /* Optional: for better contrast with white stroke */
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }

    .container {
      cursor: pointer;
    }

    .container input {
      display: none;
    }

    .container svg {
      overflow: visible;
    }

    .path {
      fill: none;
      stroke: white;
      stroke-width: 6;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease;
      stroke-dasharray: 241 9999999;
      stroke-dashoffset: 0;
    }

    .container input:checked ~ svg .path {
      stroke-dasharray: 70.5096664428711 9999999;
      stroke-dashoffset: -262.2723388671875;
    }
  </style>
</head>
<body>

  <label class="container">
    <input type="checkbox">
    <svg viewBox="0 0 64 64" height="2em" width="2em">
      <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
            pathLength="575.0541381835938"
            class="path"></path>
    </svg>
  </label>

</body>
</html>`}
              </pre>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={copyHtmlCode}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy HTML Code
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Use this HTML code as a browser source in OBS to display an animated SVG checkbox.</p>
              <p>The checkbox will animate when clicked and can be used as an overlay element.</p>
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
