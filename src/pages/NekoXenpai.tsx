import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { load } from '@cashfreepayments/cashfree-js';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { PhoneDialog } from '@/components/PhoneDialog';
import nekoXenpaiBanner from '@/assets/neko-xenpai-banner-new.jpg';
import nekoXenpaiProfile from '@/assets/neko-xenpai-profile-new.jpg';
import nekoXenpaiLogo from '@/assets/neko-xenpai-profile-new.jpg';

const NekoXenpai = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
  });
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hyperemote'>('text');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cashfree, setCashfree] = useState<any>(null);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [streamerSettings, setStreamerSettings] = useState<{ hyperemotes_enabled: boolean; hyperemotes_min_amount: number } | null>(null);
  const [availableGifs, setAvailableGifs] = useState<{ name: string; url: string }[]>([]);
  const [selectedGif, setSelectedGif] = useState<string>('');
  const navigate = useNavigate();
  
  const getVoiceDuration = (amount: number) => {
    if (amount >= 500) return 30;
    if (amount >= 250) return 25;
    if (amount >= 150) return 15;
    return 15;
  };

  const getCharacterLimit = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (amount >= 250) return 500;
    if (amount >= 100) return 250;
    if (amount >= 70) return 150;
    return 100;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        setSdkLoading(true);
        const cashfreeInstance = await load({ mode: 'production' });
        setCashfree(cashfreeInstance);
      } catch (error) {
        console.error('Failed to load Cashfree SDK:', error);
        toast.error('Failed to initialize payment system');
      } finally {
        setSdkLoading(false);
      }
    };

    initializeCashfree();
  }, []);

  useEffect(() => {
    const fetchStreamerSettings = async () => {
      try {
        const { data, error } = await supabase.rpc('get_streamer_public_settings', {
          slug: 'neko_xenpai'
        });
        
        if (error) {
          console.error('Error fetching streamer settings:', error);
          return;
        }

        if (data && data.length > 0) {
          setStreamerSettings(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch streamer settings:', err);
      }
    };

    fetchStreamerSettings();
  }, []);

  // Fetch available GIFs for hyperemote selection
  useEffect(() => {
    const fetchGifs = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('neko-gif')
          .list();

        if (error) {
          console.error('Error fetching GIFs:', error);
          return;
        }

        if (data) {
          const gifs = data
            .filter(file => file.name.endsWith('.gif'))
            .map(file => ({
              name: file.name,
              url: supabase.storage.from('neko-gif').getPublicUrl(file.name).data.publicUrl
            }));
          setAvailableGifs(gifs);
          if (gifs.length > 0) {
            setSelectedGif(gifs[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch GIFs:', err);
      }
    };

    if (donationType === 'hyperemote') {
      fetchGifs();
    }
  }, [donationType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateDonation = () => {
    const minAmount = donationType === 'voice' ? 150 : donationType === 'hyperemote' ? 50 : 40;
    const amount = parseFloat(formData.amount);

    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }

    if (isNaN(amount) || amount < minAmount) {
      toast.error(`Minimum amount for ${donationType} is ₹${minAmount}`);
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

    if (donationType === 'hyperemote' && !selectedGif) {
      toast.error('Please select a GIF');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDonation()) return;

    setIsPhoneDialogOpen(true);
  };

  const validatePhone = () => {
    if (!phoneNumber || phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleContinueToPayment = async () => {
    if (!validatePhone()) return;

    setIsPhoneDialogOpen(false);
    await processPayment();
  };

  const processPayment = async () => {
    try {
      setIsProcessingPayment(true);

      let voiceMessageUrl = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        voiceMessageUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
      }

      const { data, error } = await supabase.functions.invoke('create-payment-order-neko-xenpai', {
        body: {
          name: formData.name,
          amount: formData.amount,
          message: donationType === 'text' ? formData.message : null,
          phone: phoneNumber,
          voiceMessageUrl,
          isHyperemote: donationType === 'hyperemote',
          selectedGifId: donationType === 'hyperemote' ? selectedGif : null,
        },
      });

      if (error) throw error;
      if (!data?.payment_session_id) throw new Error('No payment session ID received');

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/status?order_id=${data.order_id}&status={order_status}`,
      };

      if (cashfree) {
        cashfree.checkout(checkoutOptions);
      }
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
        className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-fuchsia-500/20 shadow-2xl relative overflow-hidden"
        style={{ 
          backgroundImage: `url(${nekoXenpaiProfile})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 via-pink-600/20 to-fuchsia-400/20 opacity-50 blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-pink-600/10 to-fuchsia-400/10 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center space-y-3 relative z-10">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-fuchsia-500 shadow-xl">
              <img 
                src={nekoXenpaiLogo} 
                alt="Neko XENPAI"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Neko XENPAI
          </CardTitle>
          <CardDescription className="text-base text-fuchsia-200">
            Support your favorite streamer!
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-fuchsia-200">Choose Donation Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={donationType === 'text' ? 'default' : 'outline'}
                onClick={() => setDonationType('text')}
                className={`h-16 flex flex-col items-center justify-center gap-1 transition-all ${
                  donationType === 'text'
                    ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white border-fuchsia-500'
                    : 'bg-black/40 hover:bg-black/60 text-fuchsia-200 border-fuchsia-500/30'
                }`}
              >
                <span className="text-2xl">💬</span>
                <span className="text-[10px] font-semibold">Text Message</span>
                <span className="text-[9px] opacity-70">Min ₹40</span>
              </Button>

              <Button
                type="button"
                variant={donationType === 'voice' ? 'default' : 'outline'}
                onClick={() => setDonationType('voice')}
                className={`h-16 flex flex-col items-center justify-center gap-1 transition-all ${
                  donationType === 'voice'
                    ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white border-fuchsia-500'
                    : 'bg-black/40 hover:bg-black/60 text-fuchsia-200 border-fuchsia-500/30'
                }`}
              >
                <span className="text-2xl">🎤</span>
                <span className="text-[10px] font-semibold">Voice Message</span>
                <span className="text-[9px] opacity-70">Min ₹150</span>
              </Button>

              <Button
                type="button"
                variant={donationType === 'hyperemote' ? 'default' : 'outline'}
                onClick={() => setDonationType('hyperemote')}
                disabled={!streamerSettings?.hyperemotes_enabled}
                className={`h-16 flex flex-col items-center justify-center gap-1 transition-all ${
                  donationType === 'hyperemote'
                    ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white border-fuchsia-500'
                    : 'bg-black/40 hover:bg-black/60 text-fuchsia-200 border-fuchsia-500/30 disabled:opacity-50'
                }`}
              >
                <span className="text-2xl">🎁</span>
                <span className="text-[10px] font-semibold">Hyperemotes</span>
                <span className="text-[9px] opacity-70">Min ₹{streamerSettings?.hyperemotes_min_amount || 50}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm text-fuchsia-200">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-black/40 border-fuchsia-500/30 text-white placeholder:text-fuchsia-300/50 focus:border-fuchsia-500 focus:ring-fuchsia-500/20"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="amount" className="text-sm text-fuchsia-200">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="bg-black/40 border-fuchsia-500/30 text-white placeholder:text-fuchsia-300/50 focus:border-fuchsia-500 focus:ring-fuchsia-500/20"
              min="1"
              required
            />
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
                requiredAmount={150}
                currentAmount={parseFloat(formData.amount) || 0}
                brandColor="#d946ef"
              />
              <p className="text-[10px] text-fuchsia-300/70">
                Duration: {getVoiceDuration(parseFloat(formData.amount) || 0)}s (increases with donation amount)
              </p>
            </div>
          )}

          {donationType === 'hyperemote' && (
            <div className="space-y-1">
              <Label className="text-sm text-fuchsia-200">Select Hyperemote</Label>
              {availableGifs.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-2 bg-black/40 rounded-lg border border-fuchsia-500/30">
                  {availableGifs.map((gif) => (
                    <button
                      key={gif.name}
                      type="button"
                      onClick={() => setSelectedGif(gif.name)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedGif === gif.name
                          ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50 scale-95'
                          : 'border-fuchsia-500/30 hover:border-fuchsia-500/50 hover:scale-95'
                      }`}
                    >
                      <img
                        src={gif.url}
                        alt={gif.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-fuchsia-300/70 text-center py-4">
                  No hyperemotes available yet
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isProcessingPayment || sdkLoading}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-semibold py-4 text-base shadow-lg shadow-fuchsia-500/30 transition-all"
          >
            {isProcessingPayment ? 'Processing...' : `Support with ₹${formData.amount || '0'}`}
          </Button>
        </CardContent>
      </Card>

      <PhoneDialog
        open={isPhoneDialogOpen}
        onOpenChange={setIsPhoneDialogOpen}
        phoneNumber={phoneNumber}
        onPhoneChange={setPhoneNumber}
        phoneError={phoneError}
        onContinue={processPayment}
        isSubmitting={isProcessingPayment}
        buttonColor="#d946ef"
      />
    </div>
  );
};

export default NekoXenpai;
