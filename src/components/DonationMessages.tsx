
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { StreamerTableName } from "@/types/donations";

interface DonationMessagesProps {
  tableName: StreamerTableName;
}

interface DonationRecord {
  id: string;
  donor_name: string;
  amount: number;
  message: string;
  created_at: string;
  status: string;
}

const DonationMessages = ({ tableName }: DonationMessagesProps) => {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDonations();
  }, [tableName]);

  const fetchDonations = async () => {
    try {
      console.log(`Fetching donations from table: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching donations:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch donation messages",
        });
        return;
      }

      console.log(`Fetched ${data?.length || 0} donations`);
      setDonations(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No donation messages yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recent Donations</h2>
        <Badge variant="outline">{donations.length} messages</Badge>
      </div>
      
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {donations.map((donation) => (
            <Card key={donation.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">
                    {donation.donor_name}
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(donation.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(donation.created_at)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{donation.message}</p>
                <div className="mt-3 flex justify-between items-center">
                  <Badge 
                    variant={donation.status === 'completed' ? 'default' : 'secondary'}
                  >
                    {donation.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DonationMessages;
