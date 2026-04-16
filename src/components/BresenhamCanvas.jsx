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

const SCREEN_WIDTH = 1024;
const SCREEN_HEIGHT = 640;

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
/**
 * Render pixels onto the provided ImageData data array
 */
function renderPixelsToBuffer(data, pixels, color = { r: 0, g: 200, b: 100, a: 255 }) {
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
/**
 * Render a text string using Bresenham's lines for each character glyph
 */
export function renderBresenhamText(data, text, startX, startY, scale = 2, color = { r: 0, g: 200, b: 100, a: 255 }) {
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
  renderPixelsToBuffer(data, clipped, color);
}

/**
 * BresenhamCanvas Component
 * Renders the ATM screen content using only manual algorithms
 */
const BresenhamCanvas = ({ atmState, atmData, onCanvasMount }) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);

  const drawScreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    // Prepare buffer
    const imageData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
    const data = imageData.data;

    // Fill background (clear buffer)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 5;      // R
      data[i + 1] = 5;  // G
      data[i + 2] = 16; // B
      data[i + 3] = 255;
    }

    timeRef.current += 0.016;
    const scaleFactor = 2; // Extra scaling for higher resolution

    // Draw border using Bresenham rect
    const borderPixels = bresenhamRect(5, 5, SCREEN_WIDTH - 10, SCREEN_HEIGHT - 10);
    renderPixelsToBuffer(data, clipPixels(borderPixels, SCREEN_BOUNDS), { r: 0, g: 120, b: 80, a: 200 });

    // Inner border
    const innerBorder = bresenhamRect(12, 12, SCREEN_WIDTH - 24, SCREEN_HEIGHT - 24);
    renderPixelsToBuffer(data, clipPixels(innerBorder, SCREEN_BOUNDS), { r: 0, g: 80, b: 60, a: 150 });

    // Draw bank logo at top center using Bezier curves
    const logoPixels = generateBankLogo(SCREEN_WIDTH / 2, 90, 1.0);
    renderPixelsToBuffer(data, clipPixels(logoPixels, SCREEN_BOUNDS), { r: 0, g: 220, b: 120, a: 255 });

    // Bank name
    renderBresenhamText(data, 'SECURE BANK', SCREEN_WIDTH / 2 - 130, 150, 4, { r: 0, g: 230, b: 140, a: 255 });

    // State-specific content
    switch (atmState) {
      case 'IDLE':
        renderIdleScreen(data);
        break;
      case 'CARD_INSERTING':
        renderCardInsertingScreen(data);
        break;
      case 'PIN_ENTRY':
        renderPinScreen(data, atmData);
        break;
      case 'AUTHENTICATING':
        renderAuthScreen(data);
        break;
      case 'AUTH_FAILED':
        renderAuthFailedScreen(data, atmData);
        break;
      case 'MENU':
        renderMenuScreen(data, atmData);
        break;
      case 'BALANCE':
        renderBalanceScreen(data, atmData);
        break;
      case 'WITHDRAWAL':
        renderWithdrawalScreen(data, atmData);
        break;
      case 'PROCESSING':
        renderProcessingScreen(data);
        break;
      case 'DISPENSING':
        renderDispensingScreen(data);
        break;
      case 'SUCCESS':
        renderSuccessScreen(data, atmData);
        break;
      case 'CARD_EJECTING':
        renderEjectingScreen(data);
        break;
      default:
        break;
    }

    // Decorative animated line at bottom
    const wavePixels = [];
    for (let x = 20; x < SCREEN_WIDTH - 20; x++) {
      const y = SCREEN_HEIGHT - 30 + Math.sin((x + timeRef.current * 100) * 0.05) * 6;
      wavePixels.push({ x, y: Math.round(y) });
    }
    renderPixelsToBuffer(data, clipPixels(wavePixels, SCREEN_BOUNDS), { r: 0, g: 150, b: 100, a: 100 });

    // Final flush
    ctx.putImageData(imageData, 0, 0);

    animFrameRef.current = requestAnimationFrame(drawScreen);
  }, [atmState, atmData]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawScreen);
    if (canvasRef.current && onCanvasMount) {
      onCanvasMount(canvasRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawScreen, onCanvasMount]);

  return (
    <canvas
      ref={canvasRef}
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT}
      id="atm-bresenham-screen"
      style={{
        display: 'none', // Hidden from main UI, used as texture
      }}
    />
  );
};

// === State-specific screen renderers ===

