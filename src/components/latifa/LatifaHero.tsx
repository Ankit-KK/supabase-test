// src/components/latifa/LatifaHero.tsx

import React, { useState, useEffect, useRef } from "react";
import latifaAvatar from "@/assets/gaming-with-latifa-avatar.jpg";

/* ── Typewriter hook ── */
const useTypewriter = (text: string, speed = 60, delay = 600) => {
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
  }, [text]);
  return { displayed, done };
};

const HERO_CSS = `
  /* ── Hero ── */
  .lf-hero {
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg,
      rgba(60,10,100,0.95) 0%,
      rgba(20,5,40,0.98) 100%
    );
    border-bottom: 1px solid rgba(168,85,247,0.3);
    padding-bottom: 0;
  }

  /* Animated top border */
  .lf-hero::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 10;
    background: linear-gradient(90deg,
      var(--lf-purple-dark), var(--lf-purple), var(--lf-pink),
      var(--lf-magenta), var(--lf-pink), var(--lf-purple), var(--lf-purple-dark));
    background-size: 200% 100%;
    animation: lf-border-shift 3s linear infinite;
    box-shadow: 0 0 12px var(--lf-purple), 0 0 24px rgba(244,114,182,0.5);
  }
  @keyframes lf-border-shift { 0%{background-position:0%} 100%{background-position:200%} }

  /* ── Light rays behind avatar ── */
  .lf-rays {
    position: absolute;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 340px; height: 220px;
    pointer-events: none; z-index: 0;
  }
  .lf-ray {
    position: absolute;
    bottom: 0; left: 50%;
    width: 2px;
    transform-origin: bottom center;
    background: linear-gradient(0deg, rgba(168,85,247,0.5) 0%, transparent 100%);
    animation: lf-ray-pulse 3s ease-in-out infinite;
  }
  .lf-ray:nth-child(1)  { height: 180px; transform: translateX(-50%) rotate(-60deg); animation-delay: 0s;    opacity: 0.6; }
  .lf-ray:nth-child(2)  { height: 200px; transform: translateX(-50%) rotate(-45deg); animation-delay: 0.2s;  opacity: 0.8; background: linear-gradient(0deg, rgba(244,114,182,0.5) 0%, transparent 100%); }
  .lf-ray:nth-child(3)  { height: 220px; transform: translateX(-50%) rotate(-30deg); animation-delay: 0.4s;  opacity: 0.7; }
  .lf-ray:nth-child(4)  { height: 210px; transform: translateX(-50%) rotate(-15deg); animation-delay: 0.6s;  opacity: 0.9; background: linear-gradient(0deg, rgba(232,121,249,0.6) 0%, transparent 100%); }
  .lf-ray:nth-child(5)  { height: 220px; transform: translateX(-50%) rotate(0deg);   animation-delay: 0s;    opacity: 1.0; background: linear-gradient(0deg, rgba(255,255,255,0.3) 0%, transparent 100%); width: 3px; }
  .lf-ray:nth-child(6)  { height: 210px; transform: translateX(-50%) rotate(15deg);  animation-delay: 0.6s;  opacity: 0.9; background: linear-gradient(0deg, rgba(232,121,249,0.6) 0%, transparent 100%); }
  .lf-ray:nth-child(7)  { height: 220px; transform: translateX(-50%) rotate(30deg);  animation-delay: 0.4s;  opacity: 0.7; }
  .lf-ray:nth-child(8)  { height: 200px; transform: translateX(-50%) rotate(45deg);  animation-delay: 0.2s;  opacity: 0.8; background: linear-gradient(0deg, rgba(244,114,182,0.5) 0%, transparent 100%); }
  .lf-ray:nth-child(9)  { height: 180px; transform: translateX(-50%) rotate(60deg);  animation-delay: 0s;    opacity: 0.6; }

  @keyframes lf-ray-pulse {
    0%,100% { opacity: var(--ray-opacity, 0.7); }
    50%     { opacity: 0.2; }
  }

  /* Ground glow */
  .lf-ground-glow {
    position: absolute; bottom: 0; left: 0; right: 0; height: 60px;
    background: linear-gradient(0deg, rgba(168,85,247,0.35) 0%, transparent 100%);
    pointer-events: none; z-index: 1;
  }

  /* ── Avatar frame ── */
  .lf-avatar-wrap {
    position: relative; z-index: 2;
    display: flex; justify-content: center;
    padding-top: 20px;
  }

  .lf-avatar-outer {
    position: relative; width: 110px; height: 110px;
  }

  /* Rotating border */
  .lf-avatar-ring {
    position: absolute; inset: -4px; border-radius: 50%;
    background: conic-gradient(
      var(--lf-purple), var(--lf-pink), var(--lf-magenta),
      var(--lf-purple-dark), var(--lf-purple)
    );
    animation: lf-ring-rotate 3s linear infinite;
    box-shadow: 0 0 20px rgba(168,85,247,0.6), 0 0 40px rgba(244,114,182,0.3);
  }
  @keyframes lf-ring-rotate { to { transform: rotate(360deg); } }

  /* Inner mask to create border effect */
  .lf-avatar-ring::after {
    content: ''; position: absolute; inset: 3px;
    border-radius: 50%; background: var(--lf-card);
  }

  .lf-avatar-img {
    position: absolute; inset: 3px; border-radius: 50%;
    width: calc(100% - 6px); height: calc(100% - 6px);
    object-fit: cover; object-position: center top;
    z-index: 2;
  }

  /* Glow under avatar */
  .lf-avatar-glow {
    position: absolute; bottom: -10px; left: 50%;
    transform: translateX(-50%);
    width: 80px; height: 20px; border-radius: 50%;
    background: rgba(168,85,247,0.5);
    filter: blur(8px);
    animation: lf-glow-pulse 2s ease-in-out infinite;
  }
  @keyframes lf-glow-pulse { 0%,100%{opacity:0.5;} 50%{opacity:1;} }

  /* ── Name section ── */
  .lf-name-section {
    position: relative; z-index: 2;
    text-align: center;
    padding: 12px 16px 16px;
  }

  /* Victory label */
  .lf-victory-label {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'Orbitron', monospace; font-size: 8px; font-weight: 700;
    color: var(--lf-pink); letter-spacing: 0.3em; text-transform: uppercase;
    margin-bottom: 6px;
  }
  .lf-victory-label::before,
  .lf-victory-label::after {
    content: ''; display: block; width: 20px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--lf-pink));
  }
  .lf-victory-label::after { transform: scaleX(-1); }

  /* Big name */
  @keyframes lf-cursor-blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .lf-big-name {
    font-family: 'Black Ops One', cursive;
    font-size: 32px; font-weight: 400;
    color: #fff; line-height: 1; letter-spacing: 0.04em;
    text-shadow:
      0 0 20px rgba(168,85,247,0.7),
      0 0 40px rgba(168,85,247,0.4),
      0 0 60px rgba(244,114,182,0.2);
  }
  .lf-big-name-pink {
    color: var(--lf-pink);
    text-shadow:
      0 0 15px rgba(244,114,182,0.9),
      0 0 30px rgba(244,114,182,0.5),
      0 0 50px rgba(168,85,247,0.3);
  }
  .lf-name-cursor {
    display: inline-block; width: 3px; height: 28px;
    background: var(--lf-pink); margin-left: 2px; vertical-align: middle;
    animation: lf-cursor-blink .7s ease-in-out infinite;
  }

  /* Sub tagline */
  .lf-tagline {
    font-family: 'Orbitron', monospace; font-size: 9px; font-weight: 700;
    color: rgba(233,213,255,0.35); letter-spacing: 0.2em; text-transform: uppercase;
    margin-top: 6px;
  }

  /* Stats bar */
  .lf-stats-bar {
    display: flex; justify-content: center; gap: 0;
    margin-top: 12px; border-top: 1px solid rgba(168,85,247,0.15);
  }
  .lf-stat {
    flex: 1; padding: 8px 4px; text-align: center;
    border-right: 1px solid rgba(168,85,247,0.15);
    position: relative;
  }
  .lf-stat:last-child { border-right: none; }
  .lf-stat-val {
    font-family: 'Black Ops One', cursive; font-size: 14px;
    color: var(--lf-purple); letter-spacing: 0.04em;
    text-shadow: 0 0 8px rgba(168,85,247,0.5);
    display: block;
  }
  .lf-stat-lbl {
    font-family: 'Orbitron', monospace; font-size: 7px; font-weight: 700;
    color: rgba(233,213,255,0.3); letter-spacing: 0.12em; text-transform: uppercase;
    display: block; margin-top: 1px;
  }

  /* Live badge */
  @keyframes lf-live-pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
  .lf-live-badge {
    position: absolute; top: 12px; right: 14px; z-index: 10;
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(168,85,247,0.15);
    border: 1px solid rgba(168,85,247,0.5);
    padding: 4px 10px;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  }
  .lf-live-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--lf-purple);
    animation: lf-live-pulse 1.2s ease-in-out infinite;
    box-shadow: 0 0 6px var(--lf-purple);
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
  const { displayed, done } = useTypewriter("Gaming With Latifa", 60, 800);

  const dispPre = displayed.slice(0, Math.min(displayed.length, prefix.length));
  const dispSuf = displayed.length > prefix.length ? displayed.slice(prefix.length) : '';

  /* Parallax on card */
  useEffect(() => {
    const el = cardRef.current; if (!el) return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2; const cy = window.innerHeight / 2;
      const rx = (e.clientY - cy) / cy * 4; const ry = -(e.clientX - cx) / cx * 4;
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

        {/* Live badge */}
        <div className="lf-live-badge">
          <div className="lf-live-dot" />
          <span className="lf-live-text">LIVE</span>
        </div>

        {/* Light rays */}
        <div className="lf-rays">
          <div className="lf-ray" />
          <div className="lf-ray" />
          <div className="lf-ray" />
          <div className="lf-ray" />
          <div className="lf-ray" />
          <div className="lf-ray" />
          <div className="lf-ray" />
          <div className="lf-ray" />
          <div className="lf-ray" />
        </div>

        <div className="lf-ground-glow" />

        {/* Avatar */}
        <div className="lf-avatar-wrap">
          <div className="lf-avatar-outer">
            <div className="lf-avatar-ring" />
            <img src={latifaAvatar} alt="Gaming With Latifa" className="lf-avatar-img" />
            <div className="lf-avatar-glow" />
          </div>
        </div>

        {/* Name + tagline */}
        <div className="lf-name-section">
          <div className="lf-victory-label">Brand Ambassador</div>
          <div className="lf-big-name">
            {dispPre}
            {dispSuf && <span className="lf-big-name-pink">{dispSuf}</span>}
            {!done && <span className="lf-name-cursor" />}
          </div>
          <div className="lf-tagline">Support · Drop · Deploy</div>
        </div>

        {/* Stats bar */}
        <div className="lf-stats-bar">
          <div className="lf-stat">
            <span className="lf-stat-val">BGMI</span>
            <span className="lf-stat-lbl">Game</span>
          </div>
          <div className="lf-stat">
            <span className="lf-stat-val">🇮🇳 IND</span>
            <span className="lf-stat-lbl">Region</span>
          </div>
          <div className="lf-stat">
            <span className="lf-stat-val">PRO</span>
            <span className="lf-stat-lbl">Tier</span>
          </div>
        </div>

      </div>
    </>
  );
};

export default LatifaHero;
