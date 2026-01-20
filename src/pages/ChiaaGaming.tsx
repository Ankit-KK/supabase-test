import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { SUPPORTED_CURRENCIES, getCurrencyMinimums, getCurrencySymbol } from "@/constants/currencies";
import DonationPageFooter from "@/components/DonationPageFooter";

// Use existing ChiaaGaming background
const chiaaBackground = "/lovable-uploads/b3a1671f-4c8f-4220-a29f-774bb7851737.png";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const ChiaGaming = () => {
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
  const [mediaType, setMediaType] = useState<"image" | "gif" | "video" | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const navigate = useNavigate();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const minimums = getCurrencyMinimums(selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);
  const brandColor = "#ec4899";

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
        ? minimums.minVoice
        : donationType === "hypersound"
          ? minimums.minHypersound
          : donationType === "media"
            ? minimums.minMedia
            : minimums.minText;
    if (amount < minAmount) {
      toast.error(`Minimum amount for ${donationType} is ${currencySymbol}${minAmount}`);
      return;
    }

    if (donationType === "media" && !mediaUrl) {
      toast.error("Please upload a media file");
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

    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl: string | null = null;
      if (donationType === "voice" && voiceRecorder.audioBlob) {
        console.log("Uploading voice message before payment...", {
          blobSize: voiceRecorder.audioBlob.size,
          blobType: voiceRecorder.audioBlob.type,
        });

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
            const base64 = result.split(",")[1];
            console.log("Voice data converted to base64, length:", base64.length);
            resolve(base64);
          };

          reader.onerror = () => {
            reject(new Error("Failed to read voice recording"));
          };

          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
          "upload-voice-message-direct",
          {
            body: {
              voiceData: voiceDataBase64,
              streamerSlug: "chiaa_gaming",
            },
          },
        );

        if (uploadError) {
          console.error("Voice upload error:", uploadError);
          throw new Error("Failed to upload voice message");
        }

        voiceMessageUrl = uploadResult.voice_message_url;
        console.log("Voice message uploaded successfully:", voiceMessageUrl);
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order-chiagaming", {
        body: {
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
        name: "Chiaa Gaming",
        description: "Support Chiaa Gaming",
        handler: function (response: any) {
          console.log("Payment successful:", response);
          navigate(`/status?order_id=${data.orderId}&status=success`);
        },
        modal: {
          ondismiss: function () {
            console.log("Payment cancelled");
            navigate(`/status?order_id=${data.orderId}&status=pending`);
          },
        },
        theme: {
          color: brandColor,
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
      setFormData((prev) => ({ ...prev, amount: String(minimums.minHypersound), message: "" }));
    } else if (value === "voice") {
      setFormData((prev) => ({ ...prev, amount: String(minimums.minVoice), message: "" }));
    } else if (value === "media") {
      setFormData((prev) => ({ ...prev, amount: String(minimums.minMedia), message: "" }));
      setMediaUrl(null);
      setMediaType(null);
    } else {
      setFormData((prev) => ({ ...prev, amount: String(minimums.minText), message: "" }));
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${chiaaBackground})` }}
    >
      <div className="absolute inset-0 bg-black/60"></div>

      <Card
        className="w-full max-w-sm mx-auto bg-card/95 backdrop-blur-sm border-pink-500/20 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-pink-600/20 to-pink-400/20 opacity-50 blur-xl"></div>

        <CardHeader className="text-center relative z-10 pb-2">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-pink-500 shadow-xl">
              <img src={chiaaBackground} alt="Chiaa Gaming Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
            Chiaa Gaming
          </CardTitle>
          <p className="text-muted-foreground text-xs">Support Chiaa Gaming with your donation</p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-pink-500">
                Your Name *
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-pink-500/30 focus:border-pink-500 focus:ring-pink-500/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-pink-500">Choose your donation type</label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("text")}
                  className={`p-1.5 rounded-lg border-2 transition-all ${
                    donationType === "text"
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-pink-500/30 hover:border-pink-500/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">💬</div>
                    <div className="font-medium text-[9px]">Text</div>
                    <div className="text-[8px] text-muted-foreground">
                      {currencySymbol}{minimums.minText}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("voice")}
                  className={`p-1.5 rounded-lg border-2 transition-all ${
                    donationType === "voice"
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-pink-500/30 hover:border-pink-500/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🎤</div>
                    <div className="font-medium text-[9px]">Voice</div>
                    <div className="text-[8px] text-muted-foreground">
                      {currencySymbol}{minimums.minVoice}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("media")}
                  className={`p-1.5 rounded-lg border-2 transition-all ${
                    donationType === "media"
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-pink-500/30 hover:border-pink-500/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🖼️</div>
                    <div className="font-medium text-[9px]">Media</div>
                    <div className="text-[8px] text-muted-foreground">
                      {currencySymbol}{minimums.minMedia}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("hypersound")}
                  className={`p-1.5 rounded-lg border-2 transition-all ${
                    donationType === "hypersound"
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-pink-500/30 hover:border-pink-500/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🔊</div>
                    <div className="font-medium text-[9px]">Sound</div>
                    <div className="text-[8px] text-muted-foreground">
                      {currencySymbol}{minimums.minHypersound}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-pink-500">
                Amount *
              </label>
              <div className="flex gap-2">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="w-[100px] justify-between border-pink-500/30 hover:bg-pink-500/10"
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
                                const newCurrency = value.toUpperCase();
                                setSelectedCurrency(newCurrency);
                                setCurrencyOpen(false);
                                const newMins = getCurrencyMinimums(newCurrency);
                                if (donationType === "text")
                                  setFormData((prev) => ({ ...prev, amount: String(newMins.minText) }));
                                else if (donationType === "voice")
                                  setFormData((prev) => ({ ...prev, amount: String(newMins.minVoice) }));
                                else setFormData((prev) => ({ ...prev, amount: String(newMins.minHypersound) }));
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
                  className="flex-1 border-pink-500/30 focus:border-pink-500 focus:ring-pink-500/20"
                  required
                  min="1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                TTS available above {currencySymbol}
                {selectedCurrency === "INR" ? "70" : "1"}
              </p>
            </div>

            {donationType === "text" && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-pink-500">
                  Your Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-pink-500/30 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 bg-background text-foreground placeholder:text-muted-foreground"
                  rows={3}
                />
              </div>
            )}

            {donationType === "voice" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-pink-500">Voice Message *</label>
                <EnhancedVoiceRecorder
                  controller={voiceRecorder}
                  onRecordingComplete={(hasRecording, duration) => {
                    console.log("Recording complete:", hasRecording, duration);
                  }}
                  maxDurationSeconds={getVoiceDuration(currentAmount)}
                  brandColor={brandColor}
                  requiredAmount={minimums.minVoice}
                  currentAmount={currentAmount}
                />
              </div>
            )}

            {donationType === "hypersound" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-pink-500">Select a Sound</Label>
                <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
              </div>
            )}

            {donationType === "media" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-pink-500">Upload Media *</Label>
                <MediaUploader
                  streamerSlug="chiaa_gaming"
                  onMediaUploaded={(url, type) => {
                    setMediaUrl(url);
                    setMediaType(type);
                  }}
                  onMediaRemoved={() => {
                    setMediaUrl(null);
                    setMediaType(null);
                  }}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isProcessingPayment}
              className="w-full text-white font-medium py-3"
              style={{ backgroundColor: brandColor }}
            >
              {isProcessingPayment ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span>
                  Donate {currencySymbol}
                  {formData.amount || "0"}
                </span>
              )}
            </Button>
          </form>

          <DonationPageFooter brandColor={brandColor} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChiaGaming;
