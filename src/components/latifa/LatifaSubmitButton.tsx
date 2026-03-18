// src/components/latifa/LatifaSubmitButton.tsx

import React from "react";
import { Heart } from "lucide-react";

const BUTTON_CSS = `
  .lf-btn-wrap {
    position: relative; width: 100%;
    border-radius: 3px; padding-bottom: 6px;
  }
  .lf-btn-wrap::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: calc(100% - 4px); border-radius: 3px; z-index: 1;
    background: linear-gradient(90deg, #2e0e6a, #3d1490, #2a0c6a);
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  }

  .lf-btn {
    position: relative; z-index: 2;
    width: 100%; padding: 14px; border: none; cursor: pointer;
    font-family: 'Black Ops One', cursive;
    font-size: 13px; font-weight: 400;
    letter-spacing: .1em; color: #fff;
    border-radius: 3px;
    transition: transform .1s ease, box-shadow .1s ease;
    transform: translateY(-6px);
    background: linear-gradient(135deg, var(--lf-purple-dark) 0%, var(--lf-purple) 50%, var(--lf-pink-dark) 100%);
    border-top: 1.5px solid rgba(255,255,255,0.18);
    border-left: 1.5px solid rgba(255,255,255,0.08);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.15),
      0 0 22px rgba(168,85,247,0.6),
      0 0 45px rgba(168,85,247,0.2);
    overflow: hidden;
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  }

  .lf-btn:hover:not(:disabled) {
    transform: translateY(-7px);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.22),
      0 0 35px rgba(168,85,247,0.8),
      0 0 65px rgba(244,114,182,0.35);
  }

  .lf-btn:active:not(:disabled) {
    transform: translateY(0) !important;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.5) !important;
  }

  .lf-btn:disabled {
    opacity: .38; cursor: not-allowed;
  }

  /* Shimmer sweep */
  .lf-btn::before {
    content: ''; position: absolute; top: 0; left: -110%;
    width: 55%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: skewX(-20deg); transition: left .6s;
  }
  .lf-btn:hover:not(:disabled)::before { left: 160%; }
`;

interface LatifaSubmitButtonProps {
  isProcessing: boolean;
  amount: string;
  currencySymbol: string;
}

const LatifaSubmitButton: React.FC<LatifaSubmitButtonProps> = ({
  isProcessing,
  amount,
  currencySymbol,
}) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: BUTTON_CSS }} />
    <div className="lf-btn-wrap">
      <button type="submit" className="lf-btn" disabled={isProcessing}>
        {isProcessing ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
            <span className="lf-spinner" /> DEPLOYING...
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Heart style={{ width: 14, height: 14 }} />
            SUPPORT {currencySymbol}{amount || '0'}
          </span>
        )}
      </button>
    </div>
  </>
);

export default LatifaSubmitButton;
