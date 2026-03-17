import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import HyperSoundSelector from "@/components/HyperSoundSelector";
import MediaUploader from "@/components/MediaUploader";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import { getMaxMessageLength } from "@/utils/getMaxMessageLength";
import DonationPageFooter from "@/components/DonationPageFooter";
import RewardsBanner from "@/components/RewardsBanner";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap');

  :root {
    --lf-purple:      #a855f7;
    --lf-purple-dark: #7c3aed;
    --lf-pink:        #f472b6;
    --lf-pink-dark:   #db2777;
    --lf-orange:      #fb923c;
    --lf-orange-dark: #ea580c;
    --lf-bg:          #120a1e;
    --lf-card:        #1a1028;
    --lf-text:        #e9d5ff;
    --lf-muted:       rgba(233,213,255,0.45);
  }

  * { box-sizing: border-box; }
  .lf-root { font-family: 'Nunito', sans-serif; }

  .lf-page {
    width: 100vw; height: 100dvh;
    background: var(--lf-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  .lf-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

  .lf-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background:
      radial-gradient(ellipse 60% 50% at 20% 20%, rgba(168,85,247,0.2) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 80% 75%, rgba(244,114,182,0.15) 0%, transparent 55%),
      radial-gradient(ellipse 40% 35% at 55% 50%, rgba(251,146,60,0.06) 0%, transparent 60%);
  }

  .lf-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  .lf-card {
    width: 420px; background: var(--lf-card);
    border-radius: 20px;
    border: 1px solid rgba(168,85,247,0.3);
    box-shadow: 0 0 0 1px rgba(244,114,182,0.08), 0 0 40px rgba(168,85,247,0.2), 0 0 80px rgba(168,85,247,0.08), 0 30px 80px rgba(0,0,0,0.7);
    overflow: hidden; position: relative;
  }

  .lf-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 10;
    background: linear-gradient(90deg, var(--lf-purple-dark), var(--lf-purple), var(--lf-pink), var(--lf-orange), var(--lf-pink), var(--lf-purple));
    background-size: 200% 100%; animation: lf-shift 3s linear infinite;
    box-shadow: 0 0 10px var(--lf-purple), 0 0 22px rgba(244,114,182,0.4);
  }
  @keyframes lf-shift { 0%{background-position:0%} 100%{background-position:200%} }

  /* ── HERO ── */
  .lf-hero {
    position: relative; padding: 24px 22px 20px;
    display: flex; flex-direction: column; align-items: center;
    overflow: hidden;
    background: linear-gradient(160deg, rgba(168,85,247,0.18) 0%, rgba(244,114,182,0.1) 60%, transparent 100%);
    border-bottom: 1px solid rgba(168,85,247,0.18);
    text-align: center;
  }

  /* ── BGMI animated ring ── */
  .lf-ring-wrap { position: relative; width: 80px; height: 80px; margin-bottom: 14px; }
  .lf-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid transparent; }
  .lf-ring-1 { border-color: var(--lf-purple); animation: lf-spin 3s linear infinite; box-shadow: 0 0 12px rgba(168,85,247,0.5), inset 0 0 12px rgba(168,85,247,0.1); }
  .lf-ring-2 { inset: 8px; border-color: var(--lf-pink); animation: lf-spin 2s linear infinite reverse; box-shadow: 0 0 10px rgba(244,114,182,0.45); }
  .lf-ring-3 { inset: 16px; border-color: var(--lf-orange); animation: lf-spin 4s linear infinite; box-shadow: 0 0 8px rgba(251,146,60,0.4); }
  .lf-ring-dot { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 20px; height: 20px; border-radius: 50%; background: radial-gradient(circle, var(--lf-pink) 0%, var(--lf-purple) 100%); box-shadow: 0 0 16px var(--lf-pink), 0 0 30px rgba(168,85,247,0.5); animation: lf-dot-pulse 1.8s ease-in-out infinite; }
  .lf-ring-cross { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 48px; height: 48px; }
  .lf-ring-cross::before,.lf-ring-cross::after { content: ''; position: absolute; background: rgba(168,85,247,0.4); }
  .lf-ring-cross::before { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-50%); }
  .lf-ring-cross::after  { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); }
  .lf-ring-1::before,.lf-ring-1::after { content: ''; position: absolute; width: 8px; height: 8px; background: var(--lf-card); border-radius: 50%; }
  .lf-ring-1::before { top: -4px; left: 50%; transform: translateX(-50%); }
  .lf-ring-1::after  { bottom: -4px; left: 50%; transform: translateX(-50%); }

  @keyframes lf-spin { to{transform:rotate(360deg);} }
  @keyframes lf-dot-pulse { 0%,100%{transform:translate(-50%,-50%) scale(1);} 50%{transform:translate(-50%,-50%) scale(1.2);} }

  @keyframes lf-name-in { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
  .lf-name { font-family:'Fredoka One',cursive; font-size:28px; color:#fff; line-height:1; letter-spacing:0.02em; text-shadow:0 0 20px rgba(168,85,247,0.5),0 0 40px rgba(244,114,182,0.25); animation:lf-name-in .5s ease .1s both; }
  .lf-name span { color: var(--lf-pink); }
  .lf-hero-sub { font-size:11px; font-weight:700; color:var(--lf-muted); margin-top:5px; letter-spacing:0.12em; text-transform:uppercase; animation:lf-name-in .5s ease .25s both; }

  @keyframes lf-live-pulse { 0%,100%{opacity:1;box-shadow:0 0 6px var(--lf-pink);} 50%{opacity:0.5;box-shadow:none;} }
  .lf-live { display:inline-flex; align-items:center; gap:5px; margin-top:10px; background:rgba(244,114,182,0.12); border:1px solid rgba(244,114,182,0.4); border-radius:20px; padding:4px 12px; animation:lf-name-in .5s ease .4s both; }
  .lf-live-dot { width:6px; height:6px; border-radius:50%; background:var(--lf-pink); animation:lf-live-pulse 1.4s ease-in-out infinite; }
  .lf-live-text { font-size:9px; font-weight:800; color:var(--lf-pink); letter-spacing:0.15em; text-shadow:0 0 8px var(--lf-pink); }

  /* ── Body ── */
  .lf-body { padding:16px 18px 18px; display:flex; flex-direction:column; gap:13px; }
  .lf-lbl { font-size:10px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; display:block; margin-bottom:6px; color:rgba(168,85,247,0.8); }

  .lf-iw input { width:100% !important; background:rgba(168,85,247,0.06) !important; border:1.5px solid rgba(168,85,247,0.25) !important; border-radius:10px !important; color:var(--lf-text) !important; font-family:'Nunito',sans-serif !important; font-size:15px !important; font-weight:700 !important; padding:9px 13px !important; outline:none !important; transition:all .18s !important; caret-color:var(--lf-pink); }
  .lf-iw input:focus { border-color:var(--lf-purple) !important; background:rgba(168,85,247,0.1) !important; box-shadow:0 0 0 3px rgba(168,85,247,0.15) !important; }
  .lf-iw input::placeholder { color:rgba(233,213,255,0.25) !important; }
  .lf-iw input:disabled,.lf-iw input[readonly] { opacity:.4 !important; cursor:not-allowed !important; }

  .lf-ta { width:100%; background:rgba(168,85,247,0.06); border:1.5px solid rgba(168,85,247,0.25); border-radius:10px; color:var(--lf-text); font-family:'Nunito',sans-serif; font-size:14px; font-weight:700; padding:9px 13px; resize:none; outline:none; line-height:1.5; caret-color:var(--lf-pink); transition:all .18s; }
  .lf-ta:focus { border-color:var(--lf-purple); background:rgba(168,85,247,0.1); box-shadow:0 0 0 3px rgba(168,85,247,0.12); }
  .lf-ta::placeholder { color:rgba(233,213,255,0.25); }

  .lf-cbar { height:3px; margin-top:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; }
  .lf-cbar-fill { height:100%; border-radius:3px; transition:width .12s,background .2s; }

  /* ── Type Buttons ── */
  .lf-types { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; }
  .lf-tb { border:none; cursor:pointer; outline:none; border-radius:12px; padding:10px 4px 9px; text-align:center; background:rgba(168,85,247,0.07); border:1.5px solid rgba(168,85,247,0.2); transition:all .15s; }
  .lf-tb:hover { border-color:rgba(168,85,247,0.45); background:rgba(168,85,247,0.12); transform:translateY(-1px); }
  .lf-tb:active { transform:translateY(1px); }
  .lf-tb.lf-on { background:rgba(168,85,247,0.18); border-color:var(--lf-purple); box-shadow:0 0 14px rgba(168,85,247,0.35),0 4px 12px rgba(0,0,0,0.3); transform:translateY(-2px); }
  .lf-tb-emoji { font-size:18px; display:block; line-height:1; }
  .lf-tb-name { font-size:9px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; display:block; margin-top:4px; color:rgba(233,213,255,0.5); transition:color .15s; }
  .lf-tb.lf-on .lf-tb-name { color:var(--lf-purple); text-shadow:0 0 10px rgba(168,85,247,0.6); }
  .lf-tb-min { font-size:8px; font-weight:700; color:rgba(251,146,60,0.6); display:block; margin-top:2px; }

  .lf-amt { display:flex; gap:8px; }
  .lf-cur { display:flex; align-items:center; justify-content:space-between; gap:4px; background:rgba(168,85,247,0.06) !important; border:1.5px solid rgba(168,85,247,0.25) !important; border-radius:10px !important; color:var(--lf-text) !important; font-family:'Nunito',sans-serif !important; font-size:13px !important; font-weight:800 !important; padding:0 11px !important; min-width:90px; height:40px; cursor:pointer; transition:all .18s; flex-shrink:0; }
  .lf-cur:hover { border-color:var(--lf-purple) !important; }

  .lf-div { height:1px; background:linear-gradient(90deg,transparent,rgba(168,85,247,0.3),rgba(244,114,182,0.2),transparent); position:relative; }
  .lf-div::before { content:'✦'; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:8px; color:rgba(244,114,182,0.5); background:var(--lf-card); padding:0 6px; }

  .lf-sp { border-radius:12px; padding:10px 12px; }
  .lf-sp-pu { background:rgba(168,85,247,0.07); border:1.5px solid rgba(168,85,247,0.25); }
  .lf-sp-pk { background:rgba(244,114,182,0.06); border:1.5px solid rgba(244,114,182,0.25); }
  .lf-sp-or { background:rgba(251,146,60,0.06); border:1.5px solid rgba(251,146,60,0.25); }

  /* ── Button ── */
  .lf-btn { width:100%; padding:14px; border:none; cursor:pointer; font-family:'Fredoka One',cursive; font-size:16px; font-weight:400; letter-spacing:.04em; color:#fff; border-radius:14px; background:linear-gradient(135deg,var(--lf-purple-dark) 0%,var(--lf-purple) 40%,var(--lf-pink-dark) 100%); box-shadow:0 4px 20px rgba(168,85,247,0.45),0 2px 8px rgba(0,0,0,0.3); transition:all .18s; position:relative; overflow:hidden; }
  .lf-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(168,85,247,0.55),0 4px 12px rgba(0,0,0,0.3); }
  .lf-btn:active:not(:disabled) { transform:translateY(1px); box-shadow:0 2px 10px rgba(168,85,247,0.35); }
  .lf-btn:disabled { opacity:.4; cursor:not-allowed; }
  .lf-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent); transform:skewX(-20deg); transition:left .6s; }
  .lf-btn:hover:not(:disabled)::before { left:160%; }

  .lf-hint { font-size:10px; font-weight:700; color:rgba(251,146,60,0.6); margin-top:3px; }

  @keyframes lf-fu { from{opacity:0;transform:translateY(5px);} to{opacity:1;transform:translateY(0);} }
  .lf-fu { animation:lf-fu .18s ease forwards; }

  @keyframes lf-spin-a { to{transform:rotate(360deg);} }
  .lf-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; display:inline-block; animation:lf-spin-a .65s linear infinite; }

  @keyframes lf-in { from{opacity:0;transform:scale(0.96) translateY(10px);} to{opacity:1;transform:scale(1) translateY(0);} }
  .lf-in { animation:lf-in .5s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Success Overlay ── */
  @keyframes lf-ov-in  { from{opacity:0;} to{opacity:1;} }
  @keyframes lf-ov-out { from{opacity:1;} to{opacity:0;} }
  @keyframes lf-pop    { 0%{transform:scale(0.5);opacity:0;} 60%{transform:scale(1.15);} 100%{transform:scale(1);opacity:1;} }
  @keyframes lf-conf   { 0%{transform:translateY(0) rotate(0deg);opacity:1;} 100%{transform:translateY(80px) rotate(720deg);opacity:0;} }
  @keyframes lf-bar-fill { from{width:0;} to{width:100%;} }

  .lf-success-overlay { position:fixed; inset:0; z-index:99999; background:rgba(10,5,20,0.93); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; animation:lf-ov-in .3s ease forwards; }
  .lf-success-overlay.lf-ov-exit { animation:lf-ov-out .4s ease forwards; }
  .lf-conf-wrap { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  .lf-conf-piece { position:absolute; width:8px; height:8px; border-radius:2px; animation:lf-conf 1.4s ease-out both; }
  .lf-success-emoji { font-size:64px; animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .1s both; }
  .lf-success-title { font-family:'Fredoka One',cursive; font-size:36px; color:#fff; text-shadow:0 0 20px var(--lf-pink),0 0 40px rgba(168,85,247,0.4); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .2s both; }
  .lf-success-sub { font-size:12px; font-weight:700; color:var(--lf-muted); letter-spacing:0.1em; animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .3s both; }
  .lf-success-amount { font-family:'Fredoka One',cursive; font-size:20px; color:var(--lf-orange); text-shadow:0 0 12px rgba(251,146,60,0.5); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .4s both; }
  .lf-success-bar-wrap { width:200px; height:4px; background:rgba(255,255,255,0.1); border-radius:4px; margin-top:16px; overflow:hidden; animation:lf-pop .4s ease .5s both; }
  .lf-success-bar { height:100%; border-radius:4px; background:linear-gradient(90deg,var(--lf-purple),var(--lf-pink),var(--lf-orange)); animation:lf-bar-fill 2.4s linear .6s both; }
  .lf-success-redirect { font-size:10px; font-weight:700; color:rgba(233,213,255,0.3); letter-spacing:0.1em; margin-top:8px; animation:lf-pop .4s ease .7s both; }

  /* ── Kill Feed ── */
  .lf-killfeed { position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:6px; pointer-events:none; }
  @keyframes lf-kf-in { from{opacity:0;transform:translateX(16px);} to{opacity:1;transform:translateX(0);} }
  .lf-kf { display:flex; align-items:center; gap:8px; background:rgba(18,10,30,0.94); border:1px solid rgba(168,85,247,0.3); border-left:3px solid var(--lf-purple); padding:8px 14px; border-radius:8px; animation:lf-kf-in .2s ease forwards; min-width:200px; }
  .lf-kf-err  { border-left-color:#ef4444; }
  .lf-kf-warn { border-left-color:var(--lf-orange); }
  .lf-kf-icon { font-size:13px; flex-shrink:0; }
  .lf-kf-text { font-family:'Nunito',sans-serif; font-size:11px; font-weight:800; color:var(--lf-text); letter-spacing:0.04em; }
`;

/* ── Particle canvas ── */
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const COLORS = ['168,85,247','244,114,182','251,146,60'];
    type P = { x:number; y:number; r:number; vx:number; vy:number; alpha:number; color:string; };
    const ps: P[] = [];
    const spawn = () => ps.push({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:1.5+Math.random()*3, vx:(Math.random()-0.5)*0.4, vy:-0.2-Math.random()*0.3, alpha:0.2+Math.random()*0.5, color:COLORS[Math.floor(Math.random()*COLORS.length)] });
    for (let i=0;i<55;i++) spawn();
    let frame: number;
    const tick = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if (Math.random()<0.06) spawn();
      for (let i=ps.length-1;i>=0;i--) {
        const p=ps[i]; p.x+=p.vx; p.y+=p.vy;
        if (p.y<-10) { ps.splice(i,1); continue; }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${p.color},${p.alpha})`; ctx.fill();
      }
      frame=requestAnimationFrame(tick);
    };
    tick();
    const onResize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    window.addEventListener('resize',onResize);
    return ()=>{ cancelAnimationFrame(frame); window.removeEventListener('resize',onResize); };
  }, []);
  return <canvas ref={canvasRef} className="lf-canvas"/>;
};

