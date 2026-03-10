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
import DonationPageFooter from "@/components/DonationPageFooter";
import RewardsBanner from "@/components/RewardsBanner";

const Brigzard = () => {
  const navigate = useNavigate();

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

  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { pricing } = useStreamerPricing("brigzard", selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const currentAmount = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === "INR") {
      if (amount >= 500) return 15;
      if (amount >= 300) return 12;
      return 8;
    }
    if (amount >= 6) return 15;
    if (amount >= 4) return 12;
    return 8;
  };

  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast.error("Failed to load payment gateway");
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

  const handleDonationTypeChange = (value: "text" | "voice" | "hypersound" | "media") => {
    setDonationType(value);

    const amount =
      value === "voice"
        ? pricing.minVoice
        : value === "hypersound"
          ? pricing.minHypersound
          : value === "media"
            ? pricing.minMedia
            : pricing.minText;

    setFormData({ name: formData.name, amount: String(amount), message: "" });
    setSelectedHypersound(null);
    setMediaUrl(null);
    setMediaType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment system is still loading");
      return;
    }

    const amount = Number(formData.amount);
    if (!formData.name || !amount || amount <= 0) {
      toast.error("Enter valid name and amount");
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
      toast.error(`Minimum for ${donationType} is ${currencySymbol}${minAmount}`);
      return;
    }

    if (donationType === "voice" && !voiceRecorder.audioBlob) {
      toast.error("Please record a voice message");
      return;
    }

    if (donationType === "hypersound" && !selectedHypersound) {
      toast.error("Select a sound");
      return;
    }

    if (donationType === "media" && !mediaUrl) {
      toast.error("Upload a media file");
      return;
    }

    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl: string | null = null;

      if (donationType === "voice" && voiceRecorder.audioBlob) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        const { data, error } = await supabase.functions.invoke("upload-voice-message-direct", {
          body: { voiceData: base64, streamerSlug: "brigzard" },
        });

        if (error) throw error;
        voiceMessageUrl = data.voice_message_url;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: {
          streamer_slug: "brigzard",
          name: formData.name,
          amount: Number(formData.amount),
          message: donationType === "text" ? formData.message : null,
          voiceMessageUrl,
          hypersoundUrl: donationType === "hypersound" ? selectedHypersound : null,
          mediaUrl: donationType === "media" ? mediaUrl : null,
          mediaType,
          currency: selectedCurrency,
        },
      });

      if (error) throw error;

      new (window as any).Razorpay({
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: "BRIGZARD",
        description: "Support BRIGZARD",
        handler: () => navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`),
        modal: {
          ondismiss: () => navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`),
        },
        theme: { color: "#4a5c3e" },
      }).open();
    } catch {
      toast.error("Payment failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1a2016] via-[#2a3425] to-[#1a1f17]">
      <Card className="w-full max-w-sm backdrop-blur-sm border-[#4a5c3e]/40 shadow-[0_0_30px_rgba(74,92,62,0.2)] relative overflow-hidden bg-gradient-to-br from-[#1a2016] to-[#2a3425]">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

        <CardHeader className="text-center relative z-10 pb-2 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#c4a747] shadow-xl mb-3 bg-[#2a3425] flex items-center justify-center">
            <span className="text-3xl font-black text-[#c4a747]">B</span>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#c4a747] to-[#8a7a3a] bg-clip-text text-transparent tracking-wider">
            BRIGZARD
          </CardTitle>
          <p className="text-xs text-gray-400">Support BRIGZARD with your donation</p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          {/* NAME */}
          <div className="space-y-2">
            <Label className="text-[#c4a747]">Your Name *</Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-black/40 text-white placeholder:text-gray-400 border-[#4a5c3e]/30 focus:border-[#c4a747] focus:ring-[#c4a747]/20"
            />
          </div>

          {/* DONATION TYPE */}
          <div className="grid grid-cols-4 gap-1.5">
            {(["text", "voice", "hypersound", "media"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleDonationTypeChange(type)}
                className={`p-2 rounded-lg border-2 transition-all ${
                  donationType === type
                    ? "border-[#c4a747] bg-[#c4a747]/10"
                    : "border-[#4a5c3e]/30 hover:border-[#4a5c3e]/50"
                }`}
              >
                <div className="text-center">
                  <div className="text-sm mb-0.5">
                    {type === "text" ? "💬" : type === "voice" ? "🎤" : type === "hypersound" ? "🔊" : "🖼️"}
                  </div>
                  <div className="font-medium text-[10px] capitalize">{type === "hypersound" ? "Sound" : type}</div>
                  <div className="text-[9px] text-muted-foreground">
                    Min: {currencySymbol}
                    {type === "text"
                      ? pricing.minText
                      : type === "voice"
                        ? pricing.minVoice
                        : type === "hypersound"
                          ? pricing.minHypersound
                          : pricing.minMedia}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* AMOUNT */}
          <div className="space-y-2">
            <Label className="text-[#c4a747]">Amount *</Label>
            <div className="flex gap-2">
              <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[100px] justify-between bg-black/40 text-white border-[#4a5c3e]/30 hover:bg-[#4a5c3e]/10"
                  >
                    {currencySymbol} {selectedCurrency}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search currency..." />
                    <CommandList>
                      <CommandEmpty>No currency found.</CommandEmpty>
                      <CommandGroup>
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={c.code}
                            onSelect={() => {
                              setSelectedCurrency(c.code);
                              setCurrencyOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedCurrency === c.code ? "opacity-100" : "opacity-0")} />
                            {c.symbol} {c.code}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Input
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                readOnly={donationType === "hypersound"}
                className={`bg-black/40 text-white placeholder:text-gray-400 border-[#4a5c3e]/30 focus:border-[#c4a747] focus:ring-[#c4a747]/20 ${donationType === "hypersound" ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            </div>

            {pricing.ttsEnabled && (
              <p className="text-xs text-[#c4a747]">
                TTS above {currencySymbol}
                {pricing.minTts}
              </p>
            )}
          </div>

          {/* TEXT */}
          {donationType === "text" && (
            <div className="space-y-1">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                maxLength={maxMessageLength}
                className="w-full min-h-[90px] rounded-md bg-black/40 text-white placeholder:text-gray-400 border border-[#4a5c3e]/30 focus:border-[#c4a747] focus:ring-[#c4a747]/20 px-3 py-2 text-sm"
                placeholder="Your message (optional)"
              />
              <p className="text-xs text-right text-muted-foreground">
                {formData.message.length}/{maxMessageLength}
              </p>
            </div>
          )}

          {/* VOICE */}
          {donationType === "voice" && (
            <EnhancedVoiceRecorder
              controller={voiceRecorder}
              onRecordingComplete={() => {}}
              maxDurationSeconds={getVoiceDuration(currentAmount)}
              requiredAmount={pricing.minVoice}
              currentAmount={currentAmount}
              brandColor="#4a5c3e"
            />
          )}

          {/* HYPERSOUND */}
          {donationType === "hypersound" && (
            <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
          )}

          {/* MEDIA */}
          {donationType === "media" && (
            <MediaUploader
              streamerSlug="brigzard"
              onMediaUploaded={(url, type) => {
                setMediaUrl(url);
                setMediaType(type);
              }}
              onMediaRemoved={() => {
                setMediaUrl(null);
                setMediaType(null);
              }}
            />
          )}

          <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency} />

          <Button
            className="w-full font-semibold py-6 bg-[#4a5c3e] hover:bg-[#3a4c2e] text-[#c4a747]"
            onClick={handleSubmit}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? "Processing..." : `Support ${currencySymbol}${formData.amount || "0"}`}
          </Button>

          <DonationPageFooter brandColor="#4a5c3e" />
        </CardContent>
      </Card>
    </div>
  );
};

export default Brigzard;
