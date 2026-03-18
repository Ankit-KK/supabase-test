import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import MediaUploader from "@/components/MediaUploader";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import { getMaxMessageLength } from "@/utils/getMaxMessageLength";
import DonationPageFooter from "@/components/DonationPageFooter";
import RewardsBanner from "@/components/RewardsBanner";
import latifaAvatar from "@/assets/gaming-with-latifa-avatar.jpg";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Orbitron:wght@400;700;900&family=Black+Ops+One&display=swap');

  :root {
    --lf-purple:      #a855f7;
    --lf-purple-dark: #7c3aed;
    --lf-pink:        #f472b6;
    --lf-pink-dark:   #db2777;
    --lf-magenta:     #e879f9;
    --lf-bg:          #08050f;
    --lf-surface:     #110d1e;
    --lf-text:        #f0e6ff;
    --lf-muted:       rgba(240,230,255,0.5);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .lf-root {
    font-family: 'Nunito', sans-serif;
    width: 100vw; min-height: 100dvh;
    background: var(--lf-bg);
    overflow-x: hidden; overflow-y: auto;
    position: relative;
  }

  /* ── Hero Section — full width photo ── */
  .lf-hero {
    position: relative;
    width: 100%; height: 55vw; max-height: 340px; min-height: 240px;
    overflow: hidden;
  }

  .lf-hero-img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center 15%;
    display: block;
  }

  /* Dark gradient overlay — fades photo into bg */
  .lf-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      180deg,
      rgba(8,5,15,0.1) 0%,
      rgba(8,5,15,0.05) 40%,
      rgba(8,5,15,0.6) 75%,
      rgba(8,5,15,1) 100%
    );
  }

  /* Side vignettes */
  .lf-hero-vignette {
    position: absolute; inset: 0;
    background:
      linear-gradient(90deg, rgba(8,5,15,0.5) 0%, transparent 25%, transparent 75%, rgba(8,5,15,0.5) 100%);
  }

  /* Purple glow rising from bottom of hero */
  .lf-hero-glow {
    position: absolute; bottom: -20px; left: 50%;
    transform: translateX(-50%);
    width: 70%; height: 120px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(168,85,247,0.4) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Live badge */
  @keyframes lf-live-pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
  .lf-live {
    position: absolute; top: 14px; right: 14px;
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(8,5,15,0.7); backdrop-filter: blur(8px);
    border: 1px solid rgba(168,85,247,0.5);
    border-radius: 20px; padding: 5px 12px;
  }
  .lf-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--lf-purple); animation: lf-live-pulse 1.2s ease-in-out infinite; box-shadow: 0 0 6px var(--lf-purple); }
  .lf-live-text { font-family: 'Orbitron', monospace; font-size: 9px; font-weight: 700; color: var(--lf-purple); letter-spacing: 0.18em; }

  /* ── Name block — overlaps hero bottom ── */
  .lf-nameblock {
    position: relative; z-index: 2;
    margin-top: -60px; padding: 0 20px 16px;
    text-align: center;
  }

  @keyframes lf-cursor { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .lf-name {
    font-family: 'Black Ops One', cursive;
    font-size: clamp(28px, 8vw, 38px);
    color: #fff; line-height: 1.05; letter-spacing: 0.03em;
    text-shadow: 0 0 30px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.4), 0 2px 4px rgba(0,0,0,0.8);
  }
  .lf-name-pink {
    color: var(--lf-pink);
    text-shadow: 0 0 20px rgba(244,114,182,1), 0 0 40px rgba(244,114,182,0.5), 0 2px 4px rgba(0,0,0,0.8);
  }
  .lf-name-cursor { display: inline-block; width: 3px; height: 30px; background: var(--lf-pink); margin-left: 2px; vertical-align: middle; animation: lf-cursor .7s ease-in-out infinite; }
  .lf-sub { font-size: 12px; font-weight: 700; color: var(--lf-muted); letter-spacing: 0.12em; text-transform: uppercase; margin-top: 6px; }

  /* Stats row */
  .lf-stats {
    display: flex; justify-content: center; gap: 0;
    margin: 14px 0 0; border-radius: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(168,85,247,0.2);
    overflow: hidden;
  }
  .lf-stat { flex:1; padding: 10px 8px; text-align: center; border-right: 1px solid rgba(168,85,247,0.15); }
  .lf-stat:last-child { border-right: none; }
  .lf-stat-val { font-family:'Black Ops One',cursive; font-size:13px; color:var(--lf-purple); text-shadow:0 0 8px rgba(168,85,247,0.5); display:block; }
  .lf-stat-lbl { font-family:'Orbitron',monospace; font-size:7px; font-weight:700; color:rgba(240,230,255,0.3); letter-spacing:0.12em; text-transform:uppercase; display:block; margin-top:2px; }

  /* ── Form Section ── */
  .lf-form-section {
    position: relative; z-index: 2;
    padding: 8px 16px 32px;
    display: flex; flex-direction: column; gap: 18px;
  }

  /* Section divider */
  .lf-section-title {
    font-family: 'Orbitron', monospace; font-size: 9px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(168,85,247,0.7); display: flex; align-items: center; gap: 10px;
    margin-bottom: 8px;
  }
  .lf-section-title::after { content:''; flex:1; height:1px; background:linear-gradient(90deg, rgba(168,85,247,0.3), transparent); }

  /* ── Inputs ── */
  .lf-input-wrap { position: relative; }
  .lf-input {
    width: 100%;
    background: rgba(168,85,247,0.06);
    border: 1.5px solid rgba(168,85,247,0.25);
    border-radius: 12px;
    color: var(--lf-text);
    font-family: 'Nunito', sans-serif;
    font-size: 16px; font-weight: 700;
    padding: 14px 16px;
    outline: none;
    transition: all .2s;
    caret-color: var(--lf-pink);
  }
  .lf-input:focus {
    border-color: var(--lf-purple);
    background: rgba(168,85,247,0.1);
    box-shadow: 0 0 0 3px rgba(168,85,247,0.15), 0 0 20px rgba(168,85,247,0.12);
  }
  .lf-input::placeholder { color: rgba(240,230,255,0.25); }
  .lf-input:disabled,.lf-input[readonly] { opacity:.4; cursor:not-allowed; }

  /* Pink underline on focus */
  .lf-input-wrap::after {
    content:''; position:absolute; bottom:0; left:16px; right:16px; height:2px;
    background: linear-gradient(90deg, var(--lf-purple), var(--lf-pink));
    border-radius: 2px;
    transform:scaleX(0); transform-origin:left; transition:transform .25s ease; opacity:0.8;
  }
  .lf-input-wrap:focus-within::after { transform:scaleX(1); }

  .lf-textarea {
    width: 100%;
    background: rgba(168,85,247,0.06);
    border: 1.5px solid rgba(168,85,247,0.25);
    border-radius: 12px;
    color: var(--lf-text);
    font-family: 'Nunito', sans-serif;
    font-size: 15px; font-weight: 600;
    padding: 14px 16px;
    resize: none; outline: none; line-height: 1.5;
    caret-color: var(--lf-pink); transition: all .2s;
  }
  .lf-textarea:focus { border-color:var(--lf-purple); background:rgba(168,85,247,0.1); box-shadow:0 0 0 3px rgba(168,85,247,0.15); }
  .lf-textarea::placeholder { color:rgba(240,230,255,0.25); }

  /* ── Type buttons — large tiles ── */
  .lf-types { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
  .lf-type-tile {
    border: 1.5px solid rgba(168,85,247,0.2);
    border-radius: 14px;
    background: rgba(168,85,247,0.05);
    padding: 14px 12px;
    cursor: pointer; outline: none;
    transition: all .18s; position: relative; overflow: hidden;
    text-align: left;
  }
  .lf-type-tile:hover { border-color: rgba(168,85,247,0.45); background: rgba(168,85,247,0.1); transform: translateY(-1px); }
  .lf-type-tile.lf-on {
    border-color: var(--lf-purple);
    background: rgba(168,85,247,0.14);
    box-shadow: 0 0 18px rgba(168,85,247,0.3), inset 0 0 20px rgba(168,85,247,0.06);
  }
  .lf-type-tile::before {
    content:''; position:absolute; top:0; right:0;
    width:60px; height:60px; border-radius:50%;
    background:radial-gradient(circle,rgba(168,85,247,0.15),transparent);
    transform:translate(20px,-20px);
    transition: opacity .18s;
    opacity: 0;
  }
  .lf-type-tile.lf-on::before { opacity:1; }
  .lf-tile-emoji { font-size:22px; display:block; margin-bottom:6px; }
  .lf-tile-name { font-family:'Nunito',sans-serif; font-size:14px; font-weight:900; color:rgba(240,230,255,0.6); display:block; letter-spacing:0.02em; transition:color .15s; }
  .lf-type-tile.lf-on .lf-tile-name { color:#fff; }
  .lf-tile-min { font-family:'Orbitron',monospace; font-size:9px; font-weight:700; color:rgba(244,114,182,0.6); display:block; margin-top:3px; }

  /* ── Amount row ── */
  .lf-amt-row { display:flex; gap:10px; }
  .lf-cur-btn {
    display:flex; align-items:center; justify-content:space-between; gap:4px;
    background:rgba(168,85,247,0.06); border:1.5px solid rgba(168,85,247,0.25);
    border-radius:12px; color:var(--lf-text);
    font-family:'Nunito',sans-serif; font-size:14px; font-weight:800;
    padding:0 14px; min-width:96px; height:52px;
    cursor:pointer; transition:all .2s; flex-shrink:0;
  }
  .lf-cur-btn:hover { border-color:var(--lf-purple); }

  /* ── Sub panels ── */
  .lf-panel {
    border-radius: 14px; padding: 14px;
    background: rgba(168,85,247,0.06);
    border: 1.5px solid rgba(168,85,247,0.22);
  }
  .lf-panel-pk { background:rgba(244,114,182,0.05); border-color:rgba(244,114,182,0.22); }
  .lf-panel-mg { background:rgba(232,121,249,0.05); border-color:rgba(232,121,249,0.22); }
  .lf-panel-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; font-family:'Orbitron',monospace; font-size:10px; font-weight:700; letter-spacing:0.1em; color:var(--lf-purple); }

  /* Char counter */
  .lf-char-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
  .lf-char-count { font-family:'Orbitron',monospace; font-size:9px; font-weight:700; }
  .lf-cbar { height:2px; margin-top:6px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden; }
  .lf-cbar-fill { height:100%; border-radius:2px; transition:width .12s,background .2s; }

  /* Hint */
  .lf-hint { font-size:11px; font-weight:700; color:rgba(244,114,182,0.6); margin-top:4px; }

  /* ── Animated gradient submit button ── */
  .lf-btn {
    width:100%; padding:17px; border:none; cursor:pointer;
    font-family:'Black Ops One',cursive; font-size:16px; font-weight:400;
    letter-spacing:.06em; color:#fff;
    border-radius:16px;
    background: linear-gradient(135deg,
      var(--lf-purple-dark),
      var(--lf-purple),
      var(--lf-pink),
      var(--lf-magenta),
      var(--lf-purple-dark)
    );
    background-size: 300% 300%;
    animation: lf-btn-gradient 4s ease infinite;
    box-shadow: 0 4px 24px rgba(168,85,247,0.5), 0 2px 8px rgba(0,0,0,0.4);
    transition: transform .15s ease, box-shadow .15s ease;
    position:relative; overflow:hidden;
  }
  @keyframes lf-btn-gradient {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .lf-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(168,85,247,0.65), 0 4px 12px rgba(0,0,0,0.4);
  }
  .lf-btn:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 2px 12px rgba(168,85,247,0.4); }
  .lf-btn:disabled { opacity:.4; cursor:not-allowed; animation:none; background:rgba(168,85,247,0.4); }
  .lf-btn::before {
    content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
    transform:skewX(-20deg); transition:left .7s;
  }
  .lf-btn:hover:not(:disabled)::before { left:160%; }

  /* Spinner */
  @keyframes lf-spin { to{transform:rotate(360deg);} }
  .lf-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; display:inline-block; animation:lf-spin .65s linear infinite; }

  /* ── Success overlay ── */
  @keyframes lf-ov-in  { from{opacity:0;} to{opacity:1;} }
  @keyframes lf-ov-out { from{opacity:1;} to{opacity:0;} }
  @keyframes lf-pop    { 0%{transform:scale(0.4);opacity:0;} 65%{transform:scale(1.1);} 100%{transform:scale(1);opacity:1;} }
  @keyframes lf-conf   { 0%{transform:translateY(0) rotate(0deg);opacity:1;} 100%{transform:translateY(100px) rotate(720deg);opacity:0;} }
  @keyframes lf-bar-fill { from{width:0;} to{width:100%;} }

  .lf-success-overlay { position:fixed; inset:0; z-index:99999; background:rgba(5,3,12,0.97); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; animation:lf-ov-in .3s ease forwards; }
  .lf-success-overlay.lf-ov-exit { animation:lf-ov-out .4s ease forwards; }
  .lf-conf-wrap { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  .lf-conf-piece { position:absolute; border-radius:2px; animation:lf-conf 1.6s ease-out both; }
  .lf-success-avatar { width:80px; height:80px; border-radius:50%; object-fit:cover; object-position:center top; border:3px solid var(--lf-pink); box-shadow:0 0 20px rgba(244,114,182,0.6); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .0s both; }
  .lf-success-title { font-family:'Black Ops One',cursive; font-size:34px; color:#fff; text-shadow:0 0 22px var(--lf-pink),0 0 45px rgba(168,85,247,0.5); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .15s both; letter-spacing:0.04em; }
  .lf-success-sub { font-family:'Nunito',sans-serif; font-size:14px; font-weight:800; color:rgba(240,230,255,0.5); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .25s both; text-align:center; padding:0 30px; }
  .lf-success-amount { font-family:'Black Ops One',cursive; font-size:22px; color:var(--lf-pink); text-shadow:0 0 14px rgba(244,114,182,0.6); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .35s both; letter-spacing:0.06em; }
  .lf-success-bar-wrap { width:200px; height:3px; background:rgba(255,255,255,0.08); margin-top:18px; border-radius:3px; overflow:hidden; animation:lf-pop .4s ease .45s both; }
  .lf-success-bar { height:100%; border-radius:3px; background:linear-gradient(90deg,var(--lf-purple),var(--lf-pink),var(--lf-magenta)); animation:lf-bar-fill 2.5s linear .55s both; }
  .lf-success-redirect { font-family:'Orbitron',monospace; font-size:9px; font-weight:700; color:rgba(168,85,247,0.4); letter-spacing:0.15em; margin-top:8px; animation:lf-pop .4s ease .6s both; }

  /* ── Kill feed ── */
  .lf-killfeed { position:fixed; top:16px; right:16px; z-index:9999; display:flex; flex-direction:column; gap:6px; pointer-events:none; }
  @keyframes lf-kf-in { from{opacity:0;transform:translateX(14px);} to{opacity:1;transform:translateX(0);} }
  .lf-kf { display:flex; align-items:center; gap:8px; background:rgba(8,5,15,0.94); backdrop-filter:blur(12px); border:1px solid rgba(168,85,247,0.3); border-left:3px solid var(--lf-purple); padding:9px 14px; border-radius:10px; animation:lf-kf-in .2s ease forwards; min-width:200px; }
  .lf-kf-err  { border-left-color:#ef4444; }
  .lf-kf-warn { border-left-color:var(--lf-pink); }
  .lf-kf-icon { font-size:11px; flex-shrink:0; color:var(--lf-purple); }
  .lf-kf-err  .lf-kf-icon { color:#ef4444; }
  .lf-kf-warn .lf-kf-icon { color:var(--lf-pink); }
  .lf-kf-text { font-family:'Nunito',sans-serif; font-size:11px; font-weight:800; color:var(--lf-text); }

  @keyframes lf-fu { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .lf-fu { animation:lf-fu .2s ease forwards; }
`;

/* ── Typewriter ── */
const useTypewriter = (text: string, speed = 60, delay = 600) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false); let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => { i++; setDisplayed(text.slice(0, i)); if (i >= text.length) { clearInterval(iv); setDone(true); } }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text]);
  return { displayed, done };
};

/* ── Success Overlay ── */
const SuccessOverlay: React.FC<{ amount: string; currency: string; onDone: () => void }> = ({ amount, currency, onDone }) => {
  const ref = useRef<HTMLDivElement>(null);
  const conf = Array.from({ length: 32 }, (_, i) => ({
    left: `${Math.random() * 100}%`, top: `${5 + Math.random() * 45}%`,
    bg: ['#a855f7','#f472b6','#e879f9','#c084fc','#f9a8d4','#7c3aed','#fbbf24'][i % 7],
    delay: `${Math.random() * 0.6}s`, dur: `${1.3 + Math.random() * 0.9}s`, size: `${7 + Math.random() * 7}px`,
  }));
  useEffect(() => {
    const t = setTimeout(() => { ref.current?.classList.add('lf-ov-exit'); setTimeout(onDone, 400); }, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div ref={ref} className="lf-success-overlay">
      <div className="lf-conf-wrap">
        {conf.map((c, i) => <div key={i} className="lf-conf-piece" style={{ left:c.left, top:c.top, background:c.bg, animationDelay:c.delay, animationDuration:c.dur, width:c.size, height:c.size }}/>)}
      </div>
      <img src={latifaAvatar} alt="Latifa" className="lf-success-avatar"/>
      <div className="lf-success-title">Thank You!</div>
      <div className="lf-success-sub">Latifa loves you for this 💜</div>
      <div className="lf-success-amount">{currency}{amount} Sent!</div>
      <div className="lf-success-bar-wrap"><div className="lf-success-bar"/></div>
      <div className="lf-success-redirect">Taking you to confirmation...</div>
    </div>
  );
};

/* ── Kill Feed ── */
type KFMsg = { id: number; text: string; icon: string; variant: 'default'|'err'|'warn'; };
let kfId = 0;
const useKillFeed = () => {
  const [msgs, setMsgs] = useState<KFMsg[]>([]);
  const push = useCallback((text: string, icon = '✦', variant: KFMsg['variant'] = 'default') => {
    const id = ++kfId; setMsgs(p => [...p, { id, text, icon, variant }]);
    setTimeout(() => setMsgs(p => p.filter(m => m.id !== id)), 3200);
  }, []);
  return { msgs, push };
};

/* ── Audio ── */
const playClick   = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.setValueAtTime(660,c.currentTime); o.frequency.exponentialRampToValueAtTime(440,c.currentTime+0.05); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.08); o.start(); o.stop(c.currentTime+0.08); } catch {} };
const playSuccess = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=f; const t=c.currentTime+i*0.1; g.gain.setValueAtTime(0.06,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.15); o.start(t); o.stop(t+0.15); }); } catch {} };
const playError   = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sawtooth'; o.frequency.setValueAtTime(220,c.currentTime); o.frequency.exponentialRampToValueAtTime(80,c.currentTime+0.15); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.15); o.start(); o.stop(c.currentTime+0.15); } catch {} };

/* ── Main ── */
const GamingWithLatifa = () => {
  const navigate = useNavigate();
  const { msgs, push } = useKillFeed();

  const [formData, setFormData]                     = useState({ name: "", amount: "", message: "" });
  const [selectedCurrency, setSelectedCurrency]     = useState("INR");
  const [currencyOpen, setCurrencyOpen]             = useState(false);
  const [donationType, setDonationType]             = useState<"text"|"voice"|"hypersound"|"media">("text");
  const [selectedHypersound, setSelectedHypersound] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl]                     = useState<string | null>(null);
  const [mediaType, setMediaType]                   = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded]         = useState(false);
  const [isProcessing, setIsProcessing]             = useState(false);
  const [showSuccess, setShowSuccess]               = useState(false);
  const [redirectUrl, setRedirectUrl]               = useState('');

  const { pricing }     = useStreamerPricing("gaming_with_latifa", selectedCurrency);
  const currencySymbol  = getCurrencySymbol(selectedCurrency);
  const currentAmount   = parseFloat(formData.amount) || 0;
  const maxMsgLen       = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  const getVoiceDur = (a: number) => { if (selectedCurrency==="INR") { if (a>=500) return 15; if (a>=300) return 12; return 8; } if (a>=6) return 15; if (a>=4) return 12; return 8; };
  const voiceRecorder = useVoiceRecorder(getVoiceDur(currentAmount));

  const { displayed, done } = useTypewriter("Gaming With Latifa", 60, 500);

  useEffect(() => {
    const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.async = true;
    s.onload = () => setRazorpayLoaded(true); s.onerror = () => push("Payment gateway failed", "✖", "err");
    document.body.appendChild(s); return () => { if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value }));
  };

  const handleTypeChange = (value: "text"|"voice"|"hypersound"|"media") => {
    playClick(); setDonationType(value);
    const a = value==="voice"?pricing.minVoice:value==="hypersound"?pricing.minHypersound:value==="media"?pricing.minMedia:pricing.minText;
    setFormData({ name: formData.name, amount: String(a), message: "" });
    setSelectedHypersound(null); setMediaUrl(null); setMediaType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razorpayLoaded || !(window as any).Razorpay) { playError(); push("Payment system loading", "⚠", "warn"); return; }
    const amount = Number(formData.amount);
    if (!formData.name) { playError(); push("Tell us your name first!", "✖", "err"); return; }
    if (!amount || amount <= 0) { playError(); push("Enter an amount!", "✖", "err"); return; }
    const min = donationType==="voice"?pricing.minVoice:donationType==="hypersound"?pricing.minHypersound:donationType==="media"?pricing.minMedia:pricing.minText;
    if (amount < min) { playError(); push(`Min for ${donationType}: ${currencySymbol}${min}`, "✖", "err"); return; }
    if (donationType==="voice" && !voiceRecorder.audioBlob) { playError(); push("Record your voice first!", "⚠", "warn"); return; }
    if (donationType==="hypersound" && !selectedHypersound) { playError(); push("Pick a sound!", "⚠", "warn"); return; }
    if (donationType==="media" && !mediaUrl) { playError(); push("Upload your media!", "⚠", "warn"); return; }
    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessing(true); push("Getting things ready...", "✦", "default");
    try {
      let voiceMessageUrl: string | null = null;
      if (donationType==="voice" && voiceRecorder.audioBlob) {
        const base64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(voiceRecorder.audioBlob!); });
        const { data, error } = await supabase.functions.invoke("upload-voice-message-direct", { body: { voiceData: base64, streamerSlug: "gaming_with_latifa" } });
        if (error) throw error; voiceMessageUrl = data.voice_message_url;
      }
      const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
        body: { streamer_slug:"gaming_with_latifa", name:formData.name, amount:Number(formData.amount), message:donationType==="text"?formData.message:null, voiceMessageUrl, hypersoundUrl:donationType==="hypersound"?selectedHypersound:null, mediaUrl:donationType==="media"?mediaUrl:null, mediaType, currency:selectedCurrency }
      });
      if (error) throw error;
      new (window as any).Razorpay({
        key: data.razorpay_key_id, amount: data.amount, currency: data.currency, order_id: data.razorpay_order_id,
        name: "Gaming With Latifa", description: "Support Gaming With Latifa 💜",
        handler: () => { playSuccess(); setRedirectUrl(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`); setShowSuccess(true); },
        modal: { ondismiss: () => navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`) },
        theme: { color: "#a855f7" },
      }).open();
    } catch { playError(); push("Payment failed. Try again.", "✖", "err"); }
    finally { setIsProcessing(false); }
  };

  const msgPct = maxMsgLen > 0 ? (formData.message.length / maxMsgLen) * 100 : 0;
  const msgClr = msgPct > 90 ? '#ef4444' : msgPct > 70 ? 'var(--lf-pink)' : 'var(--lf-purple)';
  const prefix = "Gaming With ";
  const dispPre = displayed.slice(0, Math.min(displayed.length, prefix.length));
  const dispSuf = displayed.length > prefix.length ? displayed.slice(prefix.length) : '';

  const TYPES = [
    { key:'text'       as const, emoji:'💬', label:'Text',  min:pricing.minText },
    { key:'voice'      as const, emoji:'🎤', label:'Voice', min:pricing.minVoice },
    { key:'hypersound' as const, emoji:'🔊', label:'Sound', min:pricing.minHypersound },
    { key:'media'      as const, emoji:'🖼️', label:'Media', min:pricing.minMedia },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }}/>

      {showSuccess && <SuccessOverlay amount={formData.amount} currency={currencySymbol} onDone={() => navigate(redirectUrl)}/>}

      <div className="lf-killfeed">
        {msgs.map(m => (
          <div key={m.id} className={cn('lf-kf', m.variant==='err'?'lf-kf-err':m.variant==='warn'?'lf-kf-warn':'')}>
            <span className="lf-kf-icon">{m.icon}</span>
            <span className="lf-kf-text">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="lf-root">

        {/* ── HERO — full width photo ── */}
        <div className="lf-hero">
          <img src={latifaAvatar} alt="Gaming With Latifa" className="lf-hero-img"/>
          <div className="lf-hero-overlay"/>
          <div className="lf-hero-vignette"/>
          <div className="lf-hero-glow"/>
          <div className="lf-live">
            <div className="lf-live-dot"/>
            <span className="lf-live-text">LIVE</span>
          </div>
        </div>

        {/* ── Name block ── */}
        <div className="lf-nameblock">
          <div className="lf-name">
            {dispPre}
            {dispSuf && <span className="lf-name-pink">{dispSuf}</span>}
            {!done && <span className="lf-name-cursor"/>}
          </div>
          <div className="lf-sub">Drop in and show some love 💜</div>
          <div className="lf-stats">
            <div className="lf-stat"><span className="lf-stat-val">BGMI</span><span className="lf-stat-lbl">Game</span></div>
            <div className="lf-stat"><span className="lf-stat-val">🇮🇳 IND</span><span className="lf-stat-lbl">Region</span></div>
            <div className="lf-stat"><span className="lf-stat-val">PRO</span><span className="lf-stat-lbl">Tier</span></div>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="lf-form-section">

            {/* Name */}
            <div>
              <div className="lf-section-title">Your Name</div>
              <div className="lf-input-wrap">
                <input
                  name="name" value={formData.name} required
                  className="lf-input" placeholder="What do we call you?"
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Support type */}
            <div>
              <div className="lf-section-title">Support Type</div>
              <div className="lf-types">
                {TYPES.map(t => (
                  <button key={t.key} type="button" onClick={() => handleTypeChange(t.key)} className={cn('lf-type-tile', donationType===t.key?'lf-on':'')}>
                    <span className="lf-tile-emoji">{t.emoji}</span>
                    <span className="lf-tile-name">{t.label}</span>
                    <span className="lf-tile-min">{currencySymbol}{t.min}+</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="lf-section-title">Amount</div>
              <div className="lf-amt-row">
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" className="lf-cur-btn">
                      <span>{currencySymbol} {selectedCurrency}</span>
                      <ChevronsUpDown style={{ width:11, height:11, opacity:0.4, marginLeft:'auto', flexShrink:0 }}/>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search currency..."/>
                      <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {SUPPORTED_CURRENCIES.map(c => (
                            <CommandItem key={c.code} value={c.code} onSelect={() => { setSelectedCurrency(c.code); setCurrencyOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", selectedCurrency===c.code?"opacity-100":"opacity-0")}/>
                              {c.symbol} {c.code}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="lf-input-wrap" style={{ flex:1 }}>
                  <input
                    name="amount" type="number" value={formData.amount} min="1"
                    placeholder="0" required className="lf-input"
                    readOnly={donationType==="hypersound"}
                    style={donationType==="hypersound"?{opacity:0.4,cursor:'not-allowed'}:{}}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              {pricing.ttsEnabled && <p className="lf-hint">⚡ TTS above {currencySymbol}{pricing.minTts}</p>}
            </div>

            {/* Text message */}
            {donationType==="text" && (
              <div className="lf-fu">
                <div className="lf-char-row">
                  <div className="lf-section-title" style={{margin:0}}>Your Message</div>
                  <span className="lf-char-count" style={{color:msgClr}}>{formData.message.length}/{maxMsgLen}</span>
                </div>
                <textarea
                  name="message" value={formData.message} rows={3}
                  maxLength={maxMsgLen} placeholder="Say something to Latifa!"
                  className="lf-textarea" onChange={handleInputChange}
                />
                <div className="lf-cbar"><div className="lf-cbar-fill" style={{width:`${msgPct}%`,background:msgClr}}/></div>
              </div>
            )}

            {/* Voice */}
            {donationType==="voice" && (
              <div className="lf-fu">
                <div className="lf-section-title">Voice Message</div>
                <div className="lf-panel lf-panel-pk">
                  <EnhancedVoiceRecorder
                    controller={voiceRecorder} onRecordingComplete={() => {}}
                    maxDurationSeconds={getVoiceDur(currentAmount)}
                    requiredAmount={pricing.minVoice} currentAmount={currentAmount}
                    brandColor="#a855f7"
                  />
                </div>
              </div>
            )}

            {/* HyperSound */}
            {donationType==="hypersound" && (
              <div className="lf-fu">
                <div className="lf-section-title">Pick a Sound</div>
                <div className="lf-panel lf-panel-mg">
                  <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                </div>
              </div>
            )}

            {/* Media */}
            {donationType==="media" && (
              <div className="lf-fu">
                <div className="lf-section-title">Upload Media</div>
                <div className="lf-panel">
                  <MediaUploader
                    streamerSlug="gaming_with_latifa"
                    onMediaUploaded={(url, type) => { setMediaUrl(url); setMediaType(type); }}
                    onMediaRemoved={() => { setMediaUrl(null); setMediaType(null); }}
                  />
                </div>
              </div>
            )}

            <RewardsBanner amount={currentAmount} currency={selectedCurrency}/>

            {/* Submit */}
            <button type="submit" className="lf-btn" disabled={isProcessing}>
              {isProcessing ? (
                <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                  <span className="lf-spinner"/> Sending...
                </span>
              ) : (
                <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <Heart style={{width:16,height:16}}/> Support {currencySymbol}{formData.amount||'0'} 💜
                </span>
              )}
            </button>

            <p style={{fontSize:10,fontWeight:600,color:'rgba(240,230,255,0.18)',textAlign:'center',lineHeight:1.6,fontFamily:'Nunito,sans-serif'}}>
              Phone numbers collected by Razorpay as per RBI regulations
            </p>
            <DonationPageFooter brandColor="#a855f7"/>
          </div>
        </form>
      </div>
    </>
  );
};

export default GamingWithLatifa;
