/**
 * SecurityFeed.jsx - Simulated Security Camera Feed
 * CS3231 Computer Graphics - Secure ATM Interface Simulator
 * 
 * Renders a canvas-based simulated CCTV feed with:
 * - Procedural noise/static effect
 * - Timestamp overlay
 * - Scan lines
 * This is used as an HTML5 Canvas texture on the ATM's secondary screen
 */

import React, { useRef, useEffect, useCallback } from 'react';

const SecurityFeed = ({ width = 320, height = 240 }) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Dark background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, height);

    // Simulate camera view - static scene with noise
    // Draw some "scene" elements
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(20, 80, 280, 120); // Floor
    ctx.fillStyle = '#16213e';
    ctx.fillRect(40, 40, 60, 120); // Wall element
    ctx.fillRect(200, 50, 80, 110); // ATM shape

    // ATM screen glow
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(215, 65, 50, 35);

    // Random person silhouette (simple)
    ctx.fillStyle = '#222244';
    ctx.beginPath();
    ctx.arc(140, 100, 15, 0, Math.PI * 2); // Head
    ctx.fill();
    ctx.fillRect(130, 115, 20, 45); // Body

    // Add noise/grain effect
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] += noise;     // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
    }
    ctx.putImageData(imageData, 0, 0);

    // Scan lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Green-tint overlay
    ctx.fillStyle = 'rgba(0, 255, 65, 0.04)';
    ctx.fillRect(0, 0, width, height);

    // Timestamp
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    const dateStr = now.toLocaleDateString('en-US');
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ff41';
    ctx.fillText(`CAM-01  ${dateStr}  ${timeStr}`, 8, 14);
    ctx.fillText('REC ●', width - 50, 14);

    // Corner brackets
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 1;
    const bracketSize = 15;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(5, 5 + bracketSize);
    ctx.lineTo(5, 5);
    ctx.lineTo(5 + bracketSize, 5);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - 5 - bracketSize, 5);
    ctx.lineTo(width - 5, 5);
    ctx.lineTo(width - 5, 5 + bracketSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(5, height - 5 - bracketSize);
    ctx.lineTo(5, height - 5);
    ctx.lineTo(5 + bracketSize, height - 5);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - 5 - bracketSize, height - 5);
    ctx.lineTo(width - 5, height - 5);
    ctx.lineTo(width - 5, height - 5 - bracketSize);
    ctx.stroke();

    // Vignette effect
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, height * 0.3,
      width / 2, height / 2, height * 0.8
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    animFrameRef.current = requestAnimationFrame(draw);
  }, [width, height]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        borderRadius: '4px',
        border: '1px solid rgba(0, 255, 65, 0.2)',
      }}
    />
  );
};

export default SecurityFeed;
