import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Crosshair } from "lucide-react";
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
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&family=Black+Ops+One&display=swap');

  :root {
    --bz-gold:        #c4a747;
    --bz-gold-dark:   #8a7a3a;
    --bz-green:       #4a5c3e;
    --bz-green-light: #6a8a55;
    --bz-orange:      #e08020;
    --bz-red:         #e04040;
    --bz-cyan:        #00eeff;
    --bz-bg:          #060804;
    --bz-card:        #0a0c07;
    --bz-text:        #d4c9a8;
  }

  * { box-sizing: border-box; }
  .bz-root { font-family: 'Rajdhani', sans-serif; }

  .bz-page {
    width: 100vw; height: 100dvh;
    background: var(--bz-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  .bz-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.35; }

  .bz-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background:
      radial-gradient(ellipse 65% 50% at 10% 15%, rgba(74,92,62,0.2) 0%, transparent 60%),
      radial-gradient(ellipse 55% 45% at 88% 80%, rgba(196,167,71,0.08) 0%, transparent 55%);
  }

  .bz-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.03;
    background-image: linear-gradient(rgba(196,167,71,1) 1px, transparent 1px), linear-gradient(90deg, rgba(196,167,71,1) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .bz-scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 2;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px);
  }

  .bz-scale-wrap { width: 420px; transform-origin: top center; position: relative; z-index: 10; }

  .bz-card {
    width: 420px; background: var(--bz-card); border-radius: 2px;
    border: 1px solid rgba(74,92,62,0.5);
    box-shadow: 0 0 0 1px rgba(196,167,71,0.05), 0 0 30px rgba(74,92,62,0.18), 0 0 70px rgba(74,92,62,0.07), 0 30px 80px rgba(0,0,0,0.9);
    overflow: hidden;
    clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px));
    position: relative;
  }

  .bz-card::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 100;
    background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px);
  }

  .bz-bracket { position: absolute; width: 14px; height: 14px; z-index: 101; pointer-events: none; }
  .bz-bracket-tl { top: 5px; left: 5px; border-top: 1.5px solid var(--bz-gold); border-left: 1.5px solid var(--bz-gold); opacity: 0.6; }
  .bz-bracket-tr { top: 5px; right: 28px; border-top: 1.5px solid var(--bz-gold); border-right: 1.5px solid var(--bz-gold); opacity: 0.6; }
  .bz-bracket-bl { bottom: 28px; left: 5px; border-bottom: 1.5px solid var(--bz-gold); border-left: 1.5px solid var(--bz-gold); opacity: 0.6; }
  .bz-bracket-br { bottom: 5px; right: 5px; border-bottom: 1.5px solid var(--bz-gold); border-right: 1.5px solid var(--bz-gold); opacity: 0.6; }

  /* ── HERO ── */
  .bz-hero {
    position: relative; padding: 18px 22px 16px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(74,92,62,0.22) 0%, rgba(40,55,30,0.18) 60%, transparent 100%);
    border-bottom: 1px solid rgba(74,92,62,0.3);
  }
  .bz-hero::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--bz-green), var(--bz-gold), var(--bz-green-light), var(--bz-gold), var(--bz-green));
    background-size: 200% 100%; animation: bz-shift 4s linear infinite;
    box-shadow: 0 0 8px var(--bz-gold), 0 0 20px rgba(196,167,71,0.3);
  }
  .bz-hero::after {
    content: ''; position: absolute; bottom: 0; right: 0;
    width: 0; height: 0; border-style: solid;
    border-width: 0 0 20px 20px;
    border-color: transparent transparent rgba(196,167,71,0.18) transparent;
  }
  @keyframes bz-shift { 0%{background-position:0%} 100%{background-position:200%} }

  .bz-hero-blob {
    position: absolute; top: -40px; right: -40px; width: 160px; height: 160px;
    border-radius: 50%; background: radial-gradient(circle, rgba(74,92,62,0.28) 0%, transparent 65%); pointer-events: none;
  }

  .bz-operator-tag { display: flex; flex-direction: column; position: relative; z-index: 1; }
  .bz-tag-prefix { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:rgba(196,167,71,0.45); letter-spacing:0.25em; text-transform:uppercase; margin-bottom:3px; }

  @keyframes bz-glitch {
    0%,90%,100% { transform:none; text-shadow:none; clip-path:none; opacity:1; }
    91% { transform:translateX(-3px); text-shadow:3px 0 var(--bz-gold),-3px 0 var(--bz-cyan); }
    92% { transform:translateX(3px) skewX(-4deg); text-shadow:-3px 0 #ff003c,3px 0 var(--bz-cyan); clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%); }
    93% { transform:translateX(-2px); text-shadow:2px 0 var(--bz-cyan),-2px 0 var(--bz-gold); clip-path:none; }
    94% { transform:translateX(2px) skewX(3deg); text-shadow:none; opacity:0.8; }
    95% { transform:none; opacity:1; }
    96% { transform:translateX(-1px); text-shadow:1px 0 #ff003c; clip-path:polygon(0 60%,100% 60%,100% 80%,0 80%); }
    97% { transform:none; clip-path:none; }
  }

  .bz-name {
    font-family:'Black Ops One',cursive; font-size:30px; font-weight:400; color:#fff;
    line-height:1; letter-spacing:0.08em; animation:bz-glitch 9s infinite;
    position:relative; z-index:1; text-shadow:0 0 20px rgba(196,167,71,0.2);
  }
  .bz-hero-sub { font-size:9px; font-weight:600; color:rgba(255,255,255,0.25); margin-top:5px; position:relative; z-index:1; letter-spacing:0.18em; text-transform:uppercase; font-family:'Orbitron',monospace; }

  @keyframes bz-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  .bz-live { display:inline-flex; align-items:center; gap:5px; background:rgba(74,92,62,0.15); border:1px solid rgba(106,138,85,0.45); padding:5px 11px; flex-shrink:0; position:relative; z-index:1; clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
  .bz-live-dot { width:5px; height:5px; border-radius:50%; background:var(--bz-green-light); animation:bz-pulse 1.2s ease-in-out infinite; }
  .bz-live-text { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; color:var(--bz-green-light); letter-spacing:0.18em; text-shadow:0 0 8px var(--bz-green-light); }

  /* ── Body ── */
  .bz-body { padding:14px 18px 16px; display:flex; flex-direction:column; gap:12px; }
  .bz-lbl { font-family:'Orbitron',monospace; font-size:8px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; display:block; margin-bottom:6px; color:rgba(196,167,71,0.55); }

  .bz-iw { position:relative; }
  .bz-iw input {
    width:100% !important; background:rgba(74,92,62,0.05) !important; border:1px solid rgba(74,92,62,0.3) !important;
    border-radius:1px !important; color:#fff !important; font-family:'Rajdhani',sans-serif !important;
    font-size:15px !important; font-weight:600 !important; padding:8px 12px !important;
    outline:none !important; transition:all .15s !important; caret-color:var(--bz-gold); letter-spacing:0.05em !important;
  }
  .bz-iw input:focus { border-color:var(--bz-gold) !important; background:rgba(196,167,71,0.05) !important; box-shadow:0 0 0 1px rgba(196,167,71,0.1),0 0 12px rgba(196,167,71,0.08) !important; }
  .bz-iw input::placeholder { color:rgba(255,255,255,0.18) !important; }
  .bz-iw input:disabled,.bz-iw input[readonly] { opacity:.35 !important; cursor:not-allowed !important; }
  .bz-iw::after { content:''; position:absolute; bottom:0; left:0; right:0; height:1px; background:var(--bz-gold); transform:scaleX(0); transform-origin:left; transition:transform 0.2s ease; opacity:0.6; }
  .bz-iw:focus-within::after { transform:scaleX(1); }

  .bz-ta { width:100%; background:rgba(74,92,62,0.05); border:1px solid rgba(74,92,62,0.3); border-radius:1px; color:#fff; font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:600; padding:8px 12px; resize:none; outline:none; line-height:1.5; caret-color:var(--bz-gold); transition:all .15s; letter-spacing:0.04em; }
  .bz-ta:focus { border-color:var(--bz-gold); background:rgba(196,167,71,0.05); box-shadow:0 0 0 1px rgba(196,167,71,0.1); }
  .bz-ta::placeholder { color:rgba(255,255,255,0.18); }

  .bz-cbar { height:2px; margin-top:5px; background:rgba(255,255,255,0.06); overflow:hidden; }
  .bz-cbar-fill { height:100%; transition:width .12s,background .2s; }

  /* ── Type Buttons ── */
  .bz-types { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
  .bz-tb { position:relative; padding:0; border:none; background:none; cursor:pointer; outline:none; display:block; width:100%; }
  .bz-tb-face { position:relative; z-index:2; padding:10px 4px 9px; text-align:center; transition:transform .1s ease,box-shadow .1s ease; transform:translateY(-4px); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
  .bz-tb::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 2px); z-index:1; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }

  .bz-tb-gd .bz-tb-face { background:linear-gradient(160deg,rgba(196,167,71,0.15),rgba(100,80,20,0.45)); border:1px solid rgba(196,167,71,0.5); }
  .bz-tb-gd::after { background:#3a2e0c; }
  .bz-tb-gd.bz-on .bz-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(196,167,71,0.28),rgba(140,110,30,0.5)); border-color:var(--bz-gold); box-shadow:0 0 16px rgba(196,167,71,0.6),0 0 30px rgba(196,167,71,0.2); }

  .bz-tb-gn .bz-tb-face { background:linear-gradient(160deg,rgba(74,92,62,0.2),rgba(30,50,20,0.5)); border:1px solid rgba(74,92,62,0.55); }
  .bz-tb-gn::after { background:#141f10; }
  .bz-tb-gn.bz-on .bz-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(74,92,62,0.32),rgba(50,75,35,0.55)); border-color:var(--bz-green-light); box-shadow:0 0 16px rgba(106,138,85,0.6),0 0 30px rgba(74,92,62,0.2); }

  .bz-tb-or .bz-tb-face { background:linear-gradient(160deg,rgba(200,100,20,0.18),rgba(120,50,0,0.45)); border:1px solid rgba(200,120,30,0.5); }
  .bz-tb-or::after { background:#3a1e04; }
  .bz-tb-or.bz-on .bz-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(200,120,30,0.3),rgba(160,80,0,0.5)); border-color:var(--bz-orange); box-shadow:0 0 16px rgba(200,120,30,0.6),0 0 30px rgba(200,100,20,0.2); }

  .bz-tb-rd .bz-tb-face { background:linear-gradient(160deg,rgba(180,30,30,0.18),rgba(100,10,10,0.45)); border:1px solid rgba(180,40,40,0.5); }
  .bz-tb-rd::after { background:#2e0808; }
  .bz-tb-rd.bz-on .bz-tb-face { transform:translateY(0); background:linear-gradient(160deg,rgba(180,40,40,0.3),rgba(140,20,20,0.5)); border-color:var(--bz-red); box-shadow:0 0 16px rgba(200,50,50,0.6),0 0 30px rgba(180,30,30,0.2); }

  .bz-tb:active .bz-tb-face { transform:translateY(0) !important; }
  .bz-tb:hover .bz-tb-face { filter:brightness(1.1); }
  .bz-tb-emoji { font-size:17px; display:block; line-height:1; }
  .bz-tb-name { font-family:'Orbitron',monospace; font-size:7px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; display:block; margin-top:4px; transition:color .15s,text-shadow .15s; }
  .bz-tb-min { font-size:7px; font-weight:600; color:rgba(196,167,71,0.55); display:block; margin-top:2px; font-family:'Rajdhani',sans-serif; }

  .bz-amt { display:flex; gap:7px; }
  .bz-cur { display:flex; align-items:center; justify-content:space-between; gap:4px; background:rgba(74,92,62,0.05) !important; border:1px solid rgba(74,92,62,0.3) !important; border-radius:1px !important; color:#fff !important; font-family:'Rajdhani',sans-serif !important; font-size:13px !important; font-weight:700 !important; padding:0 10px !important; min-width:90px; height:38px; cursor:pointer; transition:all .15s; flex-shrink:0; letter-spacing:0.05em !important; }
  .bz-cur:hover { border-color:var(--bz-gold) !important; }

  .bz-div { height:1px; background:linear-gradient(90deg,transparent,rgba(74,92,62,0.4),rgba(196,167,71,0.15),transparent); position:relative; }
  .bz-div::before { content:'◆'; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:6px; color:rgba(196,167,71,0.4); }

  .bz-sp { padding:10px 12px; position:relative; }
  .bz-sp::before,.bz-sp::after { content:''; position:absolute; width:10px; height:10px; pointer-events:none; }
  .bz-sp::before { top:0; left:0; border-top:1px solid var(--bz-gold); border-left:1px solid var(--bz-gold); opacity:0.4; }
  .bz-sp::after  { bottom:0; right:0; border-bottom:1px solid var(--bz-gold); border-right:1px solid var(--bz-gold); opacity:0.4; }
  .bz-sp-gn { background:rgba(74,92,62,0.07); border:1px solid rgba(74,92,62,0.35); }
  .bz-sp-or { background:rgba(200,100,20,0.05); border:1px solid rgba(200,120,30,0.3); }
  .bz-sp-rd { background:rgba(180,30,30,0.05); border:1px solid rgba(180,40,40,0.25); }

  /* ── Button ── */
  .bz-btn-wrap { position:relative; width:100%; padding-bottom:5px; }
  .bz-btn-wrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:calc(100% - 4px); z-index:1; background:linear-gradient(90deg,#151e0c,#1e2e12,#182410); clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px)); }
  .bz-btn { position:relative; z-index:2; width:100%; padding:14px; border:none; cursor:pointer; font-family:'Black Ops One',cursive; font-size:13px; font-weight:400; letter-spacing:.12em; color:var(--bz-gold); transition:transform .1s ease,box-shadow .1s ease; transform:translateY(-5px); background:linear-gradient(135deg,#253318 0%,#334a20 50%,#263a16 100%); border-top:1px solid rgba(196,167,71,0.25); border-left:1px solid rgba(196,167,71,0.12); box-shadow:inset 0 1px 0 rgba(196,167,71,0.1),0 0 18px rgba(74,92,62,0.35); overflow:hidden; clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px)); }
  .bz-btn:hover:not(:disabled) { box-shadow:inset 0 1px 0 rgba(196,167,71,0.18),0 0 26px rgba(196,167,71,0.35),0 0 50px rgba(74,92,62,0.2); text-shadow:0 0 14px var(--bz-gold); }
  .bz-btn:active:not(:disabled) { transform:translateY(0) !important; box-shadow:inset 0 2px 8px rgba(0,0,0,0.6) !important; }
  .bz-btn:disabled { opacity:.35; cursor:not-allowed; }
  .bz-btn::before { content:''; position:absolute; top:0; left:-110%; width:55%; height:100%; background:linear-gradient(90deg,transparent,rgba(196,167,71,0.1),transparent); transform:skewX(-20deg); transition:left .6s; }
  .bz-btn:hover:not(:disabled)::before { left:160%; }

  .bz-hint { font-size:9px; font-weight:600; color:rgba(196,167,71,0.45); margin-top:3px; font-family:'Orbitron',monospace; letter-spacing:0.08em; }

  @keyframes bz-fu { from{opacity:0;transform:translateY(5px);} to{opacity:1;transform:translateY(0);} }
  .bz-fu { animation:bz-fu .18s ease forwards; }

  @keyframes bz-spin-a { to{transform:rotate(360deg);} }
  .bz-spin { width:13px; height:13px; border:1.5px solid rgba(196,167,71,0.3); border-top-color:var(--bz-gold); border-radius:50%; display:inline-block; animation:bz-spin-a .65s linear infinite; }

  @keyframes bz-in { from{opacity:0;transform:scale(0.97) translateY(8px);} to{opacity:1;transform:scale(1) translateY(0);} }
  .bz-in { animation:bz-in .45s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Kill Feed ── */
  .bz-killfeed { position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:6px; pointer-events:none; }
  @keyframes bz-kf-in  { from{opacity:0;transform:translateX(20px);} to{opacity:1;transform:translateX(0);} }
  @keyframes bz-kf-out { from{opacity:1;} to{opacity:0;transform:translateX(12px);} }
  .bz-kf { display:flex; align-items:center; gap:8px; background:rgba(6,8,4,0.93); border:1px solid rgba(74,92,62,0.45); border-left:3px solid var(--bz-gold); padding:8px 14px; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); animation:bz-kf-in .2s ease forwards; min-width:220px; }
  .bz-kf-err  { border-left-color:var(--bz-red); }
  .bz-kf-warn { border-left-color:var(--bz-orange); }
  .bz-kf-icon { font-size:11px; flex-shrink:0; color:var(--bz-gold); font-family:'Orbitron',monospace; }
  .bz-kf-err  .bz-kf-icon { color:var(--bz-red); }
  .bz-kf-warn .bz-kf-icon { color:var(--bz-orange); }
  .bz-kf-text { font-family:'Orbitron',monospace; font-size:9px; font-weight:700; color:var(--bz-text); letter-spacing:0.06em; }
`;

/* ── Smoke Canvas ── */
const SmokeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    type P = { x:number; y:number; r:number; vx:number; vy:number; alpha:number; da:number; };
    const ps: P[] = [];
    const spawn = () => ps.push({ x:Math.random()*canvas.width, y:canvas.height+20, r:30+Math.random()*60, vx:(Math.random()-0.5)*0.3, vy:-(0.15+Math.random()*0.25), alpha:0.04+Math.random()*0.06, da:-(0.0001+Math.random()*0.0002) });
    for (let i=0;i<18;i++) { spawn(); ps[i].y=Math.random()*canvas.height; }
    let frame: number;
    const tick = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if (Math.random()<0.04) spawn();
      for (let i=ps.length-1;i>=0;i--) {
        const p=ps[i]; p.x+=p.vx; p.y+=p.vy; p.alpha+=p.da;
        if (p.alpha<=0||p.y<-p.r) { ps.splice(i,1); continue; }
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
        g.addColorStop(0,`rgba(74,92,62,${p.alpha})`); g.addColorStop(1,`rgba(74,92,62,0)`);
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }
      frame=requestAnimationFrame(tick);
    };
    tick();
    const onResize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    window.addEventListener('resize',onResize);
    return ()=>{ cancelAnimationFrame(frame); window.removeEventListener('resize',onResize); };
  }, []);
  return <canvas ref={canvasRef} className="bz-canvas"/>;
};

/* ── Kill Feed ── */
type KFMsg = { id:number; text:string; icon:string; variant:'default'|'err'|'warn'; };
let kfId = 0;
const useKillFeed = () => {
  const [msgs, setMsgs] = useState<KFMsg[]>([]);
  const push = useCallback((text:string, icon='✦', variant:KFMsg['variant']='default') => {
    const id = ++kfId;
    setMsgs(p=>[...p,{id,text,icon,variant}]);
    setTimeout(()=>setMsgs(p=>p.filter(m=>m.id!==id)), 3200);
  }, []);
  return { msgs, push };
};

/* ── Audio ── */
const playClick = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.setValueAtTime(880,c.currentTime); o.frequency.exponentialRampToValueAtTime(220,c.currentTime+0.06); g.gain.setValueAtTime(0.07,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.08); o.start(); o.stop(c.currentTime+0.08); } catch {} };
const playConfirm = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); [440,550,660].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value=f; const t=c.currentTime+i*0.07; g.gain.setValueAtTime(0.05,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.1); o.start(t); o.stop(t+0.1); }); } catch {} };
const playError = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sawtooth'; o.frequency.setValueAtTime(200,c.currentTime); o.frequency.exponentialRampToValueAtTime(80,c.currentTime+0.15); g.gain.setValueAtTime(0.06,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.15); o.start(); o.stop(c.currentTime+0.15); } catch {} };

/* ── Main ── */
const Brigzard = () => {
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

  const { pricing }      = useStreamerPricing("brigzard", selectedCurrency);
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

  useEffect(() => { const t=setTimeout(applyScale,80); window.addEventListener('resize',applyScale); return ()=>{ clearTimeout(t); window.removeEventListener('resize',applyScale); }; }, [applyScale]);
  useEffect(() => { const t=setTimeout(applyScale,60); return ()=>clearTimeout(t); }, [donationType,applyScale]);

  useEffect(() => {
    const s=document.createElement("script"); s.src="https://checkout.razorpay.com/v1/checkout.js"; s.async=true;
    s.onload=()=>setRazorpayLoaded(true);
    s.onerror=()=>push("Payment gateway failed to load","✖","err");
    document.body.appendChild(s);
    return ()=>{ if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

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
    if (!razorpayLoaded||!(window as any).Razorpay) { playError(); push("Payment system still loading","⚠","warn"); return; }
    const amount=Number(formData.amount);
    if (!formData.name) { playError(); push("Operator callsign required","✖","err"); return; }
    if (!amount||amount<=0) { playError(); push("Enter a valid amount","✖","err"); return; }
    const min=donationType==="voice"?pricing.minVoice:donationType==="hypersound"?pricing.minHypersound:donationType==="media"?pricing.minMedia:pricing.minText;
    if (amount<min) { playError(); push(`Min for ${donationType}: ${currencySymbol}${min}`,"✖","err"); return; }
    if (donationType==="voice"&&!voiceRecorder.audioBlob) { playError(); push("Record voice comms first","⚠","warn"); return; }
    if (donationType==="hypersound"&&!selectedHypersound) { playError(); push("Select a sound","⚠","warn"); return; }
    if (donationType==="media"&&!mediaUrl) { playError(); push("Upload a media file","⚠","warn"); return; }
    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    push("Initiating deployment...","◈","default");
    try {
      let voiceMessageUrl:string|null=null;
      if (donationType==="voice"&&voiceRecorder.audioBlob) {
        const base64=await new Promise<string>((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve((r.result as string).split(",")[1]); r.onerror=reject; r.readAsDataURL(voiceRecorder.audioBlob!); });
        const {data,error}=await supabase.functions.invoke("upload-voice-message-direct",{body:{voiceData:base64,streamerSlug:"brigzard"}});
        if (error) throw error;
        voiceMessageUrl=data.voice_message_url;
      }
      const {data,error}=await supabase.functions.invoke("create-razorpay-order-unified",{
        body:{ streamer_slug:"brigzard", name:formData.name, amount:Number(formData.amount), message:donationType==="text"?formData.message:null, voiceMessageUrl, hypersoundUrl:donationType==="hypersound"?selectedHypersound:null, mediaUrl:donationType==="media"?mediaUrl:null, mediaType, currency:selectedCurrency }
      });
      if (error) throw error;
      playConfirm();
      new (window as any).Razorpay({
        key:data.razorpay_key_id, amount:data.amount, currency:data.currency, order_id:data.razorpay_order_id,
        name:"BRIGZARD", description:"Support BRIGZARD",
        handler:()=>navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`),
        modal:{ondismiss:()=>navigate(`/status?order_id=${data.orderId}&status=pending&st=${data.status_token}`)},
        theme:{color:"#4a5c3e"},
      }).open();
    } catch {
      playError(); push("Payment failed. Try again.","✖","err");
    } finally { setIsProcessingPayment(false); }
  };

  const msgPct=maxMessageLength>0?(formData.message.length/maxMessageLength)*100:0;
  const msgClr=msgPct>90?'var(--bz-red)':msgPct>70?'var(--bz-gold)':'var(--bz-green-light)';

  const TYPES=[
    {key:'text'       as const,emoji:'💬',label:'Text', min:pricing.minText,      tc:'bz-tb-gd',nc:'var(--bz-gold)'},
    {key:'voice'      as const,emoji:'🎤',label:'Voice',min:pricing.minVoice,     tc:'bz-tb-gn',nc:'var(--bz-green-light)'},
    {key:'hypersound' as const,emoji:'🔊',label:'Sound',min:pricing.minHypersound,tc:'bz-tb-or',nc:'var(--bz-orange)'},
    {key:'media'      as const,emoji:'🖼️',label:'Media',min:pricing.minMedia,     tc:'bz-tb-rd',nc:'var(--bz-red)'},
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>
      <SmokeCanvas/>

      {/* Kill Feed */}
      <div className="bz-killfeed">
        {msgs.map(m=>(
          <div key={m.id} className={cn('bz-kf', m.variant==='err'?'bz-kf-err':m.variant==='warn'?'bz-kf-warn':'')}>
            <span className="bz-kf-icon">{m.icon}</span>
            <span className="bz-kf-text">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="bz-root bz-page">
        <div className="bz-atm"/>
        <div className="bz-grid"/>
        <div className="bz-scanlines"/>

        <div ref={wrapRef} className="bz-scale-wrap" style={{transformOrigin:'top center'}}>
          <div ref={cardRef} className="bz-card bz-in">

            <div className="bz-bracket bz-bracket-tl"/>
            <div className="bz-bracket bz-bracket-tr"/>
            <div className="bz-bracket bz-bracket-bl"/>
            <div className="bz-bracket bz-bracket-br"/>

            {/* HERO */}
            <div className="bz-hero">
              <div className="bz-hero-blob"/>
              <div className="bz-operator-tag">
                <span className="bz-tag-prefix">▸ Operator ID</span>
                <div className="bz-name">BRIGZARD</div>
                <div className="bz-hero-sub">Support · Donate · Deploy</div>
              </div>
              <div className="bz-live">
                <div className="bz-live-dot"/>
                <span className="bz-live-text">LIVE</span>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="bz-body">

                <div>
                  <label className="bz-lbl">▸ Operator Callsign</label>
                  <div className="bz-iw"><Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" required/></div>
                </div>

                <div>
                  <label className="bz-lbl">▸ Mission Type</label>
                  <div className="bz-types">
                    {TYPES.map(t=>(
                      <button key={t.key} type="button" onClick={()=>handleDonationTypeChange(t.key)} className={cn('bz-tb',t.tc,donationType===t.key?'bz-on':'')}>
                        <div className="bz-tb-face">
                          <span className="bz-tb-emoji">{t.emoji}</span>
                          <span className="bz-tb-name" style={{color:donationType===t.key?t.nc:'rgba(255,255,255,0.35)',textShadow:donationType===t.key?`0 0 10px ${t.nc}`:'none'}}>{t.label}</span>
                          <span className="bz-tb-min">{currencySymbol}{t.min}+</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="bz-lbl">▸ Support Amount</label>
                  <div className="bz-amt">
                    <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className="bz-cur">
                          <span>{currencySymbol} {selectedCurrency}</span>
                          <ChevronsUpDown style={{width:10,height:10,opacity:0.35,marginLeft:'auto',flexShrink:0}}/>
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
                    <div className="bz-iw" style={{flex:1}}>
                      <Input name="amount" type="number" value={formData.amount} onChange={handleInputChange} min="1" placeholder="0" readOnly={donationType==="hypersound"} required/>
                    </div>
                  </div>
                  {pricing.ttsEnabled&&<p className="bz-hint">⚡ TTS ENABLED ABOVE {currencySymbol}{pricing.minTts}</p>}
                </div>

                <div className="bz-div"/>

                {donationType==="text"&&(
                  <div className="bz-fu">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <label className="bz-lbl" style={{margin:0}}>▸ Intel Message</label>
                      <span style={{fontSize:9,fontWeight:700,color:msgClr,textShadow:`0 0 6px ${msgClr}`,fontFamily:'Orbitron,monospace',letterSpacing:'0.08em'}}>{formData.message.length}/{maxMessageLength}</span>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Your message (optional)" className="bz-ta" rows={2} maxLength={maxMessageLength}/>
                    <div className="bz-cbar"><div className="bz-cbar-fill" style={{width:`${msgPct}%`,background:msgClr,boxShadow:`0 0 5px ${msgClr}`}}/></div>
                  </div>
                )}

                {donationType==="voice"&&(
                  <div className="bz-fu">
                    <label className="bz-lbl">▸ Voice Comms</label>
                    <div className="bz-sp bz-sp-gn">
                      <EnhancedVoiceRecorder controller={voiceRecorder} onRecordingComplete={()=>{}} maxDurationSeconds={getVoiceDuration(currentAmount)} requiredAmount={pricing.minVoice} currentAmount={currentAmount} brandColor="#4a5c3e"/>
                    </div>
                  </div>
                )}

                {donationType==="hypersound"&&(
                  <div className="bz-fu bz-sp bz-sp-or">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:14}}>🔊</span>
                      <span style={{fontSize:11,fontWeight:700,color:'var(--bz-orange)',textShadow:'0 0 8px var(--bz-orange)',fontFamily:'Orbitron,monospace',letterSpacing:'0.1em'}}>HYPERSOUNDS</span>
                    </div>
                    <HyperSoundSelector selectedSound={selectedHypersound} onSoundSelect={setSelectedHypersound}/>
                  </div>
                )}

                {donationType==="media"&&(
                  <div className="bz-fu bz-sp bz-sp-rd">
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:14}}>🖼️</span>
                      <span style={{fontSize:11,fontWeight:700,color:'var(--bz-red)',textShadow:'0 0 8px var(--bz-red)',fontFamily:'Orbitron,monospace',letterSpacing:'0.1em'}}>MEDIA DROP</span>
                    </div>
                    <MediaUploader streamerSlug="brigzard" onMediaUploaded={(url,type)=>{setMediaUrl(url);setMediaType(type);}} onMediaRemoved={()=>{setMediaUrl(null);setMediaType(null);}}/>
                  </div>
                )}

                <RewardsBanner amount={Number(formData.amount)} currency={selectedCurrency}/>

                <div className="bz-btn-wrap">
                  <button type="submit" className="bz-btn" disabled={isProcessingPayment}>
                    {isProcessingPayment?(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <span className="bz-spin"/> DEPLOYING...
                      </span>
                    ):(
                      <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}>
                        <Crosshair style={{width:14,height:14}}/>
                        SUPPORT {currencySymbol}{formData.amount||'0'}
                      </span>
                    )}
                  </button>
                </div>

                <p style={{fontSize:8,fontWeight:600,color:'rgba(255,255,255,0.12)',textAlign:'center',lineHeight:1.6,fontFamily:'Orbitron,monospace',letterSpacing:'0.06em'}}>
                  PHONE NUMBERS COLLECTED BY RAZORPAY PER RBI REGULATIONS
                </p>
                <DonationPageFooter brandColor="#4a5c3e"/>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Brigzard;