function renderIdleScreen(data) {
  renderBresenhamText(data, 'WELCOME', SCREEN_WIDTH / 2 - 84, 240, 4, { r: 0, g: 255, b: 150, a: 255 });
  renderBresenhamText(data, 'INSERT CARD', SCREEN_WIDTH / 2 - 130, 320, 4, { r: 0, g: 200, b: 120, a: 200 });
  renderBresenhamText(data, 'TO BEGIN', SCREEN_WIDTH / 2 - 96, 370, 4, { r: 0, g: 200, b: 120, a: 200 });

  // Animated arrow pointing to card slot
  const arrowY = 460 + Math.sin(Date.now() * 0.005) * 10;
  const arrowPixels = [
    ...bresenhamLine(SCREEN_WIDTH / 2, arrowY, SCREEN_WIDTH / 2 - 30, arrowY - 20),
    ...bresenhamLine(SCREEN_WIDTH / 2, arrowY, SCREEN_WIDTH / 2 + 30, arrowY - 20),
    ...bresenhamLine(SCREEN_WIDTH / 2, arrowY, SCREEN_WIDTH / 2, arrowY - 50),
  ];
  renderPixelsToBuffer(data, clipPixels(arrowPixels, SCREEN_BOUNDS), { r: 0, g: 255, b: 100, a: 255 });
}

function renderCardInsertingScreen(data) {
  renderBresenhamText(data, 'READING CARD', SCREEN_WIDTH / 2 - 144, 280, 4, { r: 0, g: 200, b: 120, a: 255 });
  renderBresenhamText(data, 'PLEASE WAIT', SCREEN_WIDTH / 2 - 130, 340, 4, { r: 0, g: 180, b: 100, a: 180 });

  // Loading animation
  const cx = SCREEN_WIDTH / 2;
  const cy = 440;
  const numDots = 8;
  const radius = 30;
  for (let i = 0; i < numDots; i++) {
    const angle = (i / numDots) * Math.PI * 2 + Date.now() * 0.003;
    const dx = cx + Math.cos(angle) * radius;
    const dy = cy + Math.sin(angle) * radius;
    const alpha = Math.floor(100 + 155 * ((i + Math.floor(Date.now() * 0.01)) % numDots) / numDots);
    const dotPixels = bresenhamCircle(Math.round(dx), Math.round(dy), 4);
    renderPixelsToBuffer(data, clipPixels(dotPixels, SCREEN_BOUNDS), { r: 0, g: 200, b: 120, a: alpha });
  }
}

function renderPinScreen(data, smData) {
  renderBresenhamText(data, 'ENTER PIN', SCREEN_WIDTH / 2 - 108, 210, 4, { r: 0, g: 255, b: 150, a: 255 });

  const pinBoxStartX = SCREEN_WIDTH / 2 - 120;
  const pinBoxY = 280;
  const boxSize = 50;
  const gap = 16;

  for (let i = 0; i < 4; i++) {
    const bx = pinBoxStartX + i * (boxSize + gap);
    const boxPixels = bresenhamRect(bx, pinBoxY, boxSize, boxSize);
    renderPixelsToBuffer(data, clipPixels(boxPixels, SCREEN_BOUNDS), { r: 0, g: 180, b: 100, a: 200 });

    if (smData && smData.pin && i < smData.pin.length) {
      const dotPixels = bresenhamCircle(bx + boxSize / 2, pinBoxY + boxSize / 2, 10);
      renderPixelsToBuffer(data, clipPixels(dotPixels, SCREEN_BOUNDS), { r: 0, g: 255, b: 150, a: 255 });
    }
  }

  if (smData && smData.pinAttempts > 0) {
    renderBresenhamText(data, `ATTEMPTS: ${smData.remainingAttempts}/3`, SCREEN_WIDTH / 2 - 168, 370, 4, { r: 200, g: 100, b: 0, a: 255 });
  }

  renderBresenhamText(data, 'PIN: 1234', SCREEN_WIDTH / 2 - 108, 420, 4, { r: 0, g: 120, b: 80, a: 120 });
  renderBresenhamText(data, 'PRESS ENTER', SCREEN_WIDTH / 2 - 130, 500, 4, { r: 0, g: 160, b: 100, a: 180 });
}

