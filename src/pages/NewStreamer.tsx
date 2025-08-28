import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Heart, Sparkles, Send, CheckCircle } from 'lucide-react';
import VoiceRecorder from '@/components/VoiceRecorder';

interface NewStreamerSettings {
  hyperemotes_enabled: boolean;
  hyperemotes_min_amount: number;
}

const NewStreamer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceData, setVoiceData] = useState<string | null>(null);
  const [streamerSettings, setStreamerSettings] = useState<NewStreamerSettings | null>(null);
  const [activeTab, setActiveTab] = useState('text');

  useEffect(() => {
    fetchStreamerSettings();
    
    // Check for payment success
    const paymentStatus = searchParams.get('payment');
    const orderId = searchParams.get('order_id');
    
    if (paymentStatus === 'success' && orderId) {
      toast({
        title: "Payment Successful!",
        description: "Your donation has been received and is being processed.",
        duration: 5000,
      });
      
      // Clear URL parameters
      navigate('/newstreamer', { replace: true });
    }
  }, [searchParams, navigate]);

  const fetchStreamerSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('streamers')
        .select('hyperemotes_enabled, hyperemotes_min_amount')
        .eq('streamer_slug', 'newstreamer')
        .single();

      if (error) throw error;
      setStreamerSettings(data);
    } catch (error) {
      console.error('Error fetching streamer settings:', error);
    }
  };

  const handleSubmit = async (donationType: 'text' | 'voice' | 'hyperemote') => {
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and a valid amount.",
        variant: "destructive",
      });
      return;
    }

    if (donationType === 'hyperemote' && streamerSettings) {
      if (!streamerSettings.hyperemotes_enabled) {
        toast({
          title: "Hyperemotes Disabled",
          description: "Hyperemotes are currently disabled for this streamer.",
          variant: "destructive",
        });
        return;
      }
      
      if (parseFloat(amount) < streamerSettings.hyperemotes_min_amount) {
        toast({
          title: "Amount Too Low",
          description: `Hyperemotes require a minimum donation of ₹${streamerSettings.hyperemotes_min_amount}.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (donationType === 'voice' && !voiceData) {
      toast({
        title: "No Voice Recording",
        description: "Please record a voice message for voice donations.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-order-newstreamer', {
        body: {
          name: name.trim(),
          amount: parseFloat(amount),
          message: message.trim() || null,
          isHyperemote: donationType === 'hyperemote',
          voiceData: donationType === 'voice' ? voiceData : null
        }
      });

      if (error) throw error;

      if (data.success && data.payment_url) {
        // Open payment in new tab
        window.open(data.payment_url, '_blank');
        
        toast({
          title: "Payment Initiated",
          description: "Payment window opened. Complete the payment to send your donation!",
        });
        
        // Reset form
        setName('');
        setAmount('');
        setMessage('');
        setVoiceData(null);
        setActiveTab('text');
      } else {
        throw new Error(data.error || 'Failed to create payment order');
      }
    } catch (error: any) {
      console.error('Error creating donation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Support New Streamer
          </h1>
          <p className="text-muted-foreground">
            Send a donation with text, voice message, or hyperemote
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/95 border-emerald-200 dark:border-emerald-800 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Heart className="w-5 h-5" />
              Make a Donation
            </CardTitle>
            <CardDescription>
              Choose your donation type and show your support!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Name</label>
                <Input
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="50"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Donation Type Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="hyperemote" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Hyperemote
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
                  <Textarea
                    placeholder="Write your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="border-emerald-200 focus:border-emerald-400 min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.length}/500 characters
                  </p>
                </div>
                <Button 
                  onClick={() => handleSubmit('text')} 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  {isSubmitting ? 'Processing...' : 'Send Text Donation'}
                </Button>
              </TabsContent>

              <TabsContent value="voice" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Voice Message</label>
                  <VoiceRecorder onRecordingComplete={(hasRecording, duration) => {
                    // For now, we'll just set voiceData to a placeholder when recording is complete
                    setVoiceData(hasRecording ? 'recorded_voice_data' : null);
                  }} />
                  {voiceData && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 dark:text-emerald-300">
                        Voice message recorded successfully!
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
                  <Textarea
                    placeholder="Add a text message along with your voice..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="border-emerald-200 focus:border-emerald-400"
                    maxLength={200}
                  />
                </div>
                <Button 
                  onClick={() => handleSubmit('voice')} 
                  disabled={isSubmitting || !voiceData}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  {isSubmitting ? 'Processing...' : 'Send Voice Donation'}
                </Button>
              </TabsContent>

              <TabsContent value="hyperemote" className="space-y-4">
                {streamerSettings?.hyperemotes_enabled ? (
                  <>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-purple-700 dark:text-purple-300">Hyperemote Donation</h3>
                      </div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                        Hyperemotes are special donations that get instant approval and priority display!
                      </p>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        Minimum: ₹{streamerSettings.hyperemotes_min_amount}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
                      <Textarea
                        placeholder="Your hyperemote message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="border-purple-200 focus:border-purple-400"
                        maxLength={200}
                      />
                    </div>
                    <Button 
                      onClick={() => handleSubmit('hyperemote')} 
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      size="lg"
                    >
                      {isSubmitting ? 'Processing...' : 'Send Hyperemote'}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Hyperemotes are currently disabled for this streamer.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewStreamer;