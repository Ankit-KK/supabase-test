import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

const ClumsyGod = () => {
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

  const getCharacterLimit = (amount: number): number => {
    if (amount >= 200) return 250;
    if (amount >= 100) return 200;
    if (amount >= 40) return 100;
    return 100;
  };

  const getVoiceDuration = (amount: number): number => {
    if (amount >= 250) return 30;
    if (amount >= 200) return 20;
    if (amount >= 150) return 15;
    return 15;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const maxVoiceDuration = getVoiceDuration(currentAmount);
  const voiceRecorder = useVoiceRecorder(maxVoiceDuration);

  useEffect(() => {
    if (voiceRecorder.isRecording) {
      setIsAmountLocked(true);
    } else if (!voiceRecorder.audioBlob) {
      setIsAmountLocked(false);
    }
  }, [voiceRecorder.isRecording, voiceRecorder.audioBlob]);

  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
        toast({
          title: "Payment System Ready",
          description: "You can now make donations safely."
        });
      };
      script.onerror = () => {
        toast({
          title: "Payment System Error",
          description: "Failed to load payment system. Please refresh.",
          variant: "destructive"
        });
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    };

    const fetchStreamerSettings = async () => {
      try {
        const { data, error } = await supabase.rpc('get_streamer_public_settings', {
          slug: 'clumsygod'
        });
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

    if (name === 'amount' && donationType === 'message') {
      const newAmount = parseFloat(value) || 40;
      const newCharLimit = getCharacterLimit(newAmount);
      if (formData.message.length > newCharLimit) {
        toast({
          title: "Message Shortened",
          description: `Donation amount reduced. Message limited to ${newCharLimit} characters.`
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

    const amount = parseFloat(formData.amount);
    if (!formData.name?.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name.",
        variant: "destructive"
      });
      return;
    }
    if (donationType === 'voice' && !hasVoiceRecording) {
      toast({
        title: "Voice Message Required",
        description: "Please record a voice message for your donation.",
        variant: "destructive"
      });
      return;
    }
    if (donationType === 'message' && !formData.message?.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message for your donation.",
        variant: "destructive"
      });
      return;
    }

    if (donationType === 'message' && formData.message?.trim()) {
      const charLimit = getCharacterLimit(amount);
      if (formData.message.length > charLimit) {
        toast({
          title: "Message Too Long",
          description: `Your donation amount allows up to ${charLimit} characters.`,
          variant: "destructive"
        });
        return;
      }
    }

    if (!amount || amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive"
      });
      return;
    }

    if (donationType === 'message' && amount < 40) {
      toast({
        title: "Insufficient Amount",
        description: "Text messages require a minimum donation of ₹40.",
        variant: "destructive"
      });
      return;
    }
    if (donationType === 'voice' && amount < 150) {
      toast({
        title: "Insufficient Amount",
        description: "Voice messages require a minimum donation of ₹150.",
        variant: "destructive"
      });
      return;
    }
    if (!razorpayLoaded) {
      toast({
        title: "Payment System Not Ready",
        description: "Please wait or refresh the page.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      let voiceMessageUrl: string | null = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        const voiceDataBase64 = await new Promise<string>(resolve => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke('upload-voice-message-direct', {
          body: {
            voiceData: voiceDataBase64,
            streamerSlug: 'clumsygod'
          }
        });
        if (uploadError) {
          throw new Error('Failed to upload voice message');
        }
        voiceMessageUrl = uploadResult.voice_message_url;
      }

      const response = await supabase.functions.invoke('create-razorpay-order-clumsygod', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : donationType === 'voice' ? 'Sent a Voice message' : formData.message.trim(),
          voiceMessageUrl: voiceMessageUrl,
          isHyperemote: donationType === 'hyperemote'
        }
      });

      const data = response.data;
      const error = response.error;
      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: 'INR',
        name: 'HyperChat - ClumsyGod',
        description: donationType === 'hyperemote' ? 'Hyperemote Celebration' : donationType === 'voice' ? 'Voice Message' : 'Text Message',
        order_id: data.razorpay_order_id,
        prefill: {
          name: formData.name.trim()
        },
        theme: {
          color: '#8b5cf6'
        },
        handler: function (response: any) {
          navigate(`/status?order_id=${data.order_id}&status=success`);
        },
        modal: {
          ondismiss: function () {
            navigate(`/status?order_id=${data.order_id}&status=pending`);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        navigate(`/status?order_id=${data.order_id}&status=failed`);
      });
      rzp.open();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDonationTypeChange = (type: 'message' | 'voice' | 'hyperemote') => {
    setDonationType(type);
    if (type === 'hyperemote') {
      const minAmount = streamerSettings?.hyperemotes_min_amount || 50;
      setFormData(prev => ({
        ...prev,
        amount: minAmount.toString(),
        message: 'Hyperemote celebration! 🎉'
      }));
      setShowHyperemoteEffect(true);
      setTimeout(() => setShowHyperemoteEffect(false), 3000);
    } else {
      setFormData(prev => ({
        ...prev,
        amount: ''
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Full-page background with banner image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/lovable-uploads/clumsygod-banner.jpg)' }}
      />
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Animated purple glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-violet-400/15 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <Card className="w-full max-w-[21rem] mx-auto relative overflow-hidden border-violet-500/30 shadow-2xl shadow-violet-500/20">
        {/* Card background with logo image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/lovable-uploads/clumsygod-logo.jpg)' }}
        />
        {/* Semi-transparent overlay for card content readability */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        
        <CardHeader className="text-center relative z-10 pb-3">
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center space-x-2 text-violet-400">
              <Gamepad2 className="h-7 w-7" />
              <Sparkles className="h-5 w-5 animate-pulse" />
              <Star className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
            ClumsyGod
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Support ClumsyGod with your donation
          </p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10 pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-medium text-violet-400">
                Your Name *
              </label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Enter your name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="border-violet-500/30 focus:border-violet-500 focus:ring-violet-500/20 h-9 text-sm" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-violet-400">
                Choose your donation type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button 
                  type="button" 
                  onClick={() => handleDonationTypeChange('message')} 
                  className={`p-2 rounded-lg border-2 transition-all ${donationType === 'message' ? 'border-violet-500 bg-violet-500/10' : 'border-violet-500/30 hover:border-violet-500/50'}`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">💬</div>
                    <div className="font-medium text-[10px]">Text Message</div>
                    <div className="text-[9px] text-muted-foreground">Min: ₹40</div>
                  </div>
                </button>
                <button 
                  type="button" 
                  onClick={() => handleDonationTypeChange('voice')} 
                  className={`p-2 rounded-lg border-2 transition-all ${donationType === 'voice' ? 'border-violet-500 bg-violet-500/10' : 'border-violet-500/30 hover:border-violet-500/50'}`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🎤</div>
                    <div className="font-medium text-[10px]">Voice Message</div>
                    <div className="text-[9px] text-muted-foreground">Min: ₹150</div>
                  </div>
                </button>
                <button 
                  type="button" 
                  onClick={() => handleDonationTypeChange('hyperemote')} 
                  className={`p-2 rounded-lg border-2 transition-all ${donationType === 'hyperemote' ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500/30 hover:border-purple-500/50'}`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🎉</div>
                    <div className="font-medium text-[10px]">Hyperemotes</div>
                    <div className="text-[9px] text-muted-foreground">
                      ₹{streamerSettings?.hyperemotes_min_amount || 50}+
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="amount" className="text-xs font-medium text-violet-400">
                Amount (₹) *
              </label>
              <Input 
                id="amount" 
                name="amount" 
                type="number" 
                placeholder={donationType === 'message' ? 'Min: ₹40' : donationType === 'voice' ? 'Min: ₹150' : 'Enter amount'} 
                value={formData.amount} 
                onChange={handleInputChange} 
                className="border-violet-500/30 focus:border-violet-500 focus:ring-violet-500/20 h-9 text-sm" 
                min="1" 
                max="100000" 
                disabled={donationType === 'hyperemote' || isAmountLocked} 
                required 
              />
              {isAmountLocked && (
                <p className="text-[10px] text-yellow-600 flex items-center gap-1">
                  🔒 Amount locked during voice recording
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">TTS above ₹70</p>
              {donationType === 'voice' && currentAmount >= 150 && (
                <p className="text-[10px] text-muted-foreground">
                  Voice duration: {getVoiceDuration(currentAmount)}s
                  {currentAmount < 200 && ' (₹200+ for 20s, ₹250+ for 30s)'}
                </p>
              )}
              {donationType === 'hyperemote' && (
                <p className="text-[10px] text-muted-foreground">
                  Hyperemotes start at ₹{streamerSettings?.hyperemotes_min_amount || 50}
                </p>
              )}
            </div>

            {donationType === 'message' && (
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-medium text-violet-400">
                  Message *
                </label>
                <textarea 
                  id="message" 
                  name="message" 
                  placeholder="Enter your message" 
                  value={formData.message} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border border-violet-500/30 rounded-lg bg-background/50 backdrop-blur-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none resize-none text-sm" 
                  rows={2} 
                  maxLength={getCharacterLimit(currentAmount)} 
                  required 
                />
                <div className="text-[10px] text-muted-foreground text-right">
                  {formData.message.length}/{getCharacterLimit(currentAmount)} chars
                </div>
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-violet-400">
                  Record Voice Message *
                </label>
                <VoiceRecorder
                  controller={voiceRecorder}
                  maxDurationSeconds={maxVoiceDuration}
                  requiredAmount={150}
                  currentAmount={currentAmount}
                  onRecordingComplete={(hasRecording, duration) => {
                    setHasVoiceRecording(hasRecording);
                    setVoiceDuration(duration);
                  }}
                />
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isProcessing || !razorpayLoaded} 
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold py-2.5 text-sm"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Donate ₹${formData.amount || '0'}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClumsyGod;
