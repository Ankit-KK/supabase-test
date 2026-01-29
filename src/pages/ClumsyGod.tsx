import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import MediaUploader from "@/components/MediaUploader";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import DonationPageFooter from "@/components/DonationPageFooter";

const ClumsyGod = () => {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    message: "",
  });
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [donationType, setDonationType] = useState<"text" | "voice" | "hypersound" | "media">("text");
  const [selectedHypersound, setSelectedHypersound] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const navigate = useNavigate();

  const { pricing } = useStreamerPricing('clumsy_god', selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === "INR") {
      if (amount >= 500) return 30;
      if (amount >= 250) return 25;
      if (amount >= 150) return 15;
      return 15;
    }
    if (amount >= 6) return 30;
    if (amount >= 3) return 25;
    return 15;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment system is still loading. Please wait.");
      return;
    }

    if (!formData.name || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const minAmount =
      donationType === "voice"
        ? pricing.minVoice
        : donationType === "hypersound"
          ? pricing.minHypersound
          : donationType === "media"
            ? pricing.minMedia
            : pricing.minText;
    if (amount < minAmount) {
      toast.error(`Minimum amount for ${donationType} is ${currencySymbol}${minAmount}`);
      return;
    }

    if (donationType === "voice" && !voiceRecorder.audioBlob) {
      toast.error("Please record a voice message");
      return;
    }

    if (donationType === "hypersound" && !selectedHypersound) {
      toast.error("Please select a sound");
      return;
    }

    if (donationType === "media" && !mediaUrl) {
      toast.error("Please upload a media file");
      return;
    }

    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl: string | null = null;
      if (donationType === "voice" && voiceRecorder.audioBlob) {
        if (!voiceRecorder.audioBlob || voiceRecorder.audioBlob.size === 0) {
          throw new Error("No voice recording found. Please record your message again.");
        }

        const voiceDataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(",")) {
              reject(new Error("Failed to read voice data"));
              return;
            }
            resolve(result.split(",")[1]);
          };
          reader.onerror = () => reject(new Error("Failed to read voice recording"));
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
          "upload-voice-message-direct",
          {
            body: {
              voiceData: voiceDataBase64,
              streamerSlug: "clumsy_god",
            },
          },
        );

        if (uploadError) {
          throw new Error("Failed to upload voice message");
        }

        voiceMessageUrl = uploadResult.voice_message_url;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: {
          streamer_slug: 'clumsy_god',
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: donationType === "text" ? formData.message : null,
          voiceMessageUrl: voiceMessageUrl,
          hypersoundUrl: donationType === "hypersound" ? selectedHypersound : null,
          mediaUrl: donationType === "media" ? mediaUrl : null,
          mediaType: donationType === "media" ? mediaType : null,
          currency: selectedCurrency,
        },
      });

      if (error) throw error;

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: "Clumsy God",
        description: "Support Clumsy God",
        handler: function (response: any) {
          navigate(`/status?order_id=${data.orderId}&status=success`);
        },
        modal: {
          ondismiss: function () {
            navigate(`/status?order_id=${data.orderId}&status=pending`);
          },
        },
        theme: {
          color: "#10b981",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDonationTypeChange = (value: "text" | "voice" | "hypersound" | "media") => {
    setDonationType(value);
    if (value === "hypersound") {
      setFormData((prev) => ({ ...prev, amount: String(pricing.minHypersound), message: "" }));
    } else if (value === "voice") {
      setFormData((prev) => ({ ...prev, amount: String(pricing.minVoice), message: "" }));
    } else if (value === "media") {
      setFormData((prev) => ({ ...prev, amount: String(pricing.minMedia), message: "" }));
      setMediaUrl(null);
      setMediaType(null);
    } else {
      setFormData((prev) => ({ ...prev, amount: String(pricing.minText), message: "" }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
      <div className="absolute inset-0 bg-black/20"></div>

      <Card className="w-full max-w-sm mx-auto bg-card/95 backdrop-blur-sm border-emerald-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-600/10 to-teal-500/10 opacity-50 blur-xl"></div>

        <CardHeader className="text-center relative z-10 pb-2">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl bg-emerald-500/20 flex items-center justify-center">
              <span className="text-4xl">🎮</span>
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Clumsy God
          </CardTitle>
          <p className="text-muted-foreground text-xs">Support Clumsy God with your donation</p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-emerald-400">
                Your Name *
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-emerald-400">Choose your donation type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["text", "voice", "hypersound", "media"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDonationTypeChange(type)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      donationType === type
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-emerald-500/30 hover:border-emerald-500/50"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-sm mb-0.5">
                        {type === "text" ? "💬" : type === "voice" ? "🎤" : type === "hypersound" ? "🔊" : "🖼️"}
                      </div>
                      <div className="font-medium text-[10px] capitalize">{type === "hypersound" ? "Sound" : type}</div>
                      <div className="text-[9px] text-muted-foreground">
                        Min: {currencySymbol}
                        {type === "text" ? pricing.minText : type === "voice" ? pricing.minVoice : type === "hypersound" ? pricing.minHypersound : pricing.minMedia}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-emerald-400">
                Amount *
              </label>
              <div className="flex gap-2">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="w-[100px] justify-between border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      {currencySymbol} {selectedCurrency}
                      <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search currency..." />
                      <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <CommandItem
                              key={currency.code}
                              value={currency.code}
                              onSelect={(value) => {
                                setSelectedCurrency(value.toUpperCase());
                                setCurrencyOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCurrency === currency.code ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {currency.symbol} {currency.code} - {currency.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="flex-1 border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                  required
                  min="1"
                />
              </div>
              {pricing.ttsEnabled && (
                <p className="text-xs text-muted-foreground">
                  TTS above {currencySymbol}{pricing.minTts}
                </p>
              )}
            </div>

            {donationType === "text" && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-emerald-400">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Write your message..."
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full min-h-[80px] rounded-md border border-emerald-500/30 bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">{formData.message.length}/200</p>
              </div>
            )}

            {donationType === "voice" && (
              <EnhancedVoiceRecorder
                onRecordingComplete={() => {}}
                maxDurationSeconds={getVoiceDuration(currentAmount)}
                controller={voiceRecorder}
                requiredAmount={pricing.minVoice}
                currentAmount={currentAmount}
                brandColor="#10b981"
              />
            )}

            {donationType === "hypersound" && (
              <HyperSoundSelector
                selectedSound={selectedHypersound}
                onSoundSelect={setSelectedHypersound}
              />
            )}

            {donationType === "media" && (
              <MediaUploader
                onMediaUploaded={(url, type) => {
                  setMediaUrl(url);
                  setMediaType(type);
                }}
                onMediaRemoved={() => {
                  setMediaUrl(null);
                  setMediaType(null);
                }}
                streamerSlug="clumsy_god"
              />
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? "Processing..." : `Donate ${currencySymbol}${formData.amount || "0"}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DonationPageFooter />
    </div>
  );
};

export default ClumsyGod;