/* ── Success Overlay ── */
const SuccessOverlay: React.FC<{ amount:string; currency:string; onDone:()=>void }> = ({ amount, currency, onDone }) => {
  const ref = useRef<HTMLDivElement>(null);
  const confetti = Array.from({length:24},(_,i)=>({
    left:`${Math.random()*100}%`, top:`${10+Math.random()*40}%`,
    bg:['#a855f7','#f472b6','#fb923c','#fbbf24','#34d399'][i%5],
    delay:`${Math.random()*0.5}s`, dur:`${1.2+Math.random()*0.6}s`, rot:`${Math.random()*360}deg`,
  }));
  useEffect(() => {
    const t=setTimeout(()=>{ ref.current?.classList.add('lf-ov-exit'); setTimeout(onDone,400); },3000);
    return ()=>clearTimeout(t);
  }, [onDone]);
  return (
    <div ref={ref} className="lf-success-overlay">
      <div className="lf-conf-wrap">
        {confetti.map((c,i)=>(
          <div key={i} className="lf-conf-piece" style={{left:c.left,top:c.top,background:c.bg,animationDelay:c.delay,animationDuration:c.dur,transform:`rotate(${c.rot})`}}/>
        ))}
      </div>
      <div className="lf-success-emoji">🎉</div>
      <div className="lf-success-title">Yay, Thanks!</div>
      <div className="lf-success-sub">You just supported Gaming With Latifa!</div>
      <div className="lf-success-amount">{currency}{amount} dropped! 💜</div>
      <div className="lf-success-bar-wrap"><div className="lf-success-bar"/></div>
      <div className="lf-success-redirect">Taking you to confirmation...</div>
    </div>
  );
};

