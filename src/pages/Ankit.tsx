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

const Ankit = () => {
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

  // Emotional TTS states
  const [messageInputRef, setMessageInputRef] = useState<HTMLTextAreaElement | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showEmotionalPreview, setShowEmotionalPreview] = useState(false);
  
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
          .rpc('get_streamer_public_settings', { slug: 'ankit' });

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

    // Track cursor position for emotion insertion
    if (name === 'message' && e.target instanceof HTMLTextAreaElement) {
      setCursorPosition(e.target.selectionStart);
    }
  };

  const handleEmotionSelect = (emotionTag: string) => {
    if (!messageInputRef) return;

    const currentMessage = formData.message;
    const before = currentMessage.slice(0, cursorPosition);
    const after = currentMessage.slice(cursorPosition);
    const newMessage = before + emotionTag + ' ' + after;

    setFormData(prev => ({
      ...prev,
      message: newMessage
    }));

    // Update cursor position to after the inserted emotion
    setTimeout(() => {
      if (messageInputRef) {
        const newCursorPos = cursorPosition + emotionTag.length + 1;
        messageInputRef.setSelectionRange(newCursorPos, newCursorPos);
        messageInputRef.focus();
        setCursorPosition(newCursorPos);
      }
    }, 0);
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

      // Create order via Supabase edge function
      const response = await supabase.functions.invoke('create-payment-order-ankit', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : 
                  donationType === 'voice' ? 'Voice message donation' : '',
          phone: phoneNumber?.trim() || undefined,
          voiceData: voiceDataBase64
        }
      });

      data = response.data;
      const error = response.error;

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      const orderId = data.order_id;

      // Attach optional data to the existing donation (created by edge function)
      // Note: Voice data and extras are now handled by the create-payment-order-ankit edge function

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
      setFormData(prev => ({ ...prev, amount: '1', message: '' }));
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-blue-500/20 shadow-2xl relative overflow-hidden">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-blue-400/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2 text-blue-500">
              <Gamepad2 className="h-8 w-8" />
              <Sparkles className="h-6 w-6 animate-pulse" />
              <Heart className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            Ankit
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Support Ankit with your donation
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-blue-500">
                Your Name *
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-blue-500/30 focus:border-blue-500 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* Donation Type Selection */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-blue-500">
                  Choose your donation type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('message')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      donationType === 'message'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-blue-500/30 hover:border-blue-500/50'
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
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-blue-500/30 hover:border-blue-500/50'
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
              <label htmlFor="amount" className="text-sm font-medium text-blue-500">
                Amount (₹) *
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="border-blue-500/30 focus:border-blue-500 focus:ring-blue-500/20"
                min="1"
                max="100000"
                disabled={donationType === 'hyperemote'}
                required
              />
              {donationType === 'hyperemote' && (
                <p className="text-xs text-muted-foreground">Hyperemotes are fixed at ₹1</p>
              )}
            </div>

            {/* Message Field */}
            {donationType === 'message' && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-blue-500">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message (use [emotion] tags for expressive TTS)"
                  value={formData.message}
                  onChange={handleInputChange}
                  onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
                  ref={(ref) => setMessageInputRef(ref)}
                  className="w-full p-3 border border-blue-500/30 rounded-lg bg-background/50 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                  rows={3}
                  maxLength={500}
                  required
                />
                <div className="text-xs text-muted-foreground text-right">
                  {formData.message.length}/500 characters
                </div>
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-blue-500">
                  Record Voice Message *
                </label>
                <VoiceRecorder
                  onRecordingComplete={(hasRecording, duration) => {
                    setHasVoiceRecording(hasRecording);
                    setVoiceDuration(duration);
                  }}
                  maxDurationSeconds={60}
                  controller={voiceRecorder}
                />
              </div>
            )}

            {/* Hyperemote Selection */}
            {donationType === 'hyperemote' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-purple-500">
                  Choose your celebration emote
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {availableEmotes.map((emote) => (
                    <button
                      key={emote.name}
                      type="button"
                      onClick={() => handleEmojiSelect(emote.name, emote.url)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        selectedEmoji === emote.name
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-purple-500/30 hover:border-purple-500/50'
                      }`}
                    >
                      <img 
                        src={emote.url} 
                        alt={emote.name}
                        className="w-8 h-8 mx-auto object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isProcessing || sdkLoading || !!sdkError}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : sdkLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading Payment System...</span>
                </div>
              ) : sdkError ? (
                <span className="text-red-300">Payment System Error</span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Donate ₹{formData.amount || '0'}</span>
                </span>
              )}
            </Button>

            {sdkError && (
              <div className="text-center">
                <p className="text-red-500 text-sm">{sdkError}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs"
                >
                  Refresh Page
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Phone Number Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-500" />
              Complete Your Donation
            </DialogTitle>
            <DialogDescription>
              Please enter your mobile number to complete the payment process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Mobile Number *
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError('');
                }}
                className={`${phoneError ? 'border-red-500' : ''}`}
                maxLength={10}
              />
              {phoneError && (
                <p className="text-red-500 text-sm">{phoneError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPhoneDialog(false)}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePhoneSubmit}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hyperemote Effect */}
      {showHyperemoteEffect && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce text-6xl">🎉</div>
        </div>
      )}
    </div>
  );
};

export default Ankit;