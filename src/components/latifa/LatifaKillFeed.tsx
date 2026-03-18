// src/components/latifa/LatifaBackground.tsx

import React, { useEffect, useRef } from "react";

const BG_CSS = `
  .lf-page {
    width: 100vw; height: 100dvh;
    background: var(--lf-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  /* ── Particle canvas ── */
  .lf-canvas {
    position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.45;
  }

  /* ── Atmospheric glow ── */
  .lf-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background:
      radial-gradient(ellipse 60% 50% at 15% 20%, rgba(124,58,237,0.2) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 85% 75%, rgba(244,114,182,0.14) 0%, transparent 55%),
      radial-gradient(ellipse 35% 30% at 50% 50%, rgba(168,85,247,0.05) 0%, transparent 60%);
  }

  /* ── Tactical grid ── */
  .lf-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.04;
    background-image:
      linear-gradient(rgba(168,85,247,1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* ── Scanlines ── */
  .lf-scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 2;
    background: repeating-linear-gradient(
      0deg,
      transparent, transparent 2px,
      rgba(0,0,0,0.045) 2px, rgba(0,0,0,0.045) 4px
    );
  }
`;

const LatifaBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = [
      '168,85,247',   // purple
      '244,114,182',  // pink
      '139,92,246',   // violet
      '232,121,249',  // magenta
    ];

    type Particle = {
      x: number; y: number; r: number;
      vx: number; vy: number;
      alpha: number; color: string;
    };

    const particles: Particle[] = [];

    const spawn = (): Particle => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     0.6 + Math.random() * 2.2,
      vx:    (Math.random() - 0.5) * 0.25,
      vy:    -0.12 - Math.random() * 0.22,
      alpha: 0.12 + Math.random() * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    /* Pre-populate */
    for (let i = 0; i < 65; i++) particles.push(spawn());

    let frame: number;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.05) particles.push(spawn());

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) { particles.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      }

      frame = requestAnimationFrame(tick);
    };

    tick();

    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BG_CSS }} />
      <canvas ref={canvasRef} className="lf-canvas" />
      <div className="lf-atm" />
      <div className="lf-grid" />
      <div className="lf-scanlines" />
    </>
  );
};

export default LatifaBackground;
