/**
 * BresenhamCanvas.jsx - Canvas Renderer using Manual Algorithms
 * CS3231 Computer Graphics - Secure ATM Interface Simulator
 * 
 * Renders the ATM screen interface using only Bresenham's line algorithm
 * and Bezier curves from ManualMath.js - NO Canvas2D drawing APIs for lines.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  bresenhamLine,
  bresenhamRect,
  bresenhamCircle,
  generateBankLogo,
  cubicBezier,
} from '../graphics/ManualMath.js';
import { clipPixels } from '../graphics/ClippingAlgorithm.js';

const SCREEN_WIDTH = 480;
const SCREEN_HEIGHT = 320;

const SCREEN_BOUNDS = {
  xMin: 0,
  yMin: 0,
  xMax: SCREEN_WIDTH - 1,
  yMax: SCREEN_HEIGHT - 1,
};

/**
 * Render pixels onto a canvas using only putImageData
 * Each "pixel" from Bresenham is painted as a single pixel or small dot
 */
function renderPixels(ctx, pixels, color = { r: 0, g: 200, b: 100, a: 255 }) {
  const imageData = ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  const data = imageData.data;

  for (const p of pixels) {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    if (x >= 0 && x < SCREEN_WIDTH && y >= 0 && y < SCREEN_HEIGHT) {
      const idx = (y * SCREEN_WIDTH + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = color.a;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Render text character-by-character using Bresenham lines
 * Simple 5x7 pixel font renderer
 */
const CHAR_MAP = {
  'A': [[0,6],[0,2],[0,2],[2,0],[2,0],[4,2],[4,2],[4,6],[0,4],[4,4]],
  'B': [[0,0],[0,6],[0,0],[3,0],[3,0],[4,1],[4,1],[3,2],[3,2],[0,3],[0,3],[3,3],[3,3],[4,4],[4,4],[4,5],[4,5],[3,6],[3,6],[0,6]],
  'S': [[4,1],[3,0],[3,0],[1,0],[1,0],[0,1],[0,1],[0,2],[0,2],[1,3],[1,3],[3,3],[3,3],[4,4],[4,4],[4,5],[4,5],[3,6],[3,6],[1,6],[1,6],[0,5]],
  'E': [[4,0],[0,0],[0,0],[0,6],[0,6],[4,6],[0,3],[3,3]],
  'C': [[4,1],[3,0],[3,0],[1,0],[1,0],[0,1],[0,1],[0,5],[0,5],[1,6],[1,6],[3,6],[3,6],[4,5]],
  'U': [[0,0],[0,5],[0,5],[1,6],[1,6],[3,6],[3,6],[4,5],[4,5],[4,0]],
  'R': [[0,0],[0,6],[0,0],[3,0],[3,0],[4,1],[4,1],[4,2],[4,2],[3,3],[3,3],[0,3],[2,3],[4,6]],
  'K': [[0,0],[0,6],[4,0],[0,3],[0,3],[4,6]],
  'N': [[0,6],[0,0],[0,0],[4,6],[4,6],[4,0]],
  'I': [[1,0],[3,0],[2,0],[2,6],[1,6],[3,6]],
  'T': [[0,0],[4,0],[2,0],[2,6]],
  'P': [[0,0],[0,6],[0,0],[3,0],[3,0],[4,1],[4,1],[4,2],[4,2],[3,3],[3,3],[0,3]],
  'D': [[0,0],[0,6],[0,0],[3,0],[3,0],[4,1],[4,1],[4,5],[4,5],[3,6],[3,6],[0,6]],
  'L': [[0,0],[0,6],[0,6],[4,6]],
  'M': [[0,6],[0,0],[0,0],[2,3],[2,3],[4,0],[4,0],[4,6]],
  'W': [[0,0],[1,6],[1,6],[2,3],[2,3],[3,6],[3,6],[4,0]],
  'H': [[0,0],[0,6],[4,0],[4,6],[0,3],[4,3]],
  'O': [[1,0],[3,0],[3,0],[4,1],[4,1],[4,5],[4,5],[3,6],[3,6],[1,6],[1,6],[0,5],[0,5],[0,1],[0,1],[1,0]],
  'G': [[4,1],[3,0],[3,0],[1,0],[1,0],[0,1],[0,1],[0,5],[0,5],[1,6],[1,6],[3,6],[3,6],[4,5],[4,5],[4,3],[4,3],[2,3]],
  'F': [[4,0],[0,0],[0,0],[0,6],[0,3],[3,3]],
  'V': [[0,0],[2,6],[2,6],[4,0]],
  'X': [[0,0],[4,6],[4,0],[0,6]],
  'Y': [[0,0],[2,3],[4,0],[2,3],[2,3],[2,6]],
  'Z': [[0,0],[4,0],[4,0],[0,6],[0,6],[4,6]],
  'J': [[1,0],[4,0],[3,0],[3,5],[3,5],[2,6],[2,6],[1,6],[1,6],[0,5]],
  'Q': [[1,0],[3,0],[3,0],[4,1],[4,1],[4,4],[4,4],[3,5],[3,5],[4,6],[1,0],[0,1],[0,1],[0,5],[0,5],[1,6],[1,6],[2,6],[2,5],[3,5]],
  '0': [[1,0],[3,0],[3,0],[4,1],[4,1],[4,5],[4,5],[3,6],[3,6],[1,6],[1,6],[0,5],[0,5],[0,1],[0,1],[1,0],[1,5],[3,1]],
  '1': [[1,1],[2,0],[2,0],[2,6],[1,6],[3,6]],
  '2': [[0,1],[1,0],[1,0],[3,0],[3,0],[4,1],[4,1],[4,2],[4,2],[0,6],[0,6],[4,6]],
  '3': [[0,1],[1,0],[1,0],[3,0],[3,0],[4,1],[4,1],[4,2],[4,2],[3,3],[3,3],[4,4],[4,4],[4,5],[4,5],[3,6],[3,6],[1,6],[1,6],[0,5]],
  '4': [[0,0],[0,3],[0,3],[4,3],[3,0],[3,6]],
  '5': [[4,0],[0,0],[0,0],[0,3],[0,3],[3,3],[3,3],[4,4],[4,4],[4,5],[4,5],[3,6],[3,6],[0,6]],
  '6': [[3,0],[1,0],[1,0],[0,1],[0,1],[0,5],[0,5],[1,6],[1,6],[3,6],[3,6],[4,5],[4,5],[4,4],[4,4],[3,3],[3,3],[0,3]],
  '7': [[0,0],[4,0],[4,0],[2,6]],
  '8': [[1,0],[3,0],[3,0],[4,1],[4,1],[4,2],[4,2],[3,3],[3,3],[1,3],[1,3],[0,2],[0,2],[0,1],[0,1],[1,0],[1,3],[0,4],[0,4],[0,5],[0,5],[1,6],[1,6],[3,6],[3,6],[4,5],[4,5],[4,4],[4,4],[3,3]],
  '9': [[4,3],[4,1],[4,1],[3,0],[3,0],[1,0],[1,0],[0,1],[0,1],[0,2],[0,2],[1,3],[1,3],[4,3],[4,3],[4,5],[4,5],[3,6],[3,6],[1,6]],
  ' ': [],
  '-': [[1,3],[3,3]],
  '.': [[2,5],[2,6]],
  ':': [[2,2],[2,2],[2,4],[2,4]],
  ',': [[2,5],[1,7]],
  '●': [],
  '*': [[1,1],[3,5],[3,1],[1,5],[0,3],[4,3]],
  '$': [[4,1],[3,0],[3,0],[1,0],[1,0],[0,1],[0,1],[0,2],[0,2],[1,3],[1,3],[3,3],[3,3],[4,4],[4,4],[4,5],[4,5],[3,6],[3,6],[1,6],[1,6],[0,5],[2,0],[2,6]],
  '(': [[3,0],[2,1],[2,1],[2,5],[2,5],[3,6]],
  ')': [[1,0],[2,1],[2,1],[2,5],[2,5],[1,6]],
  '/': [[4,0],[0,6]],
  '!': [[2,0],[2,4],[2,6],[2,6]],
  '?': [[0,1],[1,0],[1,0],[3,0],[3,0],[4,1],[4,1],[4,2],[4,2],[3,3],[3,3],[2,3],[2,3],[2,4],[2,6],[2,6]],
};

/**
 * Render a text string using Bresenham's lines for each character glyph
 */
export function renderBresenhamText(ctx, text, startX, startY, scale = 2, color = { r: 0, g: 200, b: 100, a: 255 }) {
  const charWidth = 6 * scale;
  const allPixels = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toUpperCase();
    const segments = CHAR_MAP[ch];
    if (!segments) continue;

    const ox = startX + i * charWidth;
    const oy = startY;

    for (let s = 0; s < segments.length; s += 2) {
      if (s + 1 >= segments.length) break;
      const x0 = ox + segments[s][0] * scale;
      const y0 = oy + segments[s][1] * scale;
      const x1 = ox + segments[s + 1][0] * scale;
      const y1 = oy + segments[s + 1][1] * scale;
      const pixels = bresenhamLine(x0, y0, x1, y1);
      allPixels.push(...pixels);
    }
  }

  const clipped = clipPixels(allPixels, SCREEN_BOUNDS);
  renderPixels(ctx, clipped, color);
}

/**
 * BresenhamCanvas Component
 * Renders the ATM screen content using only manual algorithms
 */
const BresenhamCanvas = ({ atmState, atmData }) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);

  const drawScreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear screen with dark background
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    timeRef.current += 0.016;

    // Draw border using Bresenham rect
    const borderPixels = bresenhamRect(2, 2, SCREEN_WIDTH - 5, SCREEN_HEIGHT - 5);
    const clippedBorder = clipPixels(borderPixels, SCREEN_BOUNDS);
    renderPixels(ctx, clippedBorder, { r: 0, g: 120, b: 80, a: 200 });

    // Inner border
    const innerBorder = bresenhamRect(5, 5, SCREEN_WIDTH - 11, SCREEN_HEIGHT - 11);
    renderPixels(ctx, clipPixels(innerBorder, SCREEN_BOUNDS), { r: 0, g: 80, b: 60, a: 150 });

    // Draw bank logo at top center using Bezier curves
    const logoPixels = generateBankLogo(SCREEN_WIDTH / 2, 45, 0.5);
    const clippedLogo = clipPixels(logoPixels, SCREEN_BOUNDS);
    renderPixels(ctx, clippedLogo, { r: 0, g: 220, b: 120, a: 255 });

    // Bank name
    renderBresenhamText(ctx, 'SECURE BANK', SCREEN_WIDTH / 2 - 65, 75, 2, { r: 0, g: 230, b: 140, a: 255 });

    // State-specific content
    switch (atmState) {
      case 'IDLE':
        renderIdleScreen(ctx);
        break;
      case 'CARD_INSERTING':
        renderCardInsertingScreen(ctx);
        break;
      case 'PIN_ENTRY':
        renderPinScreen(ctx, atmData);
        break;
      case 'AUTHENTICATING':
        renderAuthScreen(ctx);
        break;
      case 'AUTH_FAILED':
        renderAuthFailedScreen(ctx, atmData);
        break;
      case 'MENU':
        renderMenuScreen(ctx, atmData);
        break;
      case 'BALANCE':
        renderBalanceScreen(ctx, atmData);
        break;
      case 'WITHDRAWAL':
        renderWithdrawalScreen(ctx, atmData);
        break;
      case 'PROCESSING':
        renderProcessingScreen(ctx);
        break;
      case 'DISPENSING':
        renderDispensingScreen(ctx);
        break;
      case 'SUCCESS':
        renderSuccessScreen(ctx, atmData);
        break;
      case 'CARD_EJECTING':
        renderEjectingScreen(ctx);
        break;
      default:
        break;
    }

    // Decorative animated line at bottom
    const wavePixels = [];
    for (let x = 10; x < SCREEN_WIDTH - 10; x++) {
      const y = SCREEN_HEIGHT - 15 + Math.sin((x + timeRef.current * 100) * 0.05) * 3;
      wavePixels.push({ x, y: Math.round(y) });
    }
    renderPixels(ctx, clipPixels(wavePixels, SCREEN_BOUNDS), { r: 0, g: 150, b: 100, a: 100 });

    animFrameRef.current = requestAnimationFrame(drawScreen);
  }, [atmState, atmData]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawScreen);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawScreen]);

  return (
    <canvas
      ref={canvasRef}
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT}
      id="atm-bresenham-screen"
      style={{
        imageRendering: 'pixelated',
        borderRadius: '8px',
        boxShadow: '0 0 30px rgba(0, 200, 100, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.5)',
      }}
    />
  );
};