/* ── Kill Feed ── */
type KFMsg = { id:number; text:string; icon:string; variant:'default'|'err'|'warn'; };
let kfId = 0;
const useKillFeed = () => {
  const [msgs, setMsgs] = useState<KFMsg[]>([]);
  const push = useCallback((text:string, icon='✦', variant:KFMsg['variant']='default') => {
    const id=++kfId; setMsgs(p=>[...p,{id,text,icon,variant}]);
    setTimeout(()=>setMsgs(p=>p.filter(m=>m.id!==id)),3200);
  }, []);
  return { msgs, push };
};

/* ── Audio ── */
const playClick   = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.setValueAtTime(660,c.currentTime); o.frequency.exponentialRampToValueAtTime(440,c.currentTime+0.05); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.07); o.start(); o.stop(c.currentTime+0.07); } catch {} };
const playSuccess = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=f; const t=c.currentTime+i*0.1; g.gain.setValueAtTime(0.06,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.15); o.start(t); o.stop(t+0.15); }); } catch {} };
const playError   = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.setValueAtTime(300,c.currentTime); o.frequency.exponentialRampToValueAtTime(150,c.currentTime+0.18); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.2); o.start(); o.stop(c.currentTime+0.2); } catch {} };

/* ── Main ── */
const GamingWithLatifa = () => {
  const navigate = useNavigate();
  const cardRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const { msgs, push } = useKillFeed();

  const [formData, setFormData]                       = useState({ name:"", amount:"", message:"" });
  const [selectedCurrency, setSelectedCurrency]       = useState("INR");
  const [currencyOpen, setCurrencyOpen]               = useState(false);
  const [donationType, setDonationType]               = useState<"text"|"voice"|"hypersound"|"media">("text");
  const [selectedHypersound, setSelectedHypersound]   = useState<string|null>(null);
  const [mediaUrl, setMediaUrl]                       = useState<string|null>(null);
  const [mediaType, setMediaType]                     = useState<string|null>(null);
  const [razorpayLoaded, setRazorpayLoaded]           = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showSuccess, setShowSuccess]                 = useState(false);
  const [redirectUrl, setRedirectUrl]                 = useState('');

  const { pricing }      = useStreamerPricing("gaming_with_latifa", selectedCurrency);
  const currencySymbol   = getCurrencySymbol(selectedCurrency);
  const currentAmount    = parseFloat(formData.amount) || 0;
  const maxMessageLength = getMaxMessageLength(pricing.messageCharTiers, currentAmount);

  const getVoiceDuration = (amount:number) => {
    if (selectedCurrency==="INR") { if (amount>=500) return 15; if (amount>=300) return 12; return 8; }
    if (amount>=6) return 15; if (amount>=4) return 12; return 8;
  };
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  const applyScale = useCallback(() => {
    const wrap=wrapRef.current; const card=cardRef.current; if (!wrap||!card) return;
    const scaleW=Math.min(1,(window.innerWidth-32)/420);
    const scaleH=card.scrollHeight>0?Math.min(1,(window.innerHeight-48)/card.scrollHeight):1;
    const scale=Math.min(scaleW,scaleH);
    wrap.style.transform=`scale(${scale})`; wrap.style.height=`${card.scrollHeight*scale}px`;
  }, []);

  useEffect(()=>{ const t=setTimeout(applyScale,80); window.addEventListener('resize',applyScale); return ()=>{ clearTimeout(t); window.removeEventListener('resize',applyScale); }; },[applyScale]);
  useEffect(()=>{ const t=setTimeout(applyScale,60); return ()=>clearTimeout(t); },[donationType,applyScale]);

  useEffect(()=>{
    const s=document.createElement("script"); s.src="https://checkout.razorpay.com/v1/checkout.js"; s.async=true;
    s.onload=()=>setRazorpayLoaded(true);
    s.onerror=()=>push("Payment gateway failed 😬","","err");
    document.body.appendChild(s);
    return ()=>{ if (document.body.contains(s)) document.body.removeChild(s); };
  },[]);

  const handleInputChange = (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const {name,value}=e.target; setFormData(prev=>({...prev,[name]:value}));
  };

  const handleDonationTypeChange = (value:"text"|"voice"|"hypersound"|"media") => {
    playClick(); setDonationType(value);
    const amount=value==="voice"?pricing.minVoice:value==="hypersound"?pricing.minHypersound:value==="media"?pricing.minMedia:pricing.minText;
    setFormData({name:formData.name,amount:String(amount),message:""});
    setSelectedHypersound(null); setMediaUrl(null); setMediaType(null);
  };

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!razorpayLoaded||!(window as any).Razorpay) { playError(); push("Payment system still loading 😅","","warn"); return; }
    const amount=Number(formData.amount);
    if (!formData.name) { playError(); push("Tell us your name first! 👀","","err"); return; }
    if (!amount||amount<=0) { playError(); push("Enter an amount! 💸","","err"); return; }
    const min=donationType==="voice"?pricing.minVoice:donationType==="hypersound"?pricing.minHypersound:donationType==="media"?pricing.minMedia:pricing.minText;
    if (amount<min) { playError(); push(`Min for ${donationType}: ${currencySymbol}${min} 😬`,"","err"); return; }
    if (donationType==="voice"&&!voiceRecorder.audioBlob) { playError(); push("Record your voice first 🎤","","warn"); return; }
    if (donationType==="hypersound"&&!selectedHypersound) { playError(); push("Pick a sound! 🔊","","warn"); return; }
    if (donationType==="media"&&!mediaUrl) { playError(); push("Upload your media! 🖼️","","warn"); return; }
    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    push("Getting things ready... 🎮","","default");
    try {
      let voiceMessageUrl:string|null=null;
      if (donationType==="voice"&&voiceRecorder.audioBlob) {
        const base64=await new Promise<string>((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve((r.result as string).split(",")[1]); r.onerror=reject; r.readAsDataURL(voiceRecorder.audioBlob!); });
        const {data,error}=await supabase.functions.invoke("upload-voice-message-direct",{body:{voiceData:base64,streamerSlug:"gaming_with_latifa"}});
        if (error) throw error;
        voiceMessageUrl=data.voice_message_url;
      }
      const {data,error}=await supabase.functions.invoke("create-razorpay-order-unified",{
        body:{ streamer_slug:"gaming_with_latifa", name:formData.name, amount:Number(formData.amount), message:donationType==="text"?formData.message:null, voiceMessageUrl, hypersoundUrl:donationType==="hypersound"?selectedHypersound:null, mediaUrl:donationType==="media"?mediaUrl:null, mediaType, currency:selectedCurrency }
      });
      if (error) throw error;
      new (window as any).Razorpay({
        key:data.razorpay_key_id, amount:data.amount, currency:data.currency, order_id:data.razorpay_order_id,
        name:"Gaming With Latifa", description:"Support Gaming With Latifa 💜",
        handler:()=>{ playSuccess(); setRedirectUrl(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`); setShowSuccess(true); },
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`)},
        theme:{color:"#a855f7"},
      }).open();
    } catch {
      playError(); push("Oops! Something went wrong 😬","","err");
    } finally { setIsProcessingPayment(false); }
  };

  const msgPct=maxMessageLength>0?(formData.message.length/maxMessageLength)*100:0;
  const msgClr=msgPct>90?'#ef4444':msgPct>70?'var(--lf-orange)':'var(--lf-purple)';

  const TYPES=[
    {key:'text'       as const,emoji:'💬',label:'Text', min:pricing.minText,      nc:'var(--lf-purple)'},
    {key:'voice'      as const,emoji:'🎤',label:'Voice',min:pricing.minVoice,     nc:'var(--lf-pink)'},
    {key:'hypersound' as const,emoji:'🔊',label:'Sound',min:pricing.minHypersound,nc:'var(--lf-orange)'},
    {key:'media'      as const,emoji:'🖼️',label:'Media',min:pricing.minMedia,     nc:'var(--lf-pink)'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <ParticleCanvas/>

      {showSuccess&&<SuccessOverlay amount={formData.amount} currency={currencySymbol} onDone={()=>navigate(redirectUrl)}/>}

      <div className="lf-killfeed">
        {msgs.map(m=>(
          <div key={m.id} className={cn('lf-kf',m.variant==='err'?'lf-kf-err':m.variant==='warn'?'lf-kf-warn':'')}>
            <span className="lf-kf-icon">{m.icon}</span>
            <span className="lf-kf-text">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="lf-root lf-page">
        <div className="lf-atm"/>

        <div ref={wrapRef} className="lf-scale-wrap" style={{transformOrigin:'top center'}}>
          <div ref={cardRef} className="lf-card lf-in">

            {/* HERO */}
            <div className="lf-hero">
              <div className="lf-ring-wrap">
                <div className="lf-ring lf-ring-1"/>
                <div className="lf-ring lf-ring-2"/>
                <div className="lf-ring lf-ring-3"/>
                <div className="lf-ring-cross"/>
                <div className="lf-ring-dot"/>
              </div>
              <div className="lf-name">Gaming With <span>Latifa</span></div>
              <div className="lf-hero-sub">Drop your support 🎯</div>
              <div className="lf-live">
                <div className="lf-live-dot"/>
                <span className="lf-live-text">LIVE</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="lf-body">

                <div>
                  <label className="lf-lbl">Your name</label>
                  <div className="lf-iw"><Input name="name" value={formData.name} onChange={handleInputChange} placeholder="What do we call you? 👋" required/></div>
                </div>

                <div>
                  <label className="lf-lbl">How are you supporting?</label>
                  <div className="lf-types">
                    {TYPES.map(t=>(
                      <button key={t.key} type="button" onClick={()=>handleDonationTypeChange(t.key)} className={cn('lf-tb',donationType===t.key?'lf-on':'')}>
                        <span className="lf-tb-emoji">{t.emoji}</span>
                        <span className="lf-tb-name" style={{color:donationType===t.key?t.nc:undefined}}>{t.label}</span>
                        <span className="lf-tb-min">{currencySymbol}{t.min}+</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="lf-lbl">Amount</label>
                  <div className="lf-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="lf-cur">
                          <span>{currencySymbol} {selectedCurrency}</span>
                          <ChevronsUpDown style={{width:11,height:11,opacity:0.4,marginLeft:'auto',flexShrink:0}}/>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[220px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search currency..."/>
                          <CommandList>
                            <CommandEmpty>No currency found.</CommandEmpty>
                            <CommandGroup>
                              {SUPPORTED_CURRENCIES.map(c=>(
                                <CommandItem key={c.code} value={c.code} onSelect={()=>{setSelectedCurrency(c.code);setCurrencyOpen(false);}}>
                                  <Check className={cn("mr-2 h-4 w-4",selectedCurrency===c.code?"opacity-100":"opacity-0")}/>
                                  {c.symbol} {c.code}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="lf-iw" style={{flex:1}}>
                      <Input name="amount" type="number" value={formData.amount} onChange={handleInputChange} min="1" placeholder="0" readOnly={donationType==="hypersound"} required/>
                    </div>
                  </div>
                  {pricing.ttsEnabled&&<p className="lf-hint">⚡ TTS above {currencySymbol}{pricing.minTts}</p>}
                </div>

                <div className="lf-div"/>

                {donationType==="text"&&(
                  <div className="lf-fu">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <label className="lf-lbl" style={{margin:0}}>Your message</label>
                      <span style={{fontSize:10,fontWeight:800,color:msgClr}}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Say something fun! 😄" className="lf-ta" rows={2} maxLength={maxMessageLength}/>
                    <div className="lf-cbar"><div className="lf-cbar-fill" style={{width:`${msgPct}%`,background:msgClr}}/></div>
                  </div>
                )}

                {donationType==="voice"&&(
                  <div className="lf-fu">
                    <label className="lf-lbl">Voice message</label>
                    <div className="lf-sp lf-sp-pk">
                      <EnhancedVoiceRecorder controller={voiceRecorder} onRecordingComplete={()=>{}} maxDurationSeconds={getVoiceDuration(currentAmount)} requiredAmount={pricing.minVoice} currentAmount={currentAmount} brandColor="#a855f7"/>
                    </div>
                  </div>
                )}

                {donationType==="hypersound"&&(
                  <div className="lf-fu lf-sp lf-sp-or">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>🔊</span>
                      <span style={{fontSize:12,fontWeight:800,color:'var(--lf-orange)',fontFamily:'Nunito,sans-serif'}}>Pick a HyperSound!</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                  </div>
                )}

                {donationType==="media"&&(
                  <div className="lf-fu lf-sp lf-sp-pu">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>🖼️</span>
                      <span style={{fontSize:12,fontWeight:800,color:'var(--lf-purple)',fontFamily:'Nunito,sans-serif'}}>Drop your media!</span>
                    </div>
                    <MediaUploader streamerSlug="gaming_with_latifa" onMediaUploaded={(url,type)=>{setMediaUrl(url);setMediaType(type);}} onMediaRemoved={()=>{setMediaUrl(null);setMediaType(null);}}/>
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                <button type="submit" className="lf-btn" disabled={isProcessingPayment}>
                  {isProcessingPayment?(
                    <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                      <span className="lf-spin"/> Hang on...
                    </span>
                  ):(
                    <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      <Heart style={{width:16,height:16}}/>
                      Support {currencySymbol}{formData.amount||'0'} 💜
                    </span>
                  )}
                </button>

                <p style={{fontSize:9,fontWeight:700,color:'rgba(233,213,255,0.2)',textAlign:'center',lineHeight:1.6,fontFamily:'Nunito,sans-serif'}}>
                  Phone numbers collected by Razorpay as per RBI regulations
                </p>
                <DonationPageFooter brandColor="#a855f7"/>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamingWithLatifa;
