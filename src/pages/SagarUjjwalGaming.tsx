import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { Flame, MessageSquare, Mic, Volume2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import HyperSoundSelector from '@/components/HyperSoundSelector';
import { SUPPORTED_CURRENCIES, getCurrencyMinimums, getCurrencySymbol } from '@/constants/currencies';
import DonationPageFooter from "@/components/DonationPageFooter";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SagarUjjwalGaming = () => {
  const navigate = useNavigate();
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

  const minimums = getCurrencyMinimums(currency);
  const currencySymbol = getCurrencySymbol(currency);

  const getVoiceDuration = (amount: number) => {
    const inrEquivalent = currency === 'INR' ? amount : amount * 80;
    if (inrEquivalent >= 500) return 30;
    if (inrEquivalent >= 250) return 25;
    if (inrEquivalent >= 150) return 15;
    return 15;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDonationTypeChange = (type: 'text' | 'voice' | 'hypersound') => {
    setDonationType(type);
    setSelectedSound(null);
    if (type === 'hypersound') {
      setFormData(prev => ({ ...prev, amount: String(minimums.minHypersound), message: '' }));
    } else if (type === 'voice') {
      setFormData(prev => ({ ...prev, amount: String(minimums.minVoice) }));
    } else {
      setFormData(prev => ({ ...prev, amount: String(minimums.minText) }));
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    setCurrencyOpen(false);
    const newMinimums = getCurrencyMinimums(newCurrency);
    if (donationType === 'hypersound') {
      setFormData(prev => ({ ...prev, amount: String(newMinimums.minHypersound) }));
    } else if (donationType === 'voice') {
      setFormData(prev => ({ ...prev, amount: String(newMinimums.minVoice) }));
    } else {
      setFormData(prev => ({ ...prev, amount: String(newMinimums.minText) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!razorpayLoaded) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const amount = parseFloat(formData.amount);
      const isHypersound = donationType === 'hypersound';

      // Validate minimum amounts
      if (isHypersound && amount < minimums.minHypersound) {
        toast.error(`HyperSounds require minimum ${currencySymbol}${minimums.minHypersound}`);
        setIsProcessingPayment(false);
        return;
      }

      if (donationType === 'voice' && amount < minimums.minVoice) {
        toast.error(`Voice messages require minimum ${currencySymbol}${minimums.minVoice}`);
        setIsProcessingPayment(false);
        return;
      }

      if (donationType === 'text' && amount < minimums.minText) {
        toast.error(`Text messages require minimum ${currencySymbol}${minimums.minText}`);
        setIsProcessingPayment(false);
        return;
      }

      if (isHypersound && !selectedSound) {
        toast.error('Please select a sound to play');
        setIsProcessingPayment(false);
        return;
      }

      // Handle voice message upload
      let voiceMessageUrl = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob);
        });

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-voice-message-direct', {
          body: { 
            voiceData: base64Data,
            streamerSlug: 'sagarujjwalgaming'
          }
        });

        if (uploadError || !uploadData?.voice_message_url) {
          throw new Error('Failed to upload voice message');
        }

        voiceMessageUrl = uploadData.voice_message_url;
      }

      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order-sagarujjwalgaming', {
        body: {
          name: formData.name,
          amount,
          currency,
          message: donationType === 'text' ? formData.message : undefined,
          voiceMessageUrl,
          hypersoundUrl: isHypersound ? selectedSound : undefined,
        }
      });

      if (orderError) throw orderError;

      // Open Razorpay checkout
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SAGAR UJJWAL GAMING',
        description: 'Support Stream',
        order_id: orderData.razorpay_order_id,
        handler: function(response: any) {
          navigate(`/status?order_id=${orderData.orderId}&status=success`);
        },
        modal: {
          ondismiss: function() {
            navigate(`/status?order_id=${orderData.orderId}&status=pending`);
          }
        },
        theme: {
          color: '#ef4444'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getCharacterLimit = () => {
    const amount = parseFloat(formData.amount) || 0;
    const inrEquivalent = currency === 'INR' ? amount : amount * 80;
    if (inrEquivalent >= 200) return 250;
    if (inrEquivalent >= 100) return 200;
    return 100;
  };

  const selectedCurrencyData = SUPPORTED_CURRENCIES.find(c => c.code === currency);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url('/lovable-uploads/sagarujjwal-banner.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div 
        className="w-full max-w-sm backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-red-500/20 relative z-10"
        style={{
          backgroundImage: `url('/lovable-uploads/sagarujjwal-logo.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/70 rounded-2xl" />
        <div className="text-center mb-4 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="w-6 h-6 text-red-500" />
            <h1 className="text-lg sm:text-xl font-bold text-white">SAGAR UJJWAL GAMING</h1>
          </div>
          <p className="text-red-200 text-xs">Support the stream!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-red-100">Your Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-gray-900/50 border-red-500/30 focus:border-red-500 text-white"
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-red-100">Donation Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={donationType === 'text' ? 'default' : 'outline'}
                onClick={() => handleDonationTypeChange('text')}
                className={donationType === 'text' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500/30 text-red-200 hover:bg-red-500/10'}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Text
              </Button>
              <Button
                type="button"
                variant={donationType === 'voice' ? 'default' : 'outline'}
                onClick={() => handleDonationTypeChange('voice')}
                className={donationType === 'voice' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500/30 text-red-200 hover:bg-red-500/10'}
              >
                <Mic className="w-4 h-4 mr-2" />
                Voice
              </Button>
              <Button
                type="button"
                variant={donationType === 'hypersound' ? 'default' : 'outline'}
                onClick={() => handleDonationTypeChange('hypersound')}
                className={donationType === 'hypersound' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500/30 text-red-200 hover:bg-red-500/10'}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Sound
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-red-100">Amount</Label>
            <div className="flex gap-2">
              <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={currencyOpen}
                    className="w-[100px] justify-between bg-gray-900/50 border-red-500/30 text-white hover:bg-gray-800/50"
                  >
                    {selectedCurrencyData ? `${selectedCurrencyData.symbol} ${selectedCurrencyData.code}` : 'INR'}
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
                            onSelect={() => handleCurrencyChange(curr.code)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                currency === curr.code ? "opacity-100" : "opacity-0"
                              )}
                            />
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
                className="bg-gray-900/50 border-red-500/30 focus:border-red-500 text-white flex-1"
                placeholder="Enter amount"
                min={donationType === 'hypersound' ? minimums.minHypersound : donationType === 'voice' ? minimums.minVoice : minimums.minText}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">TTS above {currencySymbol}{currency === 'INR' ? '70' : '1'}</p>
          </div>

          {donationType === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="message" className="text-red-100">
                Your Message ({formData.message.length}/{getCharacterLimit()})
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="bg-gray-900/50 border-red-500/30 focus:border-red-500 text-white min-h-[100px]"
                placeholder="Enter your message"
                maxLength={getCharacterLimit()}
                required
              />
            </div>
          )}

          {donationType === 'voice' && (
            <EnhancedVoiceRecorder
              controller={voiceRecorder}
              maxDurationSeconds={getVoiceDuration(currentAmount)}
              onRecordingComplete={(hasRecording) => {
                // Voice recording complete callback
              }}
              requiredAmount={minimums.minVoice}
              currentAmount={currentAmount}
              brandColor="#ef4444"
            />
          )}

          {donationType === 'hypersound' && (
            <HyperSoundSelector
              selectedSound={selectedSound}
              onSoundSelect={setSelectedSound}
            />
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-red-500/50 transition-all"
            disabled={isProcessingPayment || !razorpayLoaded || (donationType === 'voice' && !voiceRecorder.audioBlob) || (donationType === 'hypersound' && !selectedSound)}
          >
            {isProcessingPayment ? 'Processing...' : `Pay ${currencySymbol}${formData.amount || '0'}`}
          </Button>
          <DonationPageFooter brandColor="#ef4444" />
        </form>
      </div>
    </div>
  );
};

export default SagarUjjwalGaming;