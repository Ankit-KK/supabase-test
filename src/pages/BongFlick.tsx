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
import { Check, ChevronsUpDown } from 'lucide-react';
import HyperSoundSelector from '@/components/HyperSoundSelector';
import { SUPPORTED_CURRENCIES, getCurrencyMinimums, getCurrencySymbol } from '@/constants/currencies';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const bongflickBanner = '/lovable-uploads/bongflick-banner.jpg';
const bongflickLogo = '/lovable-uploads/bongflick-logo.jpg';

const BongFlick = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
  });
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hypersound'>('text');
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const navigate = useNavigate();

  const minimums = getCurrencyMinimums(selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const getVoiceDuration = (amount: number) => {
    const inrEquivalent = selectedCurrency === 'INR' ? amount : amount * 80;
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

    loadRazorpay();
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
      toast.error(`Minimum amount for text message is ${currencySymbol}${minimums.minText}`);
      return;
    }
    if (donationType === 'voice' && amount < minimums.minVoice) {
      toast.error(`Minimum amount for voice message is ${currencySymbol}${minimums.minVoice}`);
      return;
    }
    if (donationType === 'hypersound' && amount < minimums.minHypersound) {
      toast.error(`Minimum amount for HyperSound is ${currencySymbol}${minimums.minHypersound}`);
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
          body: { voiceData: base64Audio, streamerSlug: 'bongflick' }
        });

        if (uploadError || !uploadData?.voice_message_url) {
          throw new Error('Failed to upload voice message');
        }

        voiceMessageUrl = uploadData.voice_message_url;
      }

      const { data, error } = await supabase.functions.invoke('create-razorpay-order-bongflick', {
        body: {
          name: formData.name,
          amount,
          currency: selectedCurrency,
          message: donationType === 'text' ? formData.message : null,
          voiceMessageUrl,
          hypersoundUrl: donationType === 'hypersound' ? selectedSound : null,
        }
      });

      if (error) throw error;

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: selectedCurrency,
        name: 'HyperChat - BongFlick',
        description: donationType === 'hypersound' ? 'HyperSound' : 
                     donationType === 'voice' ? 'Voice Interactions' : 'Text Interactions',
        order_id: data.razorpay_order_id,
        prefill: {
          name: formData.name
        },
        theme: {
          color: '#8b5cf6'
        },
        handler: function (response: any) {
          navigate(`/status?order_id=${data.internalOrderId}&status=success`);
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            navigate(`/status?order_id=${data.internalOrderId}&status=pending`);
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
      style={{ backgroundImage: `url(${bongflickBanner})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card 
          className="w-full max-w-[21rem] border-2 border-violet-500/50 shadow-2xl backdrop-blur-md overflow-hidden relative bg-cover bg-center"
          style={{ backgroundImage: `url(${bongflickLogo})` }}
        >
          <div className="absolute inset-0 bg-background/50" />
          <div className="relative z-10">
          <CardHeader className="text-center pb-4 space-y-3">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">BongFlick</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Premium Engagement Platform</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2 text-center mb-4">
              <Label className="text-violet-200 text-xs font-medium block">Select Interaction Type</Label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDonationType('text')}
                  className={`p-2 rounded-lg border transition-all ${
                    donationType === 'text'
                      ? 'bg-violet-600/80 border-violet-500/60 text-white shadow-md'
                      : 'bg-violet-900/40 border-violet-700/30 text-violet-300 hover:bg-violet-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-0.5">💬</div>
                    <div className="font-medium text-[10px]">Text</div>
                    <div className="text-[9px]">Min: {currencySymbol}{minimums.minText}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDonationType('voice');
                    voiceRecorder.clearRecording();
                  }}
                  className={`p-2 rounded-lg border transition-all ${
                    donationType === 'voice'
                      ? 'bg-violet-600/80 border-violet-500/60 text-white shadow-md'
                      : 'bg-violet-900/40 border-violet-700/30 text-violet-300 hover:bg-violet-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-0.5">🎤</div>
                    <div className="font-medium text-[10px]">Voice</div>
                    <div className="text-[9px]">Min: {currencySymbol}{minimums.minVoice}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDonationType('hypersound')}
                  className={`p-2 rounded-lg border transition-all ${
                    donationType === 'hypersound'
                      ? 'bg-violet-600/80 border-violet-500/60 text-white shadow-md'
                      : 'bg-violet-900/40 border-violet-700/30 text-violet-300 hover:bg-violet-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-0.5">🔊</div>
                    <div className="font-medium text-[10px]">HyperSound</div>
                    <div className="text-[9px]">Min: {currencySymbol}{minimums.minHypersound}</div>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-violet-200 text-xs">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="bg-violet-950/40 border-violet-700/40 text-violet-100 placeholder:text-violet-500/50 focus:border-violet-500 text-sm h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-violet-200 text-xs">Amount</Label>
                <div className="flex gap-2">
                  <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={currencyOpen}
                        className="w-[100px] justify-between bg-violet-950/40 border-violet-700/40 text-violet-100 hover:bg-violet-900/60 text-sm h-9"
                      >
                        {currencySymbol} {selectedCurrency}
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
                                onSelect={(value) => {
                                  setSelectedCurrency(value.toUpperCase());
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
                    placeholder={`Min: ${currencySymbol}${donationType === 'voice' ? minimums.minVoice : donationType === 'hypersound' ? minimums.minHypersound : minimums.minText}`}
                    min={donationType === 'voice' ? minimums.minVoice : donationType === 'hypersound' ? minimums.minHypersound : minimums.minText}
                    className="flex-1 bg-violet-950/40 border-violet-700/40 text-violet-100 placeholder:text-violet-500/50 focus:border-violet-500 text-sm h-9"
                    required
                  />
                </div>
                {donationType === 'text' && (
                  <p className="text-xs text-violet-400">TTS above {currencySymbol}{selectedCurrency === 'INR' ? '70' : '2'}</p>
                )}
              </div>

              {donationType === 'text' && (
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-violet-200 text-xs">Your Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Enter your message..."
                    className="bg-violet-950/40 border-violet-700/40 text-violet-100 placeholder:text-violet-500/50 focus:border-violet-500 min-h-[80px] text-sm resize-none"
                    maxLength={250}
                    required
                  />
                  <p className="text-[10px] text-violet-400">{formData.message.length}/250 characters</p>
                </div>
              )}

              {donationType === 'voice' && (
                <div className="space-y-1.5">
                  <Label className="text-violet-200 text-xs">Voice Message (Max {getVoiceDuration(currentAmount)}s)</Label>
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
                    brandColor="#8b5cf6"
                  />
                </div>
              )}

              {donationType === 'hypersound' && (
                <div className="space-y-1.5">
                  <Label className="text-violet-200 text-xs">Select a Sound</Label>
                  <HyperSoundSelector
                    selectedSound={selectedSound}
                    onSoundSelect={setSelectedSound}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white font-semibold h-10 text-sm shadow-lg transition-all"
                disabled={isProcessingPayment || !razorpayLoaded}
              >
                {isProcessingPayment ? 'Processing...' : `Pay ${currencySymbol}${formData.amount || '0'}`}
              </Button>
            </form>
          </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BongFlick;
