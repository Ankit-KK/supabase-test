import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Razorpay - loaded via script tag
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
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
  const [streamerSettings, setStreamerSettings] = useState<{ hyperemotes_enabled: boolean; hyperemotes_min_amount: number } | null>(null);
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
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

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

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
          isHyperemote: donationType === 'hyperemote',
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
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-fuchsia-200">Choose Donation Type</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={donationType === 'text' ? 'default' : 'outline'}
                onClick={() => setDonationType('text')}
                className={`h-20 flex flex-col items-center justify-center gap-1.5 transition-all ${
                  donationType === 'text'
                    ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white border-2 border-fuchsia-400 shadow-lg shadow-fuchsia-500/50 scale-105'
                    : 'bg-black/50 hover:bg-black/70 text-fuchsia-200 border-2 border-fuchsia-500/40 hover:border-fuchsia-500/60 hover:scale-105'
                }`}
              >
                <span className="text-3xl">💬</span>
                <span className="text-xs font-bold tracking-wide">Text</span>
                <span className="text-[10px] opacity-80 font-medium">Min ₹40</span>
              </Button>

              <Button
                type="button"
                variant={donationType === 'voice' ? 'default' : 'outline'}
                onClick={() => setDonationType('voice')}
                className={`h-20 flex flex-col items-center justify-center gap-1.5 transition-all ${
                  donationType === 'voice'
                    ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white border-2 border-fuchsia-400 shadow-lg shadow-fuchsia-500/50 scale-105'
                    : 'bg-black/50 hover:bg-black/70 text-fuchsia-200 border-2 border-fuchsia-500/40 hover:border-fuchsia-500/60 hover:scale-105'
                }`}
              >
                <span className="text-3xl">🎤</span>
                <span className="text-xs font-bold tracking-wide">Voice</span>
                <span className="text-[10px] opacity-80 font-medium">Min ₹150</span>
              </Button>

              <Button
                type="button"
                variant={donationType === 'hyperemote' ? 'default' : 'outline'}
                onClick={() => setDonationType('hyperemote')}
                disabled={!streamerSettings?.hyperemotes_enabled}
                className={`h-20 flex flex-col items-center justify-center gap-1.5 transition-all ${
                  donationType === 'hyperemote'
                    ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white border-2 border-fuchsia-400 shadow-lg shadow-fuchsia-500/50 scale-105'
                    : 'bg-black/50 hover:bg-black/70 text-fuchsia-200 border-2 border-fuchsia-500/40 hover:border-fuchsia-500/60 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <span className="text-3xl">🎁</span>
                <span className="text-xs font-bold tracking-wide">Effects</span>
                <span className="text-[10px] opacity-80 font-medium">Min ₹{streamerSettings?.hyperemotes_min_amount || 50}</span>
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
            <Label htmlFor="amount" className="text-sm text-fuchsia-200">Amount (₹)</Label>
            <Input
              id="amount"
              name="amount"
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
            <div className="space-y-2">
              <Label className="text-sm text-fuchsia-200">Hyperemote Effect Preview</Label>
              <div className="p-4 rounded-lg border-2 border-fuchsia-500 bg-fuchsia-500/10">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🌧️</span>
                  <div className="flex-1">
                    <p className="font-bold text-fuchsia-100 text-base">
                      Hyperemote Rain Effect
                    </p>
                    <p className="text-sm text-fuchsia-300/80 mt-2">
                      Adorable emotes will rain down across the screen with beautiful animations! 
                      Your donation will trigger a spectacular visual display that everyone will love.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isProcessingPayment}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-semibold py-4 text-base shadow-lg shadow-fuchsia-500/30 transition-all"
          >
            {isProcessingPayment ? 'Processing...' : `Support with ₹${formData.amount || '0'}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NekoXenpai;