function renderAuthScreen(data) {
  renderBresenhamText(data, 'VERIFYING', SCREEN_WIDTH / 2 - 108, 260, 4, { r: 0, g: 200, b: 120, a: 255 });
  renderBresenhamText(data, 'PLEASE WAIT', SCREEN_WIDTH / 2 - 130, 320, 4, { r: 0, g: 180, b: 100, a: 180 });

  const lockX = SCREEN_WIDTH / 2;
  const lockY = 430;
  const lockBody = bresenhamRect(lockX - 24, lockY, 48, 36);
  const lockShackle = [
    ...bresenhamLine(lockX - 14, lockY, lockX - 14, lockY - 20),
    ...bresenhamLine(lockX + 14, lockY, lockX + 14, lockY - 20),
  ];
  const lockTop = cubicBezier(
    { x: lockX - 14, y: lockY - 20 },
    { x: lockX - 14, y: lockY - 40 },
    { x: lockX + 14, y: lockY - 40 },
    { x: lockX + 14, y: lockY - 20 },
    30
  );
  renderPixelsToBuffer(data, clipPixels([...lockBody, ...lockShackle, ...lockTop], SCREEN_BOUNDS), { r: 0, g: 220, b: 130, a: 255 });
}

function renderAuthFailedScreen(data, smData) {
  renderBresenhamText(data, 'ACCESS DENIED', SCREEN_WIDTH / 2 - 156, 240, 4, { r: 255, g: 60, b: 60, a: 255 });
  renderBresenhamText(data, 'WRONG PIN', SCREEN_WIDTH / 2 - 108, 300, 4, { r: 255, g: 100, b: 80, a: 200 });

  if (smData) {
    renderBresenhamText(data, `${smData.remainingAttempts} TRIES LEFT`, SCREEN_WIDTH / 2 - 144, 360, 4, { r: 255, g: 150, b: 50, a: 200 });
  }

  const xPixels = [
    ...bresenhamLine(SCREEN_WIDTH / 2 - 30, 420, SCREEN_WIDTH / 2 + 30, 480),
    ...bresenhamLine(SCREEN_WIDTH / 2 + 30, 420, SCREEN_WIDTH / 2 - 30, 480),
  ];
  renderPixelsToBuffer(data, clipPixels(xPixels, SCREEN_BOUNDS), { r: 255, g: 60, b: 60, a: 255 });

  renderBresenhamText(data, 'CLICK RETRY', SCREEN_WIDTH / 2 - 130, 530, 4, { r: 0, g: 180, b: 100, a: 180 });
}

function renderMenuScreen(data, smData) {
  renderBresenhamText(data, 'MAIN MENU', SCREEN_WIDTH / 2 - 108, 210, 4, { r: 0, g: 255, b: 150, a: 255 });

  if (smData) {
    renderBresenhamText(data, `HELLO ${smData.cardholderName}`, 40, 260, 3, { r: 0, g: 180, b: 100, a: 200 });
  }

  const options = ['1. WITHDRAWAL', '2. BALANCE', '3. EXIT'];
  const colors = [
    { r: 0, g: 230, b: 140, a: 255 },
    { r: 0, g: 200, b: 180, a: 255 },
    { r: 200, g: 120, b: 80, a: 255 },
  ];

  options.forEach((opt, i) => {
    const y = 320 + i * 80;
    const boxPixels = bresenhamRect(100, y - 10, SCREEN_WIDTH - 200, 56);
    renderPixelsToBuffer(data, clipPixels(boxPixels, SCREEN_BOUNDS), colors[i]);
    renderBresenhamText(data, opt, 140, y + 10, 4, colors[i]);
  });
}