// === State-specific screen renderers ===

function renderIdleScreen(ctx) {
  renderBresenhamText(ctx, 'WELCOME', SCREEN_WIDTH / 2 - 42, 120, 2, { r: 0, g: 255, b: 150, a: 255 });
  renderBresenhamText(ctx, 'INSERT CARD', SCREEN_WIDTH / 2 - 65, 160, 2, { r: 0, g: 200, b: 120, a: 200 });
  renderBresenhamText(ctx, 'TO BEGIN', SCREEN_WIDTH / 2 - 48, 185, 2, { r: 0, g: 200, b: 120, a: 200 });

  // Animated arrow pointing to card slot
  const arrowY = 230 + Math.sin(Date.now() * 0.005) * 5;
  const arrowPixels = [
    ...bresenhamLine(SCREEN_WIDTH / 2, arrowY, SCREEN_WIDTH / 2 - 15, arrowY - 10),
    ...bresenhamLine(SCREEN_WIDTH / 2, arrowY, SCREEN_WIDTH / 2 + 15, arrowY - 10),
    ...bresenhamLine(SCREEN_WIDTH / 2, arrowY, SCREEN_WIDTH / 2, arrowY - 25),
  ];
  renderPixels(ctx, clipPixels(arrowPixels, SCREEN_BOUNDS), { r: 0, g: 255, b: 100, a: 255 });
}

