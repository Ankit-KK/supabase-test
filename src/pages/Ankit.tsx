import React, { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Heart, Sparkles, Check, ChevronsUpDown, Volume2, Image, X } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import { getMaxMessageLength } from "@/utils/getMaxMessageLength";
// Razorpay integration - SDK loaded dynamically
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import DonationPageFooter from "@/components/DonationPageFooter";

const Ankit = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
    currency: 'INR'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [donationType, setDonationType] = useState<'message' | 'voice' | 'hypersound' | 'image'>('message');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [streamerSettings, setStreamerSettings] = useState<any>(null);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [showHypersoundEffect, setShowHypersoundEffect] = useState(false);
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);

  // Fetch streamer-specific pricing
  const { pricing } = useStreamerPricing('ankit', formData.currency);

  // Auto-resume mobile video when it gets paused by touch/interaction
  useEffect(() => {
    const video = mobileVideoRef.current;
    if (!video || !isMobile) return;

    const handlePause = () => {
      if (document.visibilityState === 'visible') {
        video.play().catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        video.play().catch(() => {});
      }
    };

    const handleTouchEnd = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    video.addEventListener('pause', handlePause);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      video.removeEventListener('pause', handlePause);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  // Calculate voice recording duration based on amount
  const getVoiceDuration = (amount: number): number => {
    if (amount >= 250) return 30;
    if (amount >= 200) return 20;
    if (amount >= 150) return 15;
    return 15;
  };

  // Voice recorder instance - dynamically update duration based on amount
  const currentAmount = parseFloat(formData.amount) || 0;
  const charLimit = getMaxMessageLength(pricing.messageCharTiers, currentAmount);
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
          description: "You can now make donations safely."
        });
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
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
        const {
          data,
          error
        } = await supabase.rpc('get_streamer_public_settings', {
          slug: 'ankit'
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
    const {
      name,
      value
    } = e.target;

    // If amount changes and message exceeds new limit, truncate message
    if (name === 'amount' && donationType === 'message') {
      const newAmount = parseFloat(value) || 40;
      const newCharLimit = getMaxMessageLength(pricing.messageCharTiers, newAmount);
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

    // Validate inputs first
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
    if (donationType === 'hypersound' && !selectedSound) {
      toast({
        title: "Sound Required",
        description: "Please select a sound for your HyperSound donation.",
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

    // Validate character limits for text messages
    if (donationType === 'message' && formData.message?.trim()) {
      if (formData.message.length > charLimit) {
        toast({
          title: "Message Too Long",
          description: `Your donation amount allows up to ${charLimit} characters. Increase donation or shorten message.`,
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

    // Validate minimum amounts based on donation type using streamer pricing
    const currencySymbol = getCurrencySymbol(formData.currency);
    
    // Text donations use minText - TTS is a bonus at higher amounts (₹70+)
    if (donationType === 'message' && amount < pricing.minText) {
      toast({
        title: "Insufficient Amount",
        description: `Text messages require a minimum donation of ${currencySymbol}${pricing.minText}.`,
        variant: "destructive"
      });
      return;
    }
    if (donationType === 'voice' && amount < pricing.minVoice) {
      toast({
        title: "Insufficient Amount",
        description: `Voice messages require a minimum donation of ${currencySymbol}${pricing.minVoice}.`,
        variant: "destructive"
      });
      return;
    }
    if (donationType === 'hypersound' && amount < pricing.minHypersound) {
      toast({
        title: "Insufficient Amount",
        description: `HyperSounds require a minimum donation of ${currencySymbol}${pricing.minHypersound}.`,
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
      const amount = parseFloat(formData.amount);

      // Upload voice message BEFORE creating payment order
      let voiceMessageUrl: string | null = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        console.log('Uploading voice message before payment...');
        const reader = new FileReader();
        const voiceDataBase64 = await new Promise<string>(resolve => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        // Upload voice message directly
        const {
          data: uploadResult,
          error: uploadError
        } = await supabase.functions.invoke('upload-voice-message-direct', {
          body: {
            voiceData: voiceDataBase64,
            streamerSlug: 'ankit'
          }
        });
        if (uploadError) {
          console.error('Voice upload error:', uploadError);
          throw new Error('Failed to upload voice message');
        }
        voiceMessageUrl = uploadResult.voice_message_url;
        console.log('Voice message uploaded successfully:', voiceMessageUrl);
      }

      // Create Razorpay order via Supabase edge function
      const response = await supabase.functions.invoke('create-razorpay-order-unified', {
        body: {
          streamer_slug: 'ankit',
          name: formData.name.trim(),
          amount: amount,
          currency: formData.currency,
          message: donationType === 'message' ? formData.message.trim() : donationType === 'voice' ? 'Sent a Voice message' : donationType === 'hypersound' ? '🔊 HyperSound!' : '',
          voiceMessageUrl: voiceMessageUrl,
          hypersoundUrl: donationType === 'hypersound' ? selectedSound : null
        }
      });
      const data = response.data;
      const error = response.error;
      if (error || !data?.orderId) {
        throw new Error(data?.error || 'Failed to create payment order');
      }
      console.log('Razorpay order created:', data.razorpay_order_id);

      // Initialize Razorpay Checkout
      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: formData.currency,
        name: 'HyperChat - Ankit',
        description: donationType === 'hypersound' ? 'HyperSound - Soundboard' : donationType === 'voice' ? 'Voice Message' : 'Text Message',
        order_id: data.razorpay_order_id,
        prefill: {
          name: formData.name.trim()
        },
        hidden: {
          contact: true
        },
        theme: {
          color: '#3b82f6'
        },
        handler: function (response: any) {
          console.log('Payment success:', response);
          navigate(`/status?order_id=${data.order_id}&status=success`);
        },
        modal: {
          ondismiss: function () {
            console.log('Payment cancelled');
            navigate(`/status?order_id=${data.order_id}&status=pending`);
          }
        }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.log('Payment failed:', response);
        navigate(`/status?order_id=${data.order_id}&status=failed`);
      });
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image must be less than 5MB.",
          variant: "destructive"
        });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleDonationTypeChange = (type: 'message' | 'voice' | 'hypersound' | 'image') => {
    setDonationType(type);
    if (type === 'hypersound') {
      setFormData(prev => ({
        ...prev,
        amount: pricing.minHypersound.toString(),
        message: ''
      }));
      setShowHypersoundEffect(true);
      setTimeout(() => setShowHypersoundEffect(false), 3000);
    } else if (type === 'image') {
      setFormData(prev => ({
        ...prev,
        amount: pricing.minMedia.toString(),
        message: ''
      }));
      setSelectedSound(null);
    } else if (type === 'voice') {
      setFormData(prev => ({
        ...prev,
        amount: pricing.minVoice.toString(),
        message: ''
      }));
      setSelectedSound(null);
    } else {
      // Text donations use minText - TTS is a bonus at higher amounts
      setFormData(prev => ({
        ...prev,
        amount: pricing.minText.toString()
      }));
      setSelectedSound(null);
    }
    // Clear image when switching away from image type
    if (type !== 'image') {
      handleRemoveImage();
    }
  };

  return <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative">
    {/* Background - Video on desktop, gradient on mobile */}
    {!isMobile ? (
      <>
        <VideoBackground videoSrc="/assets/streamers/ankit-background.mp4" />
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
      </>
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-[#9b87f5]/30 via-[#D946EF]/20 to-[#7E69AB]/40 pointer-events-none"></div>
    )}

      <Card className="w-full max-w-sm mx-auto bg-transparent border-blue-500/20 shadow-2xl relative overflow-hidden z-10">
        {/* Card Background - Gradient on desktop, video on mobile */}
        {isMobile ? (
          <>
            <video
              ref={mobileVideoRef}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0 rounded-lg"
            >
              <source src="/assets/streamers/ankit-background.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/50 z-0"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#9b87f5]/40 via-[#D946EF]/30 to-[#7E69AB]/50 z-0"></div>
        )}
        
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-hyperchat-purple/20 via-hyperchat-pink/20 to-hyperchat-purple/20 opacity-50 blur-xl z-0"></div>
        
        <CardHeader className="text-center relative z-10 pb-2">
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center space-x-2 text-white drop-shadow-[0_0_8px_rgba(155,135,245,0.8)]">
              <Gamepad2 className="h-6 w-6" />
              <Sparkles className="h-5 w-5 animate-pulse" />
              <Heart className="h-5 w-5" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold bg-hero-gradient bg-clip-text text-transparent drop-shadow-lg">
            Ankit
          </CardTitle>
          <p className="text-white text-xs drop-shadow-md">
            Support Ankit with your donation
          </p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-white drop-shadow-md">
                Your Name *
              </label>
              <Input id="name" name="name" placeholder="Enter your name" value={formData.name} onChange={handleInputChange} className="border-blue-500/30 focus:border-blue-500 focus:ring-blue-500/20" required />
            </div>

            {/* Donation Type Selection */}
            <div className="space-y-3">
                <label className="text-sm font-semibold text-white drop-shadow-md">
                  Choose your donation type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button type="button" onClick={() => handleDonationTypeChange('message')} className={`p-2 rounded-lg border-2 transition-all ${donationType === 'message' ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500/30 hover:border-blue-500/50'}`}>
                    <div className="text-center">
                      <div className="text-base mb-1">💬</div>
                      <div className="font-semibold text-[10px] text-white drop-shadow-sm">Text</div>
                      <div className="text-[9px] text-yellow-300 drop-shadow-sm">Min: {getCurrencySymbol(formData.currency)}{pricing.minText}</div>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleDonationTypeChange('voice')} className={`p-2 rounded-lg border-2 transition-all ${donationType === 'voice' ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500/30 hover:border-blue-500/50'}`}>
                    <div className="text-center">
                      <div className="text-base mb-1">🎤</div>
                      <div className="font-semibold text-[10px] text-white drop-shadow-sm">Voice</div>
                      <div className="text-[9px] text-yellow-300 drop-shadow-sm">Min: {getCurrencySymbol(formData.currency)}{pricing.minVoice}</div>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleDonationTypeChange('hypersound')} className={`p-2 rounded-lg border-2 transition-all ${donationType === 'hypersound' ? 'border-orange-500 bg-orange-500/10' : 'border-orange-500/30 hover:border-orange-500/50'}`}>
                    <div className="text-center">
                      <div className="text-base mb-1">🔊</div>
                      <div className="font-semibold text-[10px] text-white drop-shadow-sm">Sound</div>
                      <div className="text-[9px] text-yellow-300 drop-shadow-sm">
                        Min: {getCurrencySymbol(formData.currency)}{pricing.minHypersound}
                      </div>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleDonationTypeChange('image')} className={`p-2 rounded-lg border-2 transition-all ${donationType === 'image' ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500/30 hover:border-purple-500/50'}`}>
                    <div className="text-center">
                      <div className="text-base mb-1">📷</div>
                      <div className="font-semibold text-[10px] text-white drop-shadow-sm">Image</div>
                      <div className="text-[9px] text-yellow-300 drop-shadow-sm">Min: {getCurrencySymbol(formData.currency)}{pricing.minMedia}</div>
                    </div>
                  </button>
                </div>
            </div>

            {/* Amount Field with Inline Currency Selector */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-semibold text-white drop-shadow-md">
                Amount *
              </label>
              <div className="flex gap-2">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="w-[100px] justify-between border-blue-500/30 focus:border-blue-500 px-2"
                    >
                      {getCurrencySymbol(formData.currency)} {formData.currency}
                      <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search currency..." />
                      <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <CommandItem
                              key={currency.code}
                              value={`${currency.code} ${currency.name}`}
                              onSelect={() => {
                                setFormData(prev => ({ ...prev, currency: currency.code }));
                                setCurrencyOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.currency === currency.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {currency.symbol} {currency.code} - {currency.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input 
                  id="amount" 
                  name="amount" 
                  type="number" 
                  placeholder={donationType === 'message' ? `Min: ${pricing.minText}` : donationType === 'voice' ? `Min: ${pricing.minVoice}` : `Min: ${pricing.minHypersound}`} 
                  value={formData.amount} 
                  onChange={handleInputChange} 
                  className="flex-1 border-blue-500/30 focus:border-blue-500 focus:ring-blue-500/20" 
                  min="1" 
                  max="100000" 
                  disabled={isAmountLocked} 
                  required 
                />
              </div>
              {isAmountLocked && <p className="text-xs text-yellow-600 flex items-center gap-1">
                  🔒 Amount locked during voice recording
                </p>}
              {donationType === 'message' && pricing.ttsEnabled && (
                <p className="text-xs text-white/90 drop-shadow-sm">TTS above {getCurrencySymbol(formData.currency)}{pricing.minTts}</p>
              )}
              {donationType === 'voice' && currentAmount >= pricing.minVoice && <p className="text-xs text-white/90 drop-shadow-sm">
                  Voice duration: {getVoiceDuration(currentAmount)}s
                  {formData.currency === 'INR' && currentAmount < 200 && ' (Donate ₹200+ for 20s, ₹250+ for 30s)'}
                </p>}
              {donationType === 'hypersound' && <p className="text-xs text-white/90 drop-shadow-sm">
                  HyperSounds start at {getCurrencySymbol(formData.currency)}{pricing.minHypersound}
                </p>}
            </div>

            {/* Message Field */}
            {donationType === 'message' && <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-semibold text-white drop-shadow-md">
                  Message *
                </label>
                <textarea id="message" name="message" placeholder="Enter your message" value={formData.message} onChange={handleInputChange} className="w-full p-3 border border-blue-500/30 rounded-lg bg-background/50 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none" rows={3} maxLength={charLimit} required />
                <div className="text-xs text-white/90 drop-shadow-sm text-right">
                  {formData.message.length}/{charLimit} characters
                </div>
              </div>}

            {donationType === 'voice' && <div className="space-y-3">
                <label className="text-sm font-semibold text-white drop-shadow-md">
                  Record Voice Message *
                </label>
                <VoiceRecorder onRecordingComplete={(hasRecording, duration) => {
              setHasVoiceRecording(hasRecording);
              setVoiceDuration(duration);
            }} maxDurationSeconds={maxVoiceDuration} controller={voiceRecorder} requiredAmount={150} currentAmount={currentAmount} />
              </div>}

            {/* HyperSound Selector */}
            {donationType === 'hypersound' && <div className="space-y-3">
                <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <Volume2 className="h-5 w-5 text-orange-400 drop-shadow-md" />
                    <span className="font-semibold text-orange-400 drop-shadow-md">HyperSounds</span>
                  </div>
                  <p className="text-sm text-white/90 drop-shadow-sm mb-4">
                    You control the soundboard! Pick a sound to play on stream.
                  </p>
                  <HyperSoundSelector 
                    selectedSound={selectedSound}
                    onSoundSelect={setSelectedSound}
                  />
                </div>
              </div>}

            {/* Image Upload (Demo) */}
            {donationType === 'image' && <div className="space-y-3">
                <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <Image className="h-5 w-5 text-purple-300 drop-shadow-md" />
                    <span className="font-semibold text-purple-300 drop-shadow-md">Image Upload</span>
                    <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full drop-shadow-sm">Demo</span>
                  </div>
                  <p className="text-sm text-white/90 drop-shadow-sm mb-4">
                    Share an image with the streamer! (Demo feature - not functional yet)
                  </p>
                  
                  {!imagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-purple-500/30 border-dashed rounded-lg cursor-pointer bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Image className="w-8 h-8 mb-2 text-purple-300 drop-shadow-md" />
                        <p className="text-sm text-purple-300 drop-shadow-sm">Click to upload image</p>
                        <p className="text-xs text-white/80 drop-shadow-sm">PNG, JPG up to 5MB</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>}

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-hero-gradient hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" disabled={isProcessing || !razorpayLoaded}>
              {isProcessing ? <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div> : !razorpayLoaded ? <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading Payment System...</span>
                </div> : <span className="flex items-center justify-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Donate {getCurrencySymbol(formData.currency)}{formData.amount || '0'}</span>
                </span>}
            </Button>
            
            {/* RBI Regulation Notice */}
            <p className="text-xs text-white/70 text-center mt-2">
              Phone numbers are collected by Razorpay as per RBI regulations
            </p>
          </form>
          <DonationPageFooter brandColor="#3b82f6" />
        </CardContent>
      </Card>

      {/* HyperSound Effect */}
      {showHypersoundEffect && <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce text-6xl">🔊</div>
        </div>}
    </div>;
};
export default Ankit;
