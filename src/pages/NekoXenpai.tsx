import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SUPPORTED_CURRENCIES, getCurrencyByCode, getCurrencyMinimums, getCurrencySymbol } from '@/constants/currencies';
import nekoXenpaiBanner from '@/assets/neko-xenpai-banner-new.jpg';
import nekoXenpaiProfile from '@/assets/neko-xenpai-profile-new.jpg';
import nekoXenpaiLogo from '@/assets/neko-xenpai-profile-new.jpg';
import DonationPageFooter from "@/components/DonationPageFooter";

const NekoXenpai = () => {
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
    // For other currencies, use equivalent tiers
    if (amount >= 6) return 30;
    if (amount >= 3) return 25;
    return 15;
  };

  const getCharacterLimit = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (selectedCurrency === 'INR') {
      if (amount >= 250) return 500;
      if (amount >= 100) return 250;
      if (amount >= 70) return 150;
      return 100;
    }
    // For other currencies
    if (amount >= 3) return 500;
    if (amount >= 1.5) return 250;
    return 150;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateDonation = () => {
    const minAmount = donationType === 'voice' ? minimums.minVoice : donationType === 'hypersound' ? minimums.minHypersound : minimums.minText;
    const amount = parseFloat(formData.amount);

    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }

    if (isNaN(amount) || amount < minAmount) {
      toast.error(`Minimum amount for ${donationType} is ${currencySymbol}${minAmount}`);
      return false;
    }

    if (donationType === 'text' && !formData.message.trim()) {
      toast.error('Please enter a message');
      return false;
    }

    if (donationType === 'voice' && !voiceRecorder.audioBlob) {
      toast.error('Please record a voice message');
      return false;
    }

    if (donationType === 'hypersound' && !selectedHypersound) {
      toast.error('Please select a sound');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDonation()) return;

    await processPayment();
  };

  const processPayment = async () => {
    try {
      setIsProcessingPayment(true);

      let voiceMessageUrl = null;

      // Upload voice message BEFORE creating payment order
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        console.log('Uploading voice message before payment...', { 
          blobSize: voiceRecorder.audioBlob.size,
          blobType: voiceRecorder.audioBlob.type 
        });

        if (!voiceRecorder.audioBlob || voiceRecorder.audioBlob.size === 0) {
          throw new Error('No voice recording found. Please record your message again.');
        }

        // Convert blob to base64
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

        // Upload voice message using edge function
        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
          'upload-voice-message-direct',
          {
            body: { 
              voiceData: voiceDataBase64, 
              streamerSlug: 'neko_xenpai'
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

      const { data, error } = await supabase.functions.invoke('create-razorpay-order-neko-xenpai', {
        body: {
          name: formData.name,
          amount: formData.amount,
          message: donationType === 'text' ? formData.message : null,
          voiceMessageUrl,
          hypersoundUrl: donationType === 'hypersound' ? selectedHypersound : null,
          currency: selectedCurrency,
        },
      });

      if (error) throw error;

      // Initialize Razorpay checkout
      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: 'Neko XENPAI',
        description: 'Support Neko XENPAI',
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
          color: '#d946ef'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const characterLimit = getCharacterLimit();
  const remainingChars = characterLimit - formData.message.length;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${nekoXenpaiBanner})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      
      <Card 
        className="w-full max-w-sm mx-auto bg-card/95 backdrop-blur-sm border-fuchsia-500/20 shadow-2xl relative overflow-hidden"
        style={{ 
          backgroundImage: `url(${nekoXenpaiProfile})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 via-pink-600/20 to-fuchsia-400/20 opacity-50 blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-pink-600/10 to-fuchsia-400/10 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center space-y-2 relative z-10 pb-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-fuchsia-500 shadow-xl">
              <img 
                src={nekoXenpaiLogo} 
                alt="Neko XENPAI"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Neko XENPAI
          </CardTitle>
          <CardDescription className="text-xs text-fuchsia-200">
            Support your favorite streamer!
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 space-y-3">
          <div className="space-y-4">
            <Label className="text-sm font-bold text-fuchsia-200 text-center block uppercase tracking-wider">Choose Donation Type</Label>
            <div className="grid grid-cols-3 gap-4">
              <Button
                type="button"
                variant={donationType === 'text' ? 'default' : 'outline'}
                onClick={() => setDonationType('text')}
                className={`h-24 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                  donationType === 'text'
                    ? 'bg-gradient-to-br from-fuchsia-600 via-fuchsia-500 to-pink-600 hover:from-fuchsia-700 hover:via-fuchsia-600 hover:to-pink-700 text-white border-2 border-fuchsia-300 shadow-xl shadow-fuchsia-500/60 scale-105 ring-2 ring-fuchsia-400/30'
                    : 'bg-gradient-to-br from-black/60 to-black/40 hover:from-black/70 hover:to-black/50 text-fuchsia-200 border-2 border-fuchsia-500/50 hover:border-fuchsia-400/70 hover:shadow-lg hover:shadow-fuchsia-500/30 hover:scale-105'
                }`}
              >
                <span className="text-4xl">💬</span>
                <span className="text-sm font-bold tracking-wide uppercase">Text</span>
                <span className="text-xs opacity-90 font-semibold">Min {currencySymbol}{minimums.minText}</span>
              </Button>

              <Button
                type="button"
                variant={donationType === 'voice' ? 'default' : 'outline'}
                onClick={() => setDonationType('voice')}
                className={`h-24 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                  donationType === 'voice'
                    ? 'bg-gradient-to-br from-fuchsia-600 via-fuchsia-500 to-pink-600 hover:from-fuchsia-700 hover:via-fuchsia-600 hover:to-pink-700 text-white border-2 border-fuchsia-300 shadow-xl shadow-fuchsia-500/60 scale-105 ring-2 ring-fuchsia-400/30'
                    : 'bg-gradient-to-br from-black/60 to-black/40 hover:from-black/70 hover:to-black/50 text-fuchsia-200 border-2 border-fuchsia-500/50 hover:border-fuchsia-400/70 hover:shadow-lg hover:shadow-fuchsia-500/30 hover:scale-105'
                }`}
              >
                <span className="text-4xl">🎤</span>
                <span className="text-sm font-bold tracking-wide uppercase">Voice</span>
                <span className="text-xs opacity-90 font-semibold">Min {currencySymbol}{minimums.minVoice}</span>
              </Button>

              <Button
                type="button"
                variant={donationType === 'hypersound' ? 'default' : 'outline'}
                onClick={() => setDonationType('hypersound')}
                className={`h-24 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                  donationType === 'hypersound'
                    ? 'bg-gradient-to-br from-fuchsia-600 via-fuchsia-500 to-pink-600 hover:from-fuchsia-700 hover:via-fuchsia-600 hover:to-pink-700 text-white border-2 border-fuchsia-300 shadow-xl shadow-fuchsia-500/60 scale-105 ring-2 ring-fuchsia-400/30'
                    : 'bg-gradient-to-br from-black/60 to-black/40 hover:from-black/70 hover:to-black/50 text-fuchsia-200 border-2 border-fuchsia-500/50 hover:border-fuchsia-400/70 hover:shadow-lg hover:shadow-fuchsia-500/30 hover:scale-105'
                }`}
              >
                <span className="text-4xl">🔊</span>
                <span className="text-sm font-bold tracking-wide uppercase">Sound</span>
                <span className="text-xs opacity-90 font-semibold">Min {currencySymbol}{minimums.minHypersound}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm text-fuchsia-200">Your Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-black/40 border-fuchsia-500/30 text-white placeholder:text-fuchsia-300/50 focus:border-fuchsia-500 focus:ring-fuchsia-500/20"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="amount" className="text-sm text-fuchsia-200">Amount</Label>
            <div className="flex gap-2">
              <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={currencyOpen}
                    className="w-[100px] justify-between bg-black/40 border-fuchsia-500/30 text-white hover:bg-black/60"
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
                              const newCurrency = value.toUpperCase();
                              setSelectedCurrency(newCurrency);
                              setCurrencyOpen(false);
                              const newMins = getCurrencyMinimums(newCurrency);
                              if (donationType === 'text') setFormData(prev => ({ ...prev, amount: String(newMins.minText) }));
                              else if (donationType === 'voice') setFormData(prev => ({ ...prev, amount: String(newMins.minVoice) }));
                              else setFormData(prev => ({ ...prev, amount: String(newMins.minHypersound) }));
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
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="flex-1 bg-black/40 border-fuchsia-500/30 text-white placeholder:text-fuchsia-300/50 focus:border-fuchsia-500 focus:ring-fuchsia-500/20"
                min="1"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">TTS above {currencySymbol}{selectedCurrency === 'INR' ? '70' : '1'}</p>
          </div>

          {donationType === 'text' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="message" className="text-sm text-fuchsia-200">Your Message</Label>
                <span className={`text-xs ${remainingChars < 0 ? 'text-red-400' : 'text-fuchsia-300'}`}>
                  {remainingChars} characters left
                </span>
              </div>
              <Textarea
                id="message"
                name="message"
                placeholder="Write your message here..."
                value={formData.message}
                onChange={handleInputChange}
                className="bg-black/40 border-fuchsia-500/30 text-white placeholder:text-fuchsia-300/50 focus:border-fuchsia-500 focus:ring-fuchsia-500/20 min-h-[120px]"
                maxLength={characterLimit}
                required
              />
              <p className="text-xs text-fuchsia-300/70">
                Character limit increases with donation amount
              </p>
            </div>
          )}

          {donationType === 'voice' && (
            <div className="space-y-1">
              <Label className="text-sm text-fuchsia-200">Voice Message</Label>
              <EnhancedVoiceRecorder
                onRecordingComplete={(hasRecording, duration) => {}}
                maxDurationSeconds={getVoiceDuration(parseFloat(formData.amount) || 0)}
                controller={voiceRecorder}
                requiredAmount={minimums.minVoice}
                currentAmount={parseFloat(formData.amount) || 0}
                brandColor="#d946ef"
              />
              <p className="text-[10px] text-fuchsia-300/70">
                Duration: {getVoiceDuration(parseFloat(formData.amount) || 0)}s (increases with donation amount)
              </p>
            </div>
          )}

          {donationType === 'hypersound' && (
            <div className="space-y-2">
              <Label className="text-sm text-fuchsia-200">Select a Sound</Label>
              <HyperSoundSelector
                selectedSound={selectedHypersound}
                onSoundSelect={setSelectedHypersound}
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isProcessingPayment}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-semibold py-4 text-base shadow-lg shadow-fuchsia-500/30 transition-all"
          >
            {isProcessingPayment ? 'Processing...' : `Support with ${currencySymbol}${formData.amount || '0'}`}
          </Button>
          <DonationPageFooter brandColor="#d946ef" />
        </CardContent>
      </Card>
    </div>
  );
};

export default NekoXenpai;
