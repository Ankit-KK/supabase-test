// src/components/latifa/LatifaSuccessOverlay.tsx

import React, { useEffect, useRef } from "react";

const OVERLAY_CSS = `
  @keyframes lf-ov-in  { from{opacity:0;} to{opacity:1;} }
  @keyframes lf-ov-out { from{opacity:1;} to{opacity:0;} }
  @keyframes lf-pop    { 0%{transform:scale(0.4);opacity:0;} 65%{transform:scale(1.1);} 100%{transform:scale(1);opacity:1;} }
  @keyframes lf-conf   { 0%{transform:translateY(0) rotate(0deg);opacity:1;} 100%{transform:translateY(110px) rotate(720deg);opacity:0;} }
  @keyframes lf-bar-fill { from{width:0;} to{width:100%;} }
  @keyframes lf-scan-ov  { 0%{top:-4%;} 100%{top:110%;} }

  .lf-success-overlay {
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(5,3,12,0.96);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    animation: lf-ov-in .3s ease forwards;
  }
  .lf-success-overlay.lf-ov-exit { animation: lf-ov-out .4s ease forwards; }

  /* Scanline sweep on overlay */
  .lf-success-scanline {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(168,85,247,0.5), rgba(244,114,182,0.4), transparent);
    animation: lf-scan-ov 2s linear infinite;
    pointer-events: none;
  }

  /* Confetti */
  .lf-conf-wrap { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .lf-conf-piece { position: absolute; border-radius: 2px; animation: lf-conf 1.6s ease-out both; }

  /* Content */
  .lf-success-emoji  { font-size: 68px; animation: lf-pop .55s cubic-bezier(0.22,1,0.36,1) .1s both; }
  .lf-success-title  { font-family:'Black Ops One',cursive; font-size:38px; color:#fff; text-shadow:0 0 22px var(--lf-pink),0 0 45px rgba(168,85,247,0.5); animation:lf-pop .55s cubic-bezier(0.22,1,0.36,1) .2s both; letter-spacing:0.06em; }
  .lf-success-sub    { font-family:'Orbitron',monospace; font-size:10px; font-weight:700; color:rgba(233,213,255,0.35); letter-spacing:0.18em; text-transform:uppercase; animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .3s both; }
  .lf-success-amount { font-family:'Black Ops One',cursive; font-size:20px; color:var(--lf-pink); text-shadow:0 0 14px rgba(244,114,182,0.6); animation:lf-pop .5s cubic-bezier(0.22,1,0.36,1) .4s both; letter-spacing:0.08em; }

  .lf-success-bar-wrap {
    width: 220px; height: 2px; background: rgba(255,255,255,0.08);
    margin-top: 22px; overflow: hidden;
    animation: lf-pop .4s ease .5s both;
  }
  .lf-success-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--lf-purple), var(--lf-pink));
    box-shadow: 0 0 8px var(--lf-pink);
    animation: lf-bar-fill 2.5s linear .6s both;
  }

  .lf-success-redirect {
    font-family: 'Orbitron', monospace; font-size: 8px; font-weight: 700;
    color: rgba(168,85,247,0.4); letter-spacing: 0.18em;
    margin-top: 10px; animation: lf-pop .4s ease .7s both;
  }
`;

const CONFETTI_COLORS = ['#a855f7','#f472b6','#e879f9','#c084fc','#f9a8d4','#7c3aed'];

interface LatifaSuccessOverlayProps {
  amount: string;
  currency: string;
  onDone: () => void;
}

const LatifaSuccessOverlay: React.FC<LatifaSuccessOverlayProps> = ({ amount, currency, onDone }) => {
  const ref = useRef<HTMLDivElement>(null);

  const confetti = Array.from({ length: 30 }, (_, i) => ({
    left:  `${Math.random() * 100}%`,
    top:   `${5 + Math.random() * 45}%`,
    bg:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${Math.random() * 0.6}s`,
    dur:   `${1.3 + Math.random() * 0.9}s`,
    size:  `${7 + Math.random() * 6}px`,
    rot:   `${Math.random() * 360}deg`,
  }));

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.classList.add('lf-ov-exit');
      setTimeout(onDone, 400);
    }, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: OVERLAY_CSS }} />
      <div ref={ref} className="lf-success-overlay">
        <div className="lf-success-scanline" />

        <div className="lf-conf-wrap">
          {confetti.map((c, i) => (
            <div
              key={i}
              className="lf-conf-piece"
              style={{
                left: c.left, top: c.top,
                background: c.bg,
                animationDelay: c.delay,
                animationDuration: c.dur,
                width: c.size, height: c.size,
                transform: `rotate(${c.rot})`,
              }}
            />
          ))}
        </div>

        <div className="lf-success-emoji">🎯</div>
        <div className="lf-success-title">Support Confirmed</div>
        <div className="lf-success-sub">Mission Accomplished</div>
        <div className="lf-success-amount">{currency}{amount} Deployed</div>
        <div className="lf-success-bar-wrap">
          <div className="lf-success-bar" />
        </div>
        <div className="lf-success-redirect">▸ Redirecting to debrief...</div>
      </div>
    </>
  );
};

export default LatifaSuccessOverlay;
