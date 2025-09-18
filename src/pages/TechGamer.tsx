import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDisplay } from "@/components/AlertDisplay";
import SimpleVoiceRecorder from "@/components/SimpleVoiceRecorder";
import SimpleEmojiSelector from "@/components/SimpleEmojiSelector";
import { Gamepad2, Zap, Heart, Gift } from 'lucide-react';

const TechGamer = () => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamerInfo, setStreamerInfo] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStreamerInfo();
    fetchRecentDonations();
  }, []);

  const fetchStreamerInfo = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_streamer_info', {
        slug: 'techgamer'
      });
      
      if (error) throw error;
      if (data && data.length > 0) {
        setStreamerInfo(data[0]);
      }
    } catch (error) {
      console.error('Error fetching streamer info:', error);
    }
  };

  const fetchRecentDonations = async () => {
    try {
      const { data, error } = await supabase.rpc('get_recent_donations_public', {
        p_streamer_slug: 'techgamer',
        p_limit: 5
      });
      
      if (error) throw error;
      setRecentDonations(data || []);
    } catch (error) {
      console.error('Error fetching recent donations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create payment order
      const { data, error } = await supabase.functions.invoke('create-payment-order-techgamer', {
        body: {
          name: name.trim(),
          amount: parseFloat(amount),
          message: message.trim() || null,
          voice_blob: voiceBlob,
          streamer_slug: 'techgamer'
        }
      });

      if (error) throw error;

      if (data.success && data.payment_session_id) {
        // Redirect to Cashfree payment
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.error || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Error creating donation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process donation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const isHyperemote = parseFloat(amount) >= 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="h-12 w-12 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">TechGamer</h1>
          </div>
          <p className="text-blue-200 text-lg">Support amazing tech content and gaming streams!</p>
          <Badge variant="secondary" className="mt-2 bg-blue-500/20 text-blue-300 border-blue-400">
            <Zap className="h-4 w-4 mr-1" />
            Live Streaming
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donation Form */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gift className="h-5 w-5 text-blue-400" />
                  Support TechGamer
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Your support helps create amazing tech content and gaming experiences!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Your Name *
                    </label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="bg-slate-700/50 border-blue-500/30 text-white placeholder:text-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Amount (₹) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="10"
                      className="bg-slate-700/50 border-blue-500/30 text-white placeholder:text-slate-400"
                      required
                    />
                    {isHyperemote && (
                      <Badge className="mt-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <Zap className="h-3 w-3 mr-1" />
                        Hyperemote Activated! Special effects included
                      </Badge>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Message (Optional)
                    </label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Leave a supportive message..."
                      className="bg-slate-700/50 border-blue-500/30 text-white placeholder:text-slate-400 min-h-[100px]"
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <SimpleEmojiSelector onEmojiSelect={handleEmojiSelect} />
                      <span className="text-sm text-slate-400">
                        {message.length}/500
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Voice Message (Optional)
                    </label>
                    <SimpleVoiceRecorder onVoiceRecorded={setVoiceBlob} />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3"
                  >
                    {isSubmitting ? 'Processing...' : `Donate ₹${amount || '0'}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Donations */}
          <div>
            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-400" />
                  Recent Support
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Latest donations from the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDonations.length > 0 ? (
                    recentDonations.map((donation, index) => (
                      <div key={index} className="bg-slate-700/30 rounded-lg p-3 border border-blue-500/10">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-blue-300">
                            {donation.donor_name}
                          </span>
                          <Badge variant="outline" className="text-xs border-blue-400 text-blue-300">
                            ₹{donation.amount}
                          </Badge>
                        </div>
                        {donation.sanitized_message && (
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {donation.sanitized_message}
                          </p>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(donation.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">
                      Be the first to support TechGamer!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AlertDisplay will be managed by the OBS alerts system */}
    </div>
  );
};

export default TechGamer;