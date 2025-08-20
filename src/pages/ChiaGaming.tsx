import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Heart, Sparkles } from "lucide-react";
import { load } from '@cashfreepayments/cashfree-js';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";


const ChiaGaming = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashfree, setCashfree] = useState<any>(null);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [donationType, setDonationType] = useState<'message' | 'voice' | 'hyperemote'>('message');
  const [streamerSettings, setStreamerSettings] = useState<any>(null);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [showHyperemoteEffect, setShowHyperemoteEffect] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [selectedEmoteUrl, setSelectedEmoteUrl] = useState<string>('');
  
  // Voice recorder instance
  const voiceRecorder = useVoiceRecorder(60);
  
  // Static emotes from chiaa-emotes bucket (for hyperemotes)
  const availableEmotes = [
    { name: "emojis1", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/emojis1-Photoroom.png" },
    { name: "image-10", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(10).png" },
    { name: "image-1", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(1).png" },
    { name: "image-2", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(2).png" },
    { name: "image-3", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(3).png" },
    { name: "image-4", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(4).png" },
    { name: "image-5", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(5).png" },
    { name: "image-6", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(6).png" },
    { name: "image-7", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(7).png" },
    { name: "image-8", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(8).png" },
    { name: "image-9", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(9).png" },
    { name: "image", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom.png" }
  ];

  // Initialize Cashfree SDK and fetch streamer settings
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setSdkLoading(true);
        setSdkError(null);
        console.log('Initializing Cashfree SDK...');
        
        const cf = await load({
          mode: "production"
        });
        
        setCashfree(cf);
        console.log('Cashfree SDK initialized successfully');
        
        toast({
          title: "Payment System Ready",
          description: "You can now make donations safely.",
        });
      } catch (error) {
        console.error('Failed to initialize Cashfree SDK:', error);
        setSdkError('Failed to load payment system. Please refresh the page.');
        toast({
          title: "Payment System Error", 
          description: "Failed to load payment system. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setSdkLoading(false);
      }
    };

    const fetchStreamerSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('streamers')
          .select('id, hyperemotes_enabled, hyperemotes_min_amount')
          .eq('streamer_slug', 'chia_gaming')
          .maybeSingle();

        if (error) throw error;
        if (data) setStreamerSettings(data);
      } catch (error) {
        console.error('Failed to fetch streamer settings:', error);
      }
    };
    
    initializeSDK();
    fetchStreamerSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    let data: any = null;

    try {
      const amount = parseFloat(formData.amount);
      
      // Validate inputs - voice donations need recording, hyperemotes don't
      if (!formData.name?.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter your name.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (donationType === 'voice' && !hasVoiceRecording) {
        toast({
          title: "Voice Message Required",
          description: "Please record a voice message for your donation.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (donationType === 'message' && !formData.message?.trim()) {
        toast({
          title: "Message Required",
          description: "Please enter a message for your donation.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (!amount || amount < 1) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid donation amount.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (!cashfree) {
        toast({
          title: "Payment System Not Ready",
          description: "Please wait for the payment system to load or refresh the page.",
          variant: "destructive",
        });
        throw new Error('Payment system not initialized');
      }

      // Create order via Supabase edge function
      const response = await supabase.functions.invoke('create-payment-order', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : 
                  donationType === 'voice' ? 'Voice message donation' : ''
        }
      });

      data = response.data;
      const error = response.error;

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      const orderId = data.cf_order_id || data.order_id;

      // Always fetch streamer id via RPC (bypasses RLS)
      let streamerId: string | null = null;
      try {
        const { data: pubInfo, error: pubErr } = await supabase.rpc('get_public_streamer_info', { slug: 'chia_gaming' });
        if (pubErr) {
          console.log('RPC get_public_streamer_info error:', pubErr);
        }
        const info = Array.isArray(pubInfo) ? pubInfo[0] : pubInfo;
        streamerId = info?.id ?? null;
        console.log('Using streamer_id via RPC:', streamerId);
      } catch (e) {
        console.log('RPC call failed, streamer_id will be null');
      }

      // Insert donation record into database
      const { error: dbError } = await supabase
        .from('chia_gaming_donations')
        .insert({
          order_id: orderId,
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : 
                  donationType === 'voice' ? 'Voice message donation' : '',
          payment_status: 'pending',
          is_hyperemote: donationType === 'hyperemote',
          streamer_id: streamerId,
          voice_duration_seconds: donationType === 'voice' ? voiceDuration : null
        });

      if (dbError) {
        console.error('Error saving donation:', dbError);
        // Continue with payment even if DB insert fails
      }

      // Upload voice message if it's a voice donation
      let voiceMessageUrl: string | null = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        console.log('Uploading voice message for order:', orderId);
        voiceMessageUrl = await voiceRecorder.uploadRecording(orderId);
        if (voiceMessageUrl) {
          console.log('Voice message uploaded successfully, updating database with URL:', voiceMessageUrl);
          // Update donation with voice message URL
          const { error: updateError } = await supabase
            .from('chia_gaming_donations')
            .update({ voice_message_url: voiceMessageUrl })
            .eq('order_id', orderId);
          
          if (updateError) {
            console.error('Error updating voice message URL:', updateError);
          } else {
            console.log('Database updated with voice message URL');
          }
        } else {
          console.log('Voice message upload failed, continuing without URL');
        }
      }

      // Initialize Cashfree checkout
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
      };

      const result = await cashfree.checkout(checkoutOptions);
      
      // Update payment status and redirect based on result
      const updatePaymentStatus = async (status: string) => {
        await supabase
          .from('chia_gaming_donations')
          .update({ payment_status: status })
          .eq('order_id', orderId);
      };
      
      if (result.error) {
        console.log("Payment cancelled or error:", result.error);
        await updatePaymentStatus('cancelled');
        navigate(`/status?order_id=${orderId}&status=cancelled`);
      } else if (result.paymentDetails) {
        console.log("Payment completed:", result.paymentDetails);
        await updatePaymentStatus('success');
        navigate(`/status?order_id=${orderId}&status=success`);
      } else if (result.redirect) {
        console.log("Payment will be redirected");
        await updatePaymentStatus('pending');
        navigate(`/status?order_id=${orderId}&status=pending`);
      } else {
        await updatePaymentStatus('unknown');
        navigate(`/status?order_id=${orderId}&status=unknown`);
      }

    } catch (error) {
      console.error('Payment error:', error);
      // Redirect to status page even on error, if we have an order ID
      const orderId = data?.cf_order_id || data?.order_id;
      if (orderId) {
        // Update payment status to failed in database
        await supabase
          .from('chia_gaming_donations')
          .update({ payment_status: 'failed' })
          .eq('order_id', orderId);
        navigate(`/status?order_id=${orderId}&status=error`);
      } else {
        toast({
          title: "Payment Failed",
          description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDonationTypeChange = (type: 'message' | 'voice' | 'hyperemote') => {
    setDonationType(type);
    if (type === 'hyperemote') {
      setFormData(prev => ({ ...prev, amount: '1', message: '' }));
      // Trigger hyperemote effect
      setShowHyperemoteEffect(true);
      setTimeout(() => setShowHyperemoteEffect(false), 3000);
    } else {
      setFormData(prev => ({ ...prev, amount: '' }));
    }
  };

  const handleEmojiSelect = (emojiName: string, emoteUrl: string) => {
    setSelectedEmoji(emojiName);
    setSelectedEmoteUrl(emoteUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-pink-light via-background to-gaming-pink-light/30 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gaming-pink-primary/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gaming-pink-secondary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gaming-pink-accent/10 rounded-full blur-2xl animate-pulse-glow"></div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-gaming-pink-primary/20 shadow-2xl relative overflow-hidden">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gaming-pink-primary/20 via-gaming-pink-secondary/20 to-gaming-pink-accent/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2 text-gaming-pink-primary">
              <Gamepad2 className="h-8 w-8" />
              <Sparkles className="h-6 w-6 animate-pulse-glow" />
              <Heart className="h-6 w-6 text-gaming-pink-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gaming-pink-primary to-gaming-pink-secondary bg-clip-text text-transparent">
            Chia Gaming
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Support the gaming community with your donation
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gaming-pink-primary">
                Your Name *
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-gaming-pink-primary/30 focus:border-gaming-pink-primary focus:ring-gaming-pink-primary/20"
                required
              />
            </div>

            {/* Donation Type Selection */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gaming-pink-primary">
                  Choose your donation type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('message')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      donationType === 'message'
                        ? 'border-gaming-pink-primary bg-gaming-pink-primary/10'
                        : 'border-gaming-pink-primary/30 hover:border-gaming-pink-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-base mb-1">💬</div>
                      <div className="font-medium text-xs">Text Message</div>
                      <div className="text-xs text-muted-foreground">Type message</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('voice')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      donationType === 'voice'
                        ? 'border-gaming-pink-primary bg-gaming-pink-primary/10'
                        : 'border-gaming-pink-primary/30 hover:border-gaming-pink-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-base mb-1">🎤</div>
                      <div className="font-medium text-xs">Voice Message</div>
                      <div className="text-xs text-muted-foreground">Record voice</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('hyperemote')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      donationType === 'hyperemote'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-base mb-1">🎉</div>
                      <div className="font-medium text-xs">Hyperemotes</div>
                      <div className="text-xs text-muted-foreground">₹1 celebration</div>
                    </div>
                  </button>
                </div>
            </div>

            {/* Amount Field */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-gaming-pink-primary">
                Donation Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-pink-primary font-medium">
                  ₹
                </span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder={donationType === 'hyperemote' ? '1' : '100'}
                  min="1"
                  max="100000"
                  value={formData.amount}
                  onChange={handleInputChange}
                  disabled={donationType === 'hyperemote'}
                  className={`pl-8 border-gaming-pink-primary/30 focus:border-gaming-pink-primary focus:ring-gaming-pink-primary/20 ${
                    donationType === 'hyperemote' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  required
                />
              </div>
            </div>

            {/* Text Message Field */}
            {donationType === 'message' && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-gaming-pink-primary">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Add your supportive message..."
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full min-h-20 px-3 py-2 bg-background text-foreground border border-gaming-pink-primary/30 rounded-md focus:border-gaming-pink-primary focus:ring-gaming-pink-primary/20 focus:ring-2 resize-none transition-all"
                  maxLength={500}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.message.length}/500
                </p>
              </div>
            )}

            {/* Voice Message Field */}
            {donationType === 'voice' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gaming-pink-primary">
                  Voice Message *
                </label>
                <VoiceRecorder
                  onRecordingComplete={(hasRecording, duration) => {
                    console.log('ChiaGaming onRecordingComplete - hasRecording:', hasRecording, 'duration:', duration);
                    setHasVoiceRecording(hasRecording);
                    setVoiceDuration(duration);
                  }}
                  maxDurationSeconds={60}
                  disabled={false}
                  controller={voiceRecorder}
                />
              </div>
            )}

            {/* Pay Button */}
            <Button
              type="submit"
              disabled={isProcessing || sdkLoading || !cashfree || 
                       (donationType === 'voice' && !hasVoiceRecording) ||
                       (donationType === 'message' && !formData.message?.trim())}
              className="w-full bg-gradient-to-r from-gaming-pink-primary to-gaming-pink-secondary hover:from-gaming-pink-secondary hover:to-gaming-pink-accent text-gaming-pink-foreground font-medium py-3 relative overflow-hidden group transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100"
            >
              {sdkLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading Payment System...</span>
                </div>
              ) : isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : donationType === 'hyperemote' ? (
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>🎉 Celebrate with ₹1</span>
                  <Sparkles className="h-4 w-4 group-hover:animate-pulse-glow" />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>
                    {donationType === 'voice' ? '🎤 Voice Donation' : 
                     donationType === 'message' ? '💬 Text Donation' : 
                     `Donate ₹${formData.amount || '0'}`}
                  </span>
                  <Sparkles className="h-4 w-4 group-hover:animate-pulse-glow" />
                </div>
              )}
              
              {/* Button shine effect */}
              <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Button>
          </form>

          {/* Status messages */}
          {sdkError && (
            <div className="text-center pt-4 border-t border-gaming-pink-primary/20">
              <p className="text-sm text-destructive">{sdkError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()} 
                className="mt-2"
              >
                Refresh Page
              </Button>
            </div>
          )}
          
          {!sdkError && (
            <div className="text-center pt-4 border-t border-gaming-pink-primary/20">
              <p className="text-xs text-muted-foreground">
                💝 Choose your preferred way to support and connect with the streamer
              </p>
              {sdkLoading && (
                <p className="text-xs text-gaming-pink-primary mt-1">
                  🔄 Loading secure payment system...
                </p>
              )}
              {cashfree && !sdkLoading && (
                <p className="text-xs text-gaming-pink-primary mt-1">
                  ✅ Payment system ready
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stream-Style Hyperemote Animation */}
      {showHyperemoteEffect && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {/* Multiple floating emotes */}
          {[...Array(8)].map((_, i) => {
            const randomEmote = availableEmotes[Math.floor(Math.random() * availableEmotes.length)];
            return (
              <div
                key={i}
                className="absolute animate-float-up"
                style={{
                  left: `${Math.random() * 90}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              >
                {randomEmote ? (
                  <img 
                    src={randomEmote.url} 
                    alt={randomEmote.name}
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <div className="text-6xl">🎉</div>
                )}
              </div>
            );
          })}
          
          {/* Main celebration emote */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-float-up-main">
            {selectedEmoteUrl ? (
              <img 
                src={selectedEmoteUrl} 
                alt="main emote"
                className="w-24 h-24 object-contain"
              />
            ) : availableEmotes.length > 0 ? (
              <img 
                src={availableEmotes[0].url} 
                alt={availableEmotes[0].name}
                className="w-24 h-24 object-contain"
              />
            ) : (
              <div className="text-8xl">🎉</div>
            )}
          </div>
          
          {/* Stream notification */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-purple-600/90 text-white px-6 py-3 rounded-lg font-bold text-xl animate-fade-in shadow-lg border border-purple-400">
            HYPEREMOTE! 🎉
          </div>
        </div>
      )}

    </div>
  );
};

export default ChiaGaming;