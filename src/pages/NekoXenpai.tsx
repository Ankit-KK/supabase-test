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
import { Cat, Sparkles, Mic, MessageSquare } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-950 via-slate-900 to-fuchsia-800">
      {/* Header with Cat Icon */}
      <div className="relative h-48 bg-gradient-to-r from-fuchsia-600 to-pink-600 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-4 border-fuchsia-400/50">
              <Cat className="w-12 h-12 text-fuchsia-200" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">Neko XENPAI</h1>
          <p className="text-fuchsia-100 mt-2">Support with Style ✨</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto bg-slate-900/95 border-fuchsia-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-fuchsia-400 text-2xl">Send Your Support</CardTitle>
            <CardDescription className="text-slate-400">
              Choose your donation style and make it memorable!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-fuchsia-300 font-semibold">Choose Donation Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={donationType === 'text' ? 'default' : 'outline'}
                    onClick={() => setDonationType('text')}
                    className={`h-24 flex flex-col items-center justify-center gap-2 ${
                      donationType === 'text'
                        ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white border-fuchsia-500'
                        : 'bg-slate-800/50 hover:bg-slate-800/70 text-fuchsia-200 border-fuchsia-500/30'
                    }`}
                  >
                    <span className="text-3xl">💬</span>
                    <span className="text-xs">Text Message</span>
                    <span className="text-xs opacity-70">Min ₹40</span>
                  </Button>

                  <Button
                    type="button"
                    variant={donationType === 'voice' ? 'default' : 'outline'}
                    onClick={() => setDonationType('voice')}
                    className={`h-24 flex flex-col items-center justify-center gap-2 ${
                      donationType === 'voice'
                        ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white border-fuchsia-500'
                        : 'bg-slate-800/50 hover:bg-slate-800/70 text-fuchsia-200 border-fuchsia-500/30'
                    }`}
                  >
                    <span className="text-3xl">🎤</span>
                    <span className="text-xs">Voice Message</span>
                    <span className="text-xs opacity-70">Min ₹150</span>
                  </Button>

                  <Button
                    type="button"
                    variant={donationType === 'hyperemote' ? 'default' : 'outline'}
                    onClick={() => setDonationType('hyperemote')}
                    disabled={!streamerSettings?.hyperemotes_enabled}
                    className={`h-24 flex flex-col items-center justify-center gap-2 ${
                      donationType === 'hyperemote'
                        ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white border-fuchsia-500'
                        : 'bg-slate-800/50 hover:bg-slate-800/70 text-fuchsia-200 border-fuchsia-500/30'
                    }`}
                  >
                    <span className="text-3xl">🎁</span>
                    <span className="text-xs">Hyperemotes</span>
                    <span className="text-xs opacity-70">Min ₹{streamerSettings?.hyperemotes_min_amount || 50}</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-fuchsia-300">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  required
                  className="bg-slate-800/50 border-fuchsia-500/30 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-fuchsia-300">
                  Amount (₹)
                  {donationType === 'voice' && (
                    <span className="ml-2 text-xs text-slate-400">
                      (₹150-249: 15s | ₹250-499: 25s | ₹500+: 30s)
                    </span>
                  )}
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder={`Min ₹${donationType === 'voice' ? '150' : donationType === 'hyperemote' ? '50' : '40'}`}
                  required
                  className="bg-slate-800/50 border-fuchsia-500/30 text-white placeholder:text-slate-500"
                />
              </div>

              {donationType === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-fuchsia-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Your Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Write your message here..."
                    required
                    rows={4}
                    className="bg-slate-800/50 border-fuchsia-500/30 text-white placeholder:text-slate-500 resize-none"
                  />
                </div>
              )}

              {donationType === 'voice' && (
                <div className="space-y-2">
                  <Label className="text-fuchsia-300 flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voice Message
                  </Label>
                  <EnhancedVoiceRecorder
                    onRecordingComplete={(hasRecording) => {}}
                    maxDurationSeconds={getVoiceDuration(currentAmount)}
                    controller={voiceRecorder}
                    requiredAmount={150}
                    currentAmount={currentAmount}
                    brandColor="#d946ef"
                  />
                </div>
              )}

              {donationType === 'hyperemote' && availableGifs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-fuchsia-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Select GIF
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    {availableGifs.map((gif) => (
                      <div
                        key={gif.name}
                        onClick={() => setSelectedGif(gif.name)}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedGif === gif.name
                            ? 'border-fuchsia-500 shadow-lg shadow-fuchsia-500/50'
                            : 'border-slate-700 hover:border-fuchsia-400'
                        }`}
                      >
                        <img src={gif.url} alt={gif.name} className="w-full h-24 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isProcessingPayment || sdkLoading}
                className="w-full text-lg py-6 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-fuchsia-500/50"
              >
                {isProcessingPayment ? 'Processing...' : `Continue with ₹${formData.amount || '0'}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <PhoneDialog
        open={isPhoneDialogOpen}
        onOpenChange={setIsPhoneDialogOpen}
        phoneNumber={phoneNumber}
        onPhoneChange={setPhoneNumber}
        phoneError={phoneError}
        onContinue={handleContinueToPayment}
        isSubmitting={isProcessingPayment}
        buttonColor="#d946ef"
      />
    </div>
  );
};

export default NekoXenpai;
