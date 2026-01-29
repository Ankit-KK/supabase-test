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
import DonationPageFooter from "@/components/DonationPageFooter";

const ClumsyGod = () => {
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

  const { pricing } = useStreamerPricing("clumsy_god", selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  const currentAmount = parseFloat(formData.amount) || 0;

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === "INR") {
      if (amount >= 500) return 30;
      if (amount >= 250) return 25;
      return 15;
    }
    if (amount >= 6) return 30;
    if (amount >= 3) return 25;
    return 15;
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
          body: { voiceData: base64, streamerSlug: "clumsy_god" },
        });

        if (error) throw error;
        voiceMessageUrl = data.voice_message_url;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: {
          streamer_slug: "clumsy_god",
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
        name: "Clumsy God",
        description: "Support Clumsy God",
        handler: () => navigate(`/status?order_id=${data.orderId}&status=success`),
        modal: {
          ondismiss: () => navigate(`/status?order_id=${data.orderId}&status=pending`),
        },
        theme: { color: "#a855f7" },
      }).open();
    } catch {
      toast.error("Payment failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-950 via-violet-900 to-indigo-900">
      <div className="absolute inset-0 bg-black/40" />

      <Card className="w-full max-w-sm bg-card/90 backdrop-blur-sm border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-indigo-500/20 blur-xl opacity-50" />

        <CardHeader className="text-center relative z-10 pb-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            Clumsy God
          </CardTitle>
          <p className="text-xs text-muted-foreground">Support Clumsy God with your donation</p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          {/* NAME */}
          <div className="space-y-2">
            <Label className="text-purple-300">Your Name *</Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-black/40 text-white placeholder:text-gray-400
                         border-purple-500/30
                         focus:border-purple-500 focus:ring-purple-500/20"
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
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-purple-500/30 hover:border-purple-500/50"
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
            <Label className="text-purple-300">Amount *</Label>
            <div className="flex gap-2">
              <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[100px] justify-between
                               bg-black/40 text-white
                               border-purple-500/30
                               hover:bg-purple-500/10"
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
                            <Check
                              className={cn("mr-2 h-4 w-4", selectedCurrency === c.code ? "opacity-100" : "opacity-0")}
                            />
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
                className="bg-black/40 text-white placeholder:text-gray-400
                           border-purple-500/30
                           focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>

            {/* TTS INFO (FROM BACKEND) */}
            {pricing.ttsEnabled && (
              <p className="text-xs text-purple-300">
                TTS above {currencySymbol}
                {pricing.minTts}
              </p>
            )}
          </div>

          {/* TEXT */}
          {donationType === "text" && (
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              className="w-full min-h-[90px] rounded-md
                         bg-black/40 text-white placeholder:text-gray-400
                         border border-purple-500/30
                         focus:border-purple-500 focus:ring-purple-500/20
                         px-3 py-2 text-sm"
              placeholder="Your message (optional)"
            />
          )}

          {/* VOICE */}
          {donationType === "voice" && (
            <EnhancedVoiceRecorder
              controller={voiceRecorder}
              onRecordingComplete={() => {}}
              maxDurationSeconds={getVoiceDuration(currentAmount)}
              requiredAmount={pricing.minVoice}
              currentAmount={currentAmount}
              brandColor="#a855f7"
            />
          )}

          {/* HYPERSOUND */}
          {donationType === "hypersound" && (
            <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
          )}

          {/* MEDIA */}
          {donationType === "media" && (
            <MediaUploader
              streamerSlug="clumsy_god"
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
            className="w-full font-semibold py-6 bg-purple-600 hover:bg-purple-700"
            onClick={handleSubmit}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? "Processing..." : `Support ${currencySymbol}${formData.amount || "0"}`}
          </Button>

          <DonationPageFooter brandColor="#a855f7" />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClumsyGod;
