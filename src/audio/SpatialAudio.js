/**
 * SpatialAudio.js - Audio Management System
 * CS3231 Computer Graphics - Secure ATM Interface Simulator
 * 
 * Provides spatial audio feedback for ATM interactions using the Web Audio API.
 * Audio cues are generated procedurally (no external audio files needed).
 */

let audioContext = null;

/**
 * Initialize the Web Audio API context
 * Must be called after a user interaction (browser policy)
 */
export function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a synthesized beep sound (button press)
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type: 'sine', 'square', 'triangle', 'sawtooth'
 * @param {number} volume - Volume (0 to 1)
 */
export function playTone(frequency = 800, duration = 0.1, type = 'sine', volume = 0.3) {
  const ctx = initAudio();
  if (ctx.state === 'suspended') ctx.resume();

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Envelope: quick attack, sustain, quick release
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime + duration - 0.02);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/**
 * ATM-specific sound effects using spatial audio positioning
 */
export const ATMSounds = {
  /** Button press - short crisp beep */
  buttonPress: () => {
    playTone(1200, 0.08, 'sine', 0.2);
  },

  /** PIN digit entry - slightly lower tone */
  pinDigit: () => {
    playTone(880, 0.06, 'sine', 0.15);
  },

  /** Card insertion - mechanical sliding sound (noise burst) */
  cardInsert: () => {
    const ctx = initAudio();
    if (ctx.state === 'suspended') ctx.resume();

    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate filtered noise that sounds like a card sliding
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 8) * Math.sin(t * 200);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.value = 0.4;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  },

  /** Cash dispensing - rhythmic mechanical sound */
  cashDispense: () => {
    const ctx = initAudio();
    if (ctx.state === 'suspended') ctx.resume();

    // Create rhythmic clicking for cash counting
    for (let i = 0; i < 8; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = 200 + Math.random() * 100;

      const startTime = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.05);
    }
  },

  /** Success chime - ascending tones */
  success: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 150);
    });
  },

  /** Error buzz */
  error: () => {
    playTone(200, 0.3, 'sawtooth', 0.15);
    setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.15), 200);
  },

  /** Card eject */
  cardEject: () => {
    const ctx = initAudio();
    if (ctx.state === 'suspended') ctx.resume();

    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 6);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.2;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;

    source.connect(filter);
    filter.connect(ctx.destination);
    source.start();
  },

  /** Ambient hum - continuous low background */
  startAmbient: () => {
    const ctx = initAudio();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 60; // 60Hz hum
    gain.gain.value = 0.02; // Very quiet

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    return { oscillator: osc, gain: gain };
  },

  /** Processing beeps */
  processing: () => {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => playTone(600, 0.1, 'triangle', 0.1), i * 400);
    }
  },
};

export default ATMSounds;