function renderCardInsertingScreen(ctx) {
  renderBresenhamText(ctx, 'READING CARD', SCREEN_WIDTH / 2 - 72, 140, 2, { r: 0, g: 200, b: 120, a: 255 });
  renderBresenhamText(ctx, 'PLEASE WAIT', SCREEN_WIDTH / 2 - 65, 170, 2, { r: 0, g: 180, b: 100, a: 180 });

  // Loading animation - spinning dots using Bresenham circles
  const cx = SCREEN_WIDTH / 2;
  const cy = 220;
  const numDots = 8;
  const radius = 15;
  for (let i = 0; i < numDots; i++) {
    const angle = (i / numDots) * Math.PI * 2 + Date.now() * 0.003;
    const dx = cx + Math.cos(angle) * radius;
    const dy = cy + Math.sin(angle) * radius;
    const alpha = Math.floor(100 + 155 * ((i + Math.floor(Date.now() * 0.01)) % numDots) / numDots);
    const dotPixels = bresenhamCircle(Math.round(dx), Math.round(dy), 2);
    renderPixels(ctx, clipPixels(dotPixels, SCREEN_BOUNDS), { r: 0, g: 200, b: 120, a: alpha });
  }
}

function renderPinScreen(ctx, data) {
  renderBresenhamText(ctx, 'ENTER PIN', SCREEN_WIDTH / 2 - 54, 105, 2, { r: 0, g: 255, b: 150, a: 255 });

  // PIN display boxes
  const pinBoxStartX = SCREEN_WIDTH / 2 - 60;
  const pinBoxY = 140;
  const boxSize = 25;
  const gap = 8;

  for (let i = 0; i < 4; i++) {
    const bx = pinBoxStartX + i * (boxSize + gap);
    const boxPixels = bresenhamRect(bx, pinBoxY, boxSize, boxSize);
    renderPixels(ctx, clipPixels(boxPixels, SCREEN_BOUNDS), { r: 0, g: 180, b: 100, a: 200 });

    // Show filled dots for entered digits
    if (data && data.pin && i < data.pin.length) {
      const dotPixels = bresenhamCircle(bx + boxSize / 2, pinBoxY + boxSize / 2, 5);
      renderPixels(ctx, clipPixels(dotPixels, SCREEN_BOUNDS), { r: 0, g: 255, b: 150, a: 255 });
    }
  }

  if (data && data.pinAttempts > 0) {
    renderBresenhamText(ctx, `ATTEMPTS: ${data.remainingAttempts}/3`, SCREEN_WIDTH / 2 - 84, 185, 2, { r: 200, g: 100, b: 0, a: 255 });
  }

  renderBresenhamText(ctx, 'PIN: 1234', SCREEN_WIDTH / 2 - 54, 210, 2, { r: 0, g: 120, b: 80, a: 120 });
  renderBresenhamText(ctx, 'PRESS ENTER', SCREEN_WIDTH / 2 - 65, 250, 2, { r: 0, g: 160, b: 100, a: 180 });
}

