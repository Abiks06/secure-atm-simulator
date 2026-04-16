/**
 * ManualMath.js
 * Core graphics and math for the ATM simulator.
 * 
 * Includes:
 *   - Bresenham's Line and Circle algorithms
 *   - Bezier Curves (Quadratic and Cubic)
 *   - 4x4 matrix transformations
 */

// ============================================================================
// SECTION 1: BRESENHAM'S LINE ALGORITHM
// ============================================================================
/**
 * Bresenham's Line Algorithm
 * Finds coordinates for a line between two points using integer arithmetic.
 * 
 * @param {number} x0 - Start x
 * @param {number} y0 - Start y
 * @param {number} x1 - End x
 * @param {number} y1 - End y
 * @returns {Array<{x: number, y: number}>} Array of pixel coordinates
 */
export function bresenhamLine(x0, y0, x1, y1) {
  const pixels = [];

  // Convert to integers (pixel coordinates)
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);

  // Calculate absolute differences
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);

  // Determine step direction for each axis
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;

  // Determine if the line is steep (|slope| > 1)
  const steep = dy > dx;

  // Initialize error term
  // For gentle slopes: err = dx/2
  // This is the standard Bresenham formulation using integer arithmetic
  let err = (steep ? dy : dx) / 2;

  let x = x0;
  let y = y0;

  if (steep) {
    // Steep line: iterate over y, decide x
    // When |dy| > |dx|, we step along y and decide whether to step x
    while (true) {
      pixels.push({ x, y });
      if (y === y1 && x === x1) break;

      const e2 = err;
      // Decision: should we step in x?
      if (e2 > -dx) {
        err -= dx;
        x += sx;
      }
      // Always step in y for steep lines
      if (e2 < dy) {
        err += dy;
        y += sy;
      }
      // Safety: prevent infinite loops
      if (pixels.length > 10000) break;
    }
  } else {
    // Gentle line: iterate over x, decide y
    // Standard Bresenham: step along x, decide whether to step y
    while (true) {
      pixels.push({ x, y });
      if (x === x1 && y === y1) break;

      const e2 = err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
      if (pixels.length > 10000) break;
    }
  }

  return pixels;
}

/**
 * Draw a complete rectangle using Bresenham's lines
 * @param {number} x - Top-left x
 * @param {number} y - Top-left y
 * @param {number} w - Width
 * @param {number} h - Height
 * @returns {Array<{x: number, y: number}>} Pixel coordinates
 */
export function bresenhamRect(x, y, w, h) {
  return [
    ...bresenhamLine(x, y, x + w, y),           // Top
    ...bresenhamLine(x + w, y, x + w, y + h),   // Right
    ...bresenhamLine(x + w, y + h, x, y + h),   // Bottom
    ...bresenhamLine(x, y + h, x, y),            // Left
  ];
}

/**
 * Midpoint Circle Algorithm (Bresenham)
 * Draws a circle using 8-way symmetry.
 */
export function bresenhamCircle(cx, cy, r) {
  const pixels = [];
  let x = 0;
  let y = r;
  let d = 1 - r; // Initial decision parameter

  // Plot 8 symmetric points
  const plot8 = (cx, cy, x, y) => {
    pixels.push({ x: cx + x, y: cy + y });
    pixels.push({ x: cx - x, y: cy + y });
    pixels.push({ x: cx + x, y: cy - y });
    pixels.push({ x: cx - x, y: cy - y });
    pixels.push({ x: cx + y, y: cy + x });
    pixels.push({ x: cx - y, y: cy + x });
    pixels.push({ x: cx + y, y: cy - x });
    pixels.push({ x: cx - y, y: cy - x });
  };

  plot8(cx, cy, x, y);

  while (x < y) {
    x++;
    if (d < 0) {
      // East pixel: d_new = d + 2x + 3
      d += 2 * x + 1;
    } else {
      // South-East pixel: d_new = d + 2(x-y) + 5
      y--;
      d += 2 * (x - y) + 1;
    }
    plot8(cx, cy, x, y);
  }

  return pixels;
}


// ============================================================================
// SECTION 2: BEZIER CURVE IMPLEMENTATION
// ============================================================================
/**
 * Quadratic Bezier Curve
 * B(t) = (1-t)² * P0 + 2(1-t)t * P1 + t² * P2
 * 
 * @param {Object} p0 - Start point {x, y}
 * @param {Object} p1 - Control point {x, y}
 * @param {Object} p2 - End point {x, y}
 * @param {number} segments - Number of line segments (resolution)
 * @returns {Array<{x: number, y: number}>} Points along the curve
 */
