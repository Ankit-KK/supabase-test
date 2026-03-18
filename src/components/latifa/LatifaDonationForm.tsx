// src/components/latifa/LatifaDonationForm.tsx

import React from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import MediaUploader from "@/components/MediaUploader";

const FORM_CSS = `
  /* ── 3D Type Buttons ── */
  .lf-types { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; }

  .lf-tb {
    position: relative; padding: 0; border: none;
    background: none; cursor: pointer; outline: none;
    display: block; width: 100%;
  }
  .lf-tb-face {
    position: relative; z-index: 2;
    padding: 10px 4px 9px; text-align: center;
    transition: transform .1s ease, box-shadow .1s ease, filter .1s ease;
    transform: translateY(-4px);
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  }
  .lf-tb::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: calc(100% - 2px); z-index: 1;
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  }
  .lf-tb:active .lf-tb-face { transform: translateY(0) !important; }
  .lf-tb:hover  .lf-tb-face { filter: brightness(1.12); }

  /* Purple — text */
  .lf-tb-pu .lf-tb-face { background: linear-gradient(160deg,rgba(168,85,247,0.18),rgba(100,30,180,0.5)); border: 1px solid rgba(168,85,247,0.5); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-pu::after { background: #2e1060; }
  .lf-tb-pu.lf-on .lf-tb-face { transform: translateY(0); background: linear-gradient(160deg,rgba(168,85,247,0.32),rgba(124,58,237,0.6)); border-color: var(--lf-purple); box-shadow: inset 0 2px 5px rgba(0,0,0,0.35), 0 0 18px rgba(168,85,247,0.75), 0 0 36px rgba(168,85,247,0.28); }

  /* Pink — voice */
  .lf-tb-pk .lf-tb-face { background: linear-gradient(160deg,rgba(244,114,182,0.18),rgba(180,30,120,0.5)); border: 1px solid rgba(244,114,182,0.5); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-pk::after { background: #5a0e35; }
  .lf-tb-pk.lf-on .lf-tb-face { transform: translateY(0); background: linear-gradient(160deg,rgba(244,114,182,0.32),rgba(219,39,119,0.6)); border-color: var(--lf-pink); box-shadow: inset 0 2px 5px rgba(0,0,0,0.3), 0 0 18px rgba(244,114,182,0.75), 0 0 36px rgba(244,114,182,0.28); }

  /* Magenta — hypersound */
  .lf-tb-mg .lf-tb-face { background: linear-gradient(160deg,rgba(232,121,249,0.18),rgba(160,30,200,0.5)); border: 1px solid rgba(232,121,249,0.5); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-mg::after { background: #460e5a; }
  .lf-tb-mg.lf-on .lf-tb-face { transform: translateY(0); background: linear-gradient(160deg,rgba(232,121,249,0.32),rgba(192,38,211,0.6)); border-color: var(--lf-magenta); box-shadow: inset 0 2px 5px rgba(0,0,0,0.3), 0 0 18px rgba(232,121,249,0.75), 0 0 36px rgba(232,121,249,0.28); }

  /* Violet — media */
  .lf-tb-vi .lf-tb-face { background: linear-gradient(160deg,rgba(139,92,246,0.18),rgba(80,20,160,0.5)); border: 1px solid rgba(139,92,246,0.5); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12); }
  .lf-tb-vi::after { background: #260c50; }
  .lf-tb-vi.lf-on .lf-tb-face { transform: translateY(0); background: linear-gradient(160deg,rgba(139,92,246,0.32),rgba(109,40,217,0.6)); border-color: var(--lf-violet); box-shadow: inset 0 2px 5px rgba(0,0,0,0.3), 0 0 18px rgba(139,92,246,0.75), 0 0 36px rgba(139,92,246,0.28); }

  .lf-tb-emoji { font-size: 17px; display: block; line-height: 1; }
  .lf-tb-name  { font-family: 'Orbitron', monospace; font-size: 7px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; display: block; margin-top: 4px; color: rgba(233,213,255,0.4); transition: color .15s; }
  .lf-tb.lf-on .lf-tb-name { color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.5); }
  .lf-tb-min   { font-size: 7px; font-weight: 600; color: rgba(244,114,182,0.6); display: block; margin-top: 2px; font-family: 'Rajdhani', sans-serif; }

  /* ── Currency selector ── */
  .lf-amt { display: flex; gap: 7px; }
  .lf-cur {
    display: flex; align-items: center; justify-content: space-between; gap: 4px;
    background: rgba(168,85,247,0.05) !important;
    border: 1px solid rgba(168,85,247,0.28) !important;
    border-radius: 2px !important;
    color: var(--lf-text) !important;
    font-family: 'Rajdhani', sans-serif !important;
    font-size: 13px !important; font-weight: 700 !important;
    padding: 0 10px !important; min-width: 90px; height: 40px;
    cursor: pointer; transition: all .15s; flex-shrink: 0;
    letter-spacing: 0.04em !important;
  }
  .lf-cur:hover { border-color: var(--lf-purple) !important; }
`;