function renderAuthScreen(ctx) {
  renderBresenhamText(ctx, 'VERIFYING', SCREEN_WIDTH / 2 - 54, 130, 2, { r: 0, g: 200, b: 120, a: 255 });
  renderBresenhamText(ctx, 'PLEASE WAIT', SCREEN_WIDTH / 2 - 65, 160, 2, { r: 0, g: 180, b: 100, a: 180 });

  // Lock icon using Bresenham
  const lockX = SCREEN_WIDTH / 2;
  const lockY = 215;
  const lockBody = bresenhamRect(lockX - 12, lockY, 24, 18);
  const lockShackle = [
    ...bresenhamLine(lockX - 7, lockY, lockX - 7, lockY - 10),
    ...bresenhamLine(lockX + 7, lockY, lockX + 7, lockY - 10),
  ];
  const lockTop = cubicBezier(
    { x: lockX - 7, y: lockY - 10 },
    { x: lockX - 7, y: lockY - 20 },
    { x: lockX + 7, y: lockY - 20 },
    { x: lockX + 7, y: lockY - 10 },
    30
  );
  renderPixels(ctx, clipPixels([...lockBody, ...lockShackle, ...lockTop], SCREEN_BOUNDS), { r: 0, g: 220, b: 130, a: 255 });
}