function renderBalanceScreen(data, smData) {
  renderBresenhamText(data, 'ACCOUNT BALANCE', SCREEN_WIDTH / 2 - 180, 220, 4, { r: 0, g: 255, b: 150, a: 255 });

  if (smData) {
    renderBresenhamText(data, smData.accountNumber, SCREEN_WIDTH / 2 - 180, 290, 4, { r: 0, g: 180, b: 100, a: 200 });
    const balStr = `$${smData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    renderBresenhamText(data, balStr, SCREEN_WIDTH / 2 - 144, 370, 6, { r: 0, g: 255, b: 180, a: 255 });
  }

  renderBresenhamText(data, 'PRESS BACK', SCREEN_WIDTH / 2 - 120, 500, 4, { r: 0, g: 160, b: 100, a: 180 });
}

function renderWithdrawalScreen(data) {
  renderBresenhamText(data, 'SELECT AMOUNT', SCREEN_WIDTH / 2 - 156, 210, 4, { r: 0, g: 255, b: 150, a: 255 });

  const amounts = ['$100', '$200', '$500', '$1000'];
  const color = { r: 0, g: 220, b: 130, a: 255 };

  amounts.forEach((amt, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 120 + col * 400;
    const y = 280 + row * 110;

    const boxPixels = bresenhamRect(x, y, 300, 76);
    renderPixelsToBuffer(data, clipPixels(boxPixels, SCREEN_BOUNDS), color);
    renderBresenhamText(data, amt, x + 80, y + 20, 4, color);
  });

  renderBresenhamText(data, 'PRESS BACK', SCREEN_WIDTH / 2 - 120, 560, 4, { r: 0, g: 160, b: 100, a: 180 });
}

function renderProcessingScreen(data) {
  renderBresenhamText(data, 'PROCESSING', SCREEN_WIDTH / 2 - 120, 260, 4, { r: 0, g: 200, b: 120, a: 255 });
  renderBresenhamText(data, 'TRANSACTION', SCREEN_WIDTH / 2 - 130, 320, 4, { r: 0, g: 180, b: 100, a: 200 });

  const cx = SCREEN_WIDTH / 2;
  const cy = 440;
  const time = Date.now() * 0.003;
  const spokes = 6;
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2 + time;
    const x1 = cx + Math.cos(angle) * 16;
    const y1 = cy + Math.sin(angle) * 16;
    const x2 = cx + Math.cos(angle) * 40;
    const y2 = cy + Math.sin(angle) * 40;
    const spokePixels = bresenhamLine(Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2));
    renderPixelsToBuffer(data, clipPixels(spokePixels, SCREEN_BOUNDS), { r: 0, g: 200, b: 120, a: 200 });
  }
  const circPixels = bresenhamCircle(cx, cy, 44);
  renderPixelsToBuffer(data, clipPixels(circPixels, SCREEN_BOUNDS), { r: 0, g: 200, b: 120, a: 150 });
}

function renderDispensingScreen(data) {
  renderBresenhamText(data, 'DISPENSING', SCREEN_WIDTH / 2 - 120, 260, 4, { r: 0, g: 255, b: 150, a: 255 });
  renderBresenhamText(data, 'CASH', SCREEN_WIDTH / 2 - 48, 320, 4, { r: 0, g: 220, b: 120, a: 200 });
  renderBresenhamText(data, 'PLEASE TAKE', SCREEN_WIDTH / 2 - 130, 380, 4, { r: 0, g: 180, b: 100, a: 180 });
  renderBresenhamText(data, 'YOUR MONEY', SCREEN_WIDTH / 2 - 120, 430, 4, { r: 0, g: 180, b: 100, a: 180 });

  const dollarY = 500 + Math.sin(Date.now() * 0.008) * 10;
  const dollarPixels = generateBankLogo(SCREEN_WIDTH / 2, dollarY, 0.7);
  renderPixelsToBuffer(data, clipPixels(dollarPixels, SCREEN_BOUNDS), { r: 0, g: 255, b: 120, a: 200 });
}

function renderSuccessScreen(data, smData) {
  renderBresenhamText(data, 'TRANSACTION', SCREEN_WIDTH / 2 - 130, 220, 4, { r: 0, g: 255, b: 150, a: 255 });
  renderBresenhamText(data, 'COMPLETE', SCREEN_WIDTH / 2 - 96, 270, 4, { r: 0, g: 255, b: 150, a: 255 });

  const checkPixels = [
    ...bresenhamLine(SCREEN_WIDTH / 2 - 30, 350, SCREEN_WIDTH / 2 - 10, 370),
    ...bresenhamLine(SCREEN_WIDTH / 2 - 10, 370, SCREEN_WIDTH / 2 + 30, 330),
  ];
  renderPixelsToBuffer(data, clipPixels(checkPixels, SCREEN_BOUNDS), { r: 0, g: 255, b: 100, a: 255 });

  if (smData) {
    renderBresenhamText(data, `BAL: $${smData.balance.toFixed(0)}`, SCREEN_WIDTH / 2 - 132, 420, 4, { r: 0, g: 200, b: 120, a: 200 });
  }

  renderBresenhamText(data, '1. CONTINUE', 160, 500, 4, { r: 0, g: 200, b: 130, a: 200 });
  renderBresenhamText(data, '2. FINISH', 520, 500, 4, { r: 200, g: 120, b: 80, a: 200 });
}

function renderEjectingScreen(data) {
  renderBresenhamText(data, 'PLEASE TAKE', SCREEN_WIDTH / 2 - 130, 260, 4, { r: 0, g: 255, b: 150, a: 255 });
  renderBresenhamText(data, 'YOUR CARD', SCREEN_WIDTH / 2 - 108, 320, 4, { r: 0, g: 255, b: 150, a: 255 });
  renderBresenhamText(data, 'THANK YOU', SCREEN_WIDTH / 2 - 108, 420, 4, { r: 0, g: 180, b: 100, a: 180 });
}

export default BresenhamCanvas;
