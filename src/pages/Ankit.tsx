import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Heart, Sparkles } from "lucide-react";
// Razorpay integration - SDK loaded dynamically
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
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [donationType, setDonationType] = useState<'message' | 'voice' | 'hyperemote'>('message');
  const [streamerSettings, setStreamerSettings] = useState<any>(null);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [showHyperemoteEffect, setShowHyperemoteEffect] = useState(false);
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  
  // Calculate character limit based on amount
  const getCharacterLimit = (amount: number): number => {
    if (amount >= 200) return 250;
    if (amount >= 100) return 200;
    if (amount >= 40) return 100;
    return 100;
  };
  
  // Calculate voice recording duration based on amount
  const getVoiceDuration = (amount: number): number => {
    if (amount >= 250) return 30;
    if (amount >= 200) return 20;
    if (amount >= 150) return 15;
    return 15;
  };

  // Voice recorder instance - dynamically update duration based on amount
  const currentAmount = parseFloat(formData.amount) || 0;
  const maxVoiceDuration = getVoiceDuration(currentAmount);
  const voiceRecorder = useVoiceRecorder(maxVoiceDuration);
  
  // Lock amount when recording starts
  useEffect(() => {
    if (voiceRecorder.isRecording) {
      setIsAmountLocked(true);
    } else if (!voiceRecorder.audioBlob) {
      setIsAmountLocked(false);
    }
  }, [voiceRecorder.isRecording, voiceRecorder.audioBlob]);

  

  // Load Razorpay SDK and fetch streamer settings
  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
        console.log('Razorpay SDK loaded successfully');
        toast({
          title: "Payment System Ready",
          description: "You can now make donations safely.",
        });
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
        toast({
          title: "Payment System Error",
          description: "Failed to load payment system. Please refresh.",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
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
    
    loadRazorpay();
    fetchStreamerSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If amount changes and message exceeds new limit, truncate message
    if (name === 'amount' && donationType === 'message') {
      const newAmount = parseFloat(value) || 40;
      const newCharLimit = getCharacterLimit(newAmount);
      
      if (formData.message.length > newCharLimit) {
        toast({
          title: "Message Shortened",
          description: `Donation amount reduced. Message limited to ${newCharLimit} characters.`,
        });
        setFormData(prev => ({
          ...prev,
          [name]: value,
          message: prev.message.substring(0, newCharLimit)
        }));
        return;
      }
    }
    
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
    
    // Validate character limits for text messages
    if (donationType === 'message' && formData.message?.trim()) {
      const charLimit = getCharacterLimit(amount);
      if (formData.message.length > charLimit) {
        toast({
          title: "Message Too Long",
          description: `Your donation amount allows up to ${charLimit} characters. Increase donation or shorten message.`,
          variant: "destructive",
        });
        return;
      }
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

    if (!razorpayLoaded) {
      toast({
        title: "Payment System Not Ready",
        description: "Please wait or refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

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
              streamerSlug: 'ankit'
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

      // Create Razorpay order via Supabase edge function
      const response = await supabase.functions.invoke('create-razorpay-order-ankit', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : 
                  donationType === 'voice' ? 'Sent a Voice message' : 
                  donationType === 'hyperemote' ? formData.message.trim() : '',
          voiceMessageUrl: voiceMessageUrl,
          isHyperemote: donationType === 'hyperemote'
        }
      });

      const data = response.data;
      const error = response.error;

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      console.log('Razorpay order created:', data.razorpay_order_id);

      // Initialize Razorpay Checkout
      const options = {
        key: data.razorpay_key_id,
        amount: data.amount, // Already in paise
        currency: 'INR',
        name: 'HyperChat - Ankit',
        description: donationType === 'hyperemote' ? 'Hyperemote Celebration' : 
                     donationType === 'voice' ? 'Voice Message' : 'Text Message',
        order_id: data.razorpay_order_id,
        prefill: {
          name: formData.name.trim(),
        },
        theme: {
          color: '#3b82f6'
        },
        handler: function(response: any) {
          console.log('Payment success:', response);
          navigate(`/status?order_id=${data.order_id}&status=success`);
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled');
            navigate(`/status?order_id=${data.order_id}&status=pending`);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function(response: any) {
        console.log('Payment failed:', response);
        navigate(`/status?order_id=${data.order_id}&status=failed`);
      });

      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDonationTypeChange = (type: 'message' | 'voice' | 'hyperemote') => {
    setDonationType(type);
    if (type === 'hyperemote') {
      const minAmount = streamerSettings?.hyperemotes_min_amount || 1;
      setFormData(prev => ({ ...prev, amount: minAmount.toString(), message: 'Hyperemote celebration! 🎉' }));
      setShowHyperemoteEffect(true);
      setTimeout(() => setShowHyperemoteEffect(false), 3000);
    } else {
      setFormData(prev => ({ ...prev, amount: '' }));
    }
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
                      <div className="text-xs text-muted-foreground">Min: ₹40</div>
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
                      <div className="text-xs text-muted-foreground">
                        ₹{streamerSettings?.hyperemotes_min_amount || 1}+ celebration
                      </div>
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
                placeholder={
                  donationType === 'message' ? 'Min: ₹40' : 
                  donationType === 'voice' ? 'Min: ₹150' : 
                  'Enter amount'
                }
                value={formData.amount}
                onChange={handleInputChange}
                className="border-blue-500/30 focus:border-blue-500 focus:ring-blue-500/20"
                min="1"
                max="100000"
                disabled={donationType === 'hyperemote' || isAmountLocked}
                required
              />
              {isAmountLocked && (
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  🔒 Amount locked during voice recording
                </p>
              )}
              {donationType === 'message' && (
                <p className="text-xs text-muted-foreground">
                  TTS available for donations above ₹70
                </p>
              )}
              {donationType === 'voice' && currentAmount >= 150 && (
                <p className="text-xs text-muted-foreground">
                  Voice duration: {getVoiceDuration(currentAmount)}s
                  {currentAmount < 200 && ' (Donate ₹200+ for 20s, ₹250+ for 30s)'}
                </p>
              )}
              {donationType === 'hyperemote' && (
                <p className="text-xs text-muted-foreground">
                  Hyperemotes start at ₹{streamerSettings?.hyperemotes_min_amount || 1} with automatic celebration effects
                </p>
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
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-blue-500/30 rounded-lg bg-background/50 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                  rows={3}
                  maxLength={getCharacterLimit(currentAmount)}
                  required
                />
                <div className="text-xs text-muted-foreground text-right">
                  {formData.message.length}/{getCharacterLimit(currentAmount)} characters
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
                  maxDurationSeconds={maxVoiceDuration}
                  controller={voiceRecorder}
                  requiredAmount={150}
                  currentAmount={currentAmount}
                />
              </div>
            )}

            {/* Hyperemote Info */}
            {donationType === 'hyperemote' && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span className="font-medium text-purple-500">Hyperemote Celebration</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your donation will trigger an epic celebration animation with special effects! 
                    The bigger the amount, the more spectacular the celebration.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-purple-400">
                    <span>🎯 ₹50-99: Basic celebration</span>
                    <span>🔥 ₹100-499: Epic effects</span>
                    <span>💫 ₹500+: Legendary show</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isProcessing || !razorpayLoaded}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : !razorpayLoaded ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading Payment System...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Donate ₹{formData.amount || '0'}</span>
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

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