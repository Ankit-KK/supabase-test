import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { Loader2 } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const HarishDonationMessages = () => {
  useAuthProtection({
    redirectTo: "/harish/login",
    authKey: "harishAuth"
  });

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [obsId] = useState(() => `harish_${Date.now()}`);
  const [showMessages, setShowMessages] = useState<boolean>(() => {
    // Get saved preference from localStorage or default to true
    const savedPreference = localStorage.getItem("harishShowMessages");
    return savedPreference !== null ? savedPreference === "true" : true;
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDonations();

    // Set up a subscription to listen for new donations
    const channel = supabase
      .channel("harish-donations-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "harish_donations",
        },
        (payload) => {
          console.log("New donation received:", payload);
          const newDonation = payload.new as Donation;
          setDonations((prevDonations) => [newDonation, ...prevDonations]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("harish_donations")
        .select("*")
        .eq("payment_status", "success")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setDonations(data);
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch donations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowMessagesChange = (checked: boolean) => {
    setShowMessages(checked);
    // Save the preference to localStorage
    localStorage.setItem("harishShowMessages", checked.toString());
  };

  const openObsView = () => {
    const obsUrl = `/harish/obs/${obsId}?showMessages=${showMessages}`;
    window.open(obsUrl, "_blank");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(); // Format date based on user's locale
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Harish's Donation Messages</h1>

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <Button onClick={openObsView} className="whitespace-nowrap">
          Open OBS Browser Source
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm">Show messages in OBS:</span>
          <Switch
            checked={showMessages}
            onCheckedChange={handleShowMessagesChange}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Donations</h2>
          {donations.length === 0 ? (
            <p className="text-muted-foreground">No donations found.</p>
          ) : (
            donations.map((donation) => (
              <Card key={donation.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">{donation.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(donation.created_at)}
                    </p>
                  </div>
                  <p className="font-bold text-green-600">
                    ₹{donation.amount.toLocaleString()}
                  </p>
                </div>
                <p className="text-gray-800 dark:text-gray-200">{donation.message}</p>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default HarishDonationMessages;
