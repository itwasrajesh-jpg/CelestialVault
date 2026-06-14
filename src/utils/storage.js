import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'celestial_vault_v1';
const SECURE_PIN  = 'cv_pin_hash';
const SECURE_GES  = 'cv_gesture';
const SECURE_REC  = 'cv_recovery';
const ATTEMPT_KEY = 'cv_attempts';
const COOLDOWN_KEY= 'cv_cooldown';

// ── MAIN STATE ───────────────────────────────────────────────────────────────
export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.log('[STORAGE] loadState error:', e);
    return null;
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.log('[STORAGE] saveState error:', e);
  }
}

// ── SECURE PIN ───────────────────────────────────────────────────────────────
export async function savePin(hash) {
  try { await SecureStore.setItemAsync(SECURE_PIN, hash); } catch (e) {}
}
export async function loadPin() {
  try { return await SecureStore.getItemAsync(SECURE_PIN); } catch (e) { return null; }
}
export async function clearPin() {
  try { await SecureStore.deleteItemAsync(SECURE_PIN); } catch (e) {}
}

// ── SECURE GESTURE ───────────────────────────────────────────────────────────
export async function saveGestureEncoded(encoded) {
  try { await SecureStore.setItemAsync(SECURE_GES, JSON.stringify(encoded)); } catch (e) {}
}
export async function loadGestureEncoded() {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_GES);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

// ── RECOVERY PHRASE ──────────────────────────────────────────────────────────
export async function saveRecovery(phrase) {
  try { await SecureStore.setItemAsync(SECURE_REC, phrase); } catch (e) {}
}
export async function loadRecovery() {
  try { return await SecureStore.getItemAsync(SECURE_REC); } catch (e) { return null; }
}

// ── ATTEMPT TRACKING ─────────────────────────────────────────────────────────
export async function getAttempts() {
  try {
    const raw = await AsyncStorage.getItem(ATTEMPT_KEY);
    return raw ? JSON.parse(raw) : { count: 0 };
  } catch (e) { return { count: 0 }; }
}

export async function incrementAttempts() {
  const current = await getAttempts();
  const next = { count: (current.count || 0) + 1, lastAt: Date.now() };
  await AsyncStorage.setItem(ATTEMPT_KEY, JSON.stringify(next));
  return next.count;
}

export async function resetAttempts() {
  await AsyncStorage.removeItem(ATTEMPT_KEY);
  await AsyncStorage.removeItem(COOLDOWN_KEY);
}

// ── COOLDOWN ─────────────────────────────────────────────────────────────────
// Testing: 2 minutes. Change to 300000 (5 min) for production.
const COOLDOWN_MS = 120000;

export async function setCooldown() {
  await AsyncStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
}

export async function getCooldownRemaining() {
  try {
    const raw = await AsyncStorage.getItem(COOLDOWN_KEY);
    if (!raw) return 0;
    const until = parseInt(raw, 10);
    const remaining = until - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch (e) { return 0; }
}
