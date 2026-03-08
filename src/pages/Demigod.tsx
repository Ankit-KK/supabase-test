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

const Demigod = () => {
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

  const { pricing } = useStreamerPricing("demigod", selectedCurrency);
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
          body: { voiceData: base64, streamerSlug: "demigod" },
        });

        if (error) throw error;
        voiceMessageUrl = data.voice_message_url;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: {
          streamer_slug: "demigod",
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
        name: "Demigod",
        description: "Support Demigod",
        handler: () => navigate(`/status?order_id=${data.orderId}&status=success`),
        modal: {
          ondismiss: () => navigate(`/status?order_id=${data.orderId}&status=pending`),
        },
        theme: { color: "#ac1117" },
      }).open();
    } catch {
      toast.error("Payment failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1a1520] via-[#2a2035] to-[#1a1520]">
      <Card className="w-full max-w-sm backdrop-blur-sm border-[#ac1117]/40 shadow-[0_0_30px_rgba(172,17,23,0.2)] relative overflow-hidden bg-gradient-to-br from-[#1e1a2a] to-[#2a2540]">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

        <CardHeader className="text-center relative z-10 pb-2 flex flex-col items-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#d43a3a] to-[#ac1117] bg-clip-text text-transparent tracking-wider">
            Demigod
          </CardTitle>
          <p className="text-xs text-gray-400">Support Demigod with your donation</p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <div className="space-y-2">
            <Label className="text-[#d43a3a]">Your Name *</Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-black/40 text-white placeholder:text-gray-400 border-[#ac1117]/30 focus:border-[#d43a3a] focus:ring-[#d43a3a]/20"
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {(["text", "voice", "hypersound", "media"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleDonationTypeChange(type)}
                className={`p-2 rounded-lg border-2 transition-all ${
                  donationType === type
                    ? "border-[#a78bfa] bg-[#a78bfa]/10"
                    : "border-[#8b5cf6]/30 hover:border-[#8b5cf6]/50"
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

          <div className="space-y-2">
            <Label className="text-[#a78bfa]">Amount *</Label>
            <div className="flex gap-2">
              <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[100px] justify-between bg-black/40 text-white border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/10"
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
                className="bg-black/40 text-white placeholder:text-gray-400 border-[#8b5cf6]/30 focus:border-[#a78bfa] focus:ring-[#a78bfa]/20"
              />
            </div>

            {pricing.ttsEnabled && (
              <p className="text-xs text-[#a78bfa]">
                TTS above {currencySymbol}
                {pricing.minTts}
              </p>
            )}
          </div>

          {donationType === "text" && (
            <div className="space-y-1">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                maxLength={maxMessageLength}
                className="w-full min-h-[90px] rounded-md bg-black/40 text-white placeholder:text-gray-400 border border-[#8b5cf6]/30 focus:border-[#a78bfa] focus:ring-[#a78bfa]/20 px-3 py-2 text-sm"
                placeholder="Your message (optional)"
              />
              <p className="text-xs text-right text-muted-foreground">
                {formData.message.length}/{maxMessageLength}
              </p>
            </div>
          )}

          {donationType === "voice" && (
            <EnhancedVoiceRecorder
              controller={voiceRecorder}
              onRecordingComplete={() => {}}
              maxDurationSeconds={getVoiceDuration(currentAmount)}
              requiredAmount={pricing.minVoice}
              currentAmount={currentAmount}
              brandColor="#8b5cf6"
            />
          )}

          {donationType === "hypersound" && (
            <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
          )}

          {donationType === "media" && (
            <MediaUploader
              streamerSlug="demigod"
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

          <Button
            className="w-full font-semibold py-6 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
            onClick={handleSubmit}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? "Processing..." : `Support ${currencySymbol}${formData.amount || "0"}`}
          </Button>

          <DonationPageFooter brandColor="#8b5cf6" />
        </CardContent>
      </Card>
    </div>
  );
};

export default Demigod;
