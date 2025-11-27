import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
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

declare global {
  interface Window {
    Razorpay: any;
  }
}

const ABdevil = () => {
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
      let voiceMessageUrl = null;

      if (donationType === "voice" && voiceRecorder.audioBlob) {
        // Validate file size before upload (minimum 5KB to prevent corrupted recordings)
        if (voiceRecorder.audioBlob.size < 5000) {
          toast({
            title: "Recording Too Short",
            description: "Recording is too short. Please record at least 1 second.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        const voiceDataBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        const {
          data: uploadResult,
          error: uploadError
        } = await supabase.functions.invoke('upload-voice-message-direct', {
          body: {
            voiceData: voiceDataBase64,
            streamerSlug: 'abdevil'
          }
        });
        if (uploadError) {
          console.error('Voice upload error:', uploadError);
          throw new Error('Failed to upload voice message');
        }
        voiceMessageUrl = uploadResult.voice_message_url;
        console.log('Voice message uploaded successfully:', voiceMessageUrl);
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order-abdevil",
        {
          body: {
            amount: amountNum,
            name: name.trim(),
            message: donationType === "message" ? message.trim() : null,
            voiceMessageUrl,
            donationType,
          },
        }
      );

      if (orderError) throw orderError;

      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: "ABdevil",
        description: "Support ABdevil",
        order_id: orderData.razorpay_order_id,
        handler: function (response: any) {
          navigate(
            `/status?order_id=${orderData.orderId}&status=success&payment_id=${response.razorpay_payment_id}`
          );
        },
        modal: {
          ondismiss: function () {
            navigate(`/status?order_id=${orderData.orderId}&status=pending`);
          },
        },
        theme: {
          color: "#f97316",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-amber-900 to-orange-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/40 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-orange-500/30">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Flame className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-orange-400">ABdevil</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-orange-400">
              Your Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-black/30 border-orange-500/30 text-white placeholder:text-gray-400 focus:border-orange-500"
              required
            />
          </div>

          <DonationTypeSelector
            donationType={donationType}
            onTypeChange={setDonationType}
            brandColor="#f97316"
          />

          <div>
            <Label htmlFor="amount" className="text-orange-400">
              Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={
                donationType === "hyperemote"
                  ? "Min ₹50"
                  : donationType === "voice"
                  ? "Min ₹150"
                  : "Min ₹40"
              }
              className="bg-black/30 border-orange-500/30 text-white placeholder:text-gray-400 focus:border-orange-500"
              min={donationType === "hyperemote" ? 50 : donationType === "voice" ? 150 : 40}
              required
            />
          </div>

          {donationType === "message" && (
            <div>
              <Label htmlFor="message" className="text-orange-400">
                Your Message
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                className="bg-black/30 border-orange-500/30 text-white placeholder:text-gray-400 focus:border-orange-500 min-h-[100px]"
                maxLength={250}
              />
            </div>
          )}

          {donationType === "voice" && (
            <div className="space-y-3">
              <Label className="text-orange-400">
                Record Voice Message *
              </Label>
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

          {donationType === "hyperemote" && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-orange-300 text-sm text-center">
                🎊 Trigger a spectacular on-screen celebration effect!
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : `Send ₹${amount || "0"}`}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ABdevil;