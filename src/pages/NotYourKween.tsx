import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SimpleVoiceRecorder from "@/components/SimpleVoiceRecorder";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const NotYourKween = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [donationType, setDonationType] = useState<"text" | "voice" | "hyperemote">("text");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const getVoiceDuration = () => {
    const amt = parseFloat(amount);
    if (amt >= 500) return 30;
    if (amt >= 250) return 25;
    return 15;
  };

  const getCharacterLimit = () => {
    const amt = parseFloat(amount);
    if (amt >= 200) return 250;
    if (amt >= 100) return 200;
    return 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amountNum = parseFloat(amount);
    
    // Validate minimums
    if (donationType === "hyperemote" && amountNum < 50) {
      toast.error("Hyperemote minimum is ₹50");
      return;
    }
    if (donationType === "voice" && amountNum < 150) {
      toast.error("Voice message minimum is ₹150");
      return;
    }
    if (donationType === "text" && amountNum < 40) {
      toast.error("Text message minimum is ₹40");
      return;
    }

    setIsProcessing(true);

    try {
      let voiceMessageUrl = null;

      // Upload voice message if present
      if (donationType === "voice" && audioBlob) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(audioBlob);
        const voiceData = await base64Promise;

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
          'upload-voice-message-direct',
          { body: { voiceData, streamerSlug: 'notyourkween' } }
        );

        if (uploadError) throw uploadError;
        voiceMessageUrl = uploadData.voice_message_url;
      }

      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order-notyourkween',
        {
          body: {
            name: name.trim(),
            amount: amountNum,
            message: donationType === "text" ? message.trim() : null,
            voiceMessageUrl,
            isHyperemote: donationType === "hyperemote",
          },
        }
      );

      if (orderError) throw orderError;

      // Initialize Razorpay checkout
      const options = {
        key: "rzp_live_0BEYiUtkO7pjZo",
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "not your Kween",
        description: "Digital Engagement",
        handler: function () {
          navigate(`/status?order_id=${orderData.internalOrderId}&status=success`);
        },
        modal: {
          ondismiss: function () {
            navigate(`/status?order_id=${orderData.internalOrderId}&status=pending`);
          },
        },
        theme: { color: "#ec4899" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to process donation");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-purple-950 to-pink-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Crown className="w-10 h-10 text-pink-400" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">not your Kween</h1>
        </div>

        <div className="max-w-md mx-auto bg-gradient-to-br from-pink-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/30 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Donation Type Selector */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDonationType("text")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  donationType === "text"
                    ? "border-pink-400 bg-pink-500/20"
                    : "border-pink-700/30 bg-pink-900/20 hover:border-pink-600"
                }`}
              >
                <div className="text-2xl mb-2">💬</div>
                <div className="text-sm font-semibold text-pink-100">Text</div>
                <div className="text-xs text-pink-300">₹40+</div>
              </button>

              <button
                type="button"
                onClick={() => setDonationType("voice")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  donationType === "voice"
                    ? "border-pink-400 bg-pink-500/20"
                    : "border-pink-700/30 bg-pink-900/20 hover:border-pink-600"
                }`}
              >
                <div className="text-2xl mb-2">🎤</div>
                <div className="text-sm font-semibold text-pink-100">Voice</div>
                <div className="text-xs text-pink-300">₹150+</div>
              </button>

              <button
                type="button"
                onClick={() => setDonationType("hyperemote")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  donationType === "hyperemote"
                    ? "border-pink-400 bg-pink-500/20"
                    : "border-pink-700/30 bg-pink-900/20 hover:border-pink-600"
                }`}
              >
                <div className="text-2xl mb-2">👑</div>
                <div className="text-sm font-semibold text-pink-100">Hyperemote</div>
                <div className="text-xs text-pink-300">₹50+</div>
              </button>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-pink-200">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="bg-pink-950/50 border-pink-500/30 text-white placeholder:text-pink-400/50 focus:border-pink-400"
                maxLength={100}
                required
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-pink-200">
                Amount (₹)
                {donationType === "text" && " - Min ₹40"}
                {donationType === "voice" && " - Min ₹150"}
                {donationType === "hyperemote" && " - Min ₹50"}
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-pink-950/50 border-pink-500/30 text-white placeholder:text-pink-400/50 focus:border-pink-400"
                min={donationType === "hyperemote" ? 50 : donationType === "voice" ? 150 : 40}
                required
              />
            </div>

            {/* Text Message */}
            {donationType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="message" className="text-pink-200">
                  Your Message ({message.length}/{getCharacterLimit()})
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, getCharacterLimit()))}
                  placeholder="Enter your message..."
                  className="bg-pink-950/50 border-pink-500/30 text-white placeholder:text-pink-400/50 focus:border-pink-400 min-h-[100px]"
                />
              </div>
            )}

            {/* Voice Recorder */}
            {donationType === "voice" && amount && parseFloat(amount) >= 150 && (
              <div className="space-y-2">
                <Label className="text-pink-200">Voice Message ({getVoiceDuration()}s max)</Label>
                <SimpleVoiceRecorder
                  onVoiceRecorded={setAudioBlob}
                />
              </div>
            )}

            {/* Hyperemote Info */}
            {donationType === "hyperemote" && (
              <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                <p className="text-sm text-pink-200 text-center">
                  👑 Trigger a spectacular celebration effect on stream!
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isProcessing || (donationType === "voice" && !audioBlob)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
            >
              {isProcessing ? "Processing..." : "Proceed to Payment"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotYourKween;
