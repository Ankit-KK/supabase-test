import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SimpleEmojiSelector from '@/components/SimpleEmojiSelector';
import SimpleVoiceRecorder from '@/components/SimpleVoiceRecorder';

interface StreamerInfo {
  id: string;
  streamer_name: string;
  brand_color: string;
  hyperemotes_enabled: boolean;
  hyperemotes_min_amount: number;
}

interface RecentDonation {
  donor_name: string;
  amount: number;
  sanitized_message?: string;
  created_at: string;
}

interface UniversalDonationFormProps {
  streamerSlug: string;
}

const UniversalDonationForm: React.FC<UniversalDonationFormProps> = ({ streamerSlug }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamerInfo, setStreamerInfo] = useState<StreamerInfo | null>(null);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchStreamerInfo();
    fetchRecentDonations();
  }, [streamerSlug]);

  const fetchStreamerInfo = async () => {
    try {
      const { data, error } = await supabase.rpc('get_streamer_public_settings', {
        slug: streamerSlug
      });

      if (error) throw error;
      if (data && data.length > 0) {
        const streamer = data[0];
        setStreamerInfo({
          id: streamer.id,
          streamer_name: streamerSlug.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          brand_color: '#6366f1', // Default color
          hyperemotes_enabled: streamer.hyperemotes_enabled,
          hyperemotes_min_amount: streamer.hyperemotes_min_amount
        });
      }
    } catch (error: any) {
      console.error('Error fetching streamer info:', error);
    }
  };

  const fetchRecentDonations = async () => {
    try {
      const { data, error } = await supabase.rpc('get_recent_donations_public', {
        p_streamer_slug: streamerSlug,
        p_limit: 5
      });

      if (error) throw error;
      setRecentDonations(data || []);
    } catch (error: any) {
      console.error('Error fetching recent donations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid input",
        description: "Please provide a valid name and amount",
        variant: "destructive"
      });
      return;
    }

    if (!streamerInfo) {
      toast({
        title: "Error",
        description: "Streamer information not loaded",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-order-universal', {
        body: {
          name: name.trim(),
          amount: parseFloat(amount),
          message: message.trim() || null,
          streamer_slug: streamerSlug,
          streamer_id: streamerInfo.id
        }
      });

      if (error) throw error;

      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error('Payment setup failed');
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const isHyperemote = streamerInfo?.hyperemotes_enabled && 
                     parseFloat(amount || '0') >= (streamerInfo.hyperemotes_min_amount || 50);

  if (!streamerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Support {streamerInfo.streamer_name}
          </h1>
          <p className="text-slate-300">
            Show your support with a donation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donation Form */}
          <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Make a Donation</CardTitle>
              <CardDescription className="text-slate-300">
                Your support means everything!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Your Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={50}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="1"
                    max="100000"
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  {isHyperemote && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      🎉 Hyperemote! This will be auto-approved!
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Leave a message..."
                    maxLength={300}
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Add Emojis</Label>
                  <SimpleEmojiSelector onEmojiSelect={handleEmojiSelect} />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Voice Message (Optional)</Label>
                  <SimpleVoiceRecorder onVoiceRecorded={(blob) => {
                    console.log('Voice recorded:', blob);
                  }} />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !amount}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSubmitting ? "Processing..." : `Donate ₹${amount || "0"}`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Donations */}
          <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Support</CardTitle>
              <CardDescription className="text-slate-300">
                Latest donations from awesome supporters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDonations.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">
                    Be the first to show your support! 🎉
                  </p>
                ) : (
                  recentDonations.map((donation, index) => (
                    <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-white">
                          {donation.donor_name}
                        </span>
                        <span className="text-green-400 font-bold">
                          ₹{donation.amount}
                        </span>
                      </div>
                      {donation.sanitized_message && (
                        <p className="text-slate-300 text-sm">
                          {donation.sanitized_message}
                        </p>
                      )}
                      <p className="text-slate-500 text-xs mt-2">
                        {new Date(donation.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UniversalDonationForm;