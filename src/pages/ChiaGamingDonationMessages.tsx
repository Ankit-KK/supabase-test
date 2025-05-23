
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { Heart, Search, ArrowLeft, Sparkles, Calendar } from "lucide-react";

const ChiaGamingDonationMessages = () => {
  useAuthProtection("chia_gaming");
  
  const [donations, setDonations] = useState<any[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDonations();
    
    // Set up real-time subscription
    const channel = supabase
      .channel("chia_gaming_donations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chia_gaming_donations",
        },
        () => {
          fetchDonations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const filtered = donations.filter(
      (donation) =>
        donation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDonations(filtered);
  }, [donations, searchTerm]);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("chia_gaming_donations")
        .select("*")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(219, 39, 119, 0.3) 0%, transparent 50%),
          linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #fdf2f8 100%)
        `
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate("/chia_gaming/dashboard")}
              variant="outline"
              size="sm"
              className="border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Heart className="h-8 w-8 text-pink-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Love Messages
            </h1>
            <Sparkles className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        {/* Search */}
        <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-pink-500" />
              <Input
                placeholder="Search by name or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/70 border-pink-300 focus:border-pink-500 focus:ring-pink-400/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Donations List */}
        <div className="space-y-4">
          {filteredDonations.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4" />
                  <p className="text-pink-600 text-lg">
                    {searchTerm ? "No messages found matching your search" : "No love messages yet! 💖"}
                  </p>
                  <p className="text-pink-500 mt-2">
                    {!searchTerm && "Share your donation page to start receiving beautiful messages!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredDonations.map((donation) => (
              <Card key={donation.id} className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-pink-900">{donation.name}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-pink-600">
                          <span className="font-semibold">₹{donation.amount}</span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(donation.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-pink-50/50 p-4 rounded-lg border border-pink-200/30">
                    <p className="text-pink-800 leading-relaxed">{donation.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Stats Footer */}
        {filteredDonations.length > 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50">
            <CardContent className="pt-6">
              <div className="text-center text-pink-700">
                <p className="font-medium">
                  Showing {filteredDonations.length} of {donations.length} love messages 💕
                </p>
                <p className="text-sm text-pink-600 mt-1">
                  Total love received: ₹{filteredDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChiaGamingDonationMessages;
