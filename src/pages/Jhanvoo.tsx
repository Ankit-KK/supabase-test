import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { DonationTypeSelector } from "@/components/DonationTypeSelector";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import jhanvooBanner from "@/assets/jhanvoo-banner.jpg";
import jhanvooLogo from "@/assets/jhanvoo-logo.jpg";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Jhanvoo = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [donationType, setDonationType] = useState<"message" | "voice" | "hyperemote">("message");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const maxVoiceDuration = getVoiceDuration();
  const voiceRecorder = useVoiceRecorder(maxVoiceDuration);

  function getVoiceDuration() {
    const amt = parseFloat(amount);
    if (amt >= 500) return 30;
    if (amt >= 250) return 25;
    if (amt >= 150) return 15;
    return 15;
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !amount) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and amount",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (donationType === "hyperemote" && amountNum < 50) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount for hyperemote is ₹50",
        variant: "destructive",
      });
      return;
    }

    if (donationType === "voice" && amountNum < 150) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount for voice message is ₹150",
        variant: "destructive",
      });
      return;
    }

    if (donationType === "message" && amountNum < 40) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount for text message is ₹40",
        variant: "destructive",
      });
      return;
    }

    if (donationType === "voice" && !voiceRecorder.audioBlob) {
      toast({
        title: "Voice Required",
        description: "Please record a voice message",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      let voiceMessageUrl: string | null = null;

      if (donationType === "voice" && voiceRecorder.audioBlob) {
        console.log("Uploading voice message to Supabase...");
        const reader = new FileReader();
        reader.readAsDataURL(voiceRecorder.audioBlob);
        
        await new Promise<void>((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const base64data = reader.result as string;
              const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
                'upload-voice-message-direct',
                {
                  body: {
                    voiceData: base64data.split(',')[1],
                    streamerSlug: 'jhanvoo'
                  }
                }
              );

              if (uploadError) throw uploadError;
              
              voiceMessageUrl = uploadData?.voice_message_url;
              console.log("Voice uploaded successfully:", voiceMessageUrl);
              resolve();
            } catch (err) {
              reject(err);
            }
          };
        });
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order-jhanvoo',
        {
          body: {
            name: name.trim(),
            amount: amountNum,
            message: donationType === "message" ? message.trim() : null,
            voiceMessageUrl: voiceMessageUrl,
            isHyperemote: donationType === "hyperemote",
          }
        }
      );

      if (orderError) throw orderError;
      if (!orderData) throw new Error("No order data received");

      console.log("Order created successfully:", orderData);

      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Jhanvoo",
        description: "Support Jhanvoo",
        order_id: orderData.razorpay_order_id,
        handler: (response: any) => {
          console.log("Payment successful:", response);
          navigate(`/status?order_id=${orderData.orderId}&status=success`);
        },
        prefill: {
          name: name.trim(),
        },
        theme: {
          color: "#6366f1"
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal closed");
            navigate(`/status?order_id=${orderData.orderId}&status=pending`);
            setIsProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${jhanvooBanner})` }}
    >
      <div 
        className="max-w-md w-full bg-black/40 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-indigo-500/20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${jhanvooLogo})` }}
      >
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Jhanvoo</h1>
          <p className="text-gray-100 text-center text-sm">
            Support with your interaction
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <DonationTypeSelector
            donationType={donationType}
            onTypeChange={setDonationType}
            brandColor="#6366f1"
          />

          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-100">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/10 border-indigo-500/30 text-white placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-100">
              Amount (₹)
              {donationType === "hyperemote" && " - Min ₹50"}
              {donationType === "voice" && " - Min ₹150"}
              {donationType === "message" && " - Min ₹40"}
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white/10 border-indigo-500/30 text-white placeholder:text-gray-400"
              min={donationType === "hyperemote" ? 50 : donationType === "voice" ? 150 : 40}
              step="1"
              required
            />
            <p className="text-xs text-muted-foreground">TTS above ₹70</p>
          </div>

          {donationType === "message" && (
            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-100">Your Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Enter your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-white/10 border-indigo-500/30 text-white placeholder:text-gray-400 min-h-[100px]"
                maxLength={500}
              />
            </div>
          )}

          {donationType === "voice" && (
            <div className="space-y-2">
              <Label className="text-gray-100">Record Voice Message</Label>
              <VoiceRecorder
                onRecordingComplete={(hasRecording, duration) => {
                  setHasVoiceRecording(hasRecording);
                  setVoiceDuration(duration);
                }}
                maxDurationSeconds={maxVoiceDuration}
                controller={voiceRecorder}
                requiredAmount={150}
                currentAmount={parseFloat(amount) || 0}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 rounded-xl shadow-lg"
            disabled={isProcessing}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isProcessing ? "Processing..." : "Send Interaction"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Jhanvoo;