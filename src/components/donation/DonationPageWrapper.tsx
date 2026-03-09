import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DonationPageConfig } from '@/config/donationPageConfigs';
import { getStreamerConfig } from '@/config/streamers';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import HyperSoundSelector from '@/components/HyperSoundSelector';
import MediaUploader from '@/components/MediaUploader';
import DonationPageFooter from '@/components/DonationPageFooter';
import HowItWorksDialog from '@/components/HowItWorksDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronDown, Check, MessageSquare, Mic, Music, Image, Loader2, HelpCircle } from 'lucide-react';
import { SUPPORTED_CURRENCIES, getCurrencySymbol as getCurrencySymbolFn } from '@/constants/currencies';
import { useStreamerPricing } from '@/hooks/useStreamerPricing';
import { cn } from '@/lib/utils';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface DonationPageWrapperProps {
  config: DonationPageConfig;
}

type DonationType = 'text' | 'voice' | 'hypersound' | 'media';

export const DonationPageWrapper: React.FC<DonationPageWrapperProps> = ({ config }) => {
  const navigate = useNavigate();
  const streamerConfig = getStreamerConfig(config.streamerSlug);
  
  const [formData, setFormData] = useState({ name: '', amount: '', message: '' });
  const [currency, setCurrency] = useState('INR');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [donationType, setDonationType] = useState<DonationType>('text');
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState<number>(0);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'gif' | 'video' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  // Calculate tiered voice duration based on amount (INR): 150-299=8s, 300-499=12s, 500+=15s
  const getVoiceDuration = (amount: number) => {
    if (amount >= 500) return 15;
    if (amount >= 300) return 12;
    return 8;
  };
  
  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  // Load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const { pricing } = useStreamerPricing(config.streamerSlug, currency);

  const getMinAmount = () => {
    switch (donationType) {
      case 'text': return pricing.minText;
      case 'voice': return pricing.minVoice;
      case 'hypersound': return pricing.minHypersound;
      case 'media': return pricing.minMedia;
      default: return pricing.minText;
    }
  };

  const getCurrencySymbol = () => getCurrencySymbolFn(currency);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDonationTypeChange = (type: DonationType) => {
    setDonationType(type);
    if (type !== 'voice') {
      setHasVoiceRecording(false);
      voiceRecorder.clearRecording();
    }
    if (type !== 'hypersound') setSelectedSound(null);
    if (type !== 'media') {
      setMediaUrl(null);
      setMediaType(null);
    }
  };

  const getCharacterLimit = () => {
    if (donationType === 'voice' || donationType === 'media') return 50;
    return 200;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    const minAmount = getMinAmount();
    
    if (isNaN(amount) || amount < minAmount) {
      toast.error(`Minimum donation for ${donationType} is ${getCurrencySymbol()}${minAmount}`);
      return;
    }

    if (donationType === 'voice' && !hasVoiceRecording) {
      toast.error('Please record a voice message');
      return;
    }

    if (donationType === 'hypersound' && !selectedSound) {
      toast.error('Please select a HyperSound');
      return;
    }

    if (donationType === 'media' && !mediaUrl) {
      toast.error('Please upload an image or video');
      return;
    }

    await processPayment(amount);
  };

  const processPayment = async (amount: number) => {
    if (!razorpayLoaded) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl: string | null = null;

      // Upload voice message if present
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const fileName = `${Date.now()}-${formData.name.replace(/\s+/g, '-')}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('voice-messages')
          .upload(`${config.streamerSlug}/${fileName}`, voiceRecorder.audioBlob, {
            contentType: 'audio/webm',
            cacheControl: '3600',
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('voice-messages')
          .getPublicUrl(uploadData.path);
        
        voiceMessageUrl = urlData.publicUrl;
      }

      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        config.edgeFunctionName,
        {
          body: {
            amount,
            currency,
            donorName: formData.name.trim(),
            message: formData.message.trim() || undefined,
            donationType,
            voiceMessageUrl,
            voiceDuration: voiceDuration || undefined,
            selectedSound: selectedSound || undefined,
            mediaUrl: mediaUrl || undefined,
            mediaType: mediaType || undefined,
          },
        }
      );

      if (orderError) throw orderError;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: config.streamerName,
        description: `Donation to ${config.streamerName}`,
        order_id: orderData.orderId,
        handler: function(response: any) {
          navigate(`/status?order_id=${orderData.orderId}&status=success`);
        },
        prefill: {
          name: formData.name,
        },
        theme: {
          color: config.brandColor,
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false);
            toast.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment');
      setIsProcessingPayment(false);
    }
  };

  const donationTypes = [
    { id: 'text' as DonationType, label: 'Text', icon: MessageSquare },
    { id: 'voice' as DonationType, label: 'Voice', icon: Mic },
    { id: 'hypersound' as DonationType, label: 'HyperSound', icon: Music },
    { id: 'media' as DonationType, label: 'Media', icon: Image },
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${config.backgroundSrc})` }}
    >
      <div className="min-h-screen bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src={config.logoSrc} 
            alt={config.streamerName}
            className="h-24 w-24 rounded-full object-cover border-4 shadow-xl"
            style={{ borderColor: config.brandColor }}
          />
        </div>

        {/* Donation Card */}
        <Card 
          className="w-full max-w-md p-6 bg-black/80 backdrop-blur-md border-0 shadow-2xl"
          style={{ 
            backgroundImage: config.cardBackgroundSrc ? `url(${config.cardBackgroundSrc})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <Input
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                maxLength={50}
              />
            </div>

            {/* Amount + Currency */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  name="amount"
                  type="number"
                  placeholder={`Amount (min ${getCurrencySymbol()}${getMinAmount()})`}
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  min={getMinAmount()}
                />
              </div>
              <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-24 justify-between bg-white/10 border-white/20 text-white"
                  >
                    {currency}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0">
                  <Command>
                    <CommandInput placeholder="Search currency..." />
                    <CommandList>
                      <CommandEmpty>No currency found.</CommandEmpty>
                      <CommandGroup>
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={c.code}
                            onSelect={() => {
                              setCurrency(c.code);
                              setCurrencyOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", currency === c.code ? "opacity-100" : "opacity-0")} />
                            {c.symbol} {c.code}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Donation Type Selector */}
            <div className="grid grid-cols-4 gap-2">
              {donationTypes.map((type) => (
                <Button
                  key={type.id}
                  type="button"
                  variant={donationType === type.id ? 'default' : 'outline'}
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-2",
                    donationType === type.id 
                      ? 'text-white' 
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  )}
                  style={donationType === type.id ? { backgroundColor: config.brandColor } : undefined}
                  onClick={() => handleDonationTypeChange(type.id)}
                >
                  <type.icon className="h-4 w-4" />
                  <span className="text-xs">{type.label}</span>
                </Button>
              ))}
            </div>

            {/* Message Input */}
            <div>
              <Textarea
                name="message"
                placeholder={donationType === 'voice' || donationType === 'media' ? 'Short message (optional)' : 'Your message'}
                value={formData.message}
                onChange={handleInputChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[80px] resize-none"
                maxLength={getCharacterLimit()}
              />
              <p className="text-xs text-white/50 text-right mt-1">
                {formData.message.length}/{getCharacterLimit()}
              </p>
            </div>

            {/* Voice Recorder */}
            {donationType === 'voice' && (
              <EnhancedVoiceRecorder
                onRecordingComplete={(hasRecording, duration) => {
                  setHasVoiceRecording(hasRecording);
                  setVoiceDuration(duration);
                }}
                controller={voiceRecorder}
                requiredAmount={getMinAmount()}
                currentAmount={parseFloat(formData.amount) || 0}
                brandColor={config.brandColor}
              />
            )}

            {/* HyperSound Selector */}
            {donationType === 'hypersound' && (
              <HyperSoundSelector
                selectedSound={selectedSound}
                onSoundSelect={setSelectedSound}
              />
            )}

            {/* Media Uploader */}
            {donationType === 'media' && (
              <MediaUploader
                streamerSlug={config.streamerSlug}
                onMediaUploaded={(url, type) => {
                  setMediaUrl(url);
                  setMediaType(type);
                }}
                onMediaRemoved={() => {
                  setMediaUrl(null);
                  setMediaType(null);
                }}
              />
            )}

            <RewardsBanner amount={Number(formData.amount)} currency={currency} />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full text-white font-semibold py-3"
              style={{ backgroundColor: config.brandColor }}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Donate ${formData.amount ? `${getCurrencySymbol()}${formData.amount}` : ''}`
              )}
            </Button>
          </form>
        </Card>

        {/* How It Works */}
        <div className="mt-4">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setHowItWorksOpen(true)}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            How It Works
          </Button>
          <HowItWorksDialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen} />
        </div>

        {/* Footer */}
        <DonationPageFooter />
      </div>
    </div>
  );
};

export default DonationPageWrapper;
