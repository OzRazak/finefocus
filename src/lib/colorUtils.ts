
// src/lib/colorUtils.ts

/**
 * Generates a random hex color.
 * @returns A string representing a hex color (e.g., "#RRGGBB").
 */
export function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const PREDEFINED_SATURATED_COLORS = [
  '#FF5733', // Vivid Orange
  '#33FF57', // Bright Green
  '#3357FF', // Strong Blue
  '#FF33A1', // Hot Pink
  '#A133FF', // Deep Purple
  '#33FFF3', // Bright Cyan
  '#FFC733', // Golden Yellow
  '#FF3333', // Bright Red
  '#8D33FF', // Vibrant Violet
  '#33FFB5', // Aqua Green
];

/**
 * Returns a color from a predefined list based on an index, cycling through the list.
 * @param index - The index to pick a color for.
 * @returns A hex color string.
 */
export function getCyclicColor(index: number): string {
  return PREDEFINED_SATURATED_COLORS[index % PREDEFINED_SATURATED_COLORS.length];
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   h       The hue
 * @param   s       The saturation
 * @param   l       The lightness
 * @return  Array           The RGB representation
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Converts RGB color values to a hex string.
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string (e.g., "#RRGGBB")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Generates a color based on a string hash (e.g., task ID).
 * Produces a consistent, somewhat visually distinct color for a given string.
 * @param str - The input string.
 * @returns A hex color string.
 */
export function colorFromStringHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  const hue = (hash % 360) / 360; // Normalize hue to 0-1
  const saturation = 0.6 + ( (hash >> 8) % 40 ) / 100 ; // Saturation between 0.6 and 1.0
  const lightness = 0.5 + ( (hash >> 16) % 20 ) / 100; // Lightness between 0.5 and 0.7

  const [r, g, b] = hslToRgb(hue, saturation, lightness);
  return rgbToHex(r, g, b);
}
