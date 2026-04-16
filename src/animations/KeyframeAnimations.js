/**
 * KeyframeAnimations.js - Animation Utilities
 * CS3231 Computer Graphics - Secure ATM Interface Simulator
 * 
 * Implements smooth keyframe-based animations for:
 *   1. Card slot insertion/ejection
 *   2. Cash tray extension/retraction
 *   3. Screen transitions
 *   4. Security icon rotation
 * 
 * Uses manual interpolation (no animation libraries)
 */

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * Easing functions for smooth animation curves
 * t ∈ [0, 1] → output ∈ [0, 1]
 */
export const Easing = {
  /** Linear interpolation (no easing) */
  linear: (t) => t,

  /** Quadratic ease-in: f(t) = t² */
  easeInQuad: (t) => t * t,

  /** Quadratic ease-out: f(t) = t(2-t) */
  easeOutQuad: (t) => t * (2 - t),

  /** Quadratic ease-in-out */
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  /** Cubic ease-in: f(t) = t³ */
  easeInCubic: (t) => t * t * t,

  /** Cubic ease-out: f(t) = (t-1)³ + 1 */
  easeOutCubic: (t) => {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
  },

  /** Cubic ease-in-out */
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  /** Elastic ease-out (for bouncy feels) */
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },

  /** Back ease-out (slight overshoot) */
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  /** Smooth step (Hermite interpolation) */
  smoothStep: (t) => t * t * (3 - 2 * t),
};

// ============================================================================
// KEYFRAME INTERPOLATION
// ============================================================================

/**
 * A Keyframe represents a value at a specific time
 * @typedef {Object} Keyframe
 * @property {number} time - Normalized time [0, 1]
 * @property {number|Object} value - Value at this keyframe
 * @property {Function} easing - Easing function to use AFTER this keyframe
 */

/**
 * Interpolate between keyframes at a given time
 * @param {Array<Keyframe>} keyframes - Sorted array of keyframes
 * @param {number} t - Current time [0, 1]
 * @returns {number} Interpolated value
 */
export function interpolateKeyframes(keyframes, t) {
  if (keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0].value;

  // Clamp t to [0, 1]
  t = Math.max(0, Math.min(1, t));

  // Find the two surrounding keyframes
  let i = 0;
  while (i < keyframes.length - 1 && keyframes[i + 1].time <= t) {
    i++;
  }

  if (i >= keyframes.length - 1) return keyframes[keyframes.length - 1].value;

  const kf0 = keyframes[i];
  const kf1 = keyframes[i + 1];

  // Local interpolation parameter
  const localT = (t - kf0.time) / (kf1.time - kf0.time);
  const easedT = (kf0.easing || Easing.linear)(localT);

  // Linear interpolation between values
  if (typeof kf0.value === 'number') {
    return kf0.value + (kf1.value - kf0.value) * easedT;
  }

  // Object interpolation (for position/rotation)
  if (typeof kf0.value === 'object') {
    const result = {};
    for (const key of Object.keys(kf0.value)) {
      result[key] = kf0.value[key] + (kf1.value[key] - kf0.value[key]) * easedT;
    }
    return result;
  }

  return kf0.value;
}

// ============================================================================
// PREDEFINED ANIMATION SEQUENCES
// ============================================================================

/**
 * Card insertion animation keyframes
 * Animates the card from outside the slot to fully inside
 * 
 * Returns z-position offset for the card mesh
 */
export const CardInsertAnimation = {
  duration: 2000, // ms
  keyframes: [
    { time: 0.0, value: { z: 0.5, rotX: 0 }, easing: Easing.easeInQuad },
    { time: 0.3, value: { z: 0.2, rotX: 0 }, easing: Easing.easeInOutCubic },
    { time: 0.6, value: { z: -0.1, rotX: 0.02 }, easing: Easing.smoothStep },
    { time: 0.8, value: { z: -0.3, rotX: 0 }, easing: Easing.easeOutCubic },
    { time: 1.0, value: { z: -0.5, rotX: 0 } },
  ],
};

/**
 * Card ejection animation keyframes
 * Reverse of insertion with a slight bounce
 */
export const CardEjectAnimation = {
  duration: 1500, // ms
  keyframes: [
    { time: 0.0, value: { z: -0.5, rotX: 0 }, easing: Easing.easeInCubic },
    { time: 0.4, value: { z: -0.1, rotX: 0 }, easing: Easing.easeOutBack },
    { time: 0.7, value: { z: 0.3, rotX: -0.01 }, easing: Easing.easeOutCubic },
    { time: 1.0, value: { z: 0.5, rotX: 0 } },
  ],
};

/**
 * Cash tray animation keyframes
 * Tray slides out from the ATM bottom
 */
export const CashTrayAnimation = {
  duration: 2500, // ms
  keyframes: [
    { time: 0.0, value: { z: -0.8, y: 0 }, easing: Easing.easeInQuad },
    { time: 0.2, value: { z: -0.5, y: 0 }, easing: Easing.easeInOutCubic },
    { time: 0.5, value: { z: 0.0, y: 0 }, easing: Easing.easeOutCubic },
    { time: 0.7, value: { z: 0.3, y: 0.02 }, easing: Easing.easeOutElastic },
    { time: 1.0, value: { z: 0.4, y: 0 } },
  ],
};

/**
 * Cash tray retraction
 */
export const CashTrayRetractAnimation = {
  duration: 1500,
  keyframes: [
    { time: 0.0, value: { z: 0.4, y: 0 }, easing: Easing.easeInCubic },
    { time: 0.5, value: { z: -0.2, y: 0 }, easing: Easing.easeOutCubic },
    { time: 1.0, value: { z: -0.8, y: 0 } },
  ],
};

/**
 * Screen fade-in animation
 */
export const ScreenFadeAnimation = {
  duration: 500,
  keyframes: [
    { time: 0.0, value: 0, easing: Easing.easeOutCubic },
    { time: 1.0, value: 1 },
  ],
};

// ============================================================================
// ANIMATION CONTROLLER
// ============================================================================

/**
 * Animation controller that manages playback of keyframe sequences
 */
export class AnimationController {
  constructor() {
    this.animations = new Map();
  }

  /**
   * Start playing an animation
   * @param {string} name - Animation identifier
   * @param {Object} animDef - Animation definition {duration, keyframes}
   * @param {Function} onUpdate - Called each frame with interpolated value
   * @param {Function} onComplete - Called when animation finishes
   */
  play(name, animDef, onUpdate, onComplete) {
    const startTime = performance.now();
    this.animations.set(name, {
      def: animDef,
      startTime,
      onUpdate,
      onComplete,
      completed: false,
    });
  }

  /**
   * Stop an animation
   */
  stop(name) {
    this.animations.delete(name);
  }

  /**
   * Update all active animations (call from requestAnimationFrame)
   */
  update() {
    const now = performance.now();

    for (const [name, anim] of this.animations.entries()) {
      if (anim.completed) continue;

      const elapsed = now - anim.startTime;
      const t = Math.min(elapsed / anim.def.duration, 1.0);

      const value = interpolateKeyframes(anim.def.keyframes, t);
      anim.onUpdate(value, t);

      if (t >= 1.0) {
        anim.completed = true;
        if (anim.onComplete) anim.onComplete();
        this.animations.delete(name);
      }
    }
  }

  /**
   * Check if any animations are currently playing
   */
  isPlaying(name) {
    return this.animations.has(name);
  }
}

export default AnimationController;
