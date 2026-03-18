// src/components/latifa/LatifaTheme.ts

export const LATIFA_COLORS = {
  purple:      '#a855f7',
  purpleDark:  '#7c3aed',
  purpleDim:   '#2e1060',
  pink:        '#f472b6',
  pinkDark:    '#db2777',
  pinkDim:     '#5a0e35',
  magenta:     '#e879f9',
  magentaDim:  '#460e5a',
  violet:      '#8b5cf6',
  violetDim:   '#260c50',
  bg:          '#08050f',
  card:        '#0e0a1a',
  text:        '#e9d5ff',
  muted:       'rgba(233,213,255,0.4)',
} as const;

export const LATIFA_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&family=Black+Ops+One&display=swap');

  :root {
    --lf-purple:      ${LATIFA_COLORS.purple};
    --lf-purple-dark: ${LATIFA_COLORS.purpleDark};
    --lf-purple-dim:  ${LATIFA_COLORS.purpleDim};
    --lf-pink:        ${LATIFA_COLORS.pink};
    --lf-pink-dark:   ${LATIFA_COLORS.pinkDark};
    --lf-pink-dim:    ${LATIFA_COLORS.pinkDim};
    --lf-magenta:     ${LATIFA_COLORS.magenta};
    --lf-magenta-dim: ${LATIFA_COLORS.magentaDim};
    --lf-violet:      ${LATIFA_COLORS.violet};
    --lf-violet-dim:  ${LATIFA_COLORS.violetDim};
    --lf-bg:          ${LATIFA_COLORS.bg};
    --lf-card:        ${LATIFA_COLORS.card};
    --lf-text:        ${LATIFA_COLORS.text};
    --lf-muted:       ${LATIFA_COLORS.muted};
  }

  * { box-sizing: border-box; }
  .lf-root { font-family: 'Rajdhani', sans-serif; }

  /* ── Shared input styles ── */
  .lf-iw { position: relative; }
  .lf-iw input {
    width: 100% !important;
    background: rgba(168,85,247,0.05) !important;
    border: 1px solid rgba(168,85,247,0.28) !important;
    border-radius: 2px !important;
    color: var(--lf-text) !important;
    font-family: 'Rajdhani', sans-serif !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    padding: 9px 12px !important;
    outline: none !important;
    transition: all .15s !important;
    caret-color: var(--lf-pink);
    letter-spacing: 0.04em !important;
  }
  .lf-iw input:focus {
    border-color: var(--lf-purple) !important;
    background: rgba(168,85,247,0.09) !important;
    box-shadow: 0 0 0 2px rgba(168,85,247,0.15), 0 0 14px rgba(168,85,247,0.1) !important;
  }
  .lf-iw input::placeholder { color: rgba(233,213,255,0.2) !important; }
  .lf-iw input:disabled, .lf-iw input[readonly] { opacity: .35 !important; cursor: not-allowed !important; }
  .lf-iw::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 1px; background: var(--lf-pink);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.2s ease; opacity: 0.7;
  }
  .lf-iw:focus-within::after { transform: scaleX(1); }

  .lf-ta {
    width: 100%; background: rgba(168,85,247,0.05);
    border: 1px solid rgba(168,85,247,0.28); border-radius: 2px;
    color: var(--lf-text); font-family: 'Rajdhani', sans-serif;
    font-size: 14px; font-weight: 600; padding: 9px 12px;
    resize: none; outline: none; line-height: 1.5;
    caret-color: var(--lf-pink); transition: all .15s; letter-spacing: 0.04em;
  }
  .lf-ta:focus {
    border-color: var(--lf-purple);
    background: rgba(168,85,247,0.09);
    box-shadow: 0 0 0 2px rgba(168,85,247,0.12);
  }
  .lf-ta::placeholder { color: rgba(233,213,255,0.2); }

  /* ── Shared label ── */
  .lf-lbl {
    font-family: 'Orbitron', monospace;
    font-size: 8px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    display: block; margin-bottom: 6px;
    color: rgba(168,85,247,0.65);
  }

  /* ── Shared char counter bar ── */
  .lf-cbar { height: 2px; margin-top: 5px; background: rgba(255,255,255,0.07); overflow: hidden; }
  .lf-cbar-fill { height: 100%; transition: width .12s, background .2s; }

  /* ── Shared divider ── */
  .lf-div {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(168,85,247,0.4), rgba(244,114,182,0.2), transparent);
    position: relative;
  }
  .lf-div::before {
    content: '◆'; position: absolute; left: 50%; top: 50%;
    transform: translate(-50%, -50%); font-size: 6px; color: rgba(244,114,182,0.5);
  }

  /* ── Shared sub panels ── */
  .lf-sp { padding: 10px 12px; position: relative; }
  .lf-sp::before, .lf-sp::after {
    content: ''; position: absolute; width: 10px; height: 10px; pointer-events: none;
  }
  .lf-sp::before { top: 0; left: 0; border-top: 1px solid var(--lf-purple); border-left: 1px solid var(--lf-purple); opacity: 0.45; }
  .lf-sp::after  { bottom: 0; right: 0; border-bottom: 1px solid var(--lf-purple); border-right: 1px solid var(--lf-purple); opacity: 0.45; }
  .lf-sp-pu { background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.3); }
  .lf-sp-pk { background: rgba(244,114,182,0.05); border: 1px solid rgba(244,114,182,0.28); }
  .lf-sp-mg { background: rgba(232,121,249,0.05); border: 1px solid rgba(232,121,249,0.28); }

  /* ── Shared hint ── */
  .lf-hint {
    font-size: 9px; font-weight: 600;
    color: rgba(244,114,182,0.55); margin-top: 3px;
    font-family: 'Orbitron', monospace; letter-spacing: 0.08em;
  }

  /* ── Shared spinner ── */
  @keyframes lf-spin-a { to { transform: rotate(360deg); } }
  .lf-spinner {
    width: 13px; height: 13px;
    border: 1.5px solid rgba(255,255,255,0.3); border-top-color: #fff;
    border-radius: 50%; display: inline-block;
    animation: lf-spin-a .65s linear infinite;
  }

  /* ── Shared fade-up ── */
  @keyframes lf-fu { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  .lf-fu { animation: lf-fu .18s ease forwards; }
`;
