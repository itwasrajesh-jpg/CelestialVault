import { useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { verifyPin } from '../utils/security';
import {
  incrementAttempts, resetAttempts, setCooldown, getCooldownRemaining,
} from '../utils/storage';

// ─── VAULT AUTH — double biometric, then PIN fallback ─────────────────────────
export function useVaultAuth() {
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  const startAuth = useCallback(async () => {
    const remaining = await getCooldownRemaining();
    if (remaining > 0) {
      setState('cooldown');
      setError('Too many attempts. Try again in ' + Math.ceil(remaining / 1000) + 's');
      return false;
    }

    const hasHW      = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHW || !isEnrolled) {
      setState('pin');
      return 'needs_pin';
    }

    // First biometric — same options as working Expense app
    setState('bio1');
    const result1 = await LocalAuthentication.authenticateAsync({
      promptMessage:          'Verify your identity',
      fallbackLabel:          'Use PIN',
      disableDeviceFallback:  false,
      requireConfirmation:    false,
    });

    if (!result1.success) {
      const count = await incrementAttempts();
      if (count >= 5) await setCooldown();
      setState('failed');
      setError('Fingerprint not recognised');
      return false;
    }

    // Second biometric — vault confirmation
    setState('bio2');
    const result2 = await LocalAuthentication.authenticateAsync({
      promptMessage:          'Confirm vault access',
      fallbackLabel:          'Use PIN',
      disableDeviceFallback:  false,
      requireConfirmation:    false,
    });

    if (!result2.success) {
      const count = await incrementAttempts();
      if (count >= 5) await setCooldown();
      setState('failed');
      setError('Second fingerprint not recognised');
      return false;
    }

    await resetAttempts();
    setState('done');
    return true;
  }, []);

  return { state, error, startAuth };
}

// ─── APP LOCK AUTH — single biometric + PIN fallback ─────────────────────────
export function useAppLockAuth() {
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  const authenticate = useCallback(async (appName) => {
    const name = appName || 'this app';
    const remaining = await getCooldownRemaining();
    if (remaining > 0) {
      setState('cooldown');
      setError('Wait ' + Math.ceil(remaining / 1000) + 's');
      return false;
    }

    const hasHW      = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHW || !isEnrolled) {
      setState('pin');
      return 'needs_pin';
    }

    setState('bio');
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage:          'Unlock ' + name,
      fallbackLabel:          'Use PIN',
      disableDeviceFallback:  false,
      requireConfirmation:    false,
    });

    if (result.success) {
      await resetAttempts();
      setState('done');
      return true;
    }

    const count = await incrementAttempts();
    if (count >= 5) await setCooldown();
    setState('failed');
    setError('Fingerprint not recognised');
    return false;
  }, []);

  const verifyPinEntry = useCallback(async (pin, storedHash) => {
    const ok = await verifyPin(pin, storedHash);
    if (ok) {
      await resetAttempts();
      setState('done');
    } else {
      const count = await incrementAttempts();
      if (count >= 5) await setCooldown();
      setState('failed');
      setError('Incorrect PIN');
    }
    return ok;
  }, []);

  return { state, error, authenticate, verifyPinEntry };
}
