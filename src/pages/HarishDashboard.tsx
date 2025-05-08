
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface DonationStats {
  totalAmount: number;
  donationCount: number;
}

const HarishDashboard = () => {
  useAuthProtection("harish");
  
  const [stats, setStats] = useState<DonationStats>({
    totalAmount: 0,
    donationCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDonationStats();
  }, []);

  const fetchDonationStats = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("harish_donations")
        .select("amount")
        .eq("payment_status", "success");

      if (error) {
        throw error;
      }

      if (data) {
        const totalAmount = data.reduce((sum, donation) => sum + Number(donation.amount), 0);
        setStats({
          totalAmount,
          donationCount: data.length,
        });
      }
    } catch (error) {
      console.error("Error fetching donation stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Harish's Dashboard</h1>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/harish/messages")} variant="outline">
            View Donation Messages
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Number of Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.donationCount}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HarishDashboard;