function renderAuthFailedScreen(ctx, data) {
  renderBresenhamText(ctx, 'ACCESS DENIED', SCREEN_WIDTH / 2 - 78, 120, 2, { r: 255, g: 60, b: 60, a: 255 });
  renderBresenhamText(ctx, 'WRONG PIN', SCREEN_WIDTH / 2 - 54, 150, 2, { r: 255, g: 100, b: 80, a: 200 });

  if (data) {
    renderBresenhamText(ctx, `${data.remainingAttempts} TRIES LEFT`, SCREEN_WIDTH / 2 - 72, 180, 2, { r: 255, g: 150, b: 50, a: 200 });
  }

  // X mark
  const xPixels = [
    ...bresenhamLine(SCREEN_WIDTH / 2 - 15, 210, SCREEN_WIDTH / 2 + 15, 240),
    ...bresenhamLine(SCREEN_WIDTH / 2 + 15, 210, SCREEN_WIDTH / 2 - 15, 240),
  ];
  renderPixels(ctx, clipPixels(xPixels, SCREEN_BOUNDS), { r: 255, g: 60, b: 60, a: 255 });

  renderBresenhamText(ctx, 'CLICK RETRY', SCREEN_WIDTH / 2 - 65, 265, 2, { r: 0, g: 180, b: 100, a: 180 });
}

