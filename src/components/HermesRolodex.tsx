/**
 * HERMES ROLODEX™
 * A feature module for the Pauli Second Brain
 * Powered by the Hermes Agent (Nous Research)
 *
 * Architecture:
 *  - One agent (Hermes) operates everything — no skill-switching
 *  - Graph-first data model: people are nodes, relationships are edges
 *  - Fuzzy recall: "that guy from the gas station" resolves via graph traversal
 *  - All data lives in Pauli Second Brain (Supabase/Prisma backend)
 *  - Hermes gateway: WhatsApp/Telegram/Slack — all surfaces, one brain
 */

import { useState, useRef, useEffect, useCallback } from "react";

// ─── DESIGN SYSTEM ───────────────────────────────────────────────────────────
// Aesthetic: Noir mercury — like a detective's pinboard grew a soul.
// Cinnabar red signal on near-black. Typewriter meets neural network.
// Every element feels like it was placed by someone who remembers everything.

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --void:       #080808;
    --void-2:     #111010;
    --void-3:     #1a1919;
    --void-4:     #242222;
    --border:     #2a2828;
    --border-hi:  #3d3a3a;
    --mercury:    #d4d0c8;
    --mercury-2:  #8a8680;
    --mercury-3:  #4a4744;
    --signal:     #d94f3d;
    --signal-2:   #a33a2b;
    --signal-glow:rgba(217,79,61,0.18);
    --signal-dim: rgba(217,79,61,0.08);
    --amber:      #e8a832;
    --amber-dim:  #9a6f1e;
    --green:      #3d8c5a;
    --blue:       #4a72c4;
    --font-serif: 'Playfair Display', 'Georgia', serif;
    --font-mono:  'IBM Plex Mono', 'Courier New', monospace;
    --r:          3px;
    --ease:       cubic-bezier(0.23, 1, 0.32, 1);
  }

  html, body, #root {
    height: 100%;
    background: var(--void);
    color: var(--mercury);
    font-family: var(--font-mono);
    -webkit-font-smoothing: antialiased;
  }

  /* ────────────────────────────────── LAYOUT */
  .hr-app {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(217,79,61,0.07) 0%, transparent 55%),
      var(--void);
  }

  /* ────────────────────────────────── HEADER */
  .hr-header {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 16px;
    padding: 0 24px;
    height: 58px;
    border-bottom: 1px solid var(--border);
    background: rgba(8,8,8,0.97);
    backdrop-filter: blur(16px);
    position: relative;
    z-index: 100;
  }

  .hr-wordmark {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .hr-wordmark-h {
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 700;
    color: var(--signal);
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .hr-wordmark-sub {
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--mercury-3);
    font-weight: 400;
  }
  .hr-wordmark-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--signal);
    align-self: center;
    animation: hr-pulse 2.4s ease-in-out infinite;
    margin-left: 2px;
  }
  @keyframes hr-pulse {
    0%,100%{opacity:1;transform:scale(1)}
    50%{opacity:0.4;transform:scale(0.7)}
  }

  .hr-search-wrap {
    position: relative;
    max-width: 440px;
  }
  .hr-search-wrap svg {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--mercury-3);
    pointer-events: none;
  }
  .hr-search {
    width: 100%;
    padding: 8px 12px 8px 34px;
    background: var(--void-3);
    border: 1px solid var(--border);
    border-radius: var(--r);
    color: var(--mercury);
    font-family: var(--font-mono);
    font-size: 12px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .hr-search:focus {
    border-color: var(--signal-2);
    box-shadow: 0 0 0 3px var(--signal-dim);
  }
  .hr-search::placeholder { color: var(--mercury-3); }

  .hr-header-actions { display: flex; align-items: center; gap: 10px; }

  .hr-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: var(--r);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid;
    transition: all 0.18s var(--ease);
    white-space: nowrap;
  }
  .hr-btn-primary {
    background: var(--signal);
    border-color: var(--signal);
    color: #fff;
  }
  .hr-btn-primary:hover {
    background: #e85f4d;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--signal-glow);
  }
  .hr-btn-ghost {
    background: transparent;
    border-color: var(--border-hi);
    color: var(--mercury-2);
  }
  .hr-btn-ghost:hover {
    border-color: var(--mercury-3);
    color: var(--mercury);
  }

  .hr-recall-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    background: var(--void-3);
    border: 1px solid var(--border);
    border-radius: 20px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--mercury-2);
    cursor: pointer;
    transition: all 0.2s;
  }
  .hr-recall-btn:hover {
    border-color: var(--amber-dim);
    color: var(--amber);
    background: rgba(232,168,50,0.06);
  }
  .hr-recall-icon {
    font-size: 13px;
  }

  /* ────────────────────────────────── BODY */
  .hr-body {
    display: grid;
    grid-template-columns: 1fr;
    overflow: hidden;
    transition: grid-template-columns 0.3s var(--ease);
  }
  .hr-body.panel-open {
    grid-template-columns: 1fr 340px;
  }

  /* ────────────────────────────────── MAIN GRID AREA */
  .hr-grid-area {
    overflow-y: auto;
    padding: 28px 32px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  .hr-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .hr-section-label {
    font-size: 9px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--signal);
    font-weight: 500;
  }
  .hr-section-count {
    font-size: 10px;
    color: var(--mercury-3);
    letter-spacing: 0.08em;
  }

  .hr-view-tabs {
    display: flex;
    gap: 2px;
    background: var(--void-3);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 3px;
  }
  .hr-tab {
    padding: 4px 10px;
    border-radius: 2px;
    font-size: 10px;
    letter-spacing: 0.1em;
    cursor: pointer;
    color: var(--mercury-3);
    border: none;
    background: transparent;
    font-family: var(--font-mono);
    transition: all 0.15s;
  }
  .hr-tab.active {
    background: var(--void-4);
    color: var(--mercury);
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }

  /* ── CARD GRID */
  .hr-people-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 14px;
  }

  .hr-card {
    position: relative;
    cursor: pointer;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    background: var(--void-2);
    aspect-ratio: 2.8/4;
    display: flex;
    flex-direction: column;
    transition: border-color 0.22s var(--ease), transform 0.22s var(--ease), box-shadow 0.22s var(--ease);
  }
  .hr-card:hover {
    border-color: var(--border-hi);
    transform: translateY(-4px) scale(1.012);
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  }
  .hr-card.active {
    border-color: var(--signal);
    box-shadow: 0 0 0 1px var(--signal), 0 8px 32px var(--signal-glow);
  }

  /* event indicator */
  .hr-card-event-dot {
    position: absolute;
    top: 9px;
    right: 9px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--signal);
    box-shadow: 0 0 8px var(--signal);
    z-index: 2;
    animation: hr-pulse 2s infinite;
  }

  /* strength ring */
  .hr-card-ring {
    position: absolute;
    top: 9px;
    left: 9px;
    z-index: 2;
    font-size: 8px;
    font-family: var(--font-mono);
    letter-spacing: 0.06em;
    padding: 2px 5px;
    border-radius: 2px;
    border: 1px solid;
  }
  .hr-card-ring.strong { color: var(--green); border-color: var(--green); background: rgba(61,140,90,0.12); }
  .hr-card-ring.medium { color: var(--amber); border-color: var(--amber-dim); background: rgba(232,168,50,0.08); }
  .hr-card-ring.fading { color: var(--signal); border-color: var(--signal-2); background: var(--signal-dim); }

  .hr-card-photo {
    flex: 1;
    overflow: hidden;
    position: relative;
    background: var(--void-3);
  }
  .hr-card-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hr-card-initials {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-serif);
    font-size: 40px;
    font-weight: 400;
    color: var(--mercury-3);
    letter-spacing: 0.03em;
  }
  /* graph lines decoration on photo */
  .hr-card-photo::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(transparent 60%, var(--void-2) 100%);
    pointer-events: none;
  }

  .hr-card-body {
    padding: 10px 12px 11px;
    border-top: 1px solid var(--border);
  }
  .hr-card-name {
    font-family: var(--font-serif);
    font-size: 14px;
    font-weight: 400;
    color: var(--mercury);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }
  .hr-card-role {
    font-size: 9px;
    color: var(--mercury-3);
    margin-top: 2px;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hr-card-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: 7px;
  }
  .hr-tag {
    font-size: 8px;
    padding: 2px 5px;
    border-radius: 2px;
    background: var(--void-4);
    border: 1px solid var(--border);
    color: var(--mercury-3);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .hr-tag.signal { border-color: var(--signal-2); color: var(--signal); background: var(--signal-dim); }

  /* add card */
  .hr-add-card {
    border: 1px dashed var(--border);
    border-radius: 6px;
    aspect-ratio: 2.8/4;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    background: transparent;
    transition: border-color 0.2s, background 0.2s;
  }
  .hr-add-card:hover { border-color: var(--signal-2); background: var(--signal-dim); }
  .hr-add-icon { font-size: 26px; color: var(--border-hi); transition: color 0.2s; }
  .hr-add-card:hover .hr-add-icon { color: var(--signal-2); }
  .hr-add-label { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mercury-3); }

  /* ── GRAPH VIEW */
  .hr-graph-view {
    position: relative;
    width: 100%;
    height: calc(100vh - 140px);
    background:
      radial-gradient(circle at center, rgba(217,79,61,0.04) 0%, transparent 60%),
      repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px),
      repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px);
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid var(--border);
  }
  .graph-node-el {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: transform 0.2s;
    z-index: 2;
  }
  .graph-node-el:hover { z-index: 10; }
  .graph-node-circle {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid var(--border);
    overflow: hidden;
    background: var(--void-3);
    transition: border-color 0.2s, box-shadow 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-serif);
    font-size: 16px;
    color: var(--mercury-3);
  }
  .graph-node-circle img { width: 100%; height: 100%; object-fit: cover; }
  .graph-node-el:hover .graph-node-circle,
  .graph-node-el.active .graph-node-circle {
    border-color: var(--signal);
    box-shadow: 0 0 16px var(--signal-glow);
  }
  .graph-node-label {
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--mercury-2);
    letter-spacing: 0.04em;
    max-width: 80px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .graph-edge {
    position: absolute;
    pointer-events: none;
    z-index: 1;
  }

  /* ────────────────────────────────── DETAIL PANEL */
  .hr-panel {
    border-left: 1px solid var(--border);
    background: var(--void-2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: hr-slide-in 0.28s var(--ease);
  }
  @keyframes hr-slide-in {
    from { transform: translateX(16px); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }

  .hr-panel-head {
    padding: 18px 20px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: flex-start;
    gap: 13px;
  }
  .hr-panel-avatar {
    width: 52px;
    height: 52px;
    border-radius: 4px;
    overflow: hidden;
    background: var(--void-4);
    flex-shrink: 0;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-serif);
    font-size: 18px;
    color: var(--mercury-3);
  }
  .hr-panel-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .hr-panel-name {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 400;
    color: var(--mercury);
    line-height: 1.1;
    letter-spacing: 0.01em;
  }
  .hr-panel-role {
    font-size: 10px;
    color: var(--mercury-3);
    margin-top: 3px;
    letter-spacing: 0.06em;
  }
  .hr-panel-close {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--mercury-3);
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 2px;
    transition: color 0.2s;
    flex-shrink: 0;
  }
  .hr-panel-close:hover { color: var(--mercury); }

  /* strength meter */
  .hr-strength-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .hr-strength-label { font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mercury-3); }
  .hr-strength-track {
    flex: 1;
    height: 3px;
    background: var(--void-4);
    border-radius: 2px;
    overflow: hidden;
  }
  .hr-strength-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.6s var(--ease);
  }
  .hr-strength-fill.strong { background: var(--green); }
  .hr-strength-fill.medium { background: var(--amber); }
  .hr-strength-fill.fading { background: var(--signal); }

  .hr-panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 18px 20px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  .hr-section {
    margin-bottom: 22px;
  }
  .hr-section-title {
    font-size: 8px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--signal);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }
  .hr-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .hr-field { margin-bottom: 8px; }
  .hr-field-key {
    font-size: 8px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mercury-3);
    margin-bottom: 3px;
  }
  .hr-field-val {
    font-size: 12px;
    color: var(--mercury);
    line-height: 1.5;
  }
  .hr-field-val a { color: var(--signal); text-decoration: none; }
  .hr-field-val a:hover { text-decoration: underline; }

  /* graph nodes in panel */
  .hr-graph-nodes { display: flex; flex-wrap: wrap; gap: 5px; }
  .hr-graph-chip {
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 9px;
    font-family: var(--font-mono);
    border: 1px solid var(--border-hi);
    color: var(--mercury-3);
    background: var(--void-3);
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: all 0.15s;
  }
  .hr-graph-chip:hover { border-color: var(--signal-2); color: var(--signal); }
  .hr-graph-chip.conn { border-color: var(--signal-2); color: var(--signal); background: var(--signal-dim); }

  /* events */
  .hr-event {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--r);
    background: var(--void-3);
    margin-bottom: 6px;
  }
  .hr-event-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .hr-event-name { font-size: 11px; color: var(--mercury); }
  .hr-event-date { font-size: 9px; color: var(--mercury-3); margin-top: 1px; font-family: var(--font-mono); }
  .hr-event-badge {
    margin-left: auto;
    font-size: 8px;
    padding: 2px 6px;
    border-radius: 2px;
    font-family: var(--font-mono);
    border: 1px solid;
    white-space: nowrap;
  }

  /* notes */
  .hr-notes {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 13px;
    line-height: 1.75;
    color: var(--mercury-2);
    padding-left: 10px;
    border-left: 2px solid var(--border-hi);
  }

  /* context memory */
  .hr-memory-item {
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--r);
    background: var(--void-3);
    margin-bottom: 5px;
    font-size: 11px;
    color: var(--mercury-2);
    line-height: 1.5;
  }
  .hr-memory-item strong { color: var(--mercury); font-weight: 500; }
  .hr-memory-meta {
    font-size: 9px;
    color: var(--mercury-3);
    margin-top: 3px;
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
  }

  .hr-panel-actions {
    display: flex;
    gap: 6px;
    padding: 14px 18px;
    border-top: 1px solid var(--border);
  }
  .hr-action {
    flex: 1;
    padding: 7px 6px;
    border-radius: var(--r);
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: var(--font-mono);
    cursor: pointer;
    border: 1px solid;
    transition: all 0.16s;
    text-align: center;
  }
  .hr-action-primary { background: var(--signal); border-color: var(--signal); color: #fff; }
  .hr-action-primary:hover { background: #e85f4d; }
  .hr-action-ghost { background: transparent; border-color: var(--border-hi); color: var(--mercury-3); }
  .hr-action-ghost:hover { border-color: var(--mercury-3); color: var(--mercury); }

  /* ────────────────────────────────── HERMES RECALL MODAL */
  .hr-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: hr-fade-in 0.18s;
  }
  @keyframes hr-fade-in { from{opacity:0} to{opacity:1} }

  .hr-modal {
    background: var(--void-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    width: 560px;
    max-width: 96vw;
    max-height: 88vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px var(--border-hi);
    animation: hr-scale-in 0.22s var(--ease);
  }
  @keyframes hr-scale-in { from{transform:scale(0.95);opacity:0} to{transform:scale(1);opacity:1} }

  /* Hermes Recall dialog */
  .hr-recall-modal { width: 520px; }
  .hr-recall-header {
    padding: 20px 22px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .hr-hermes-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--signal-dim);
    border: 1px solid var(--signal-2);
    border-radius: 20px;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--signal);
    font-weight: 500;
  }
  .hr-hermes-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--signal);
    animation: hr-pulse 1.5s infinite;
  }
  .hr-recall-title {
    font-family: var(--font-serif);
    font-size: 19px;
    font-weight: 400;
    color: var(--mercury);
  }
  .hr-recall-body { padding: 20px 22px; }
  .hr-recall-desc {
    font-size: 11px;
    color: var(--mercury-3);
    line-height: 1.6;
    margin-bottom: 16px;
    letter-spacing: 0.02em;
  }
  .hr-recall-input-wrap { position: relative; }
  .hr-recall-input {
    width: 100%;
    padding: 12px 14px;
    background: var(--void-3);
    border: 1px solid var(--border);
    border-radius: var(--r);
    color: var(--mercury);
    font-family: var(--font-serif);
    font-size: 16px;
    outline: none;
    resize: none;
    min-height: 80px;
    line-height: 1.6;
    transition: border-color 0.2s;
  }
  .hr-recall-input:focus { border-color: var(--signal-2); }
  .hr-recall-input::placeholder { color: var(--mercury-3); font-style: italic; }
  .hr-recall-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
  }
  .hr-example-chip {
    padding: 4px 10px;
    border: 1px dashed var(--border-hi);
    border-radius: var(--r);
    font-size: 10px;
    color: var(--mercury-3);
    cursor: pointer;
    font-family: var(--font-mono);
    transition: all 0.15s;
  }
  .hr-example-chip:hover { border-color: var(--amber-dim); color: var(--amber); }

  .hr-recall-results { margin-top: 20px; }
  .hr-recall-result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 12px;
    border: 1px solid var(--border);
    border-radius: var(--r);
    background: var(--void-3);
    margin-bottom: 7px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .hr-recall-result-item:hover { border-color: var(--signal-2); background: var(--signal-dim); }
  .hr-recall-mini-avatar {
    width: 38px;
    height: 38px;
    border-radius: 3px;
    overflow: hidden;
    background: var(--void-4);
    border: 1px solid var(--border);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-serif);
    font-size: 13px;
    color: var(--mercury-3);
  }
  .hr-recall-mini-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .hr-recall-name { font-family: var(--font-serif); font-size: 14px; color: var(--mercury); }
  .hr-recall-match {
    font-size: 10px;
    color: var(--mercury-3);
    margin-top: 2px;
    font-family: var(--font-mono);
    letter-spacing: 0.02em;
  }
  .hr-recall-confidence {
    margin-left: auto;
    font-size: 9px;
    font-family: var(--font-mono);
    padding: 3px 7px;
    border-radius: 2px;
    border: 1px solid;
    white-space: nowrap;
  }
  .hr-recall-confidence.high { color: var(--green); border-color: var(--green); background: rgba(61,140,90,0.1); }
  .hr-recall-confidence.med { color: var(--amber); border-color: var(--amber-dim); background: rgba(232,168,50,0.08); }

  .hr-thinking {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    color: var(--mercury-3);
    font-size: 11px;
    font-family: var(--font-mono);
  }
  .hr-thinking-dots span {
    animation: hr-blink 1.2s ease-in-out infinite;
    opacity: 0;
  }
  .hr-thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
  .hr-thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes hr-blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }

  /* ────────────────────────────────── ADD PERSON MODAL */
  .hr-modal-head {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .hr-modal-title {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 400;
    color: var(--mercury);
  }
  .hr-modal-body { padding: 22px 24px; overflow-y: auto; flex: 1; scrollbar-width: thin; }
  .hr-modal-foot {
    padding: 14px 24px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .hr-photo-zone {
    border: 1px dashed var(--border-hi);
    border-radius: 6px;
    padding: 22px;
    text-align: center;
    cursor: pointer;
    margin-bottom: 18px;
    position: relative;
    overflow: hidden;
    transition: all 0.2s;
  }
  .hr-photo-zone:hover { border-color: var(--signal-2); background: var(--signal-dim); }
  .hr-photo-zone.filled { padding: 0; border-style: solid; border-color: var(--border-hi); }
  .hr-photo-preview { width: 100%; max-height: 200px; object-fit: cover; display: block; border-radius: 5px; }
  .hr-photo-icon { font-size: 28px; margin-bottom: 6px; }
  .hr-photo-label { font-size: 10px; font-family: var(--font-mono); color: var(--mercury-3); letter-spacing: 0.08em; }
  .hr-photo-replace {
    position: absolute; bottom: 8px; right: 8px;
    background: rgba(0,0,0,0.75); border: 1px solid var(--border-hi);
    border-radius: var(--r); padding: 3px 8px; font-size: 9px;
    font-family: var(--font-mono); color: var(--mercury-3); letter-spacing: 0.08em;
  }

  .hr-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .hr-form-row.full { grid-template-columns: 1fr; }
  .hr-form-group { display: flex; flex-direction: column; gap: 4px; }
  .hr-form-label { font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--mercury-3); }
  .hr-form-input, .hr-form-textarea {
    background: var(--void-3);
    border: 1px solid var(--border);
    border-radius: var(--r);
    color: var(--mercury);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 10px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .hr-form-input:focus, .hr-form-textarea:focus {
    border-color: var(--signal-2);
    box-shadow: 0 0 0 2px var(--signal-dim);
  }
  .hr-form-textarea {
    resize: vertical;
    min-height: 72px;
    font-family: var(--font-serif);
    font-size: 13px;
    line-height: 1.6;
    font-style: italic;
  }

  /* ────────────────────────────────── TOASTS */
  .hr-toast-stack {
    position: fixed;
    top: 68px;
    right: 18px;
    z-index: 300;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
  .hr-toast {
    pointer-events: all;
    background: var(--void-2);
    border: 1px solid var(--border-hi);
    border-radius: 5px;
    padding: 11px 14px;
    min-width: 260px;
    max-width: 300px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.7);
    display: flex;
    gap: 10px;
    align-items: flex-start;
    animation: hr-slide-in 0.25s var(--ease);
  }
  .hr-toast.signal-toast { border-color: var(--signal-2); box-shadow: 0 8px 28px rgba(0,0,0,0.7), 0 0 0 1px var(--signal-dim); }
  .hr-toast-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
  .hr-toast-title { font-size: 12px; color: var(--mercury); font-weight: 500; }
  .hr-toast-body { font-size: 10px; font-family: var(--font-mono); color: var(--mercury-3); margin-top: 2px; line-height: 1.4; }
  .hr-toast-close {
    margin-left: auto; background: none; border: none;
    color: var(--mercury-3); cursor: pointer; font-size: 13px;
    line-height: 1; padding: 1px; transition: color 0.15s; flex-shrink: 0;
  }
  .hr-toast-close:hover { color: var(--mercury); }

  /* ────────────────────────────────── UPCOMING DROPDOWN */
  .hr-upcoming-panel {
    position: absolute;
    top: 58px;
    right: 18px;
    z-index: 150;
    width: 310px;
    background: var(--void-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
    overflow: hidden;
    animation: hr-scale-in 0.2s var(--ease);
  }
  .hr-upcoming-head {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--signal);
    font-weight: 500;
  }
  .hr-upcoming-list { max-height: 340px; overflow-y: auto; scrollbar-width: thin; }
  .hr-upcoming-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.14s;
  }
  .hr-upcoming-item:hover { background: var(--void-3); }
  .hr-upcoming-item:last-child { border-bottom: none; }
  .hr-upcoming-mini {
    width: 30px; height: 30px; border-radius: 3px;
    overflow: hidden; background: var(--void-4);
    border: 1px solid var(--border); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-serif); font-size: 11px; color: var(--mercury-3);
  }
  .hr-upcoming-mini img { width: 100%; height: 100%; object-fit: cover; }
  .hr-upcoming-event { font-size: 11px; color: var(--mercury); }
  .hr-upcoming-who { font-size: 9px; font-family: var(--font-mono); color: var(--mercury-3); margin-top: 1px; }
  .hr-upcoming-rel {
    margin-left: auto;
    font-size: 9px;
    font-family: var(--font-mono);
    padding: 2px 6px;
    border-radius: 2px;
    border: 1px solid;
    white-space: nowrap;
  }
