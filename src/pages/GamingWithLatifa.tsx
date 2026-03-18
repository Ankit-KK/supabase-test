// src/pages/GamingWithLatifa.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { getMaxMessageLength } from "@/utils/getMaxMessageLength";
import { getCurrencySymbol } from "@/constants/currencies";
import RewardsBanner from "@/components/RewardsBanner";
import DonationPageFooter from "@/components/DonationPageFooter";

import { LATIFA_CSS } from "@/components/latifa/LatifaTheme";
import LatifaBackground from "@/components/latifa/LatifaBackground";
import LatifaHero from "@/components/latifa/LatifaHero";
import LatifaKillFeed, { useLatifaKillFeed } from "@/components/latifa/LatifaKillFeed";
import LatifaDonationForm from "@/components/latifa/LatifaDonationForm";
import type { DonationType } from "@/components/latifa/LatifaDonationForm";
import LatifaSubmitButton from "@/components/latifa/LatifaSubmitButton";
import LatifaSuccessOverlay from "@/components/latifa/LatifaSuccessOverlay";
import { useLatifaPayment } from "@/components/latifa/hooks/useLatifaPayment";

const CARD_CSS = `
  .lf-scale-wrap {
    width: 420px; transform-origin: top center;
    position: relative; z-index: 10;
  }

  .lf-reveal-wrap {
    position: relative;
    animation: lf-reveal-clip 0.9s cubic-bezier(0.4,0,0.2,1) 0.1s both;
  }
  @keyframes lf-reveal-clip {
    0%   { clip-path: inset(0 0 100% 0); }
    100% { clip-path: inset(0 0 0% 0); }
  }
  .lf-reveal-line {
    position: absolute; left: 0; right: 0; height: 3px; z-index: 200; pointer-events: none;
    background: linear-gradient(90deg,
      transparent 0%, rgba(168,85,247,0.4) 15%,
      rgba(244,114,182,0.9) 40%, #fff 50%,
      rgba(244,114,182,0.9) 60%, rgba(168,85,247,0.4) 85%, transparent 100%
    );
    box-shadow: 0 0 8px rgba(244,114,182,0.8), 0 0 20px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.3);
    animation: lf-scanline-sweep 0.9s cubic-bezier(0.4,0,0.2,1) 0.1s both;
  }
  @keyframes lf-scanline-sweep {
    0%   { top: 0%;   opacity: 1; }
    85%  { top: 100%; opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }

  .lf-card {
    width: 420px; background: var(--lf-card);
    border-radius: 3px;
    border: 1px solid rgba(168,85,247,0.4);
    box-shadow:
      0 0 0 1px rgba(244,114,182,0.06),
      0 0 35px rgba(124,58,237,0.22),
      0 0 80px rgba(124,58,237,0.08),
      0 30px 80px rgba(0,0,0,0.9);
    overflow: hidden; position: relative;
    clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px));
    transition: transform 0.08s ease;
  }
  .lf-card::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 100;
    background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px);
  }

  .lf-bracket { position: absolute; width: 14px; height: 14px; z-index: 101; pointer-events: none; }
  .lf-bracket-tl { top: 5px; left: 5px; border-top: 1.5px solid var(--lf-purple); border-left: 1.5px solid var(--lf-purple); opacity: 0.7; }
  .lf-bracket-tr { top: 5px; right: 28px; border-top: 1.5px solid var(--lf-purple); border-right: 1.5px solid var(--lf-purple); opacity: 0.7; }
  .lf-bracket-bl { bottom: 28px; left: 5px; border-bottom: 1.5px solid var(--lf-purple); border-left: 1.5px solid var(--lf-purple); opacity: 0.7; }
  .lf-bracket-br { bottom: 5px; right: 5px; border-bottom: 1.5px solid var(--lf-purple); border-right: 1.5px solid var(--lf-purple); opacity: 0.7; }

  .lf-body {
    padding: 14px 18px 16px;
    display: flex; flex-direction: column; gap: 12px;
  }
`;

