// src/components/latifa/hooks/useLatifaPayment.ts

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrencySymbol } from "@/constants/currencies";
import type { KFVariant } from "../LatifaKillFeed";
import type { DonationType } from "../LatifaDonationForm";

/* ── Audio utils ── */
const playClick = () => {
  try {
    const c = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(700, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(460, c.currentTime + 0.05);
    g.gain.setValueAtTime(0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    o.start(); o.stop(c.currentTime + 0.08);
  } catch {}
};

const playSuccess = () => {
  try {
    const c = new (window.AudioContext || (window as any).webkitAudioContext)();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      const t = c.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.start(t); o.stop(t + 0.15);
    });
  } catch {}
};

const playError = () => {
  try {
    const c = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.15);
    g.gain.setValueAtTime(0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    o.start(); o.stop(c.currentTime + 0.15);
  } catch {}
};

/* ── Hook ── */
interface UseLatifaPaymentOptions {
  push: (text: string, icon?: string, variant?: KFVariant) => void;
  onSuccess: (redirectUrl: string) => void;
}

interface FormState {
  name: string;
  amount: string;
  message: string;
}

export const useLatifaPayment = ({ push, onSuccess }: UseLatifaPaymentOptions) => {
  const navigate = useNavigate();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);

  /* Load Razorpay SDK */
  useEffect(() => {
    const s = document.createElement("script");
    s.src   = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload  = () => setRazorpayLoaded(true);
    s.onerror = () => push("Payment gateway failed", "✖", "err");
    document.body.appendChild(s);
    return () => { if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

  const handleTypeChange = (
    value: DonationType,
    pricing: any,
    setDonationType: (v: DonationType) => void,
    setFormData: (f: FormState) => void,
    currentName: string,
    setSelectedHypersound: (v: string | null) => void,
    setMediaUrl: (v: string | null) => void,
    setMediaType: (v: string | null) => void,
  ) => {
    playClick();
    setDonationType(value);
    const amount =
      value === "voice"      ? pricing.minVoice      :
      value === "hypersound" ? pricing.minHypersound :
      value === "media"      ? pricing.minMedia      :
      pricing.minText;
    setFormData({ name: currentName, amount: String(amount), message: "" });
    setSelectedHypersound(null);
    setMediaUrl(null);
    setMediaType(null);
  };

  const validateAndPay = async (params: {
    formData: FormState;
    donationType: DonationType;
    selectedCurrency: string;
    pricing: any;
    voiceRecorder: any;
    selectedHypersound: string | null;
    mediaUrl: string | null;
    mediaType: string | null;
  }) => {
    const {
      formData, donationType, selectedCurrency, pricing,
      voiceRecorder, selectedHypersound, mediaUrl, mediaType,
    } = params;

    const currencySymbol = getCurrencySymbol(selectedCurrency);

    if (!razorpayLoaded || !(window as any).Razorpay) {
      playError(); push("Payment system loading", "⚠", "warn"); return;
    }

    const amount = Number(formData.amount);
    if (!formData.name)       { playError(); push("Name required", "✖", "err"); return; }
    if (!amount || amount <= 0) { playError(); push("Enter a valid amount", "✖", "err"); return; }

    const min =
      donationType === "voice"      ? pricing.minVoice      :
      donationType === "hypersound" ? pricing.minHypersound :
      donationType === "media"      ? pricing.minMedia      :
      pricing.minText;

    if (amount < min) {
      playError(); push(`Min for ${donationType}: ${currencySymbol}${min}`, "✖", "err"); return;
    }
    if (donationType === "voice"      && !voiceRecorder.audioBlob)  { playError(); push("Record voice message first", "⚠", "warn"); return; }
    if (donationType === "hypersound" && !selectedHypersound)       { playError(); push("Select a sound", "⚠", "warn"); return; }
    if (donationType === "media"      && !mediaUrl)                 { playError(); push("Upload a media file", "⚠", "warn"); return; }

    await processPayment({
      formData, donationType, selectedCurrency,
      voiceRecorder, selectedHypersound, mediaUrl, mediaType,
    });
  };

  const processPayment = async (params: {
    formData: FormState;
    donationType: DonationType;
    selectedCurrency: string;
    voiceRecorder: any;
    selectedHypersound: string | null;
    mediaUrl: string | null;
    mediaType: string | null;
  }) => {
    const {
      formData, donationType, selectedCurrency,
      voiceRecorder, selectedHypersound, mediaUrl, mediaType,
    } = params;

    setIsProcessing(true);
    push("Initiating payment...", "◈", "default");

    try {
      /* Upload voice if needed */
      let voiceMessageUrl: string | null = null;
      if (donationType === "voice" && voiceRecorder.audioBlob) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload  = () => resolve((r.result as string).split(",")[1]);
          r.onerror = reject;
          r.readAsDataURL(voiceRecorder.audioBlob!);
        });
        const { data, error } = await supabase.functions.invoke("upload-voice-message-direct", {
          body: { voiceData: base64, streamerSlug: "gaming_with_latifa" },
        });
        if (error) throw error;
        voiceMessageUrl = data.voice_message_url;
      }

      /* Create order */
      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: {
          streamer_slug:  "gaming_with_latifa",
          name:           formData.name,
          amount:         Number(formData.amount),
          message:        donationType === "text" ? formData.message : null,
          voiceMessageUrl,
          hypersoundUrl:  donationType === "hypersound" ? selectedHypersound : null,
          mediaUrl:       donationType === "media"      ? mediaUrl            : null,
          mediaType,
          currency:       selectedCurrency,
        },
      });
      if (error) throw error;

      /* Open Razorpay */
      new (window as any).Razorpay({
        key:      data.razorpay_key_id,
        amount:   data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name:        "Gaming With Latifa",
        description: "Support Gaming With Latifa",
        handler: () => {
          playSuccess();
          onSuccess(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`);
        },
        modal: {
          ondismiss: () => navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`),
        },
        theme: { color: "#a855f7" },
      }).open();

    } catch {
      playError();
      push("Payment failed. Try again.", "✖", "err");
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, handleTypeChange, validateAndPay };
};