`;

// ─── INITIAL DATA ────────────────────────────────────────────────────────────
const SEED_PEOPLE = [
  {
    id: 1, name: "Adaeze Okonkwo", role: "Venture Partner · Sequoia", photo: null,
    birthday: "1986-03-14", email: "adaeze@sequoia.com", phone: "+1 415 555 0142",
    company: "Sequoia Capital", location: "San Francisco, CA",
    tags: ["investor", "board", "mentor"],
    connections: [2, 3],
    strength: "strong", lastContact: "2025-12-15",
    contextMemory: [
      { text: "Met at SV Summit 2023, introduced by Marcus. Talked for 2 hours about climate tech.", when: "Summit 2023" },
      { text: "Her daughter Maya just started at Harvard. Mentioned it while discussing NWK.", when: "Nov 2024" },
      { text: "Prefers WhatsApp for quick notes. Hates calendar invites with no agenda.", when: "Ongoing" },
    ],
    notes: "Deeply thoughtful. Reads every pitch deck on flights — send materials on Thursdays.",
    events: [
      { id: "e1", type: "birthday", title: "Birthday", date: "2026-03-14" },
      { id: "e2", type: "meeting", title: "Quarterly check-in", date: "2026-04-02" },
    ],
    contextTags: ["climate tech", "Series B", "board governance", "Maya / Harvard"],
  },
  {
    id: 2, name: "Marcus Chen", role: "CTO · Meridian Health AI", photo: null,
    birthday: "1981-07-22", email: "m.chen@meridian.com", phone: "+1 628 555 0089",
    company: "Meridian Health AI", location: "Boston, MA",
    tags: ["technical", "healthcare", "classmate"],
    connections: [1],
    strength: "medium", lastContact: "2025-11-03",
    contextMemory: [
      { text: "Stanford CS classmate. Introduced me to Adaeze at the SV Summit.", when: "2023" },
      { text: "Obsessed with bonsai trees — has 11 of them. Grows them in his office.", when: "Boston visit" },
      { text: "Hates cold outreach. Always needs warm intro or prior connection.", when: "Ongoing" },
    ],
    notes: "Deep on AI/ML infrastructure. The person to call if I need a technical co-founder opinion.",
    events: [
      { id: "e3", type: "reminder", title: "Send Meridian Series B deck feedback", date: "2026-04-08" },
    ],
    contextTags: ["bonsai", "ML infrastructure", "warm intro only", "Stanford"],
  },
  {
    id: 3, name: "Priya Sharma", role: "Co-Founder · Arkon Labs", photo: null,
    birthday: "1990-11-05", email: "priya@arkon.io", phone: "+1 512 555 0211",
    company: "Arkon Labs", location: "Austin, TX",
    tags: ["founder", "ai", "portfolio"],
    connections: [1],
    strength: "strong", lastContact: "2026-01-20",
    contextMemory: [
      { text: "Met at Austin AI week. Red boots. First thing she said: 'I don't do small talk.'", when: "AI Week 2024" },
      { text: "Building AI for legal discovery. Has enterprise pilot with Baker McKenzie.", when: "Jan 2026" },
      { text: "Her co-founder conflict with Raj is ongoing — don't ask about it directly.", when: "Dec 2025" },
    ],
    notes: "Brilliant systems thinker. Follow up on enterprise pilot results in April.",
    events: [
      { id: "e4", type: "meeting", title: "Product demo walkthrough", date: "2026-04-10" },
      { id: "e5", type: "birthday", title: "Birthday", date: "2026-11-05" },
    ],
    contextTags: ["legal AI", "Austin", "red boots", "Baker McKenzie pilot"],
  },
  {
    id: 4, name: "Tobias Reinholt", role: "Design Director · Artifact", photo: null,
    birthday: "1988-08-30", email: "t.reinholt@artifact.co", phone: "+49 30 555 0177",
    company: "Artifact Studio", location: "Berlin, DE",
    tags: ["design", "creative"],
    connections: [],
    strength: "fading", lastContact: "2025-09-14",
    contextMemory: [
      { text: "Met at Figma Config Berlin. He was the one with the green trench coat and the Braun watch.", when: "Figma Config 2025" },
      { text: "Exceptional taste — no gradients, no rounded corners, no animations without purpose.", when: "First meeting" },
    ],
    notes: "Potential design partnership for the Kupuri Media rebrand. Relationship cooling — reach out.",
    events: [],
    contextTags: ["Figma Config", "Berlin", "green trench coat", "Braun watch", "Kupuri rebrand"],
  },
];

// ─── FUZZY RECALL ENGINE (simulated Hermes graph traversal) ─────────────────
const RECALL_CORPUS = [
  { personId: 1, trigger: ["gas station", "airport", "sf", "san francisco", "sequoia", "summit", "tall woman", "braids"], match: "You met at SV Summit 2023, introduced by Marcus. She was the Sequoia partner." },
  { personId: 1, trigger: ["birthday", "march", "daughter", "maya", "harvard"], match: "Adaeze — her daughter Maya just started at Harvard. Birthday is March 14th." },
  { personId: 2, trigger: ["bonsai", "boston", "classmate", "stanford", "cto", "technical guy", "trees", "plants"], match: "That's Marcus Chen — the bonsai collector from Stanford. Based in Boston." },
  { personId: 2, trigger: ["warm intro", "needs introduction", "won't respond cold"], match: "Marcus Chen. He only responds to warm intros — never cold outreach." },
  { personId: 3, trigger: ["red boots", "austin", "direct", "no small talk", "blunt", "sharp", "legal ai", "arkon"], match: "Priya Sharma — met at Austin AI week. Red boots. Said 'I don't do small talk'." },
  { personId: 3, trigger: ["co-founder", "raj", "conflict", "drama", "partner"], match: "That's the Priya/Raj situation at Arkon Labs. Don't bring it up directly." },
  { personId: 4, trigger: ["berlin", "german", "braun watch", "green coat", "figma", "designer", "trench"], match: "Tobias Reinholt — Figma Config Berlin. Green trench coat, Braun watch. Artifact Studio." },
];

function fuzzyRecall(query: string, people: typeof SEED_PEOPLE) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const hits: Array<{ person: typeof SEED_PEOPLE[0]; match: string; confidence: string }> = [];
  for (const entry of RECALL_CORPUS) {
    const score = entry.trigger.filter(t => q.includes(t) || t.includes(q.split(" ")[0])).length;
    if (score > 0) {
      const person = people.find(p => p.id === entry.personId);
      if (person) hits.push({ person, match: entry.match, confidence: score >= 2 ? "high" : "med" });
    }
  }
  people.forEach(p => {
    if (p.name.toLowerCase().includes(q) || p.contextTags.some(t => t.toLowerCase().includes(q))) {
      if (!hits.find(h => h.person.id === p.id)) {
        hits.push({ person: p, match: `Direct match — ${p.name}, ${p.role}`, confidence: "high" });
      }
    }
  });
  return hits.slice(0, 4);
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
const initials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
const daysFrom = (d: string) => Math.round((new Date(d).getTime() - new Date().getTime()) / 86400000);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtRel = (days: number) => {
  if (days < 0) return "Passed";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days}d`;
  if (days < 31) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
};
const EVENT_COLORS: Record<string, string> = { birthday: "#d94f3d", meeting: "#3d8c5a", reminder: "#4a72c4" };
const strengthLabel = (s: string) => ({ strong: "ACTIVE", medium: "WARM", fading: "FADING" }[s] || "—");

