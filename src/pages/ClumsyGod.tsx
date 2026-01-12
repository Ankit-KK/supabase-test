import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Sparkles, Star, Check, ChevronsUpDown, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, getCurrencySymbol, getCurrencyMinimums } from "@/constants/currencies";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import DonationPageFooter from "@/components/DonationPageFooter";

const ClumsyGod = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
    currency: 'INR'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [donationType, setDonationType] = useState<'message' | 'voice' | 'hypersound'>('message');
  const [streamerSettings, setStreamerSettings] = useState<any>(null);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [showHypersoundEffect, setShowHypersoundEffect] = useState(false);
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);

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

    // Validate minimum amounts based on donation type and currency
    const currencyMins = getCurrencyMinimums(formData.currency);
    const currencySymbol = getCurrencySymbol(formData.currency);
    
    if (donationType === 'message' && amount < currencyMins.minText) {
      toast({
        title: "Insufficient Amount",
        description: `Text messages require a minimum donation of ${currencySymbol}${currencyMins.minText}.`,
        variant: "destructive"
      });
      return;
    }
    if (donationType === 'voice' && amount < currencyMins.minVoice) {
      toast({
        title: "Insufficient Amount",
        description: `Voice messages require a minimum donation of ${currencySymbol}${currencyMins.minVoice}.`,
        variant: "destructive"
      });
      return;
    }
    if (donationType === 'hypersound' && amount < currencyMins.minHypersound) {
      toast({
        title: "Insufficient Amount",
        description: `HyperSounds require a minimum donation of ${currencySymbol}${currencyMins.minHypersound}.`,
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
          currency: formData.currency,
          message: donationType === 'message' ? formData.message.trim() : donationType === 'voice' ? 'Sent a Voice message' : '🔊 HyperSound!',
          voiceMessageUrl: voiceMessageUrl,
          hypersoundUrl: donationType === 'hypersound' ? selectedSound : null
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
        currency: formData.currency,
        name: 'HyperChat - ClumsyGod',
        description: donationType === 'hypersound' ? 'HyperSound - Soundboard' : donationType === 'voice' ? 'Voice Message' : 'Text Message',
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

  const handleDonationTypeChange = (type: 'message' | 'voice' | 'hypersound') => {
    setDonationType(type);
    if (type === 'hypersound') {
      const minAmount = getCurrencyMinimums(formData.currency).minHypersound;
      setFormData(prev => ({
        ...prev,
        amount: minAmount.toString(),
        message: ''
      }));
      setShowHypersoundEffect(true);
      setTimeout(() => setShowHypersoundEffect(false), 3000);
    } else {
      setFormData(prev => ({
        ...prev,
        amount: ''
      }));
      setSelectedSound(null);
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
                    <div className="text-[9px] text-muted-foreground">Min: {getCurrencySymbol(formData.currency)}{getCurrencyMinimums(formData.currency).minText}</div>
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
                    <div className="text-[9px] text-muted-foreground">Min: {getCurrencySymbol(formData.currency)}{getCurrencyMinimums(formData.currency).minVoice}</div>
                  </div>
                </button>
                <button 
                  type="button" 
                  onClick={() => handleDonationTypeChange('hypersound')} 
                  className={`p-2 rounded-lg border-2 transition-all ${donationType === 'hypersound' ? 'border-orange-500 bg-orange-500/10' : 'border-orange-500/30 hover:border-orange-500/50'}`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🔊</div>
                    <div className="font-medium text-[10px]">HyperSounds</div>
                    <div className="text-[9px] text-muted-foreground">
                      Min: {getCurrencySymbol(formData.currency)}{getCurrencyMinimums(formData.currency).minHypersound}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="amount" className="text-xs font-medium text-violet-400">
                Amount *
              </label>
              <div className="flex gap-2">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="w-[90px] justify-between border-violet-500/30 focus:border-violet-500 px-2 h-9 text-xs"
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
                  placeholder={donationType === 'message' ? `Min: ${getCurrencyMinimums(formData.currency).minText}` : donationType === 'voice' ? `Min: ${getCurrencyMinimums(formData.currency).minVoice}` : `Min: ${getCurrencyMinimums(formData.currency).minHypersound}`} 
                  value={formData.amount} 
                  onChange={handleInputChange} 
                  className="flex-1 border-violet-500/30 focus:border-violet-500 focus:ring-violet-500/20 h-9 text-sm" 
                  min="1" 
                  max="100000" 
                  disabled={isAmountLocked} 
                  required 
                />
              </div>
              {isAmountLocked && (
                <p className="text-[10px] text-yellow-600 flex items-center gap-1">
                  🔒 Amount locked during voice recording
                </p>
              )}
              {formData.currency === 'INR' && donationType === 'message' && <p className="text-[10px] text-muted-foreground">TTS above ₹70</p>}
              {donationType === 'voice' && currentAmount >= getCurrencyMinimums(formData.currency).minVoice && (
                <p className="text-[10px] text-muted-foreground">
                  Voice duration: {getVoiceDuration(currentAmount)}s
                  {formData.currency === 'INR' && currentAmount < 200 && ' (₹200+ for 20s, ₹250+ for 30s)'}
                </p>
              )}
              {donationType === 'hypersound' && (
                <p className="text-[10px] text-muted-foreground">
                  HyperSounds start at {getCurrencySymbol(formData.currency)}{getCurrencyMinimums(formData.currency).minHypersound}
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
                  requiredAmount={getCurrencyMinimums(formData.currency).minVoice}
                  currentAmount={currentAmount}
                  onRecordingComplete={(hasRecording, duration) => {
                    setHasVoiceRecording(hasRecording);
                    setVoiceDuration(duration);
                  }}
                />
              </div>
            )}

            {/* HyperSound Selector */}
            {donationType === 'hypersound' && (
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-xs text-orange-500">HyperSounds</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3">
                    You control the soundboard! Pick a sound to play on stream.
                  </p>
                  <HyperSoundSelector 
                    selectedSound={selectedSound}
                    onSoundSelect={setSelectedSound}
                  />
                </div>
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
                `Donate ${getCurrencySymbol(formData.currency)}${formData.amount || '0'}`
              )}
            </Button>
          </form>
          <DonationPageFooter brandColor="#8b5cf6" />
        </CardContent>
      </Card>

      {/* HyperSound Effect */}
      {showHypersoundEffect && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce text-6xl">🔊</div>
        </div>
      )}
    </div>
  );
};

export default ClumsyGod;