export function quadraticBezier(p0, p1, p2, segments = 50) {
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const oneMinusT = 1 - t;

    // B(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
    const x = oneMinusT * oneMinusT * p0.x
            + 2 * oneMinusT * t * p1.x
            + t * t * p2.x;

    const y = oneMinusT * oneMinusT * p0.y
            + 2 * oneMinusT * t * p1.y
            + t * t * p2.y;

    points.push({ x: Math.round(x), y: Math.round(y) });
  }

  return points;
}

/**
 * Cubic Bezier Curve
 * B(t) = (1-t)³·P0 + 3(1-t)²t·P1 + 3(1-t)t²·P2 + t³·P3
 * 
 * @param {Object} p0 - Start point {x, y}
 * @param {Object} p1 - Control point 1 {x, y}
 * @param {Object} p2 - Control point 2 {x, y}
 * @param {Object} p3 - End point {x, y}
 * @param {number} segments - Resolution
 * @returns {Array<{x: number, y: number}>}
 */
export function cubicBezier(p0, p1, p2, p3, segments = 80) {
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;

    // Bernstein basis polynomials for n=3:
    const b0 = u * u * u;           // (1-t)³
    const b1 = 3 * u * u * t;      // 3(1-t)²t
    const b2 = 3 * u * t * t;      // 3(1-t)t²
    const b3 = t * t * t;           // t³

    const x = b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x;
    const y = b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y;

    points.push({ x, y });
  }

  return points;
}

/**
 * Render a bank logo using Bezier curves
 * Returns an array of pixel coordinates that form the logo shape
 * Logo design: Shield shape with "SB" (Secure Bank) 
 */
export function generateBankLogo(centerX, centerY, scale = 1.0) {
  const points = [];

  // Shield outer shape - cubic bezier curves
  // Top left curve
  const topLeft = cubicBezier(
    { x: centerX, y: centerY - 40 * scale },
    { x: centerX - 35 * scale, y: centerY - 38 * scale },
    { x: centerX - 40 * scale, y: centerY - 20 * scale },
    { x: centerX - 38 * scale, y: centerY },
    60
  );
  points.push(...topLeft);

  // Bottom left curve
  const bottomLeft = cubicBezier(
    { x: centerX - 38 * scale, y: centerY },
    { x: centerX - 35 * scale, y: centerY + 20 * scale },
    { x: centerX - 20 * scale, y: centerY + 35 * scale },
    { x: centerX, y: centerY + 45 * scale },
    60
  );
  points.push(...bottomLeft);

  // Bottom right curve (mirror)
  const bottomRight = cubicBezier(
    { x: centerX, y: centerY + 45 * scale },
    { x: centerX + 20 * scale, y: centerY + 35 * scale },
    { x: centerX + 35 * scale, y: centerY + 20 * scale },
    { x: centerX + 38 * scale, y: centerY },
    60
  );
  points.push(...bottomRight);

  // Top right curve
  const topRight = cubicBezier(
    { x: centerX + 38 * scale, y: centerY },
    { x: centerX + 40 * scale, y: centerY - 20 * scale },
    { x: centerX + 35 * scale, y: centerY - 38 * scale },
    { x: centerX, y: centerY - 40 * scale },
    60
  );
  points.push(...topRight);

  // Inner dollar sign using quadratic beziers
  // Top curve of $
  const dollarTop = quadraticBezier(
    { x: centerX + 8 * scale, y: centerY - 18 * scale },
    { x: centerX - 15 * scale, y: centerY - 22 * scale },
    { x: centerX - 10 * scale, y: centerY - 5 * scale },
    40
  );
  points.push(...dollarTop);

  // Bottom curve of $
  const dollarBottom = quadraticBezier(
    { x: centerX - 10 * scale, y: centerY - 5 * scale },
    { x: centerX + 15 * scale, y: centerY + 10 * scale },
    { x: centerX - 8 * scale, y: centerY + 18 * scale },
    40
  );
  points.push(...dollarBottom);

  // Vertical line of $
  const vertLine = bresenhamLine(
    centerX, centerY - 25 * scale,
    centerX, centerY + 25 * scale
  );
  points.push(...vertLine);

  return points;
}


// ============================================================================
// SECTION 3: 4x4 MATRIX TRANSFORMATION LIBRARY
// ============================================================================
/**
 * 4x4 Homogeneous Transformation Matrix Library
 * 
 * A 4x4 matrix in column-major order (matching WebGL/Three.js convention):
 * 
 * | m[0]  m[4]  m[8]   m[12] |    | a  e  i  tx |
 * | m[1]  m[5]  m[9]   m[13] | =  | b  f  j  ty |
 * | m[2]  m[6]  m[10]  m[14] |    | c  g  k  tz |
 * | m[3]  m[7]  m[11]  m[15] |    | 0  0  0  1  |
 * 
 * Column-major storage: [a,b,c,0, e,f,g,0, i,j,k,0, tx,ty,tz,1]
 */