// ─── GRAPH LAYOUT (force-directed approximation) ─────────────────────────────
function buildGraphPositions(people: typeof SEED_PEOPLE) {
  const cx = 50, cy = 50, r = 34;
  return people.map((p, i) => {
    const angle = (i / people.length) * 2 * Math.PI - Math.PI / 2;
    return { id: p.id, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function HermesRolodex() {
  const [people, setPeople] = useState(SEED_PEOPLE);
  const [selected, setSelected] = useState<typeof SEED_PEOPLE[0] | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "graph">("grid");
  const [showAdd, setShowAdd] = useState(false);
  const [showRecall, setShowRecall] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; icon: string; title: string; body: string; cls?: string }>>([]);
  const [recallQuery, setRecallQuery] = useState("");
  const [recallResults, setRecallResults] = useState<Array<{ person: typeof SEED_PEOPLE[0]; match: string; confidence: string }>>([]);
  const [recallThinking, setRecallThinking] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recallRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState({ name: "", role: "", company: "", email: "", phone: "", location: "", birthday: "", tags: "", notes: "" });

  // Upcoming events
  const upcoming = people
    .flatMap(p => p.events.map(e => ({ ...e, person: p, days: daysFrom(e.date) })))
    .filter(e => e.days >= 0 && e.days <= 30)
    .sort((a, b) => a.days - b.days);

  const upcomingCount = upcoming.length;

  // Birthday toast on load
  useEffect(() => {
    const soon = upcoming.find(e => e.type === "birthday" && e.days <= 3);
    if (soon) {
      setTimeout(() => toast({
        icon: "🎂",
        title: `${soon.person.name}'s birthday ${soon.days === 0 ? "is today" : `in ${soon.days}d`}`,
        body: "Hermes suggests sending a personal note.",
        cls: "signal-toast"
      }), 1000);
    }
  }, []);

  // Hermes recall — debounced
  useEffect(() => {
    if (!recallQuery.trim()) { setRecallResults([]); return; }
    setRecallThinking(true);
    setRecallResults([]);
    const t = setTimeout(() => {
      const res = fuzzyRecall(recallQuery, people);
      setRecallResults(res);
      setRecallThinking(false);
    }, 700);
    return () => clearTimeout(t);
  }, [recallQuery, people]);

  const toast = useCallback(({ icon, title, body, cls = "" }: { icon: string; title: string; body: string; cls?: string }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, icon, title, body, cls }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const handleAddPerson = () => {
    if (!form.name.trim()) return;
    const p: typeof SEED_PEOPLE[0] = {
      id: Date.now(),
      name: form.name, role: form.role, photo,
      birthday: form.birthday, email: form.email, phone: form.phone,
      company: form.company, location: form.location,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      connections: [], strength: "medium",
      lastContact: new Date().toISOString().slice(0, 10),
      contextMemory: [], notes: form.notes, events: [],
      contextTags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    if (form.birthday) {
      const thisYear = new Date().getFullYear();
      const bday = form.birthday.replace(/\d{4}/, String(thisYear));
      const d = daysFrom(bday);
      const adj = d < 0 ? d + 365 : d;
      if (adj <= 30) p.events.push({ id: `b${Date.now()}`, type: "birthday", title: "Birthday", date: form.birthday });
    }
    setPeople(prev => [...prev, p]);
    setSelected(p);
    setShowAdd(false);
    setForm({ name: "", role: "", company: "", email: "", phone: "", location: "", birthday: "", tags: "", notes: "" });
    setPhoto(null);
    toast({ icon: "⊕", title: `${p.name} added to your graph`, body: "Hermes has indexed this node.", cls: "signal-toast" });
  };

  const handleAddReminder = (person: typeof SEED_PEOPLE[0]) => {
    const label = window.prompt(`Reminder for ${person.name}:`);
    if (!label) return;
    const date = window.prompt("Date (YYYY-MM-DD):", new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    if (!date) return;
    const ev = { id: `r${Date.now()}`, type: "reminder", title: label, date };
    setPeople(prev => prev.map(p => p.id === person.id ? { ...p, events: [...p.events, ev] } : p));
    const updated = { ...person, events: [...person.events, ev] };
    setSelected(updated);
    toast({ icon: "⏰", title: "Reminder set", body: `${label} — ${fmtDate(date)}` });
  };

  const filteredPeople = people.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.role.toLowerCase().includes(s)
      || p.tags.some(t => t.includes(s)) || p.contextTags.some(t => t.toLowerCase().includes(s))
      || p.company?.toLowerCase().includes(s);
  });

  const graphPositions = buildGraphPositions(people);

  // Get latest selected from people array
  const selectedFull = selected ? (people.find(p => p.id === selected.id) || selected) : null;

  return (
    <>
      <style>{STYLES}</style>
      <div className="hr-app">

        {/* ── HEADER ── */}
        <header className="hr-header">
          <div className="hr-wordmark">
            <span className="hr-wordmark-h">HERMES</span>
            <span className="hr-wordmark-sub">Rolodex</span>
            <span className="hr-wordmark-dot" />
          </div>

          <div className="hr-search-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="hr-search" placeholder="Search people, tags, context…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="hr-header-actions">
            <button className="hr-recall-btn" onClick={() => { setShowRecall(true); setRecallQuery(""); setRecallResults([]); }}>
              <span className="hr-recall-icon">⟆</span>
              Fuzzy Recall
            </button>
            <button className="hr-btn hr-btn-ghost" onClick={() => setShowUpcoming(v => !v)} style={{ position: "relative" }}>
              {upcomingCount > 0 && (
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--signal)", display: "inline-block", animation: "hr-pulse 2s infinite" }} />
              )}
              {upcomingCount} upcoming
            </button>
            <button className="hr-btn hr-btn-primary" onClick={() => setShowAdd(true)}>
              + Add
            </button>
          </div>

          {/* Upcoming dropdown */}
          {showUpcoming && (
            <div className="hr-upcoming-panel">
              <div className="hr-upcoming-head">Next 30 days — Hermes watching</div>
              <div className="hr-upcoming-list">
                {upcoming.length === 0
                  ? <div style={{ padding: "14px 16px", fontSize: 11, color: "var(--mercury-3)" }}>Clear calendar ahead.</div>
                  : upcoming.map(ev => (
                    <div key={ev.id} className="hr-upcoming-item" onClick={() => { setSelected(ev.person); setShowUpcoming(false); }}>
                      <div className="hr-upcoming-mini">
                        {ev.person.photo ? <img src={ev.person.photo} alt="" /> : initials(ev.person.name)}
                      </div>
                      <div>
                        <div className="hr-upcoming-event">{ev.title}</div>
                        <div className="hr-upcoming-who">{ev.person.name} · {fmtDate(ev.date)}</div>
                      </div>
                      <div className="hr-upcoming-rel" style={{ color: EVENT_COLORS[ev.type], borderColor: EVENT_COLORS[ev.type] }}>
                        {fmtRel(ev.days)}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </header>

        {/* ── BODY ── */}
        <div className={`hr-body${selectedFull ? " panel-open" : ""}`}>

          {/* ── GRID / GRAPH AREA ── */}
          <div className="hr-grid-area">
            <div className="hr-section-head">
              <div>
                <div className="hr-section-label">Your network</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="hr-section-count">{filteredPeople.length} nodes in graph</span>
                <div className="hr-view-tabs">
                  <button className={`hr-tab${view === "grid" ? " active" : ""}`} onClick={() => setView("grid")}>Grid</button>
                  <button className={`hr-tab${view === "graph" ? " active" : ""}`} onClick={() => setView("graph")}>Graph</button>
                </div>
              </div>
            </div>

            {/* ── CARD GRID ── */}
            {view === "grid" && (
              <div className="hr-people-grid">
                {filteredPeople.map(person => {
                  const hasUrgent = person.events.some(e => daysFrom(e.date) >= 0 && daysFrom(e.date) <= 7);
                  return (
                    <div
                      key={person.id}
                      className={`hr-card${selectedFull?.id === person.id ? " active" : ""}`}
                      onClick={() => setSelected(selectedFull?.id === person.id ? null : person)}
                    >
                      {hasUrgent && <div className="hr-card-event-dot" />}
                      <div className={`hr-card-ring ${person.strength}`}>{strengthLabel(person.strength)}</div>
                      <div className="hr-card-photo">
                        {person.photo
                          ? <img src={person.photo} alt={person.name} />
                          : <div className="hr-card-initials">{initials(person.name)}</div>
                        }
                      </div>
                      <div className="hr-card-body">
                        <div className="hr-card-name">{person.name}</div>
                        <div className="hr-card-role">{person.role}</div>
                        <div className="hr-card-tags">
                          {person.tags.slice(0, 2).map(t => <span key={t} className="hr-tag">{t}</span>)}
                          {person.strength === "fading" && <span className="hr-tag signal">reach out</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="hr-add-card" onClick={() => setShowAdd(true)}>
                  <div className="hr-add-icon">⊕</div>
                  <div className="hr-add-label">Add node</div>
                </div>
              </div>
            )}

            {/* ── GRAPH VIEW ── */}
            {view === "graph" && (
              <div className="hr-graph-view">
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                  {people.flatMap(p =>
                    p.connections.map(cid => {
                      const from = graphPositions.find(n => n.id === p.id);
                      const to = graphPositions.find(n => n.id === cid);
                      if (!from || !to) return null;
                      return (
                        <line
                          key={`${p.id}-${cid}`}
                          x1={`${from.x}%`} y1={`${from.y}%`}
                          x2={`${to.x}%`} y2={`${to.y}%`}
                          stroke="rgba(217,79,61,0.25)" strokeWidth="1"
                          strokeDasharray="4,4"
                        />
                      );
                    })
                  )}
                </svg>
                {people.map(p => {
                  const pos = graphPositions.find(n => n.id === p.id);
                  if (!pos) return null;
                  return (
                    <div
                      key={p.id}
                      className={`graph-node-el${selectedFull?.id === p.id ? " active" : ""}`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      onClick={() => setSelected(selectedFull?.id === p.id ? null : p)}
                    >
                      <div className="graph-node-circle">
                        {p.photo ? <img src={p.photo} alt="" /> : initials(p.name)}
                      </div>
                      <div className="graph-node-label">{p.name.split(" ")[0]}</div>
                    </div>
                  );
                })}
                <div style={{ position: "absolute", bottom: 14, left: 16, fontSize: 9, color: "var(--mercury-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
                  ⟆ HERMES GRAPH · {people.length} NODES · {people.reduce((a, p) => a + p.connections.length, 0)} EDGES
                </div>
              </div>
            )}
          </div>

          {/* ── DETAIL PANEL ── */}
          {selectedFull && (
            <div className="hr-panel">
              <div className="hr-panel-head">
                <div className="hr-panel-avatar">
                  {selectedFull.photo ? <img src={selectedFull.photo} alt="" /> : initials(selectedFull.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="hr-panel-name">{selectedFull.name}</div>
                  <div className="hr-panel-role">{selectedFull.role}</div>
                  <div className="hr-strength-bar">
                    <span className="hr-strength-label">Bond</span>
                    <div className="hr-strength-track">
                      <div className={`hr-strength-fill ${selectedFull.strength}`}
                        style={{ width: selectedFull.strength === "strong" ? "85%" : selectedFull.strength === "medium" ? "52%" : "22%" }} />
                    </div>
                    <span className="hr-strength-label" style={{ color: selectedFull.strength === "strong" ? "var(--green)" : selectedFull.strength === "medium" ? "var(--amber)" : "var(--signal)" }}>
                      {strengthLabel(selectedFull.strength)}
                    </span>
                  </div>
                </div>
                <button className="hr-panel-close" onClick={() => setSelected(null)}>✕</button>
              </div>

              <div className="hr-panel-body">

                {/* Contact */}
                <div className="hr-section">
                  <div className="hr-section-title">Contact</div>
                  {selectedFull.email && <div className="hr-field"><div className="hr-field-key">Email</div><div className="hr-field-val"><a href={`mailto:${selectedFull.email}`}>{selectedFull.email}</a></div></div>}
                  {selectedFull.phone && <div className="hr-field"><div className="hr-field-key">Phone</div><div className="hr-field-val">{selectedFull.phone}</div></div>}
                  {selectedFull.location && <div className="hr-field"><div className="hr-field-key">Location</div><div className="hr-field-val">{selectedFull.location}</div></div>}
                  {selectedFull.birthday && <div className="hr-field"><div className="hr-field-key">Birthday</div><div className="hr-field-val">{fmtDate(selectedFull.birthday)}</div></div>}
                  {selectedFull.lastContact && <div className="hr-field"><div className="hr-field-key">Last contact</div><div className="hr-field-val">{fmtDate(selectedFull.lastContact)}</div></div>}
                </div>

                {/* Graph */}
                <div className="hr-section">
                  <div className="hr-section-title">Graph nodes</div>
                  <div className="hr-graph-nodes">
                    {selectedFull.connections.map(cid => {
                      const c = people.find(p => p.id === cid);
                      return c ? (
                        <div key={cid} className="hr-graph-chip conn" onClick={() => setSelected(c)}>{c.name.split(" ")[0]}</div>
                      ) : null;
                    })}
                    {selectedFull.contextTags.map(t => (
                      <div key={t} className="hr-graph-chip">{t}</div>
                    ))}
                  </div>
                </div>

                {/* Context Memory */}
                {selectedFull.contextMemory.length > 0 && (
                  <div className="hr-section">
                    <div className="hr-section-title">Hermes memory</div>
                    {selectedFull.contextMemory.map((m, i) => (
                      <div key={i} className="hr-memory-item">
                        {m.text}
                        <div className="hr-memory-meta">— {m.when}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Events */}
                <div className="hr-section">
                  <div className="hr-section-title">Calendar</div>
                  {selectedFull.events.length === 0
                    ? <div style={{ fontSize: 10, color: "var(--mercury-3)", fontFamily: "var(--font-mono)" }}>No events. Add a reminder.</div>
                    : selectedFull.events.map(ev => {
                      const d = daysFrom(ev.date);
                      return (
                        <div key={ev.id} className="hr-event">
                          <div className="hr-event-dot" style={{ background: EVENT_COLORS[ev.type] }} />
                          <div>
                            <div className="hr-event-name">{ev.title}</div>
                            <div className="hr-event-date">{fmtDate(ev.date)}</div>
                          </div>
                          {d >= 0 && d <= 30 && (
                            <div className="hr-event-badge" style={{ color: EVENT_COLORS[ev.type], borderColor: EVENT_COLORS[ev.type], background: `${EVENT_COLORS[ev.type]}14` }}>
                              {fmtRel(d)}
                            </div>
                          )}
                        </div>
                      );
                    })
                  }
                </div>

                {/* Notes */}
                {selectedFull.notes && (
                  <div className="hr-section">
                    <div className="hr-section-title">Notes</div>
                    <div className="hr-notes">"{selectedFull.notes}"</div>
                  </div>
                )}

              </div>

              <div className="hr-panel-actions">
                <button className="hr-action hr-action-primary" onClick={() => handleAddReminder(selectedFull)}>+ Remind</button>
                <button className="hr-action hr-action-ghost" onClick={() => toast({ icon: "✉", title: `Draft to ${selectedFull.name}`, body: "Hermes composing via WhatsApp gateway…" })}>Message</button>
                <button className="hr-action hr-action-ghost" onClick={() => {
                  if (!window.confirm(`Remove ${selectedFull.name}?`)) return;
                  setPeople(prev => prev.filter(p => p.id !== selectedFull.id));
                  setSelected(null);
                }}>Remove</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TOASTS ── */}
      <div className="hr-toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`hr-toast${t.cls ? " " + t.cls : ""}`}>
            <span className="hr-toast-icon">{t.icon}</span>
            <div>
              <div className="hr-toast-title">{t.title}</div>
              <div className="hr-toast-body">{t.body}</div>
            </div>
            <button className="hr-toast-close" onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}>✕</button>
          </div>
        ))}
      </div>

      {/* ── HERMES FUZZY RECALL MODAL ── */}
      {showRecall && (
        <div className="hr-overlay" onClick={e => e.target === e.currentTarget && setShowRecall(false)}>
          <div className="hr-modal hr-recall-modal">
            <div className="hr-recall-header">
              <div className="hr-hermes-badge">
                <div className="hr-hermes-dot" />
                Hermes Agent
              </div>
              <div className="hr-recall-title">Fuzzy Recall</div>
              <button className="hr-panel-close" style={{ marginLeft: "auto" }} onClick={() => setShowRecall(false)}>✕</button>
            </div>
            <div className="hr-recall-body">
              <div className="hr-recall-desc">
                Describe someone in any way you remember them. Hermes traverses your graph — context, meeting place, physical detail, shared connections — and surfaces the match.
              </div>
              <div className="hr-recall-input-wrap">
                <textarea
                  ref={recallRef}
                  className="hr-recall-input"
                  placeholder="That guy from the gas station in Austin… or the woman with the red boots who hated small talk…"
                  value={recallQuery}
                  onChange={e => setRecallQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="hr-recall-examples">
                {["bonsai trees", "green trench coat Berlin", "red boots Austin", "Harvard daughter", "warm intro only"].map(ex => (
                  <div key={ex} className="hr-example-chip" onClick={() => setRecallQuery(ex)}>{ex}</div>
                ))}
              </div>

              {recallThinking && (
                <div className="hr-thinking">
                  <span>Hermes traversing graph</span>
                  <span className="hr-thinking-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              )}

              {recallResults.length > 0 && (
                <div className="hr-recall-results">
                  {recallResults.map(({ person, match, confidence }) => (
                    <div key={person.id} className="hr-recall-result-item" onClick={() => { setSelected(person); setShowRecall(false); }}>
                      <div className="hr-recall-mini-avatar">
                        {person.photo ? <img src={person.photo} alt="" /> : initials(person.name)}
                      </div>
                      <div>
                        <div className="hr-recall-name">{person.name}</div>
                        <div className="hr-recall-match">{match}</div>
                      </div>
                      <div className={`hr-recall-confidence ${confidence}`}>
                        {confidence === "high" ? "HIGH CONF" : "POSSIBLE"}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {recallQuery && !recallThinking && recallResults.length === 0 && (
                <div className="hr-thinking" style={{ marginTop: 12 }}>
                  <span style={{ color: "var(--signal)" }}>No match in current graph. Try adding more context tags.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD PERSON MODAL ── */}
      {showAdd && (
        <div className="hr-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="hr-modal">
            <div className="hr-modal-head">
              <div className="hr-modal-title">Add to graph</div>
              <button className="hr-panel-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="hr-modal-body">
              <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={e => {
                const f = e.target.files?.[0];
                if (f) setPhoto(URL.createObjectURL(f));
              }} />
              <div className={`hr-photo-zone${photo ? " filled" : ""}`} onClick={() => fileRef.current?.click()}>
                {photo
                  ? <><img src={photo} alt="" className="hr-photo-preview" /><div className="hr-photo-replace">replace</div></>
                  : <><div className="hr-photo-icon">📷</div><div className="hr-photo-label">Upload photo or take one</div></>
                }
              </div>

              <div className="hr-form-row">
                <div className="hr-form-group">
                  <label className="hr-form-label">Full name *</label>
                  <input className="hr-form-input" placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label className="hr-form-label">Role / Title</label>
                  <input className="hr-form-input" placeholder="CEO · Acme" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                </div>
              </div>
              <div className="hr-form-row">
                <div className="hr-form-group">
                  <label className="hr-form-label">Email</label>
                  <input className="hr-form-input" type="email" placeholder="jane@co.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label className="hr-form-label">Phone</label>
                  <input className="hr-form-input" placeholder="+1 555 0100" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="hr-form-row">
                <div className="hr-form-group">
                  <label className="hr-form-label">Birthday</label>
                  <input className="hr-form-input" type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
                </div>
                <div className="hr-form-group">
                  <label className="hr-form-label">Location</label>
                  <input className="hr-form-input" placeholder="City, Country" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <div className="hr-form-row full">
                <div className="hr-form-group">
                  <label className="hr-form-label">Context tags — how will you remember them? (comma-separated)</label>
                  <input className="hr-form-input" placeholder="red boots, Austin AI week, co-founder, warm intro" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                </div>
              </div>
              <div className="hr-form-row full">
                <div className="hr-form-group">
                  <label className="hr-form-label">Notes — what do you want Hermes to remember?</label>
                  <textarea className="hr-form-textarea" placeholder="How you met, what they care about, what not to mention, what to follow up on…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="hr-modal-foot">
              <button className="hr-btn hr-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="hr-btn hr-btn-primary" onClick={handleAddPerson} disabled={!form.name.trim()}>Save to graph</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