const GamingWithLatifa = () => {
  const navigate = useNavigate();
  const cardRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  const [formData, setFormData]                     = useState({ name: "", amount: "", message: "" });
  const [donationType, setDonationType]             = useState<DonationType>("text");
  const [selectedCurrency, setSelectedCurrency]     = useState("INR");
  const [currencyOpen, setCurrencyOpen]             = useState(false);
  const [selectedHypersound, setSelectedHypersound] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl]                     = useState<string | null>(null);
  const [mediaType, setMediaType]                   = useState<string | null>(null);
  const [showSuccess, setShowSuccess]               = useState(false);
  const [redirectUrl, setRedirectUrl]               = useState('');

  const { pricing }      = useStreamerPricing("gaming_with_latifa", selectedCurrency);
  const currencySymbol   = getCurrencySymbol(selectedCurrency);
  const currentAmount    = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  const getVoiceDuration = (amount: number) => {
    if (selectedCurrency === "INR") { if (amount >= 500) return 15; if (amount >= 300) return 12; return 8; }
    if (amount >= 6) return 15; if (amount >= 4) return 12; return 8;
  };
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  const { msgs, push } = useLatifaKillFeed();

  const { isProcessing, handleTypeChange, validateAndPay } = useLatifaPayment({
    push,
    onSuccess: (url) => { setRedirectUrl(url); setShowSuccess(true); },
  });

  const applyScale = useCallback(() => {
    const wrap = wrapRef.current; const card = cardRef.current; if (!wrap || !card) return;
    const scaleW = Math.min(1, (window.innerWidth - 32) / 420);
    const scaleH = card.scrollHeight > 0 ? Math.min(1, (window.innerHeight - 48) / card.scrollHeight) : 1;
    const scale  = Math.min(scaleW, scaleH);
    wrap.style.height    = `${card.scrollHeight * scale}px`;
    wrap.style.transform = `scale(${scale})`;
  }, []);

  useEffect(() => {
    const t = setTimeout(applyScale, 80);
    window.addEventListener('resize', applyScale);
    return () => { clearTimeout(t); window.removeEventListener('resize', applyScale); };
  }, [applyScale]);

  useEffect(() => {
    const t = setTimeout(applyScale, 60);
    return () => clearTimeout(t);
  }, [donationType, applyScale]);

  const onDonationTypeChange = (value: DonationType) => {
    handleTypeChange(
      value, pricing,
      setDonationType,
      setFormData,
      formData.name,
      setSelectedHypersound,
      setMediaUrl,
      setMediaType,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await validateAndPay({
      formData, donationType, selectedCurrency, pricing,
      voiceRecorder, selectedHypersound, mediaUrl, mediaType,
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LATIFA_CSS + CARD_CSS }} />

      <LatifaBackground />

      {showSuccess && (
        <LatifaSuccessOverlay
          amount={formData.amount}
          currency={currencySymbol}
          onDone={() => navigate(redirectUrl)}
        />
      )}

      <LatifaKillFeed msgs={msgs} />

      <div className="lf-root lf-page">
        <div ref={wrapRef} className="lf-scale-wrap" style={{ transformOrigin: 'top center' }}>
          <div className="lf-reveal-wrap">
            <div className="lf-reveal-line" />

            <div ref={cardRef} className="lf-card">
              <div className="lf-bracket lf-bracket-tl" />
              <div className="lf-bracket lf-bracket-tr" />
              <div className="lf-bracket lf-bracket-bl" />
              <div className="lf-bracket lf-bracket-br" />

              <LatifaHero cardRef={cardRef} />

              <form onSubmit={handleSubmit}>
                <div className="lf-body">

                  <LatifaDonationForm
                    name={formData.name}
                    amount={formData.amount}
                    message={formData.message}
                    donationType={donationType}
                    selectedCurrency={selectedCurrency}
                    currencyOpen={currencyOpen}
                    maxMessageLength={maxMessageLength}
                    pricing={pricing}
                    voiceRecorder={voiceRecorder}
                    selectedHypersound={selectedHypersound}
                    mediaUrl={mediaUrl}
                    onNameChange={v => setFormData(p => ({ ...p, name: v }))}
                    onAmountChange={v => setFormData(p => ({ ...p, amount: v }))}
                    onMessageChange={v => setFormData(p => ({ ...p, message: v }))}
                    onDonationTypeChange={onDonationTypeChange}
                    onCurrencyChange={setSelectedCurrency}
                    onCurrencyOpenChange={setCurrencyOpen}
                    onHypersoundSelect={setSelectedHypersound}
                    onMediaUploaded={(url, type) => { setMediaUrl(url); setMediaType(type); }}
                    onMediaRemoved={() => { setMediaUrl(null); setMediaType(null); }}
                    getVoiceDuration={getVoiceDuration}
                  />

                  <RewardsBanner amount={currentAmount} currency={selectedCurrency} />

                  <LatifaSubmitButton
                    isProcessing={isProcessing}
                    amount={formData.amount}
                    currencySymbol={currencySymbol}
                  />

                  <p style={{
                    fontSize: 8, fontWeight: 600,
                    color: 'rgba(233,213,255,0.14)',
                    textAlign: 'center', lineHeight: 1.6,
                    fontFamily: 'Orbitron,monospace', letterSpacing: '0.06em',
                  }}>
                    PHONE NUMBERS COLLECTED BY RAZORPAY PER RBI REGULATIONS
                  </p>

                  <DonationPageFooter brandColor="#a855f7" />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamingWithLatifa;