export class Mat4 {
  /**
   * Create a new 4x4 matrix (identity by default)
   * @param {Float32Array|Array} [elements] - 16 elements in column-major order
   */
  constructor(elements) {
    if (elements) {
      this.elements = new Float32Array(elements);
    } else {
      // Identity matrix
      this.elements = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]);
    }
  }

  /**
   * Create an identity matrix
   * I = diag(1, 1, 1, 1)
   */
  static identity() {
    return new Mat4();
  }

  /**
   * Create a translation matrix
   * 
   * T(tx, ty, tz) = | 1  0  0  tx |
   *                  | 0  1  0  ty |
   *                  | 0  0  1  tz |
   *                  | 0  0  0  1  |
   * 
   * When applied to point [x,y,z,1]:
   *   x' = x + tx
   *   y' = y + ty
   *   z' = z + tz
   */
  static translation(tx, ty, tz) {
    return new Mat4([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      tx, ty, tz, 1
    ]);
  }

  /**
   * Create a scaling matrix
   * 
   * S(sx, sy, sz) = | sx  0   0   0 |
   *                  | 0   sy  0   0 |
   *                  | 0   0   sz  0 |
   *                  | 0   0   0   1 |
   */
  static scaling(sx, sy, sz) {
    return new Mat4([
      sx, 0, 0, 0,
      0, sy, 0, 0,
      0, 0, sz, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Rotation about X-axis
   * 
   * Rx(θ) = | 1    0      0     0 |
   *          | 0   cos θ  -sin θ  0 |
   *          | 0   sin θ   cos θ  0 |
   *          | 0    0      0     1 |
   * 
   * Derivation: In the YZ plane, rotation by angle θ:
   *   y' = y·cos θ - z·sin θ
   *   z' = y·sin θ + z·cos θ
   *   x' = x (unchanged)
   * 
   * @param {number} angle - Rotation angle in radians
   */
  static rotationX(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Mat4([
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Rotation about Y-axis
   * 
   * Ry(θ) = |  cos θ  0  sin θ  0 |
   *          |  0      1  0      0 |
   *          | -sin θ  0  cos θ  0 |
   *          |  0      0  0      1 |
   * 
   * Derivation: In the XZ plane, rotation by angle θ:
   *   x' = x·cos θ + z·sin θ
   *   z' = -x·sin θ + z·cos θ
   *   y' = y (unchanged)
   */
  static rotationY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Mat4([
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Rotation about Z-axis
   * 
   * Rz(θ) = | cos θ  -sin θ  0  0 |
   *          | sin θ   cos θ  0  0 |
   *          | 0       0      1  0 |
   *          | 0       0      0  1 |
   * 
   * Derivation: In the XY plane, rotation by angle θ:
   *   x' = x·cos θ - y·sin θ
   *   y' = x·sin θ + y·cos θ
   *   z' = z (unchanged)
   */
  static rotationZ(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Mat4([
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Matrix multiplication: this × other
   * 
   * For matrices A and B, C = A × B where:
   *   C[i][j] = Σ(k=0 to 3) A[i][k] × B[k][j]
   * 
   * In column-major storage with index = row + col*4:
   *   result[row + col*4] = Σ(k=0 to 3) a[row + k*4] × b[k + col*4]
   * 
   * @param {Mat4} other - Right-hand matrix
   * @returns {Mat4} New matrix = this × other
   */
  multiply(other) {
    const a = this.elements;
    const b = other.elements;
    const result = new Float32Array(16);

    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          // Column-major: element(row, col) = array[row + col * 4]
          sum += a[row + k * 4] * b[k + col * 4];
        }
        result[row + col * 4] = sum;
      }
    }

    return new Mat4(result);
  }

  /**
   * Transform a 3D point (homogeneous coordinates)
   * 
   * [x']   [m0  m4  m8   m12] [x]
   * [y'] = [m1  m5  m9   m13] [y]
   * [z']   [m2  m6  m10  m14] [z]
   * [w']   [m3  m7  m11  m15] [1]
   * 
   * Result is divided by w' for perspective projection.
   * 
   * @param {Object} point - {x, y, z}
   * @returns {Object} Transformed {x, y, z}
   */
  multiplyVector(point) {
    const m = this.elements;
    const x = point.x || 0;
    const y = point.y || 0;
    const z = point.z || 0;
    const w = 1;

    const rx = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    const ry = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    const rz = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    const rw = m[3] * x + m[7] * y + m[11] * z + m[15] * w;

    // Perspective divide
    if (rw !== 0 && rw !== 1) {
      return { x: rx / rw, y: ry / rw, z: rz / rw };
    }

    return { x: rx, y: ry, z: rz };
  }

  /**
   * Create a perspective projection matrix
   * 
   * Based on the frustum defined by field of view:
   * 
   * P = | f/aspect  0     0              0 |
   *     | 0         f     0              0 |
   *     | 0         0  (far+near)/(near-far)  (2·far·near)/(near-far) |
   *     | 0         0    -1              0 |
   * 
   * where f = 1/tan(fov/2)
   * 
   * @param {number} fov - Field of view in radians
   * @param {number} aspect - Aspect ratio (width/height)
   * @param {number} near - Near clipping plane
   * @param {number} far - Far clipping plane
   */
  static perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    return new Mat4([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }

  /**
   * Create a lookAt view matrix
   * 
   * Constructs an orthonormal basis from eye, target, and up vectors:
   *   zAxis = normalize(eye - target)  (camera looks along -z)
   *   xAxis = normalize(cross(up, zAxis))
   *   yAxis = cross(zAxis, xAxis)
   * 
   * V = | xAxis.x  xAxis.y  xAxis.z  -dot(xAxis, eye) |
   *     | yAxis.x  yAxis.y  yAxis.z  -dot(yAxis, eye) |
   *     | zAxis.x  zAxis.y  zAxis.z  -dot(zAxis, eye) |
   *     | 0        0        0         1                |
   */
  static lookAt(eye, target, up) {
    // Forward vector (camera looks along -z)
    let zx = eye.x - target.x;
    let zy = eye.y - target.y;
    let zz = eye.z - target.z;
    let len = Math.sqrt(zx * zx + zy * zy + zz * zz);
    zx /= len; zy /= len; zz /= len;

    // Right vector = up × forward
    let xx = up.y * zz - up.z * zy;
    let xy = up.z * zx - up.x * zz;
    let xz = up.x * zy - up.y * zx;
    len = Math.sqrt(xx * xx + xy * xy + xz * xz);
    xx /= len; xy /= len; xz /= len;

    // True up = forward × right
    let yx = zy * xz - zz * xy;
    let yy = zz * xx - zx * xz;
    let yz = zx * xy - zy * xx;

    return new Mat4([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye.x + xy * eye.y + xz * eye.z),
      -(yx * eye.x + yy * eye.y + yz * eye.z),
      -(zx * eye.x + zy * eye.y + zz * eye.z),
      1
    ]);
  }

  /**
   * Convert to a flat array for WebGL/Three.js uniforms
   */
  toArray() {
    return Array.from(this.elements);
  }

  /**
   * Pretty-print the matrix for debugging
   */
  toString() {
    const m = this.elements;
    return `Mat4[\n` +
      `  ${m[0].toFixed(3)}  ${m[4].toFixed(3)}  ${m[8].toFixed(3)}  ${m[12].toFixed(3)}\n` +
      `  ${m[1].toFixed(3)}  ${m[5].toFixed(3)}  ${m[9].toFixed(3)}  ${m[13].toFixed(3)}\n` +
      `  ${m[2].toFixed(3)}  ${m[6].toFixed(3)}  ${m[10].toFixed(3)}  ${m[14].toFixed(3)}\n` +
      `  ${m[3].toFixed(3)}  ${m[7].toFixed(3)}  ${m[11].toFixed(3)}  ${m[15].toFixed(3)}\n]`;
  }
}

/**
 * Compose multiple transformations.
 * Applies transforms right-to-left: last argument is applied first.
 * 
 * Example: compose(T, R, S) = T × R × S
 * A point p is transformed as: T(R(S(p)))
 * 
 * @param  {...Mat4} matrices - Transformations in application order (left-to-right reading)
 * @returns {Mat4} Composed transformation
 */
export function composeTransforms(...matrices) {
  if (matrices.length === 0) return Mat4.identity();
  let result = matrices[0];
  for (let i = 1; i < matrices.length; i++) {
    result = result.multiply(matrices[i]);
  }
  return result;
}

/**
 * Apply a sequence of transformations to a set of 3D points
 * Used for animating security icons and card entry
 */
export function transformPoints(points, matrix) {
  return points.map(p => matrix.multiplyVector(p));
}

// Export a demonstration function for the security icon rotation
export function animateSecurityIcon(points, time) {
  const rotation = composeTransforms(
    Mat4.rotationY(time * 0.5),
    Mat4.rotationZ(time * 0.3),
  );
  return transformPoints(points, rotation);
}

// Card entry translation animation
export function animateCardEntry(progress) {
  // progress: 0 = outside, 1 = fully inserted
  const tx = 0;
  const ty = 0;
  const tz = -2.0 * progress; // Move card into the slot along Z
  return Mat4.translation(tx, ty, tz);
}
