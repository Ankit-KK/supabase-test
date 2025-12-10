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
import HyperSoundSelector from '@/components/HyperSoundSelector';
import { Brain, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { SUPPORTED_CURRENCIES, getCurrencyMinimums, getCurrencyByCode } from '@/constants/currencies';

const MrIqmaster = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
  });
  const [currency, setCurrency] = useState('INR');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hypersound'>('text');
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const navigate = useNavigate();

  const minimums = getCurrencyMinimums(currency);
  const currencyData = getCurrencyByCode(currency);
  const currencySymbol = currencyData?.symbol || currency;

  const getVoiceDuration = (amount: number) => {
    if (amount >= 500) return 30;
    if (amount >= 250) return 25;
    if (amount >= 150) return 15;
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      toast.error(`Minimum ${currencySymbol}${minimums.minText} required for text messages`);
      return;
    }

    if (donationType === 'voice' && amount < minimums.minVoice) {
      toast.error(`Minimum ${currencySymbol}${minimums.minVoice} required for voice messages`);
      return;
    }

    if (donationType === 'hypersound' && amount < minimums.minHypersound) {
      toast.error(`Minimum ${currencySymbol}${minimums.minHypersound} required for HyperSounds`);
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

    if (!razorpayLoaded) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl = null;

      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(voiceRecorder.audioBlob);
        const base64Audio = await base64Promise;

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
          'upload-voice-message-direct',
          {
            body: {
              voiceData: base64Audio,
              donorName: formData.name,
              streamerSlug: 'mriqmaster'
            }
          }
        );

        if (uploadError) {
          throw new Error('Failed to upload voice message: ' + uploadError.message);
        }

        if (!uploadData?.voice_message_url) {
          throw new Error('No voice message URL returned from upload');
        }

        voiceMessageUrl = uploadData.voice_message_url;
        toast.success('Voice message uploaded successfully');
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order-mriqmaster',
        {
          body: {
            name: formData.name,
            amount: amount,
            currency: currency,
            message: formData.message || null,
            voiceMessageUrl: voiceMessageUrl,
            hypersoundUrl: donationType === 'hypersound' ? selectedSound : null,
          }
        }
      );

      console.log('[MrIqmaster] Order response:', { orderData, orderError });

      if (orderError) {
        console.error('[MrIqmaster] Order error:', orderError);
        throw new Error(orderError.message || 'Failed to create order');
      }

      const internalOrderId = orderData.orderId || orderData.order_id;
      
      if (!orderData || !internalOrderId) {
        console.error('[MrIqmaster] Invalid order response:', orderData);
        throw new Error('Invalid order response from server');
      }

      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Mr Iqmaster',
        description: 'Support Message',
        order_id: orderData.razorpay_order_id,
        handler: function (response: any) {
          toast.success('Payment successful!');
          navigate(`/status?order_id=${internalOrderId}&status=success`);
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            navigate(`/status?order_id=${internalOrderId}&status=pending`);
          }
        },
        theme: {
          color: '#06b6d4'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      setIsProcessingPayment(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url('/lovable-uploads/mriqmaster-banner.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <Card 
        className="w-full max-w-[21rem] backdrop-blur-xl border-2 border-cyan-400/30 shadow-2xl relative z-10 overflow-hidden"
        style={{
          backgroundImage: `url('/lovable-uploads/mriqmaster-logo.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-cyan-400/20 flex items-center justify-center border-4 border-cyan-400">
              <Brain className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Mr Iqmaster</CardTitle>
          <p className="text-cyan-300 text-sm mt-2">Send your support</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-cyan-400 font-semibold">Your Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required
                className="bg-cyan-950/50 border-cyan-500/30 text-white placeholder:text-cyan-400/50 focus:border-cyan-400"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-cyan-300 font-bold text-sm uppercase tracking-wide block text-center">
                Choose Your Interaction
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  onClick={() => { setDonationType('text'); setFormData({ ...formData, amount: String(minimums.minText) }); }}
                  variant={donationType === 'text' ? 'default' : 'outline'}
                  className={donationType === 'text' 
                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 transition-all duration-300 h-auto' 
                    : 'border-2 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400/60 hover:text-cyan-200 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 bg-cyan-950/20 h-auto'}
                >
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <span className="text-2xl">💬</span>
                    <span className="text-xs font-semibold">Text</span>
                    <span className="text-[10px] opacity-80 font-medium">{currencySymbol}{minimums.minText}+</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  onClick={() => { setDonationType('voice'); setFormData({ ...formData, amount: String(minimums.minVoice) }); }}
                  variant={donationType === 'voice' ? 'default' : 'outline'}
                  className={donationType === 'voice' 
                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 transition-all duration-300 h-auto' 
                    : 'border-2 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400/60 hover:text-cyan-200 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 bg-cyan-950/20 h-auto'}
                >
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <span className="text-2xl">🎤</span>
                    <span className="text-xs font-semibold">Voice</span>
                    <span className="text-[10px] opacity-80 font-medium">{currencySymbol}{minimums.minVoice}+</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  onClick={() => { setDonationType('hypersound'); setFormData({ ...formData, amount: String(minimums.minHypersound) }); }}
                  variant={donationType === 'hypersound' ? 'default' : 'outline'}
                  className={donationType === 'hypersound' 
                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 transition-all duration-300 h-auto' 
                    : 'border-2 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400/60 hover:text-cyan-200 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 bg-cyan-950/20 h-auto'}
                >
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <span className="text-2xl">🔊</span>
                    <span className="text-xs font-semibold">Sound</span>
                    <span className="text-[10px] opacity-80 font-medium">{currencySymbol}{minimums.minHypersound}+</span>
                  </div>
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="amount" className="text-cyan-400 font-semibold">Amount</Label>
              <div className="flex gap-2">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="w-[100px] justify-between bg-cyan-950/50 border-cyan-500/30 text-white hover:bg-cyan-950/70"
                    >
                      {currencySymbol} {currency}
                      <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search currency..." />
                      <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {SUPPORTED_CURRENCIES.map((curr) => (
                            <CommandItem
                              key={curr.code}
                              value={curr.code}
                              onSelect={(value) => {
                                setCurrency(value.toUpperCase());
                                setCurrencyOpen(false);
                                const newMins = getCurrencyMinimums(value.toUpperCase());
                                if (donationType === 'text') setFormData({ ...formData, amount: String(newMins.minText) });
                                else if (donationType === 'voice') setFormData({ ...formData, amount: String(newMins.minVoice) });
                                else setFormData({ ...formData, amount: String(newMins.minHypersound) });
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", currency === curr.code ? "opacity-100" : "opacity-0")} />
                              {curr.symbol} {curr.code} - {curr.name}
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
                  placeholder="Enter amount"
                  required
                  min={donationType === 'text' ? minimums.minText : donationType === 'voice' ? minimums.minVoice : minimums.minHypersound}
                  className="flex-1 bg-cyan-950/50 border-cyan-500/30 text-white placeholder:text-cyan-400/50 focus:border-cyan-400"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">TTS above ₹70</p>
            </div>

            {donationType === 'text' && (
              <div>
                <Label htmlFor="message" className="text-cyan-400 font-semibold">
                  Your Message {currentAmount >= 40 && `(${currentAmount < 100 ? '100' : currentAmount < 200 ? '200' : '250'} chars)`}
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Enter your message"
                  className="bg-cyan-950/50 border-cyan-500/30 text-white placeholder:text-cyan-400/50 focus:border-cyan-400 min-h-[100px]"
                  maxLength={currentAmount < 100 ? 100 : currentAmount < 200 ? 200 : 250}
                />
              </div>
            )}

            {donationType === 'voice' && (
              <div>
                <Label className="text-cyan-400 font-semibold">Voice Message ({getVoiceDuration(currentAmount)}s max)</Label>
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
                />
              </div>
            )}

            {donationType === 'hypersound' && (
              <HyperSoundSelector
                selectedSound={selectedSound}
                onSoundSelect={setSelectedSound}
              />
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold py-6 text-lg shadow-lg"
              disabled={isProcessingPayment || !razorpayLoaded}
            >
              {isProcessingPayment ? 'Processing...' : 'Send Support'}
            </Button>
          </form>
        </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default MrIqmaster;
