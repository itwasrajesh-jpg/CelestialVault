// ─── SECURITY UTILS ───────────────────────────────────────────────────────────

// ── PIN HASHING — SHA-256 via native AES module ───────────────────────────────
// react-native-aes-crypto has Sha256 built in
let Aes = null;
try { Aes = require('react-native-aes-crypto').default; } catch (e) {}

export async function hashPin(pin) {
  if (Aes) {
    try { return await Aes.sha256(pin); } catch (e) {}
  }
  // Fallback: simple deterministic hash for dev/snack
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0;
  }
  return 'dev_' + Math.abs(h).toString(16);
}

export async function verifyPin(pin, storedHash) {
  const h = await hashPin(pin);
  return h === storedHash;
}

// ── GESTURE ENCODING ──────────────────────────────────────────────────────────
// Convert raw points to direction-vector signature
// Each segment direction quantized to 8 compass directions (N NE E SE S SW W NW)
// This makes matching tolerant of slightly different draws

const DIR_COUNT = 8;

function pointsToVectors(points) {
  if (!points || points.length < 2) return [];
  const dirs = [];
  // Sample every 4th point to reduce noise
  const sampled = points.filter((_, i) => i % 4 === 0);
  for (let i = 1; i < sampled.length; i++) {
    const dx = sampled[i].x - sampled[i - 1].x;
    const dy = sampled[i].y - sampled[i - 1].y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag < 5) continue; // skip micro-movements
    const angle = Math.atan2(dy, dx);
    // Quantize angle to 8 sectors
    const sector = Math.round(((angle + Math.PI) / (2 * Math.PI)) * DIR_COUNT) % DIR_COUNT;
    dirs.push(sector);
  }
  return dirs;
}

// Remove consecutive duplicates (e.g. [2,2,2,3] → [2,3])
function rle(arr) {
  return arr.filter((v, i) => i === 0 || v !== arr[i - 1]);
}

export function encodeGesture(points) {
  const vecs = pointsToVectors(points);
  return rle(vecs);
}

// Compare two encoded gestures — 70% match threshold
export function matchGesture(encoded, saved) {
  if (!encoded || !saved || encoded.length === 0 || saved.length === 0) return false;
  const maxLen = Math.max(encoded.length, saved.length);
  const minLen = Math.min(encoded.length, saved.length);
  if (minLen / maxLen < 0.5) return false; // too different in length

  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (encoded[i] === saved[i]) matches++;
  }
  return matches / maxLen >= 0.7;
}

// ── PRESET GESTURES ──────────────────────────────────────────────────────────
// Pre-encoded direction sequences for letters
export const PRESET_GESTURES = {
  Z: [0, 5, 0],            // right → SW → right
  L: [6, 0],               // down → right
  V: [5, 3],               // SW → SE (down-left then down-right)
  N: [6, 3, 6],            // up → SE → up
  C: [4, 6, 0],            // left-arc: left → down → right
  S: [0, 6, 0, 6],         // S-curve: right → down → right → down
};

export function getPresetEncoded(letter) {
  return PRESET_GESTURES[letter] || null;
}
