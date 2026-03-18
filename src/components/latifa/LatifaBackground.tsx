// src/components/latifa/LatifaBackground.tsx

import React, { useEffect, useRef } from "react";

const BG_CSS = `
  .lf-page {
    width: 100vw; height: 100dvh;
    background: var(--lf-bg);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }

  .lf-canvas {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
  }

  /* Deep radial vignette — gives cinematic depth */
  .lf-atm {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background:
      radial-gradient(ellipse 50% 60% at 50% 40%, rgba(80,10,140,0.35) 0%, transparent 65%),
      radial-gradient(ellipse 80% 50% at 50% 100%, rgba(168,85,247,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%);
  }

  /* Subtle grid */
  .lf-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.035;
    background-image:
      linear-gradient(rgba(168,85,247,1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* Scanlines */
  .lf-scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 2;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px
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

    /* Two types of particles:
       1. Small rising orbs (ambient)
       2. Occasional bright burst sparks */
    type Particle = {
      x: number; y: number; r: number;
      vx: number; vy: number;
      alpha: number; alphaDecay: number;
      color: string; type: 'orb' | 'spark';
    };

    const ORBS    = ['168,85,247','244,114,182','139,92,246','232,121,249'];
    const SPARKS  = ['255,200,255','255,150,230','220,130,255','255,255,255'];

    const particles: Particle[] = [];

    const spawnOrb = (): Particle => ({
      x:          Math.random() * canvas.width,
      y:          canvas.height + 10,
      r:          0.8 + Math.random() * 2.5,
      vx:         (Math.random() - 0.5) * 0.4,
      vy:         -0.2 - Math.random() * 0.4,
      alpha:      0.15 + Math.random() * 0.45,
      alphaDecay: 0,
      color:      ORBS[Math.floor(Math.random() * ORBS.length)],
      type:       'orb',
    });

    const spawnSpark = (): Particle => ({
      x:          Math.random() * canvas.width,
      y:          Math.random() * canvas.height * 0.6,
      r:          0.5 + Math.random() * 1.5,
      vx:         (Math.random() - 0.5) * 1.5,
      vy:         -0.5 - Math.random() * 1.5,
      alpha:      0.8 + Math.random() * 0.2,
      alphaDecay: 0.015 + Math.random() * 0.02,
      color:      SPARKS[Math.floor(Math.random() * SPARKS.length)],
      type:       'spark',
    });

    /* Pre-populate orbs */
    for (let i = 0; i < 70; i++) {
      const p = spawnOrb();
      p.y = Math.random() * canvas.height;
      particles.push(p);
    }

    let frame: number;
    let tick_count = 0;

    const tick = () => {
      tick_count++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* Spawn new particles */
      if (Math.random() < 0.06) particles.push(spawnOrb());
      if (tick_count % 8 === 0) particles.push(spawnSpark());

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.type === 'spark') p.alpha -= p.alphaDecay;
        if (p.alpha <= 0 || p.y < -10) { particles.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();

        /* Spark glow */
        if (p.type === 'spark' && p.r > 1) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${p.alpha * 0.15})`;
          ctx.fill();
        }
      }

      frame = requestAnimationFrame(tick);
    };

    tick();

    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize); };
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
