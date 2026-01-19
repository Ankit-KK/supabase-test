import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { Crown, Check, ChevronsUpDown } from 'lucide-react';
import HyperSoundSelector from '@/components/HyperSoundSelector';
import MediaUploader from '@/components/MediaUploader';
import { 
  SUPPORTED_CURRENCIES, 
  getCurrencyByCode, 
  getCurrencySymbol,
  getCurrencyMinimums,
  amountToSubunits 
} from '@/constants/currencies';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import DonationPageFooter from "@/components/DonationPageFooter";

const vipbhaiBanner = '/lovable-uploads/vipbhai-banner.jpg';
const vipbhaiLogo = '/lovable-uploads/vipbhai-logo.jpg';

const VIPBhai = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
  });
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hypersound' | 'media'>('text');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [streamerSettings, setStreamerSettings] = useState<{ hyperemotes_enabled: boolean; hyperemotes_min_amount: number } | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selectedHypersoundUrl, setSelectedHypersoundUrl] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "gif" | "video" | null>(null);
  const navigate = useNavigate();

  const currencyInfo = getCurrencyByCode(selectedCurrency);
  const minimums = getCurrencyMinimums(selectedCurrency);

  const getVoiceDuration = (amount: number) => {
    const inrEquivalent = selectedCurrency === 'INR' ? amount : amount * 83;
    if (inrEquivalent >= 500) return 30;
    if (inrEquivalent >= 250) return 25;
    if (inrEquivalent >= 150) return 15;
    return 15;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
        toast.success('Payment system ready');
      };
      script.onerror = () => {
        toast.error('Failed to load payment system');
      };
      document.body.appendChild(script);
    };

    const fetchStreamerSettings = async () => {
      const { data, error } = await supabase.rpc('get_streamer_public_settings', {
        slug: 'vipbhai'
      });
      
      if (!error && data && data.length > 0) {
        setStreamerSettings(data[0]);
      }
    };

    loadRazorpay();
    fetchStreamerSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (donationType === 'text' && amount < minimums.minText) {
      toast.error(`Minimum amount for text message is ${getCurrencySymbol(selectedCurrency)}${minimums.minText}`);
      return;
    }
    if (donationType === 'voice' && amount < minimums.minVoice) {
      toast.error(`Minimum amount for voice message is ${getCurrencySymbol(selectedCurrency)}${minimums.minVoice}`);
      return;
    }
    if (donationType === 'hypersound' && amount < minimums.minHypersound) {
      toast.error(`Minimum amount for HyperSounds is ${getCurrencySymbol(selectedCurrency)}${minimums.minHypersound}`);
      return;
    }

    if (donationType === 'media' && amount < minimums.minMedia) {
      toast.error(`Minimum amount for media is ${getCurrencySymbol(selectedCurrency)}${minimums.minMedia}`);
      return;
    }

    if (donationType === 'media' && !mediaUrl) {
      toast.error('Please upload a media file');
      return;
    }

    if (donationType === 'text' && !formData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (donationType === 'voice' && !voiceRecorder.audioBlob) {
      toast.error('Please record a voice message');
      return;
    }

    if (donationType === 'hypersound' && !selectedHypersoundUrl) {
      toast.error('Please select a HyperSound');
      return;
    }

    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl = null;

      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(voiceRecorder.audioBlob);
        const base64Audio = await base64Promise;

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-voice-message-direct', {
          body: { voiceData: base64Audio, streamerSlug: 'vipbhai' }
        });

        if (uploadError || !uploadData?.voice_message_url) {
          throw new Error('Failed to upload voice message');
        }

        voiceMessageUrl = uploadData.voice_message_url;
      }

      const { data, error } = await supabase.functions.invoke('create-razorpay-order-vipbhai', {
        body: {
          name: formData.name,
          amount,
          message: donationType === 'text' ? formData.message : null,
          voiceMessageUrl,
          hypersoundUrl: donationType === 'hypersound' ? selectedHypersoundUrl : null,
          mediaUrl: donationType === 'media' ? mediaUrl : null,
          mediaType: donationType === 'media' ? mediaType : null,
          currency: selectedCurrency,
        }
      });

      if (error) throw error;

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: selectedCurrency,
        name: 'HyperChat - VIP BHAI',
        description: donationType === 'hypersound' ? 'HyperSound Effect' : 
                     donationType === 'voice' ? 'Voice Interactions' : 'Text Interactions',
        order_id: data.razorpay_order_id,
        prefill: {
          name: formData.name
        },
        theme: {
          color: '#f59e0b'
        },
        handler: function (response: any) {
          navigate(`/status?order_id=${data.orderId}&status=success`);
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            navigate(`/status?order_id=${data.orderId}&status=pending`);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${vipbhaiBanner})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card 
          className="w-full max-w-[21rem] border-2 border-amber-500/50 shadow-2xl backdrop-blur-md overflow-hidden relative bg-cover bg-center"
          style={{ backgroundImage: `url(${vipbhaiLogo})` }}
        >
          <div className="absolute inset-0 bg-background/50" />
          <div className="relative z-10">
          <CardHeader className="text-center pb-4 space-y-3">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">VIP BHAI</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Premium Engagement Platform</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2 text-center mb-4">
              <Label className="text-amber-200 text-xs font-medium block">Select Interaction Type</Label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => setDonationType('text')}
                  className={`p-1.5 rounded-lg border transition-all ${
                    donationType === 'text'
                      ? 'bg-amber-600/80 border-amber-500/60 text-white shadow-md'
                      : 'bg-amber-900/40 border-amber-700/30 text-amber-300 hover:bg-amber-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-0.5">💬</div>
                    <div className="font-medium text-[9px]">Text</div>
                    <div className="text-[8px]">{getCurrencySymbol(selectedCurrency)}{minimums.minText}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDonationType('voice');
                    voiceRecorder.clearRecording();
                  }}
                  className={`p-1.5 rounded-lg border transition-all ${
                    donationType === 'voice'
                      ? 'bg-amber-600/80 border-amber-500/60 text-white shadow-md'
                      : 'bg-amber-900/40 border-amber-700/30 text-amber-300 hover:bg-amber-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-0.5">🎤</div>
                    <div className="font-medium text-[9px]">Voice</div>
                    <div className="text-[8px]">{getCurrencySymbol(selectedCurrency)}{minimums.minVoice}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDonationType('media');
                    setMediaUrl(null);
                    setMediaType(null);
                  }}
                  className={`p-1.5 rounded-lg border transition-all ${
                    donationType === 'media'
                      ? 'bg-amber-600/80 border-amber-500/60 text-white shadow-md'
                      : 'bg-amber-900/40 border-amber-700/30 text-amber-300 hover:bg-amber-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-0.5">🖼️</div>
                    <div className="font-medium text-[9px]">Media</div>
                    <div className="text-[8px]">{getCurrencySymbol(selectedCurrency)}{minimums.minMedia}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDonationType('hypersound')}
                  className={`p-1.5 rounded-lg border transition-all ${
                    donationType === 'hypersound'
                      ? 'bg-amber-600/80 border-amber-500/60 text-white shadow-md'
                      : 'bg-amber-900/40 border-amber-700/30 text-amber-300 hover:bg-amber-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-0.5">🔊</div>
                    <div className="font-medium text-[9px]">Sound</div>
                    <div className="text-[8px]">{getCurrencySymbol(selectedCurrency)}{minimums.minHypersound}</div>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-amber-200 text-xs">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="bg-amber-950/40 border-amber-700/40 text-amber-100 placeholder:text-amber-500/50 focus:border-amber-500 text-sm h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-amber-200 text-xs">Amount</Label>
                <div className="flex gap-2">
                  <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={currencyOpen}
                        className="w-[100px] justify-between bg-amber-950/40 border-amber-700/40 text-amber-100 hover:bg-amber-800/50 text-sm h-9"
                      >
                        {currencyInfo ? `${currencyInfo.symbol} ${currencyInfo.code}` : 'INR'}
                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandList>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {SUPPORTED_CURRENCIES.map((currency) => (
                              <CommandItem
                                key={currency.code}
                                value={currency.code}
                                onSelect={() => {
                                  setSelectedCurrency(currency.code);
                                  setCurrencyOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCurrency === currency.code ? "opacity-100" : "opacity-0"
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
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder={`Min: ${getCurrencySymbol(selectedCurrency)}${donationType === 'voice' ? minimums.minVoice : donationType === 'hypersound' ? minimums.minHypersound : minimums.minText}`}
                    min={donationType === 'voice' ? minimums.minVoice : donationType === 'hypersound' ? minimums.minHypersound : minimums.minText}
                    className="flex-1 bg-amber-950/40 border-amber-700/40 text-amber-100 placeholder:text-amber-500/50 focus:border-amber-500 text-sm h-9"
                    required
                  />
                </div>
                <p className="text-xs text-amber-400/70">TTS above ₹70 equivalent</p>
              </div>

              {donationType === 'text' && (
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-amber-200 text-xs">Your Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Enter your message..."
                    className="bg-amber-950/40 border-amber-700/40 text-amber-100 placeholder:text-amber-500/50 focus:border-amber-500 min-h-[80px] text-sm resize-none"
                    maxLength={250}
                    required
                  />
                  <p className="text-[10px] text-amber-400">{formData.message.length}/250 characters</p>
                </div>
              )}

              {donationType === 'voice' && (
                <div className="space-y-1.5">
                  <Label className="text-amber-200 text-xs">Voice Message (Max {getVoiceDuration(currentAmount)}s)</Label>
                  <EnhancedVoiceRecorder
                    controller={voiceRecorder}
                    maxDurationSeconds={getVoiceDuration(currentAmount)}
                    onRecordingComplete={(hasRecording) => {
                      if (!hasRecording) {
                        toast.error('Please record a voice message');
                      }
                    }}
                    requiredAmount={minimums.minVoice}
                    currentAmount={currentAmount}
                    brandColor="#f59e0b"
                  />
                </div>
              )}

              {donationType === 'hypersound' && (
                <div className="space-y-1.5">
                  <Label className="text-amber-200 text-xs">Select a HyperSound</Label>
                  <HyperSoundSelector
                    selectedSound={selectedHypersoundUrl}
                    onSoundSelect={setSelectedHypersoundUrl}
                  />
                </div>
              )}

              {donationType === 'media' && (
                <div className="space-y-1.5">
                  <Label className="text-amber-200 text-xs">Upload Media *</Label>
                  <MediaUploader
                    streamerSlug="vipbhai"
                    onMediaUploaded={(url, type) => {
                      setMediaUrl(url);
                      setMediaType(type);
                    }}
                    onMediaRemoved={() => {
                      setMediaUrl(null);
                      setMediaType(null);
                    }}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white font-semibold h-10 text-sm shadow-lg transition-all"
                disabled={isProcessingPayment || !razorpayLoaded}
              >
                {isProcessingPayment ? 'Processing...' : `Pay ${getCurrencySymbol(selectedCurrency)}${formData.amount || '0'}`}
              </Button>
            </form>
            <DonationPageFooter brandColor="#f59e0b" />
          </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VIPBhai;