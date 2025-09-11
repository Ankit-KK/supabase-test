import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import VoiceRecorder from "@/components/VoiceRecorder";
import EmojiSelector from "@/components/EmojiSelector";
import { EmotionPack } from "@/components/EmotionPack";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Sparkles, Zap, Star, Music, Coffee, Gift, Flame } from "lucide-react";
import { load } from "@cashfreepayments/cashfree-js";

const HYPEREMOTE_OPTIONS = [
  { value: 50, label: "❤️ Love", icon: Heart, color: "text-red-500" },
  { value: 100, label: "✨ Magic", icon: Sparkles, color: "text-yellow-500" },
  { value: 150, label: "⚡ Energy", icon: Zap, color: "text-blue-500" },
  { value: 200, label: "⭐ Star", icon: Star, color: "text-purple-500" },
  { value: 250, label: "🎵 Music", icon: Music, color: "text-green-500" },
  { value: 300, label: "☕ Coffee", icon: Coffee, color: "text-amber-700" },
  { value: 500, label: "🎁 Gift", icon: Gift, color: "text-pink-500" },
  { value: 1000, label: "🔥 Fire", icon: Flame, color: "text-orange-500" }
];

export default function DemoStreamer() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [voiceData, setVoiceData] = useState<string | null>(null);
  const [voiceDuration, setVoiceDuration] = useState<number>(0);
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedHyperemote, setSelectedHyperemote] = useState<number | null>(null);
  const [streamerInfo, setStreamerInfo] = useState<any>(null);
  const [cashfree, setCashfree] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load Cashfree SDK
    const initializeSDK = async () => {
      try {
        const cf = await load({ mode: "sandbox" });
        setCashfree(cf);
      } catch (error) {
        console.error('Failed to load Cashfree SDK:', error);
      }
    };

    // Load streamer info
    const loadStreamerInfo = async () => {
      try {
        const { data } = await supabase
          .rpc('get_public_streamer_data', { p_streamer_slug: 'demostreamer' });
        
        if (data && data.length > 0) {
          setStreamerInfo(data[0]);
        }
      } catch (error) {
        console.error('Failed to load streamer info:', error);
      }
    };

    initializeSDK();
    loadStreamerInfo();
  }, []);

  const handleVoiceRecorded = (hasRecording: boolean, duration: number) => {
    if (hasRecording) {
      setVoiceDuration(duration);
      // We'll get the actual audio blob from the VoiceRecorder component's internal state
      // when we process the donation
    } else {
      setVoiceData(null);
      setVoiceDuration(0);
    }
  };

  const handleEmotionChange = (emotions: string[]) => {
    setEmotionTags(emotions);
  };

  const handleHyperemoteSelect = (value: number) => {
    setSelectedHyperemote(value);
    setAmount(value.toString());
  };

  const validateForm = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive"
      });
      return false;
    }

    if (!amount || parseFloat(amount) < 1) {
      toast({
        title: "Amount required",
        description: "Please enter a valid amount (minimum ₹1)",
        variant: "destructive"
      });
      return false;
    }

    if (parseFloat(amount) > 100000) {
      toast({
        title: "Amount too high",
        description: "Maximum donation amount is ₹1,00,000",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleDonate = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      // Create payment order
      const { data: orderData, error } = await supabase.functions.invoke(
        'create-payment-order-demostreamer',
        {
          body: {
            name: name.trim(),
            amount: parseFloat(amount),
            message: message.trim() || null,
            voiceData,
            voiceDuration,
            emotionTags
          }
        }
      );

      if (error) throw error;

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Initialize Cashfree payment
      if (!cashfree) {
        throw new Error('Payment system not ready. Please try again.');
      }

      const checkoutOptions = {
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: "_self"
      };

      const result = await cashfree.checkout(checkoutOptions);

      if (result.error) {
        console.error('Cashfree checkout error:', result.error);
        throw new Error('Payment initialization failed');
      }

    } catch (error) {
      console.error('Donation error:', error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!streamerInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Demo Streamer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4" style={{ color: streamerInfo.brand_color }}>
            {streamerInfo.streamer_name}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Support your favorite demo streamer with donations, voice messages, and hyperemotes!
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Donation Form */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Send Donation
                </CardTitle>
                <CardDescription>
                  Support the stream with your donation and optional voice message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setSelectedHyperemote(null);
                    }}
                    min="1"
                    max="100000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Leave a message for the streamer..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length}/500 characters
                  </p>
                </div>

                {/* Voice Recorder */}
                <div className="space-y-2">
                  <Label>Voice Message (Optional)</Label>
                  <VoiceRecorder onRecordingComplete={handleVoiceRecorded} />
                  {voiceDuration > 0 && (
                    <p className="text-xs text-green-600">
                      Voice message recorded ({voiceDuration}s)
                    </p>
                  )}
                </div>

                {/* Emotion Pack */}
                {amount && parseFloat(amount) >= 1 && (
                  <div className="space-y-2">
                    <Label>Add Emotions (Premium TTS)</Label>
                    <EmotionPack
                      donationAmount={parseFloat(amount) || 0}
                      onEmotionSelect={(emotion) => {
                        setMessage(prev => prev + ' ' + emotion);
                      }}
                    />
                  </div>
                )}

                <Button 
                  onClick={handleDonate}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Donate ₹{amount || '0'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Hyperemotes */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Hyperemotes
                  </CardTitle>
                  <CardDescription>
                    Quick donation with animated emotes (₹{streamerInfo.hyperemotes_min_amount}+)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {HYPEREMOTE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <Button
                          key={option.value}
                          variant={selectedHyperemote === option.value ? "default" : "outline"}
                          className="h-16 flex flex-col items-center justify-center gap-1"
                          onClick={() => handleHyperemoteSelect(option.value)}
                        >
                          <Icon className={`w-5 h-5 ${option.color}`} />
                          <span className="text-xs">{option.label}</span>
                          <span className="text-xs font-semibold">₹{option.value}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Donations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Recent Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Anonymous</p>
                        <p className="text-sm text-muted-foreground">Thanks for the stream! ❤️</p>
                      </div>
                      <span className="font-semibold text-green-600">₹100</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">StreamFan123</p>
                        <p className="text-sm text-muted-foreground">Keep up the great content!</p>
                      </div>
                      <span className="font-semibold text-green-600">₹250</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">GamerPro</p>
                        <p className="text-sm text-muted-foreground">🔥🔥🔥</p>
                      </div>
                      <span className="font-semibold text-green-600">₹500</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}