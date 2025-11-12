import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  
  // Phone number dialog states
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Calculate voice recording duration based on amount
  const getVoiceDuration = (amount: number) => {
    if (amount >= 500) return 30;
    if (amount >= 250) return 20;
    if (amount >= 150) return 15;
    return 10;
  };

  // Voice recorder instance - dynamically update duration based on amount
  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));
  
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
          .rpc('get_streamer_public_settings', { slug: 'chiaa_gaming' });

        if (error) throw error;
        if (data && data.length > 0) setStreamerSettings(data[0]);
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
    
    // Validate inputs first
    const amount = parseFloat(formData.amount);
    
    if (!formData.name?.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    if (donationType === 'voice' && !hasVoiceRecording) {
      toast({
        title: "Voice Message Required", 
        description: "Please record a voice message for your donation.",
        variant: "destructive",
      });
      return;
    }

    if (donationType === 'message' && !formData.message?.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message for your donation.", 
        variant: "destructive",
      });
      return;
    }

    if (!amount || amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    // Validate minimum amounts based on donation type
    if (donationType === 'message' && amount < 40) {
      toast({
        title: "Insufficient Amount",
        description: "Text messages require a minimum donation of ₹40.",
        variant: "destructive",
      });
      return;
    }

    if (donationType === 'voice' && amount < 150) {
      toast({
        title: "Insufficient Amount",
        description: "Voice messages require a minimum donation of ₹150.",
        variant: "destructive",
      });
      return;
    }

    if (!cashfree) {
      toast({
        title: "Payment System Not Ready",
        description: "Please wait for the payment system to load or refresh the page.",
        variant: "destructive",
      });
      return;
    }

    // Show phone dialog after validation passes
    setShowPhoneDialog(true);
  };

  const handlePaymentAfterPhone = async () => {
    setIsProcessing(true);
    let data: any = null;

    try {
      const amount = parseFloat(formData.amount);

      // Upload voice message BEFORE creating payment order
      let voiceMessageUrl: string | null = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        console.log('Uploading voice message before payment...');
        const reader = new FileReader();
        const voiceDataBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        // Upload voice message directly
        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
          'upload-voice-message-direct',
          {
            body: { 
              voiceData: voiceDataBase64, 
              streamerSlug: 'chiaa_gaming'
            }
          }
        );

        if (uploadError) {
          console.error('Voice upload error:', uploadError);
          throw new Error('Failed to upload voice message');
        }

        voiceMessageUrl = uploadResult.voice_message_url;
        console.log('Voice message uploaded successfully:', voiceMessageUrl);
      }

      // Create order via Supabase edge function
      const response = await supabase.functions.invoke('create-payment-order-chiagaming', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : donationType === 'voice' ? 'Voice message donation' : '',
          phone: phoneNumber,
          voiceMessageUrl: voiceMessageUrl
        }
      });

      data = response.data;
      const error = response.error;

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      // Streamer ID is stored by the edge function; no need to fetch here
      // Extras (voice/hyperemote) are passed to edge function at creation time.
      // Initialize Cashfree checkout
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
        appearance: {
          width: "500px",
          height: "700px"
        },
        onSuccess: function(data: any) {
          console.log("Payment successful:", data);
        },
        onFailure: function(data: any) {
          console.log("Payment failed:", data);
        }
      };

      // Add a small delay to ensure proper focus handling
      setTimeout(async () => {
        const result = await cashfree.checkout(checkoutOptions);
        
        const orderId = data.order_id;
        if (result.error) {
          console.log("Payment cancelled or error:", result.error);
          navigate(`/status?order_id=${orderId}&status=pending`);
        } else if (result.paymentDetails) {
          console.log("Payment completed:", result.paymentDetails);
          navigate(`/status?order_id=${orderId}&status=success`);
        } else if (result.redirect) {
          console.log("Payment will be redirected");
          navigate(`/status?order_id=${orderId}&status=pending`);
        } else {
          navigate(`/status?order_id=${orderId}&status=pending`);
        }
      }, 100);

    } catch (error) {
      console.error('Payment error:', error);
      // Redirect to status page even on error, if we have an order ID
      const orderId = data?.order_id;
      if (orderId) {
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
      setShowPhoneDialog(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
    return phoneRegex.test(phone);
  };

  const handlePhoneSubmit = () => {
    setPhoneError('');
    
    if (!phoneNumber.trim()) {
      setPhoneError('Please enter your mobile number');
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    handlePaymentAfterPhone();
  };

  const handleDonationTypeChange = (type: 'message' | 'voice' | 'hyperemote') => {
    setDonationType(type);
    if (type === 'hyperemote') {
      const minAmount = streamerSettings?.hyperemotes_min_amount || 50;
      setFormData(prev => ({ ...prev, amount: minAmount.toString(), message: '' }));
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
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4" style={{ backgroundImage: 'url(/lovable-uploads/b3a1671f-4c8f-4220-a29f-774bb7851737.png)' }}>
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
                      <div className="text-xs text-muted-foreground">Min: ₹40</div>
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
                      <div className="text-xs text-muted-foreground">Min: ₹150</div>
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
                      <div className="text-xs text-muted-foreground">₹{streamerSettings?.hyperemotes_min_amount || 50}+ celebration</div>
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
                  placeholder={
                    donationType === 'message' ? 'Min: ₹40' : 
                    donationType === 'voice' ? 'Min: ₹150' : 
                    donationType === 'hyperemote' ? (streamerSettings?.hyperemotes_min_amount || 50).toString() : 
                    '100'
                  }
                  min={donationType === 'hyperemote' ? (streamerSettings?.hyperemotes_min_amount || 50).toString() : '1'}
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
              {donationType === 'message' && (
                <p className="text-xs text-muted-foreground">
                  TTS available for donations above ₹70
                </p>
              )}
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

      {/* Phone Number Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gaming-pink-primary">Enter Mobile Number</DialogTitle>
            <DialogDescription>
              Please enter your mobile number to proceed with the payment (required by Cashfree Payments).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="dialog-phone" className="text-sm font-medium text-gaming-pink-primary">
                Mobile Number *
              </label>
              <Input
                id="dialog-phone"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError('');
                }}
                className="border-gaming-pink-primary/30 focus:border-gaming-pink-primary focus:ring-gaming-pink-primary/20"
                maxLength={10}
              />
              {phoneError && (
                <p className="text-sm text-red-500">{phoneError}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowPhoneDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePhoneSubmit}
              disabled={isProcessing}
              className="bg-gaming-pink-primary hover:bg-gaming-pink-primary/90"
            >
              {isProcessing ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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