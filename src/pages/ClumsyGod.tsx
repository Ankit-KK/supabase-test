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

    setFormData({
      name: formData.name,
      amount: String(amount),
      message: "",
    });

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

    if (!formData.name || !formData.amount) {
      toast.error("Name and amount are required");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
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
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            if (!res?.includes(",")) reject();
            resolve(res.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        const { data, error } = await supabase.functions.invoke("upload-voice-message-direct", {
          body: {
            voiceData: base64,
            streamerSlug: "clumsy_god",
          },
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

      const razorpay = new (window as any).Razorpay({
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
        theme: { color: "#10b981" },
      });

      razorpay.open();
    } catch (err) {
      console.error(err);
      toast.error("Payment failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-500">Clumsy God</CardTitle>
          <p className="text-xs text-muted-foreground">Support Clumsy God on stream</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* NAME */}
          <div className="space-y-2">
            <Label>Your Name *</Label>
            <Input name="name" value={formData.name} onChange={handleInputChange} required />
          </div>

          {/* DONATION TYPE */}
          <div className="grid grid-cols-4 gap-1.5">
            {(["text", "voice", "hypersound", "media"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleDonationTypeChange(type)}
                className={`p-2 rounded-lg border-2 ${
                  donationType === type ? "border-emerald-500 bg-emerald-500/10" : "border-border"
                }`}
              >
                <div className="text-xs capitalize">{type}</div>
              </button>
            ))}
          </div>

          {/* AMOUNT */}
          <div className="space-y-2">
            <Label>Amount *</Label>
            <div className="flex gap-2">
              <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[100px] justify-between">
                    {currencySymbol} {selectedCurrency}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search currency" />
                    <CommandList>
                      <CommandEmpty>No currency</CommandEmpty>
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

              <Input name="amount" type="number" value={formData.amount} onChange={handleInputChange} required />
            </div>
          </div>

          {/* CONDITIONAL INPUTS */}
          {donationType === "text" && (
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              className="w-full min-h-[80px] border rounded-md p-2"
              placeholder="Optional message"
            />
          )}

          {donationType === "voice" && (
            <EnhancedVoiceRecorder
              controller={voiceRecorder}
              onRecordingComplete={(hasRecording, duration) => {
                console.log("Voice recorded:", hasRecording, duration);
              }}
              maxDurationSeconds={getVoiceDuration(currentAmount)}
              requiredAmount={pricing.minVoice}
              currentAmount={currentAmount}
              brandColor="#10b981"
            />
          )}

          {donationType === "hypersound" && (
            <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound} />
          )}

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

          <Button className="w-full bg-emerald-500 text-white" onClick={handleSubmit} disabled={isProcessingPayment}>
            {isProcessingPayment ? "Processing..." : `Support ${currencySymbol}${formData.amount || "0"}`}
          </Button>

          <DonationPageFooter brandColor="#10b981" />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClumsyGod;