function renderMenuScreen(ctx, data) {
  renderBresenhamText(ctx, 'MAIN MENU', SCREEN_WIDTH / 2 - 54, 105, 2, { r: 0, g: 255, b: 150, a: 255 });

  if (data) {
    renderBresenhamText(ctx, `HELLO ${data.cardholderName}`, 20, 130, 1.5, { r: 0, g: 180, b: 100, a: 200 });
  }

  // Menu options with Bresenham boxes
  const options = ['1. WITHDRAWAL', '2. BALANCE', '3. EXIT'];
  const colors = [
    { r: 0, g: 230, b: 140, a: 255 },
    { r: 0, g: 200, b: 180, a: 255 },
    { r: 200, g: 120, b: 80, a: 255 },
  ];

  options.forEach((opt, i) => {
    const y = 160 + i * 40;
    const boxPixels = bresenhamRect(50, y - 5, SCREEN_WIDTH - 100, 28);
    renderPixels(ctx, clipPixels(boxPixels, SCREEN_BOUNDS), colors[i]);
    renderBresenhamText(ctx, opt, 70, y, 2, colors[i]);
  });
}

function renderBalanceScreen(ctx, data) {
  renderBresenhamText(ctx, 'ACCOUNT BALANCE', SCREEN_WIDTH / 2 - 90, 110, 2, { r: 0, g: 255, b: 150, a: 255 });

  if (data) {
    renderBresenhamText(ctx, data.accountNumber, SCREEN_WIDTH / 2 - 90, 145, 2, { r: 0, g: 180, b: 100, a: 200 });
    const balStr = `$${data.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    renderBresenhamText(ctx, balStr, SCREEN_WIDTH / 2 - 72, 185, 3, { r: 0, g: 255, b: 180, a: 255 });
  }

  renderBresenhamText(ctx, 'PRESS BACK', SCREEN_WIDTH / 2 - 60, 250, 2, { r: 0, g: 160, b: 100, a: 180 });
}

function renderWithdrawalScreen(ctx) {
  renderBresenhamText(ctx, 'SELECT AMOUNT', SCREEN_WIDTH / 2 - 78, 105, 2, { r: 0, g: 255, b: 150, a: 255 });

  const amounts = ['$100', '$200', '$500', '$1000'];
  const color = { r: 0, g: 220, b: 130, a: 255 };

  amounts.forEach((amt, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * 200;
    const y = 140 + row * 55;

    const boxPixels = bresenhamRect(x, y, 150, 38);
    renderPixels(ctx, clipPixels(boxPixels, SCREEN_BOUNDS), color);
    renderBresenhamText(ctx, amt, x + 40, y + 10, 2, color);
  });

  renderBresenhamText(ctx, 'PRESS BACK', SCREEN_WIDTH / 2 - 60, 280, 2, { r: 0, g: 160, b: 100, a: 180 });
}

function renderProcessingScreen(ctx) {
  renderBresenhamText(ctx, 'PROCESSING', SCREEN_WIDTH / 2 - 60, 130, 2, { r: 0, g: 200, b: 120, a: 255 });
  renderBresenhamText(ctx, 'TRANSACTION', SCREEN_WIDTH / 2 - 65, 160, 2, { r: 0, g: 180, b: 100, a: 200 });

  // Spinning gear
  const cx = SCREEN_WIDTH / 2;
  const cy = 220;
  const time = Date.now() * 0.003;
  const spokes = 6;
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2 + time;
    const x1 = cx + Math.cos(angle) * 8;
    const y1 = cy + Math.sin(angle) * 8;
    const x2 = cx + Math.cos(angle) * 20;
    const y2 = cy + Math.sin(angle) * 20;
    const spokePixels = bresenhamLine(Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2));
    renderPixels(ctx, clipPixels(spokePixels, SCREEN_BOUNDS), { r: 0, g: 200, b: 120, a: 200 });
  }
  const circPixels = bresenhamCircle(cx, cy, 22);
  renderPixels(ctx, clipPixels(circPixels, SCREEN_BOUNDS), { r: 0, g: 200, b: 120, a: 150 });
}

function renderDispensingScreen(ctx) {
  renderBresenhamText(ctx, 'DISPENSING', SCREEN_WIDTH / 2 - 60, 130, 2, { r: 0, g: 255, b: 150, a: 255 });
  renderBresenhamText(ctx, 'CASH', SCREEN_WIDTH / 2 - 24, 160, 2, { r: 0, g: 220, b: 120, a: 200 });
  renderBresenhamText(ctx, 'PLEASE TAKE', SCREEN_WIDTH / 2 - 65, 190, 2, { r: 0, g: 180, b: 100, a: 180 });
  renderBresenhamText(ctx, 'YOUR MONEY', SCREEN_WIDTH / 2 - 60, 215, 2, { r: 0, g: 180, b: 100, a: 180 });

  // Dollar sign animation
  const dollarY = 250 + Math.sin(Date.now() * 0.008) * 5;
  const dollarPixels = generateBankLogo(SCREEN_WIDTH / 2, dollarY, 0.35);
  renderPixels(ctx, clipPixels(dollarPixels, SCREEN_BOUNDS), { r: 0, g: 255, b: 120, a: 200 });
}

function renderSuccessScreen(ctx, data) {
  renderBresenhamText(ctx, 'TRANSACTION', SCREEN_WIDTH / 2 - 65, 110, 2, { r: 0, g: 255, b: 150, a: 255 });
  renderBresenhamText(ctx, 'COMPLETE', SCREEN_WIDTH / 2 - 48, 135, 2, { r: 0, g: 255, b: 150, a: 255 });

  // Checkmark
  const checkPixels = [
    ...bresenhamLine(SCREEN_WIDTH / 2 - 15, 175, SCREEN_WIDTH / 2 - 5, 185),
    ...bresenhamLine(SCREEN_WIDTH / 2 - 5, 185, SCREEN_WIDTH / 2 + 15, 165),
  ];
  renderPixels(ctx, clipPixels(checkPixels, SCREEN_BOUNDS), { r: 0, g: 255, b: 100, a: 255 });

  if (data) {
    renderBresenhamText(ctx, `BAL: $${data.balance.toFixed(0)}`, SCREEN_WIDTH / 2 - 66, 210, 2, { r: 0, g: 200, b: 120, a: 200 });
  }

  renderBresenhamText(ctx, '1. CONTINUE', 80, 250, 2, { r: 0, g: 200, b: 130, a: 200 });
  renderBresenhamText(ctx, '2. FINISH', 260, 250, 2, { r: 200, g: 120, b: 80, a: 200 });
}

function renderEjectingScreen(ctx) {
  renderBresenhamText(ctx, 'PLEASE TAKE', SCREEN_WIDTH / 2 - 65, 130, 2, { r: 0, g: 255, b: 150, a: 255 });
  renderBresenhamText(ctx, 'YOUR CARD', SCREEN_WIDTH / 2 - 54, 160, 2, { r: 0, g: 255, b: 150, a: 255 });
  renderBresenhamText(ctx, 'THANK YOU', SCREEN_WIDTH / 2 - 54, 210, 2, { r: 0, g: 180, b: 100, a: 180 });
}

export default BresenhamCanvas;
