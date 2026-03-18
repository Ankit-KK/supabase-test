// src/components/latifa/LatifaKillFeed.tsx

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const KILLFEED_CSS = `
  .lf-killfeed {
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    display: flex; flex-direction: column; gap: 6px;
    pointer-events: none;
  }

  @keyframes lf-kf-in {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .lf-kf {
    display: flex; align-items: center; gap: 8px;
    background: rgba(8,5,15,0.96);
    border: 1px solid rgba(168,85,247,0.35);
    border-left: 3px solid var(--lf-purple);
    padding: 8px 14px; border-radius: 2px;
    animation: lf-kf-in .2s ease forwards;
    min-width: 210px;
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
  }
  .lf-kf-err  { border-left-color: #ef4444; }
  .lf-kf-warn { border-left-color: var(--lf-pink); }

  .lf-kf-icon {
    font-size: 11px; flex-shrink: 0;
    color: var(--lf-purple);
    font-family: 'Orbitron', monospace;
  }
  .lf-kf-err  .lf-kf-icon { color: #ef4444; }
  .lf-kf-warn .lf-kf-icon { color: var(--lf-pink); }

  .lf-kf-text {
    font-family: 'Orbitron', monospace;
    font-size: 9px; font-weight: 700;
    color: var(--lf-text); letter-spacing: 0.06em;
  }
`;

/* ── Types ── */
export type KFVariant = 'default' | 'err' | 'warn';

export interface KFMessage {
  id: number;
  text: string;
  icon: string;
  variant: KFVariant;
}

/* ── Hook — use this in the parent page ── */
let kfCounter = 0;

export const useLatifaKillFeed = () => {
  const [msgs, setMsgs] = useState<KFMessage[]>([]);

  const push = useCallback((
    text: string,
    icon = '✦',
    variant: KFVariant = 'default'
  ) => {
    const id = ++kfCounter;
    setMsgs(p => [...p, { id, text, icon, variant }]);
    setTimeout(() => setMsgs(p => p.filter(m => m.id !== id)), 3200);
  }, []);

  return { msgs, push };
};

/* ── Component ── */
interface LatifaKillFeedProps {
  msgs: KFMessage[];
}

const LatifaKillFeed: React.FC<LatifaKillFeedProps> = ({ msgs }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: KILLFEED_CSS }} />
    <div className="lf-killfeed">
      {msgs.map(m => (
        <div
          key={m.id}
          className={cn(
            'lf-kf',
            m.variant === 'err'  ? 'lf-kf-err'  : '',
            m.variant === 'warn' ? 'lf-kf-warn' : ''
          )}
        >
          <span className="lf-kf-icon">{m.icon}</span>
          <span className="lf-kf-text">{m.text}</span>
        </div>
      ))}
    </div>
  </>
);

export default LatifaKillFeed;
