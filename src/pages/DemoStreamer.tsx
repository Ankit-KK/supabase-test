import React, { useState, useEffect, useRef } from "react";
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

const DemoStreamer = () => {
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
          mode: "sandbox"
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
          .rpc('get_streamer_public_settings', { slug: 'demostreamer' });

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

      // Create order via Supabase edge function
      const response = await supabase.functions.invoke('create-payment-order-demostreamer', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : 
                  donationType === 'voice' ? 'Voice message donation' : '',
          phone: phoneNumber?.trim() || undefined,
          streamer_slug: 'demostreamer'
        }
      });

      data = response.data;
      const error = response.error;

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      const orderId = data.order_id;

      // Convert voice data to base64 for temporary storage if needed
      let voiceDataBase64: string | null = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        console.log('Converting voice recording to base64 for temporary storage');
        const reader = new FileReader();
        voiceDataBase64 = await new Promise((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
      }

      // Attach optional data to the existing donation (created by edge function)
      try {
        const updates: any = {};
        if (donationType === 'voice' && voiceDataBase64) {
          updates.temp_voice_data = voiceDataBase64;
          updates.voice_duration_seconds = voiceDuration;
        }
        if (donationType === 'hyperemote') {
          updates.is_hyperemote = true;
        }

        // Note: Extras are now handled by the create-payment-order-demostreamer edge function
        // No client-side updates needed to avoid RLS policy violations
      } catch (e) {
        console.error('Failed to attach extras to donation:', e);
      }

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
        
        // Payment status updates are handled by edge functions via webhooks/verification
        // No client-side updates needed to avoid RLS policy violations
        
        if (result.error) {
          console.log("Payment cancelled or error:", result.error);
          navigate(`/status?order_id=${orderId}&status=failure`);
        } else if (result.paymentDetails) {
          console.log("Payment completed:", result.paymentDetails);
          navigate(`/status?order_id=${orderId}&status=success`);
        } else if (result.redirect) {
          console.log("Payment will be redirected");
          navigate(`/status?order_id=${orderId}&status=pending`);
        } else {
          navigate(`/status?order_id=${orderId}&status=failure`);
        }
      }, 100);

    } catch (error) {
      console.error('Payment error:', error);
      const orderId = data?.order_id;
      if (orderId) {
        // Edge functions will handle status updates via verification
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
      setFormData(prev => ({ ...prev, amount: '50', message: '' }));
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

  const handleVoiceRecorded = (hasRecording: boolean, duration: number) => {
    setHasVoiceRecording(hasRecording);
    setVoiceDuration(duration);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-purple-500/20 shadow-2xl relative overflow-hidden">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-purple-400/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2 text-purple-500">
              <Gamepad2 className="h-8 w-8" />
              <Sparkles className="h-6 w-6 animate-pulse" />
              <Heart className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
            Demo Streamer
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Support Demo Streamer with your donation
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-purple-500">
                Your Name *
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-purple-500/30 focus:border-purple-500 focus:ring-purple-500/20"
                required
              />
            </div>

            {/* Donation Type Selection */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-purple-500">
                  Choose your donation type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('message')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      donationType === 'message'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 hover:border-purple-500/50'
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
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 hover:border-purple-500/50'
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
                    className={`p-3 rounded-lg border-2 transition-all relative overflow-hidden ${
                      donationType === 'hyperemote'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    {showHyperemoteEffect && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/50 via-purple-500/50 to-purple-600/50 animate-pulse"></div>
                    )}
                    <div className="text-center relative z-10">
                      <div className="text-base mb-1">⚡</div>
                      <div className="font-medium text-xs">Hyperemote</div>
                      <div className="text-xs text-muted-foreground">Animated emote</div>
                    </div>
                  </button>
                </div>
              </div>

            {/* Amount Field */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-purple-500">
                Amount (₹) *
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder={donationType === 'hyperemote' ? 'Min ₹50' : 'Enter amount'}
                value={formData.amount}
                onChange={handleInputChange}
                min={donationType === 'hyperemote' ? '50' : '1'}
                max="100000"
                className="border-purple-500/30 focus:border-purple-500 focus:ring-purple-500/20"
                required
              />
              {donationType === 'hyperemote' && (
                <p className="text-xs text-purple-400">
                  ⚡ Hyperemotes start from ₹50 and trigger animated emotes on stream!
                </p>
              )}
            </div>

            {/* Message Field for text donations */}
            {donationType === 'message' && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-purple-500">
                  Your Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:border-purple-500 focus:ring-purple-500/20 focus:ring-2 focus:outline-none resize-none"
                  required
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Add emotions with the buttons below 👇</span>
                  <span>{formData.message?.length || 0}/500</span>
                </div>
              </div>
            )}

            {/* Voice Recorder for voice donations */}
            {donationType === 'voice' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-500">
                  Record Your Voice Message *
                </label>
                <VoiceRecorder
                  onRecordingComplete={handleVoiceRecorded}
                  controller={voiceRecorder}
                />
              </div>
            )}

            {/* Hyperemote Selection */}
            {donationType === 'hyperemote' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-purple-500">
                  Choose Your Hyperemote
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {availableEmotes.map((emote) => (
                    <button
                      key={emote.name}
                      type="button"
                      onClick={() => handleEmojiSelect(emote.name, emote.url)}
                      className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                        selectedEmoji === emote.name
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-purple-500/30 hover:border-purple-500/50'
                      }`}
                    >
                      <img
                        src={emote.url}
                        alt={emote.name}
                        className="w-8 h-8 mx-auto object-contain"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
                {selectedEmoji && (
                  <p className="text-xs text-purple-400 text-center">
                    ✨ Selected: {selectedEmoji} - This will animate on stream!
                  </p>
                )}
              </div>
            )}


            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              disabled={sdkLoading || isProcessing}
            >
              {sdkLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading Payment System...
                </>
              ) : isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Donate {formData.amount ? `₹${formData.amount}` : ''}
                </>
              )}
            </Button>

            {sdkError && (
              <p className="text-sm text-red-500 text-center">{sdkError}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Phone Number Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple-500">Complete Your Donation</DialogTitle>
            <DialogDescription>
              Please enter your mobile number to proceed with the payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Mobile Number *
              </label>
              <Input
                id="phone"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError('');
                }}
                maxLength={10}
                className="border-purple-500/30 focus:border-purple-500 focus:ring-purple-500/20"
              />
              {phoneError && (
                <p className="text-sm text-red-500">{phoneError}</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
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
                className="bg-purple-500 hover:bg-purple-600"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemoStreamer;