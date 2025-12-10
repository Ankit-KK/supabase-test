import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import HyperSoundSelector from '@/components/HyperSoundSelector';
import { Zap, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPPORTED_CURRENCIES, getCurrencySymbol, getCurrencyMinimums } from '@/constants/currencies';

const thunderxBanner = '/lovable-uploads/thunderx-banner.jpg';
const thunderxLogo = '/lovable-uploads/thunderx-logo.jpg';

const ThunderX = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
    currency: 'INR'
  });
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hypersound'>('text');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [streamerSettings, setStreamerSettings] = useState<{ hyperemotes_enabled: boolean; hyperemotes_min_amount: number } | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const navigate = useNavigate();

  const getVoiceDuration = (amount: number) => {
    if (amount >= 500) return 30;
    if (amount >= 250) return 25;
    if (amount >= 150) return 15;
    return 15;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));
  const currencyMins = getCurrencyMinimums(formData.currency);
  const currencySymbol = getCurrencySymbol(formData.currency);

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
        slug: 'thunderx'
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

  const getCharacterLimit = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (amount >= 200) return 250;
    if (amount >= 100) return 200;
    return 100;
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

    // Validate minimums based on currency
    if (donationType === 'text' && amount < currencyMins.minText) {
      toast.error(`Minimum amount for text message is ${currencySymbol}${currencyMins.minText}`);
      return;
    }
    if (donationType === 'voice' && amount < currencyMins.minVoice) {
      toast.error(`Minimum amount for voice message is ${currencySymbol}${currencyMins.minVoice}`);
      return;
    }
    if (donationType === 'hypersound' && amount < currencyMins.minHypersound) {
      toast.error(`Minimum amount for HyperSounds is ${currencySymbol}${currencyMins.minHypersound}`);
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

    if (donationType === 'hypersound' && !selectedSound) {
      toast.error('Please select a sound');
      return;
    }

    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl = null;

      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
        });
        reader.readAsDataURL(voiceRecorder.audioBlob);
        const base64Data = await base64Promise;

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
          'upload-voice-message-direct',
          { body: { voiceData: base64Data.split(',')[1], streamerSlug: 'thunderx' } }
        );

        if (uploadError || !uploadData?.voice_message_url) {
          throw new Error('Failed to upload voice message');
        }
        voiceMessageUrl = uploadData.voice_message_url;
      }

      const { data, error } = await supabase.functions.invoke('create-razorpay-order-thunderx', {
        body: {
          name: formData.name,
          amount: formData.amount,
          currency: formData.currency,
          message: donationType === 'text' ? formData.message : donationType === 'voice' ? 'Sent a Voice message' : '🔊 HyperSound!',
          voiceMessageUrl,
          hypersoundUrl: donationType === 'hypersound' ? selectedSound : null
        }
      });

      if (error) throw error;

      if (!razorpayLoaded || !(window as any).Razorpay) {
        toast.error('Payment system not ready. Please refresh the page.');
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: formData.currency,
        name: 'HyperChat - THUNDERX',
        description: donationType === 'hypersound' ? 'HyperSound - Soundboard' : 
                     donationType === 'voice' ? 'Voice Message' : 'Text Message',
        order_id: data.razorpay_order_id,
        prefill: {
          name: formData.name
        },
        theme: {
          color: '#10b981'
        },
        handler: (response: any) => {
          console.log('Payment successful:', response);
          navigate(`/status?order_id=${data.order_id}&status=success`);
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
            navigate(`/status?order_id=${data.order_id}&status=pending`);
            setIsProcessingPayment(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  const handleDonationTypeChange = (value: string) => {
    setDonationType(value as 'text' | 'voice' | 'hypersound');
    
    if (value === 'hypersound') {
      setFormData(prev => ({ ...prev, amount: currencyMins.minHypersound.toString(), message: '' }));
    } else if (value === 'voice') {
      setFormData(prev => ({ ...prev, amount: currencyMins.minVoice.toString(), message: '' }));
    } else {
      setFormData(prev => ({ ...prev, amount: currencyMins.minText.toString() }));
    }
    setSelectedSound(null);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${thunderxBanner})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      <Card 
        className="w-full max-w-[21rem] mx-auto bg-card/95 backdrop-blur-sm border-emerald-500/20 shadow-2xl relative overflow-hidden"
        style={{ 
          backgroundImage: `url(${thunderxLogo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-emerald-600/20 to-emerald-400/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center space-y-3 relative z-10 pb-3">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl">
              <img src={thunderxLogo} alt="THUNDERX" className="w-full h-full object-cover" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            THUNDERX
          </CardTitle>
          <p className="text-emerald-200 text-xs">
            Support THUNDERX with your donation ⚡
          </p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10 pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-emerald-400">
                Your Name *
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 bg-background/50 h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-emerald-400">
                Choose your donation type
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange('text')}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === 'text'
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-emerald-500/30 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">💬</div>
                    <div className="font-medium text-[10px] text-emerald-200">Text Message</div>
                    <div className="text-[9px] text-muted-foreground">Min: {currencySymbol}{currencyMins.minText}</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange('voice')}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === 'voice'
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-emerald-500/30 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🎤</div>
                    <div className="font-medium text-[10px] text-emerald-200">Voice Message</div>
                    <div className="text-[9px] text-muted-foreground">Min: {currencySymbol}{currencyMins.minVoice}</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange('hypersound')}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === 'hypersound'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-orange-500/30 hover:border-orange-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🔊</div>
                    <div className="font-medium text-[10px] text-emerald-200">HyperSounds</div>
                    <div className="text-[9px] text-muted-foreground">Min: {currencySymbol}{currencyMins.minHypersound}</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-medium text-emerald-400">
                Amount *
              </Label>
              <div className="flex gap-2">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="w-[90px] justify-between border-emerald-500/30 focus:border-emerald-500 px-2 h-9 text-xs"
                    >
                      {currencySymbol} {formData.currency}
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
                              value={currency.code}
                              onSelect={(value) => {
                                const newCurrency = value.toUpperCase();
                                const newMins = getCurrencyMinimums(newCurrency);
                                setFormData(prev => ({ 
                                  ...prev, 
                                  currency: newCurrency,
                                  amount: donationType === 'text' ? newMins.minText.toString() :
                                          donationType === 'voice' ? newMins.minVoice.toString() :
                                          newMins.minHypersound.toString()
                                }));
                                setCurrencyOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.currency === currency.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="mr-2">{currency.symbol}</span>
                              <span>{currency.name}</span>
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
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 bg-background/50 flex-1 h-9 text-sm"
                  min={donationType === 'voice' ? currencyMins.minVoice : donationType === 'hypersound' ? currencyMins.minHypersound : currencyMins.minText}
                  required
                />
              </div>
              <p className="text-[10px] text-muted-foreground">TTS above {currencySymbol}70 (INR equivalent)</p>
            </div>

            {donationType === 'text' && (
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-medium text-emerald-400">
                  Your Message *
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 bg-background/50 min-h-[80px] text-sm"
                  maxLength={getCharacterLimit()}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  {formData.message.length}/{getCharacterLimit()} characters
                </p>
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-emerald-400">
                  Record Your Message *
                </Label>
                <EnhancedVoiceRecorder 
                  controller={voiceRecorder}
                  onRecordingComplete={(hasRecording, duration) => {
                    console.log('Recording complete:', hasRecording, duration);
                  }}
                  maxDurationSeconds={getVoiceDuration(currentAmount)}
                  brandColor="#10b981"
                  requiredAmount={currencyMins.minVoice}
                  currentAmount={currentAmount}
                />
                <p className="text-[10px] text-muted-foreground">
                  Duration: {getVoiceDuration(currentAmount)}s
                </p>
              </div>
            )}

            {donationType === 'hypersound' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-emerald-400">
                  Select a Sound *
                </Label>
                <HyperSoundSelector
                  selectedSound={selectedSound}
                  onSoundSelect={setSelectedSound}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full text-base font-bold py-5"
              style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '2px solid rgba(16, 185, 129, 0.3)'
              }}
              disabled={isProcessingPayment || !razorpayLoaded}
            >
              {isProcessingPayment ? 'Processing...' : `Pay ${currencySymbol}${formData.amount || '0'}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThunderX;