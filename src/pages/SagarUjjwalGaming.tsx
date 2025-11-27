import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { Flame, MessageSquare, Mic, Crown } from 'lucide-react';

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
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hyperemote'>('text');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const getVoiceDuration = (amount: number) => {
    if (amount >= 500) return 30;
    if (amount >= 250) return 25;
    if (amount >= 150) return 15;
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

  const handleDonationTypeChange = (type: 'text' | 'voice' | 'hyperemote') => {
    setDonationType(type);
    if (type === 'hyperemote') {
      setFormData(prev => ({ ...prev, amount: '50', message: '' }));
    } else if (type === 'voice') {
      setFormData(prev => ({ ...prev, amount: prev.amount || '150' }));
    } else {
      setFormData(prev => ({ ...prev, amount: prev.amount || '40' }));
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
      const isHyperemote = donationType === 'hyperemote';

      // Validate minimum amounts
      if (isHyperemote && amount < 50) {
        toast.error('Hyperemotes require minimum ₹50');
        setIsProcessingPayment(false);
        return;
      }

      if (donationType === 'voice' && amount < 150) {
        toast.error('Voice messages require minimum ₹150');
        setIsProcessingPayment(false);
        return;
      }

      if (donationType === 'text' && amount < 40) {
        toast.error('Text messages require minimum ₹40');
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
          message: donationType === 'text' ? formData.message : undefined,
          voiceMessageUrl,
          isHyperemote,
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
    if (amount >= 200) return 250;
    if (amount >= 100) return 200;
    return 100;
  };

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
        className="w-full max-w-md backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-red-500/20 relative z-10"
        style={{
          backgroundImage: `url('/lovable-uploads/sagarujjwal-logo.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/70 rounded-2xl" />
        <div className="text-center mb-8 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame className="w-10 h-10 text-red-500" />
            <h1 className="text-3xl font-bold text-white">SAGAR UJJWAL GAMING</h1>
          </div>
          <p className="text-red-200">Support the stream!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
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
                Text (₹40+)
              </Button>
              <Button
                type="button"
                variant={donationType === 'voice' ? 'default' : 'outline'}
                onClick={() => handleDonationTypeChange('voice')}
                className={donationType === 'voice' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500/30 text-red-200 hover:bg-red-500/10'}
              >
                <Mic className="w-4 h-4 mr-2" />
                Voice (₹150+)
              </Button>
              <Button
                type="button"
                variant={donationType === 'hyperemote' ? 'default' : 'outline'}
                onClick={() => handleDonationTypeChange('hyperemote')}
                className={donationType === 'hyperemote' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500/30 text-red-200 hover:bg-red-500/10'}
              >
                <Crown className="w-4 h-4 mr-2" />
                Fire (₹50+)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-red-100">Amount (₹)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              className="bg-gray-900/50 border-red-500/30 focus:border-red-500 text-white"
              placeholder="Enter amount"
              min={donationType === 'hyperemote' ? 50 : donationType === 'voice' ? 150 : 40}
              required
            />
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
              requiredAmount={150}
              currentAmount={currentAmount}
              brandColor="#ef4444"
            />
          )}

          {donationType === 'hyperemote' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-100 text-sm">
              <p className="font-semibold mb-2">🔥 Fire Rain Effect</p>
              <p>Trigger an epic fire GIF rain effect on stream!</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-red-500/50 transition-all"
            disabled={isProcessingPayment || !razorpayLoaded || (donationType === 'voice' && !voiceRecorder.audioBlob)}
          >
            {isProcessingPayment ? 'Processing...' : `Pay ₹${formData.amount || '0'}`}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SagarUjjwalGaming;