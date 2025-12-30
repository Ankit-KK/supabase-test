import { useState, useEffect } from "react";
import { Flame, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, getCurrencyMinimums, getCurrencyByCode } from "@/constants/currencies";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const ABdevil = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [donationType, setDonationType] = useState<"text" | "voice" | "hypersound">("text");
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const minimums = getCurrencyMinimums(currency);
  const currencyData = getCurrencyByCode(currency);
  const currencySymbol = currencyData?.symbol || currency;

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

    if (donationType === "hypersound" && amountNum < minimums.minHypersound) {
      toast({
        title: "Invalid Amount",
        description: `Minimum ${currencySymbol}${minimums.minHypersound} required for HyperSounds`,
        variant: "destructive",
      });
      return;
    }

    if (donationType === "voice" && amountNum < minimums.minVoice) {
      toast({
        title: "Invalid Amount",
        description: `Minimum ${currencySymbol}${minimums.minVoice} required for voice messages`,
        variant: "destructive",
      });
      return;
    }

    if (donationType === "text" && amountNum < minimums.minText) {
      toast({
        title: "Invalid Amount",
        description: `Minimum ${currencySymbol}${minimums.minText} required for text messages`,
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

    if (donationType === "hypersound" && !selectedSound) {
      toast({
        title: "Sound Required",
        description: "Please select a sound",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      let voiceMessageUrl = null;

      if (donationType === "voice" && voiceRecorder.audioBlob) {
        const voiceDataBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(",")[1]);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
          "upload-voice-message-direct",
          {
            body: {
              voiceData: voiceDataBase64,
              streamerSlug: "abdevil",
            },
          },
        );
        if (uploadError) {
          console.error("Voice upload error:", uploadError);
          throw new Error("Failed to upload voice message");
        }
        voiceMessageUrl = uploadResult.voice_message_url;
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke("create-razorpay-order-abdevil", {
        body: {
          amount: amountNum,
          currency: currency,
          name: name.trim(),
          message: donationType === "text" ? message.trim() : null,
          voiceMessageUrl,
          hypersoundUrl: donationType === "hypersound" ? selectedSound : null,
        },
      });

      if (orderError) throw orderError;

      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ABdevil",
        description: "Support ABdevil",
        order_id: orderData.razorpay_order_id,
        handler: function (response: any) {
          navigate(`/status?order_id=${orderData.orderId}&status=success&payment_id=${response.razorpay_payment_id}`);
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
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/lovable-uploads/abdevil-banner.jpg')" }}
    >
      <div className="w-full max-w-sm rounded-2xl shadow-2xl border border-orange-500/30 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/lovable-uploads/abdevil-logo.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative z-10 p-4 sm:p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">ABdevil</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-100">
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

            <div className="space-y-3">
              <Label className="text-gray-100 font-bold text-sm uppercase tracking-wide block text-center">
                Choose Your Interaction
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  onClick={() => { setDonationType('text'); setAmount(String(minimums.minText)); }}
                  variant={donationType === 'text' ? 'default' : 'outline'}
                  className={donationType === 'text' 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-2 border-orange-400 shadow-lg shadow-orange-500/50 h-auto' 
                    : 'border-2 border-orange-500/40 text-orange-300 hover:bg-orange-950/60 hover:border-orange-400/60 bg-orange-950/20 h-auto'}
                >
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <span className="text-2xl">💬</span>
                    <span className="text-xs font-semibold">Text</span>
                    <span className="text-[10px] opacity-80 font-medium">{currencySymbol}{minimums.minText}+</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  onClick={() => { setDonationType('voice'); setAmount(String(minimums.minVoice)); }}
                  variant={donationType === 'voice' ? 'default' : 'outline'}
                  className={donationType === 'voice' 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-2 border-orange-400 shadow-lg shadow-orange-500/50 h-auto' 
                    : 'border-2 border-orange-500/40 text-orange-300 hover:bg-orange-950/60 hover:border-orange-400/60 bg-orange-950/20 h-auto'}
                >
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <span className="text-2xl">🎤</span>
                    <span className="text-xs font-semibold">Voice</span>
                    <span className="text-[10px] opacity-80 font-medium">{currencySymbol}{minimums.minVoice}+</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  onClick={() => { setDonationType('hypersound'); setAmount(String(minimums.minHypersound)); }}
                  variant={donationType === 'hypersound' ? 'default' : 'outline'}
                  className={donationType === 'hypersound' 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-2 border-orange-400 shadow-lg shadow-orange-500/50 h-auto' 
                    : 'border-2 border-orange-500/40 text-orange-300 hover:bg-orange-950/60 hover:border-orange-400/60 bg-orange-950/20 h-auto'}
                >
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <span className="text-2xl">🔊</span>
                    <span className="text-xs font-semibold">Sound</span>
                    <span className="text-[10px] opacity-80 font-medium">{currencySymbol}{minimums.minHypersound}+</span>
                  </div>
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="amount" className="text-gray-100">Amount</Label>
              <div className="flex gap-2">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="w-[100px] justify-between bg-black/30 border-orange-500/30 text-white hover:bg-black/50"
                    >
                      {currencySymbol} {currency}
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
                              onSelect={(value) => {
                                setCurrency(value.toUpperCase());
                                setCurrencyOpen(false);
                                const newMins = getCurrencyMinimums(value.toUpperCase());
                                if (donationType === 'text') setAmount(String(newMins.minText));
                                else if (donationType === 'voice') setAmount(String(newMins.minVoice));
                                else setAmount(String(newMins.minHypersound));
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", currency === curr.code ? "opacity-100" : "opacity-0")} />
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
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="flex-1 bg-black/30 border-orange-500/30 text-white placeholder:text-gray-400 focus:border-orange-500"
                  min={donationType === 'text' ? minimums.minText : donationType === 'voice' ? minimums.minVoice : minimums.minHypersound}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">TTS above {currencySymbol}{currency === 'INR' ? '70' : '1'}</p>
            </div>

            {donationType === "text" && (
              <div>
                <Label htmlFor="message" className="text-gray-100">Your Message</Label>
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
                <Label className="text-gray-100">Record Voice Message ({maxVoiceDuration}s max)</Label>
                <EnhancedVoiceRecorder
                  onRecordingComplete={() => {}}
                  maxDurationSeconds={maxVoiceDuration}
                  controller={voiceRecorder}
                  requiredAmount={minimums.minVoice}
                  currentAmount={parseFloat(amount) || 0}
                  brandColor="#f97316"
                />
              </div>
            )}

            {donationType === "hypersound" && (
              <HyperSoundSelector
                selectedSound={selectedSound}
                onSoundSelect={setSelectedSound}
              />
            )}

            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : `Pay ${currencySymbol}${amount || "0"}`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ABdevil;
