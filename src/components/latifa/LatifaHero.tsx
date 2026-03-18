// src/components/latifa/LatifaHero.tsx

import React, { useState, useEffect, useRef } from "react";

/* ── Typewriter hook ── */
const useTypewriter = (text: string, speed = 55, delay = 800) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false); let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        i++; setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(iv); setDone(true); }
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, speed, delay]);
  return { displayed, done };
};

const HERO_CSS = `
  /* ── Hero container ── */
  .lf-hero {
    position: relative; padding: 22px 22px 18px;
    display: flex; align-items: center; justify-content: space-between; gap: 14px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(168,85,247,0.1) 50%, rgba(244,114,182,0.07) 100%);
    border-bottom: 1px solid rgba(168,85,247,0.22);
  }

  /* Animated top border */
  .lf-hero::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg,
      var(--lf-purple-dark), var(--lf-purple), var(--lf-pink),
      var(--lf-magenta), var(--lf-purple), var(--lf-purple-dark));
    background-size: 200% 100%;
    animation: lf-border-shift 4s linear infinite;
    box-shadow: 0 0 10px var(--lf-purple), 0 0 22px rgba(244,114,182,0.4);
  }
  .lf-hero::after {
    content: ''; position: absolute; bottom: 0; right: 0;
    width: 0; height: 0; border-style: solid;
    border-width: 0 0 18px 18px;
    border-color: transparent transparent rgba(168,85,247,0.2) transparent;
  }
  @keyframes lf-border-shift { 0%{background-position:0%} 100%{background-position:200%} }

  .lf-hero-blob {
    position: absolute; top: -40px; right: -40px;
    width: 160px; height: 160px; border-radius: 50%;
    background: radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 65%);
    pointer-events: none;
  }

  /* ── BGMI Airdrop Marker ── */
  .lf-drop-wrap {
    position: relative; width: 72px; height: 72px; flex-shrink: 0;
  }

  /* Expanding pulse rings */
  .lf-pulse-ring {
    position: absolute; border-radius: 50%;
    border: 1px solid var(--lf-purple);
    animation: lf-ring-expand 2.4s ease-out infinite;
    opacity: 0;
  }
  .lf-pulse-ring:nth-child(1) { inset: 50%; animation-delay: 0s; }
  .lf-pulse-ring:nth-child(2) { inset: 50%; animation-delay: 0.8s; }
  .lf-pulse-ring:nth-child(3) { inset: 50%; animation-delay: 1.6s; }

  @keyframes lf-ring-expand {
    0%   { inset: 30px; opacity: 0.8; border-color: var(--lf-purple); }
    60%  { border-color: var(--lf-pink); }
    100% { inset: -4px; opacity: 0; border-color: var(--lf-purple); }
  }

  /* Static crosshair */
  .lf-crosshair {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
  }
  /* Horizontal lines — gap in the middle */
  .lf-ch-h-l, .lf-ch-h-r, .lf-ch-v-t, .lf-ch-v-b {
    position: absolute; background: var(--lf-purple);
  }
  .lf-ch-h-l { top: 50%; left: 8px;  width: 20px; height: 1.5px; transform: translateY(-50%); }
  .lf-ch-h-r { top: 50%; right: 8px; width: 20px; height: 1.5px; transform: translateY(-50%); }
  .lf-ch-v-t { left: 50%; top: 8px;    height: 20px; width: 1.5px; transform: translateX(-50%); }
  .lf-ch-v-b { left: 50%; bottom: 8px; height: 20px; width: 1.5px; transform: translateX(-50%); }

  /* Corner brackets on crosshair */
  .lf-ch-corner {
    position: absolute; width: 10px; height: 10px;
  }
  .lf-ch-corner-tl { top: 10px; left: 10px; border-top: 1.5px solid var(--lf-pink); border-left: 1.5px solid var(--lf-pink); }
  .lf-ch-corner-tr { top: 10px; right: 10px; border-top: 1.5px solid var(--lf-pink); border-right: 1.5px solid var(--lf-pink); }
  .lf-ch-corner-bl { bottom: 10px; left: 10px; border-bottom: 1.5px solid var(--lf-pink); border-left: 1.5px solid var(--lf-pink); }
  .lf-ch-corner-br { bottom: 10px; right: 10px; border-bottom: 1.5px solid var(--lf-pink); border-right: 1.5px solid var(--lf-pink); }

  /* Center dot */
  .lf-ch-dot {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--lf-pink);
    box-shadow: 0 0 8px var(--lf-pink), 0 0 16px rgba(244,114,182,0.5);
    animation: lf-dot-pulse 2s ease-in-out infinite;
  }
  @keyframes lf-dot-pulse {
    0%,100% { transform: translate(-50%,-50%) scale(1); box-shadow: 0 0 8px var(--lf-pink), 0 0 16px rgba(244,114,182,0.5); }
    50%     { transform: translate(-50%,-50%) scale(1.4); box-shadow: 0 0 12px var(--lf-pink), 0 0 24px rgba(244,114,182,0.7); }
  }

  /* ── Operator name + typewriter ── */
  .lf-operator-tag {
    display: flex; flex-direction: column; position: relative; z-index: 1; flex: 1;
  }
  .lf-tag-prefix {
    font-family: 'Orbitron', monospace; font-size: 8px; font-weight: 700;
    color: rgba(168,85,247,0.5); letter-spacing: 0.25em; text-transform: uppercase;
    margin-bottom: 3px;
  }

  @keyframes lf-cursor-blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .lf-name {
    font-family: 'Black Ops One', cursive; font-size: 22px; font-weight: 400;
    color: #fff; line-height: 1.1; letter-spacing: 0.04em;
    text-shadow: 0 0 18px rgba(168,85,247,0.4), 0 0 35px rgba(244,114,182,0.15);
    min-height: 50px;
  }
  .lf-name-pink {
    color: var(--lf-pink);
    text-shadow: 0 0 12px rgba(244,114,182,0.6), 0 0 24px rgba(244,114,182,0.25);
  }
  .lf-name-cursor {
    display: inline-block; width: 2px; height: 20px;
    background: var(--lf-pink); margin-left: 2px; vertical-align: middle;
    animation: lf-cursor-blink .7s ease-in-out infinite;
  }
  .lf-hero-sub {
    font-size: 9px; font-weight: 600;
    color: rgba(233,213,255,0.28); margin-top: 5px;
    letter-spacing: 0.18em; text-transform: uppercase;
    font-family: 'Orbitron', monospace;
  }

  /* ── Live badge ── */
  @keyframes lf-live-pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
  .lf-live {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.4);
    padding: 4px 10px; flex-shrink: 0; position: relative; z-index: 1;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  }
  .lf-live-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--lf-purple);
    animation: lf-live-pulse 1.2s ease-in-out infinite;
  }
  .lf-live-text {
    font-family: 'Orbitron', monospace; font-size: 8px; font-weight: 700;
    color: var(--lf-purple); letter-spacing: 0.18em;
    text-shadow: 0 0 8px var(--lf-purple);
  }
`;