export type DonationType = 'text' | 'voice' | 'hypersound' | 'media';

interface LatifaDonationFormProps {
  name: string;
  amount: string;
  message: string;
  donationType: DonationType;
  selectedCurrency: string;
  currencyOpen: boolean;
  maxMessageLength: number;
  pricing: any;
  voiceRecorder: any;
  selectedHypersound: string | null;
  mediaUrl: string | null;
  onNameChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onDonationTypeChange: (v: DonationType) => void;
  onCurrencyChange: (v: string) => void;
  onCurrencyOpenChange: (v: boolean) => void;
  onHypersoundSelect: (v: string) => void;
  onMediaUploaded: (url: string, type: string) => void;
  onMediaRemoved: () => void;
  getVoiceDuration: (amount: number) => number;
}

const LatifaDonationForm: React.FC<LatifaDonationFormProps> = ({
  name, amount, message, donationType, selectedCurrency,
  currencyOpen, maxMessageLength, pricing, voiceRecorder,
  selectedHypersound, mediaUrl,
  onNameChange, onAmountChange, onMessageChange,
  onDonationTypeChange, onCurrencyChange, onCurrencyOpenChange,
  onHypersoundSelect, onMediaUploaded, onMediaRemoved,
  getVoiceDuration,
}) => {
  const currencySymbol = getCurrencySymbol(selectedCurrency);
  const currentAmount  = parseFloat(amount) || 0;
  const msgPct = maxMessageLength > 0 ? (message.length / maxMessageLength) * 100 : 0;
  const msgClr = msgPct > 90 ? '#ef4444' : msgPct > 70 ? 'var(--lf-pink)' : 'var(--lf-purple)';

  const TYPES = [
    { key: 'text'       as const, emoji: '💬', label: 'Text',  min: pricing.minText,       tc: 'lf-tb-pu' },
    { key: 'voice'      as const, emoji: '🎤', label: 'Voice', min: pricing.minVoice,      tc: 'lf-tb-pk' },
    { key: 'hypersound' as const, emoji: '🔊', label: 'Sound', min: pricing.minHypersound, tc: 'lf-tb-mg' },
    { key: 'media'      as const, emoji: '🖼️', label: 'Media', min: pricing.minMedia,      tc: 'lf-tb-vi' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FORM_CSS }} />

      {/* Name */}
      <div>
        <label className="lf-lbl">▸ Operator Name</label>
        <div className="lf-iw">
          <Input
            name="name" value={name} required
            placeholder="Enter your name"
            onChange={e => onNameChange(e.target.value)}
          />
        </div>
      </div>

      {/* Donation type */}
      <div>
        <label className="lf-lbl">▸ Mission Type</label>
        <div className="lf-types">
          {TYPES.map(t => (
            <button
              key={t.key} type="button"
              onClick={() => onDonationTypeChange(t.key)}
              className={cn('lf-tb', t.tc, donationType === t.key ? 'lf-on' : '')}
            >
              <div className="lf-tb-face">
                <span className="lf-tb-emoji">{t.emoji}</span>
                <span className="lf-tb-name">{t.label}</span>
                <span className="lf-tb-min">{currencySymbol}{t.min}+</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="lf-lbl">▸ Deploy Amount</label>
        <div className="lf-amt">
          <Popover open={currencyOpen} onOpenChange={onCurrencyOpenChange}>
            <PopoverTrigger asChild>
              <button type="button" className="lf-cur">
                <span>{currencySymbol} {selectedCurrency}</span>
                <ChevronsUpDown style={{ width: 10, height: 10, opacity: 0.35, marginLeft: 'auto', flexShrink: 0 }} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search currency..." />
                <CommandList>
                  <CommandEmpty>No currency found.</CommandEmpty>
                  <CommandGroup>
                    {SUPPORTED_CURRENCIES.map(c => (
                      <CommandItem
                        key={c.code} value={c.code}
                        onSelect={() => { onCurrencyChange(c.code); onCurrencyOpenChange(false); }}
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
          <div className="lf-iw" style={{ flex: 1 }}>
            <Input
              name="amount" type="number" value={amount} min="1"
              placeholder="0" required
              readOnly={donationType === 'hypersound'}
              onChange={e => onAmountChange(e.target.value)}
            />
          </div>
        </div>
        {pricing.ttsEnabled && (
          <p className="lf-hint">⚡ TTS ABOVE {currencySymbol}{pricing.minTts}</p>
        )}
      </div>

      <div className="lf-div" />

      {/* Text message */}
      {donationType === 'text' && (
        <div className="lf-fu">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <label className="lf-lbl" style={{ margin: 0 }}>▸ Intel Message</label>
            <span style={{ fontSize: 9, fontWeight: 700, color: msgClr, fontFamily: 'Orbitron,monospace', letterSpacing: '0.08em' }}>
              {message.length}/{maxMessageLength}
            </span>
          </div>
          <textarea
            name="message" value={message} rows={2}
            maxLength={maxMessageLength}
            placeholder="Your message (optional)"
            className="lf-ta"
            onChange={e => onMessageChange(e.target.value)}
          />
          <div className="lf-cbar">
            <div className="lf-cbar-fill" style={{ width: `${msgPct}%`, background: msgClr, boxShadow: `0 0 5px ${msgClr}` }} />
          </div>
        </div>
      )}

      {/* Voice */}
      {donationType === 'voice' && (
        <div className="lf-fu">
          <label className="lf-lbl">▸ Voice Transmission</label>
          <div className="lf-sp lf-sp-pk">
            <EnhancedVoiceRecorder
              controller={voiceRecorder}
              onRecordingComplete={() => {}}
              maxDurationSeconds={getVoiceDuration(currentAmount)}
              requiredAmount={pricing.minVoice}
              currentAmount={currentAmount}
              brandColor="#a855f7"
            />
          </div>
        </div>
      )}

      {/* HyperSound */}
      {donationType === 'hypersound' && (
        <div className="lf-fu lf-sp lf-sp-mg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>🔊</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lf-magenta)', fontFamily: 'Orbitron,monospace', letterSpacing: '0.1em' }}>HYPERSOUNDS</span>
          </div>
          <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={onHypersoundSelect} />
        </div>
      )}

      {/* Media */}
      {donationType === 'media' && (
        <div className="lf-fu lf-sp lf-sp-pu">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>🖼️</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lf-purple)', fontFamily: 'Orbitron,monospace', letterSpacing: '0.1em' }}>MEDIA DROP</span>
          </div>
          <MediaUploader
            streamerSlug="gaming_with_latifa"
            onMediaUploaded={onMediaUploaded}
            onMediaRemoved={onMediaRemoved}
          />
        </div>
      )}
    </>
  );
};

export default LatifaDonationForm;
