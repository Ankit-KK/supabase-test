
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Donation {
  id: string;
  name: string;
  message: string;
  amount: number;
  created_at: string;
}

const MackleDonationMessages = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use the auth protection hook
  useAuthProtection({
    redirectTo: "/mackle/login",
    authKey: "mackleAuth"
  });

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const { data, error } = await supabase
          .from("mackle_donations")
          .select("id, name, message, amount, created_at")
          .eq("payment_status", "success")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setDonations(data || []);
      } catch (error) {
        console.error("Error fetching donations:", error);
        toast({
          variant: "destructive",
          title: "Failed to load messages",
          description: "Could not retrieve donation messages",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();

    // Set up real-time subscription
    const channel = supabase
      .channel('mackle-messages-donations')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mackle_donations',
          filter: 'payment_status=eq.success'
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log("New donation message received via realtime:", newDonation);
          setDonations(prev => [newDonation, ...prev]);
          toast({
            title: "New Message",
            description: `New message from ${newDonation.name}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

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
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="outline" onClick={() => navigate("/mackle/dashboard")}>
            Dashboard
          </Button>
          <Button variant="outline" onClick={() => window.open("/mackle/obs/messages", "_blank")}>
            Open OBS View
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-700 rounded w-1/4"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : donations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No donation messages yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {donations.map((donation) => (
            <Card key={donation.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{donation.name}</CardTitle>
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(donation.created_at)}
                    </span>
                    <span className="font-medium text-green-600">
                      ₹{Number(donation.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">
                  {donation.message || <span className="text-muted-foreground italic">No message</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MackleDonationMessages;
