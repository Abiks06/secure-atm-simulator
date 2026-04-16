/**
 * ClippingAlgorithm.js
 * Implementation of Cohen-Sutherland line clipping and 
 * Sutherland-Hodgman polygon clipping.
 */

// Region code bit flags
const INSIDE = 0b0000; // 0
const LEFT   = 0b0001; // 1
const RIGHT  = 0b0010; // 2
const BOTTOM = 0b0100; // 4
const TOP    = 0b1000; // 8

/**
 * Compute the 4-bit region code for a point relative to the clipping window.
 * 
 * @param {number} x - Point x coordinate
 * @param {number} y - Point y coordinate
 * @param {Object} bounds - Clipping rectangle {xMin, yMin, xMax, yMax}
 * @returns {number} 4-bit outcode
 */
function computeOutcode(x, y, bounds) {
  let code = INSIDE;

  if (x < bounds.xMin) code |= LEFT;
  else if (x > bounds.xMax) code |= RIGHT;

  if (y < bounds.yMin) code |= BOTTOM;
  else if (y > bounds.yMax) code |= TOP;

  return code;
}

/**
 * Cohen-Sutherland Line Clipping Algorithm
 * 
 * Clips a line segment to a rectangular window.
 * Returns null if the line is completely outside, or the clipped endpoints.
 * 
 * Mathematical basis for intersection computation:
 *   For a line from (x0,y0) to (x1,y1):
 *   
 *   Intersection with x = xBoundary:
 *     y = y0 + (y1 - y0) × (xBoundary - x0) / (x1 - x0)
 *   
 *   Intersection with y = yBoundary:
 *     x = x0 + (x1 - x0) × (yBoundary - y0) / (y1 - y0)
 * 
 * @param {number} x0 - Start x
 * @param {number} y0 - Start y
 * @param {number} x1 - End x
 * @param {number} y1 - End y
 * @param {Object} bounds - {xMin, yMin, xMax, yMax}
 * @returns {Object|null} {x0, y0, x1, y1} clipped line or null if rejected
 */
export function cohenSutherlandClip(x0, y0, x1, y1, bounds) {
  let outcode0 = computeOutcode(x0, y0, bounds);
  let outcode1 = computeOutcode(x1, y1, bounds);
  let accept = false;

  // Maximum 20 iterations to prevent infinite loop
  for (let iter = 0; iter < 20; iter++) {
    if (!(outcode0 | outcode1)) {
      // Both endpoints inside: TRIVIALLY ACCEPT
      // Bitwise OR is 0 → both codes are 0000
      accept = true;
      break;
    } else if (outcode0 & outcode1) {
      // Both endpoints share an outside region: TRIVIALLY REJECT
      // Bitwise AND is non-zero → both are on the same side
      break;
    } else {
      // Line partially inside: clip against a boundary
      // Choose the endpoint that is outside
      const outcodeOut = outcode0 !== INSIDE ? outcode0 : outcode1;

      let x, y;

      if (outcodeOut & TOP) {
        // Clip against top boundary: y = yMax
        // x = x0 + (x1-x0) × (yMax - y0) / (y1-y0)
        x = x0 + (x1 - x0) * (bounds.yMax - y0) / (y1 - y0);
        y = bounds.yMax;
      } else if (outcodeOut & BOTTOM) {
        // Clip against bottom boundary: y = yMin
        x = x0 + (x1 - x0) * (bounds.yMin - y0) / (y1 - y0);
        y = bounds.yMin;
      } else if (outcodeOut & RIGHT) {
        // Clip against right boundary: x = xMax
        // y = y0 + (y1-y0) × (xMax - x0) / (x1-x0)
        y = y0 + (y1 - y0) * (bounds.xMax - x0) / (x1 - x0);
        x = bounds.xMax;
      } else if (outcodeOut & LEFT) {
        // Clip against left boundary: x = xMin
        y = y0 + (y1 - y0) * (bounds.xMin - x0) / (x1 - x0);
        x = bounds.xMin;
      }

      // Replace the outside endpoint with the intersection point
      if (outcodeOut === outcode0) {
        x0 = x;
        y0 = y;
        outcode0 = computeOutcode(x0, y0, bounds);
      } else {
        x1 = x;
        y1 = y;
        outcode1 = computeOutcode(x1, y1, bounds);
      }
    }
  }

  if (accept) {
    return { x0, y0, x1, y1 };
  }
  return null; // Line completely outside
}

/**
 * Clip an array of line segments (represented as pixel arrays from Bresenham)
 * against the ATM screen bounds.
 * 
 * @param {Array<{x: number, y: number}>} pixels - Pixel array
 * @param {Object} bounds - {xMin, yMin, xMax, yMax}
 * @returns {Array<{x: number, y: number}>} Clipped pixels
 */
export function clipPixels(pixels, bounds) {
  return pixels.filter(p =>
    p.x >= bounds.xMin && p.x <= bounds.xMax &&
    p.y >= bounds.yMin && p.y <= bounds.yMax
  );
}

/**
 * Clip a polygon using the Sutherland-Hodgman algorithm.
 * 
 * For each edge of the clipping rectangle, process all polygon edges:
 * - If both endpoints inside: keep the second point
 * - If first inside, second outside: keep the intersection
 * - If first outside, second inside: keep intersection and second point
 * - If both outside: keep nothing
 * 
 * @param {Array<{x: number, y: number}>} polygon - Vertices of the polygon
 * @param {Object} bounds - {xMin, yMin, xMax, yMax}
 * @returns {Array<{x: number, y: number}>} Clipped polygon vertices
 */
export function sutherlandHodgmanClip(polygon, bounds) {
  if (!polygon || polygon.length === 0) return [];

  let output = [...polygon];

  // Clip against each edge of the rectangle
  const edges = [
    { test: (p) => p.x >= bounds.xMin, intersect: lineIntersectX.bind(null, bounds.xMin) }, // Left
    { test: (p) => p.x <= bounds.xMax, intersect: lineIntersectX.bind(null, bounds.xMax) }, // Right
    { test: (p) => p.y >= bounds.yMin, intersect: lineIntersectY.bind(null, bounds.yMin) }, // Bottom
    { test: (p) => p.y <= bounds.yMax, intersect: lineIntersectY.bind(null, bounds.yMax) }, // Top
  ];

  for (const edge of edges) {
    if (output.length === 0) return [];
    const input = output;
    output = [];

    for (let i = 0; i < input.length; i++) {
      const current = input[i];
      const next = input[(i + 1) % input.length];

      const currentInside = edge.test(current);
      const nextInside = edge.test(next);

      if (currentInside && nextInside) {
        // Both inside: keep next
        output.push(next);
      } else if (currentInside && !nextInside) {
        // Going out: keep intersection
        output.push(edge.intersect(current, next));
      } else if (!currentInside && nextInside) {
        // Coming in: keep intersection and next
        output.push(edge.intersect(current, next));
        output.push(next);
      }
      // Both outside: keep nothing
    }
  }

  return output;
}

// Helper: find intersection of line segment with vertical line x = xVal
function lineIntersectX(xVal, p1, p2) {
  const t = (xVal - p1.x) / (p2.x - p1.x);
  return {
    x: xVal,
    y: p1.y + t * (p2.y - p1.y)
  };
}

// Helper: find intersection of line segment with horizontal line y = yVal
function lineIntersectY(yVal, p1, p2) {
  const t = (yVal - p1.y) / (p2.y - p1.y);
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: yVal
  };
}

export { INSIDE, LEFT, RIGHT, BOTTOM, TOP, computeOutcode };
