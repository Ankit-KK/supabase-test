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
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import { getMaxMessageLength } from "@/utils/getMaxMessageLength";
import looteriyaLogo from "@/assets/looteriya-logo.jpg";
import looteriyaCardBg from "@/assets/looteriya-card-bg.jpg";
import looteriyaMainBanner from "@/assets/looteriya-main-banner.jpg";
import DonationPageFooter from "@/components/DonationPageFooter";
import RewardsBanner from "@/components/RewardsBanner";

const LooteriyaGaming = () => {
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

  // Fetch streamer-specific pricing
  const { pricing } = useStreamerPricing('looteriya_gaming', selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  // Tiered voice duration based on amount (INR): 150-299=8s, 300-499=12s, 500+=15s
  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === "INR") {
      if (amount >= 500) return 15;
      if (amount >= 300) return 12;
      return 8;
    }
    // For other currencies, use similar tiers (rough USD equivalents)
    if (amount >= 6) return 15;
    if (amount >= 4) return 12;
    return 8;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);
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

    // Text donations use minText - TTS is a bonus at higher amounts
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
              streamerSlug: "looteriya_gaming",
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

      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: {
          streamer_slug: 'looteriya_gaming',
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
        name: "Looteriya Gaming",
        description: "Support Looteriya Gaming",
        handler: function (response: any) {
          console.log("Payment successful:", response);
          navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`);
        },
        modal: {
          ondismiss: function () {
            console.log("Payment cancelled");
            navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`);
          },
        },
        theme: {
          color: "#f59e0b",
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
      // Text donations use minText - TTS is a bonus at higher amounts
      setFormData((prev) => ({ ...prev, amount: String(pricing.minText), message: "" }));
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${looteriyaMainBanner})` }}
    >
      <div className="absolute inset-0 bg-black/20"></div>

      <Card
        className="w-full max-w-sm mx-auto bg-card/95 backdrop-blur-sm border-amber-500/20 shadow-2xl relative overflow-hidden"
        style={{
          backgroundImage: `url(${looteriyaCardBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-400/20 opacity-50 blur-xl"></div>

        <CardHeader className="text-center relative z-10 pb-2">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-amber-500 shadow-xl">
              <img src={looteriyaLogo} alt="Looteriya Gaming Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            Looteriya Gaming
          </CardTitle>
          <p className="text-muted-foreground text-xs">Support Looteriya Gaming with your donation</p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-amber-500">
                Your Name *
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-500">Choose your donation type</label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("text")}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === "text"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-amber-500/30 hover:border-amber-500/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">💬</div>
                    <div className="font-medium text-[10px]">Text</div>
                    <div className="text-[9px] text-muted-foreground">
                      Min: {currencySymbol}
                      {pricing.minText}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("voice")}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === "voice"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-amber-500/30 hover:border-amber-500/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🎤</div>
                    <div className="font-medium text-[10px]">Voice</div>
                    <div className="text-[9px] text-muted-foreground">
                      Min: {currencySymbol}
                      {pricing.minVoice}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("hypersound")}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === "hypersound"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-amber-500/30 hover:border-amber-500/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🔊</div>
                    <div className="font-medium text-[10px]">Sound</div>
                    <div className="text-[9px] text-muted-foreground">
                      Min: {currencySymbol}
                      {pricing.minHypersound}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange("media")}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === "media"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-amber-500/30 hover:border-amber-500/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🖼️</div>
                    <div className="font-medium text-[10px]">Media</div>
                    <div className="text-[9px] text-muted-foreground">
                      Min: {currencySymbol}
                      {pricing.minMedia}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-amber-500">
                Amount *
              </label>
              <div className="flex gap-2">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="w-[100px] justify-between border-amber-500/30 hover:bg-amber-500/10"
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
                                // Amount will auto-update via the pricing hook when currency changes
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
                  readOnly={donationType === "hypersound"}
                  className={`flex-1 border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/20 ${donationType === "hypersound" ? "opacity-50 cursor-not-allowed" : ""}`}
                  required
                  min="1"
                />
              </div>
              {pricing.ttsEnabled && (
                <p className="text-xs text-muted-foreground">
                  TTS in Riya's Voice above {currencySymbol}{pricing.minTts}
                </p>
              )}
            </div>

            {donationType === "text" && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-amber-500">
                  Your Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  maxLength={maxMessageLength}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-amber-500/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-background text-foreground placeholder:text-muted-foreground"
                  rows={3}
                />
                <p className="text-xs text-right text-muted-foreground">
                  {formData.message.length}/{maxMessageLength}
                </p>
              </div>
            )}

            {donationType === "voice" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-500">Voice Message *</label>
                <EnhancedVoiceRecorder
                  controller={voiceRecorder}
                  onRecordingComplete={(hasRecording, duration) => {
                    console.log("Recording complete:", hasRecording, duration);
                  }}
                  maxDurationSeconds={getVoiceDuration(currentAmount)}
                  brandColor="#f59e0b"
                  requiredAmount={pricing.minVoice}
                  currentAmount={currentAmount}
                />
              </div>
            )}

            {donationType === "hypersound" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-500">Select a Sound</Label>
                <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
              </div>
            )}

            {donationType === "media" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-500">Upload Media</Label>
                <MediaUploader
                  streamerSlug="looteriya_gaming"
                  onMediaUploaded={(url, type) => {
                    setMediaUrl(url);
                    setMediaType(type);
                  }}
                  onMediaRemoved={() => {
                    setMediaUrl(null);
                    setMediaType(null);
                  }}
                  maxFileSizeMB={10}
                  maxVideoDurationSeconds={15}
                />
              </div>
            )}

            <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency} />

            <Button
              type="submit"
              className="w-full font-semibold py-6"
              style={{ backgroundColor: "#f59e0b" }}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? "Processing..." : `Support with ${currencySymbol}${formData.amount || "0"}`}
            </Button>
          </form>
          <DonationPageFooter brandColor="#f59e0b" />
        </CardContent>
      </Card>
    </div>
  );
};

export default LooteriyaGaming;
