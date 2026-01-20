import { useState, useEffect } from "react";
import { Sparkles, Check, ChevronsUpDown } from "lucide-react";
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
import jhanvooBanner from "@/assets/jhanvoo-banner.jpg";
import jhanvooLogo from "@/assets/jhanvoo-logo.jpg";
import DonationPageFooter from "@/components/DonationPageFooter";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Jhanvoo = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [donationType, setDonationType] = useState<"text" | "voice" | "hypersound">("text");
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
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
    script.onload = () => {
      setRazorpayLoaded(true);
      console.log('Razorpay SDK loaded');
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!razorpayLoaded || !window.Razorpay) {
      toast({
        title: "Please Wait",
        description: "Payment system is still loading",
        variant: "destructive",
      });
      return;
    }

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
      let voiceMessageUrl: string | null = null;

      if (donationType === "voice" && voiceRecorder.audioBlob) {
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
            currency: currency,
            message: donationType === "text" ? message.trim() : null,
            voiceMessageUrl: voiceMessageUrl,
            hypersoundUrl: donationType === "hypersound" ? selectedSound : null,
          }
        }
      );

      if (orderError) throw orderError;
      if (!orderData) throw new Error("No order data received");

      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Jhanvoo",
        description: "Support Jhanvoo",
        order_id: orderData.razorpay_order_id,
        handler: (response: any) => {
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
        className="max-w-sm w-full bg-black/40 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-indigo-500/20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${jhanvooLogo})` }}
      >
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Jhanvoo</h1>
          <p className="text-gray-100 text-center text-xs">
            Support with your interaction
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-2 border-indigo-400 shadow-lg shadow-indigo-500/50 h-auto' 
                  : 'border-2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/60 hover:border-indigo-400/60 bg-indigo-950/20 h-auto'}
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
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-2 border-indigo-400 shadow-lg shadow-indigo-500/50 h-auto' 
                  : 'border-2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/60 hover:border-indigo-400/60 bg-indigo-950/20 h-auto'}
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
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-2 border-indigo-400 shadow-lg shadow-indigo-500/50 h-auto' 
                  : 'border-2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/60 hover:border-indigo-400/60 bg-indigo-950/20 h-auto'}
              >
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <span className="text-2xl">🔊</span>
                  <span className="text-xs font-semibold">Sound</span>
                  <span className="text-[10px] opacity-80 font-medium">{currencySymbol}{minimums.minHypersound}+</span>
                </div>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-100">Amount</Label>
            <div className="flex gap-2">
              <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={currencyOpen}
                    className="w-[100px] justify-between bg-white/10 border-indigo-500/30 text-white hover:bg-white/20"
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
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-white/10 border-indigo-500/30 text-white placeholder:text-gray-400"
                min={donationType === 'text' ? minimums.minText : donationType === 'voice' ? minimums.minVoice : minimums.minHypersound}
                step="1"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">TTS above {currencySymbol}{currency === 'INR' ? '70' : '1'}</p>
          </div>

          {donationType === "text" && (
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
              <Label className="text-gray-100">Record Voice Message ({maxVoiceDuration}s max)</Label>
              <EnhancedVoiceRecorder
                onRecordingComplete={() => {}}
                maxDurationSeconds={maxVoiceDuration}
                controller={voiceRecorder}
                requiredAmount={minimums.minVoice}
                currentAmount={parseFloat(amount) || 0}
                brandColor="#6366f1"
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
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 rounded-xl shadow-lg"
            disabled={isProcessing}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isProcessing ? "Processing..." : `Pay ${currencySymbol}${amount || "0"}`}
          </Button>
          <DonationPageFooter brandColor="#6366f1" />
        </form>
      </div>
    </div>
  );
};

export default Jhanvoo;
