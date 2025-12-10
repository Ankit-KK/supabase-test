import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import HyperSoundSelector from '@/components/HyperSoundSelector';
import { SUPPORTED_CURRENCIES, getCurrencyMinimums, getCurrencySymbol } from '@/constants/currencies';
import damaskBanner from '@/assets/damask-banner.jpg';
import damaskProfile from '@/assets/damask-profile.jpg';
import damaskLogo from '@/assets/damask-logo.jpg';

const DamaskPlays = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
  });
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hypersound'>('text');
  const [selectedHypersound, setSelectedHypersound] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const navigate = useNavigate();

  const minimums = getCurrencyMinimums(selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === 'INR') {
      if (amount >= 500) return 30;
      if (amount >= 250) return 25;
      if (amount >= 150) return 15;
      return 15;
    }
    if (amount >= 6) return 30;
    if (amount >= 3) return 25;
    return 15;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(formData.amount);
    const minAmount = donationType === 'voice' ? minimums.minVoice : donationType === 'hypersound' ? minimums.minHypersound : minimums.minText;
    
    if (amountNum < minAmount) {
      toast.error(`Minimum amount for ${donationType} is ${currencySymbol}${minAmount}`);
      return;
    }

    if (donationType === 'voice' && !voiceRecorder.audioBlob) {
      toast.error('Please record a voice message');
      return;
    }

    if (donationType === 'text' && (!formData.message || formData.message.trim().length === 0)) {
      toast.error('Please enter a message');
      return;
    }

    if (donationType === 'hypersound' && !selectedHypersound) {
      toast.error('Please select a sound');
      return;
    }

    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl = null;

      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        console.log('Uploading voice message before payment...', { 
          blobSize: voiceRecorder.audioBlob.size,
          blobType: voiceRecorder.audioBlob.type 
        });

        if (!voiceRecorder.audioBlob || voiceRecorder.audioBlob.size === 0) {
          throw new Error('No voice recording found. Please record your message again.');
        }

        const voiceDataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error('Failed to read voice data'));
              return;
            }
            const base64 = result.split(',')[1];
            console.log('Voice data converted to base64, length:', base64.length);
            resolve(base64);
          };
          
          reader.onerror = () => {
            reject(new Error('Failed to read voice recording'));
          };
          
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        if (!voiceDataBase64 || voiceDataBase64.length === 0) {
          throw new Error('Voice recording is empty. Please try recording again.');
        }

        console.log('Invoking upload-voice-message-direct...');

        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
          'upload-voice-message-direct',
          {
            body: { 
              voiceData: voiceDataBase64, 
              streamerSlug: 'damask_plays'
            }
          }
        );

        if (uploadError) {
          console.error('Voice upload error:', uploadError);
          throw new Error('Failed to upload voice message: ' + uploadError.message);
        }

        if (!uploadResult?.voice_message_url) {
          throw new Error('Voice upload succeeded but no URL was returned');
        }

        voiceMessageUrl = uploadResult.voice_message_url;
        console.log('Voice message uploaded successfully:', voiceMessageUrl);
      }

      const response = await supabase.functions.invoke('create-razorpay-order-damask-plays', {
        body: {
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: donationType === 'text' ? formData.message : null,
          voiceMessageUrl: voiceMessageUrl,
          hypersoundUrl: donationType === 'hypersound' ? selectedHypersound : null,
          currency: selectedCurrency,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Payment initialization failed');
      }

      const data = response.data;

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: 'Damask Plays',
        description: 'Support Damask Plays',
        handler: function (response: any) {
          console.log('Payment successful:', response);
          navigate(`/status?order_id=${data.orderId}&status=success`);
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled');
            navigate(`/status?order_id=${data.orderId}&status=pending`);
          }
        },
        theme: {
          color: '#10b981'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getCharacterLimit = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (selectedCurrency === 'INR') {
      if (amount >= 250) return 500;
      if (amount >= 100) return 250;
      if (amount >= 70) return 150;
      return 100;
    }
    if (amount >= 3) return 500;
    if (amount >= 1.5) return 250;
    return 150;
  };

  const currentCharLimit = getCharacterLimit();
  const currentMessageLength = formData.message.length;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${damaskBanner})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      
      <Card 
        className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-emerald-500/20 shadow-2xl relative overflow-hidden"
        style={{ 
          backgroundImage: `url(${damaskProfile})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-emerald-600/20 to-emerald-400/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center space-y-3 relative z-10">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl">
              <img src={damaskLogo} alt="Damask plays" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Damask Plays
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Support Damask Plays with your donation
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-emerald-500">
                Choose Donation Type
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDonationType('text')}
                  className={`h-20 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 transition-all ${
                    donationType === 'text'
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/50 scale-105'
                      : 'border-emerald-500/40 hover:border-emerald-500/60 bg-black/50 hover:bg-black/70 text-emerald-200 hover:scale-105'
                  }`}
                >
                  <span className="text-3xl">💬</span>
                  <span className="text-xs font-bold tracking-wide">Text</span>
                  <span className="text-[10px] opacity-80 font-medium">Min {currencySymbol}{minimums.minText}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDonationType('voice')}
                  className={`h-20 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 transition-all ${
                    donationType === 'voice'
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/50 scale-105'
                      : 'border-emerald-500/40 hover:border-emerald-500/60 bg-black/50 hover:bg-black/70 text-emerald-200 hover:scale-105'
                  }`}
                >
                  <span className="text-3xl">🎤</span>
                  <span className="text-xs font-bold tracking-wide">Voice</span>
                  <span className="text-[10px] opacity-80 font-medium">Min {currencySymbol}{minimums.minVoice}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDonationType('hypersound')}
                  className={`h-20 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 transition-all ${
                    donationType === 'hypersound'
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/50 scale-105'
                      : 'border-emerald-500/40 hover:border-emerald-500/60 bg-black/50 hover:bg-black/70 text-emerald-200 hover:scale-105'
                  }`}
                >
                  <span className="text-3xl">🔊</span>
                  <span className="text-xs font-bold tracking-wide">Sound</span>
                  <span className="text-[10px] opacity-80 font-medium">Min {currencySymbol}{minimums.minHypersound}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm text-emerald-500">Your Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                required
                className="border-emerald-500/30 focus:border-emerald-500 bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="amount" className="text-sm text-emerald-500">Amount</Label>
              <div className="flex gap-2">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="w-[100px] justify-between border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      {currencySymbol} {selectedCurrency}
                      <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
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
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                  className="flex-1 border-emerald-500/30 focus:border-emerald-500 bg-background"
                />
              </div>
              <p className="text-xs text-muted-foreground">TTS above {currencySymbol}{selectedCurrency === 'INR' ? '70' : '1'}</p>
            </div>

            {donationType === 'text' && (
              <div className="space-y-1">
                <Label htmlFor="message" className="text-sm text-emerald-500">Your Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter your message..."
                  maxLength={getCharacterLimit()}
                  className="border-emerald-500/30 focus:border-emerald-500 min-h-[100px] bg-background"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {currentMessageLength}/{currentCharLimit} characters
                </p>
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-1">
                <Label className="text-sm text-emerald-500">Record Voice Message</Label>
                <EnhancedVoiceRecorder 
                  controller={voiceRecorder}
                  currentAmount={currentAmount}
                  requiredAmount={minimums.minVoice}
                  brandColor="#10b981"
                  onRecordingComplete={() => {}}
                />
              </div>
            )}

            {donationType === 'hypersound' && (
              <div className="space-y-2">
                <Label className="text-sm text-emerald-500">Select a Sound</Label>
                <HyperSoundSelector
                  selectedSound={selectedHypersound}
                  onSoundSelect={setSelectedHypersound}
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? 'Processing...' : `Support with ${currencySymbol}${formData.amount || '0'}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DamaskPlays;