interface LatifaHeroProps {
  cardRef: React.RefObject<HTMLDivElement>;
}

const LatifaHero: React.FC<LatifaHeroProps> = ({ cardRef }) => {
  const prefix = "Gaming With ";
  const suffix = "Latifa";
  const { displayed, done } = useTypewriter("Gaming With Latifa", 55, 1000);

  const dispPre = displayed.slice(0, Math.min(displayed.length, prefix.length));
  const dispSuf = displayed.length > prefix.length ? displayed.slice(prefix.length) : '';

  /* Parallax on card */
  useEffect(() => {
    const el = cardRef.current; if (!el) return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2; const cy = window.innerHeight / 2;
      const rx = (e.clientY - cy) / cy * 5; const ry = -(e.clientX - cx) / cx * 5;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const onLeave = () => { el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseleave', onLeave); };
  }, [cardRef]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />
      <div className="lf-hero">
        <div className="lf-hero-blob" />

        {/* BGMI Airdrop Marker */}
        <div className="lf-drop-wrap">
          <div className="lf-pulse-ring" />
          <div className="lf-pulse-ring" />
          <div className="lf-pulse-ring" />
          <div className="lf-crosshair">
            <div className="lf-ch-h-l" />
            <div className="lf-ch-h-r" />
            <div className="lf-ch-v-t" />
            <div className="lf-ch-v-b" />
            <div className="lf-ch-corner lf-ch-corner-tl" />
            <div className="lf-ch-corner lf-ch-corner-tr" />
            <div className="lf-ch-corner lf-ch-corner-bl" />
            <div className="lf-ch-corner lf-ch-corner-br" />
            <div className="lf-ch-dot" />
          </div>
        </div>

        {/* Typewriter name */}
        <div className="lf-operator-tag">
          <span className="lf-tag-prefix">▸ Operator ID</span>
          <div className="lf-name">
            {dispPre}
            {dispSuf && <span className="lf-name-pink">{dispSuf}</span>}
            {!done && <span className="lf-name-cursor" />}
          </div>
          <div className="lf-hero-sub">Support · Drop · Deploy</div>
        </div>

        {/* Live badge */}
        <div className="lf-live">
          <div className="lf-live-dot" />
          <span className="lf-live-text">LIVE</span>
        </div>
      </div>
    </>
  );
};

export default LatifaHero;
