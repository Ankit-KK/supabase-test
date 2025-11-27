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
import { Brain } from 'lucide-react';

const MrIqmaster = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
  });
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hyperemote'>('text');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [streamerSettings, setStreamerSettings] = useState<{ hyperemotes_enabled: boolean; hyperemotes_min_amount: number } | null>(null);
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

    const fetchStreamerSettings = async () => {
      const { data, error } = await supabase.functions.invoke('get-pusher-config', {
        body: { streamer_slug: 'mriqmaster' }
      });
      
      if (!error && data) {
        setStreamerSettings({
          hyperemotes_enabled: true,
          hyperemotes_min_amount: 50
        });
      }
    };

    fetchStreamerSettings();
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

    if (donationType === 'text' && amount < 40) {
      toast.error('Minimum ₹40 required for text messages');
      return;
    }

    if (donationType === 'voice' && amount < 150) {
      toast.error('Minimum ₹150 required for voice messages');
      return;
    }

    if (donationType === 'hyperemote' && amount < 50) {
      toast.error('Minimum ₹50 required for hyperemotes');
      return;
    }

    if (donationType === 'voice' && !voiceRecorder.audioBlob) {
      toast.error('Please record a voice message');
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
            message: formData.message || null,
            donationType: donationType,
            voiceMessageUrl: voiceMessageUrl,
          }
        }
      );

      if (orderError) {
        throw new Error(orderError.message || 'Failed to create order');
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
          navigate(`/status?order_id=${orderData.order_id}&status=success`);
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            navigate(`/status?order_id=${orderData.order_id}&status=pending`);
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

            <div>
              <Label className="text-cyan-400 font-semibold mb-3 block">Choose Interaction</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  onClick={() => { setDonationType('text'); setFormData({ ...formData, amount: '40' }); }}
                  variant={donationType === 'text' ? 'default' : 'outline'}
                  className={donationType === 'text' ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-400' : 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50 hover:text-cyan-200'}
                >
                  <div className="flex flex-col items-center gap-1 py-1">
                    <span className="text-xl">💬</span>
                    <span className="text-xs font-medium">Text</span>
                    <span className="text-[10px] opacity-90">₹40+</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  onClick={() => { setDonationType('voice'); setFormData({ ...formData, amount: '150' }); }}
                  variant={donationType === 'voice' ? 'default' : 'outline'}
                  className={donationType === 'voice' ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-400' : 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50 hover:text-cyan-200'}
                >
                  <div className="flex flex-col items-center gap-1 py-1">
                    <span className="text-xl">🎤</span>
                    <span className="text-xs font-medium">Voice</span>
                    <span className="text-[10px] opacity-90">₹150+</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  onClick={() => { setDonationType('hyperemote'); setFormData({ ...formData, amount: '50' }); }}
                  variant={donationType === 'hyperemote' ? 'default' : 'outline'}
                  className={donationType === 'hyperemote' ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-400' : 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50 hover:text-cyan-200'}
                  disabled={!streamerSettings?.hyperemotes_enabled}
                >
                  <div className="flex flex-col items-center gap-1 py-1">
                    <Brain className="w-5 h-5" />
                    <span className="text-xs font-medium">Brain</span>
                    <span className="text-[10px] opacity-90">₹50+</span>
                  </div>
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="amount" className="text-cyan-400 font-semibold">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                required
                min={donationType === 'text' ? 40 : donationType === 'voice' ? 150 : 50}
                className="bg-cyan-950/50 border-cyan-500/30 text-white placeholder:text-cyan-400/50 focus:border-cyan-400"
              />
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
                  requiredAmount={150}
                  currentAmount={currentAmount}
                />
              </div>
            )}

            {donationType === 'hyperemote' && (
              <div className="text-cyan-300 text-sm bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/20">
                <p className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Trigger a special brain rain effect on stream!
                </p>
              </div>
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
