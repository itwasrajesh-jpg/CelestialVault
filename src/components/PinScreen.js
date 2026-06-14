import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  StyleSheet, Dimensions,
} from 'react-native';
import { tileStyle } from '../utils/themes';

const { width: SW } = Dimensions.get('window');
const PIN_LENGTH = 4;

// ─── PIN SCREEN — port of App.js LockScreen ──────────────────────────────────
export default function PinScreen({
  T, title, subtitle, onSuccess, onCancel,
  cooldownMs = 0, maxAttempts = 5,
}) {
  const [digits, setDigits] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(cooldownMs);
  const shake = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown(c => {
          if (c <= 1000) { clearInterval(timerRef.current); return 0; }
          return c - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  function doShake() {
    Animated.sequence([
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8,   duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start();
  }

  async function pressKey(key) {
    if (cooldown > 0) return;
    if (key === '⌫') {
      setDigits(d => d.slice(0, -1));
      return;
    }
    const next = digits + key;
    setDigits(next);
    if (next.length === PIN_LENGTH) {
      const ok = await onSuccess(next);
      if (ok) {
        setDigits('');
      } else {
        doShake();
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= maxAttempts) {
          setCooldown(120000); // 2 min testing cooldown
        }
        setTimeout(() => setDigits(''), 350);
      }
    }
  }

  const secsLeft = Math.ceil(cooldown / 1000);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: T.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sub, { color: T.sub }]}>{subtitle}</Text> : null}

      {cooldown > 0 ? (
        <View style={[styles.cooldownBox, { backgroundColor: T.surface2, borderColor: T.border }]}>
          <Text style={[styles.cooldownTxt, { color: T.accent }]}>
            Too many attempts — wait {secsLeft}s
          </Text>
        </View>
      ) : null}

      <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < digits.length ? T.accent : 'transparent',
                borderColor: T.accent,
              },
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.pad}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
          <TouchableOpacity
            key={i}
            disabled={k === '' || cooldown > 0}
            onPress={() => k !== '' && pressKey(String(k))}
            activeOpacity={0.65}
            style={[
              styles.key,
              tileStyle(T),
              k === '' && styles.keyEmpty,
            ]}
          >
            <Text style={[
              styles.keyTxt,
              { color: T.text },
              k === '⌫' && { fontSize: 20 },
            ]}>
              {k}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {onCancel ? (
        <TouchableOpacity onPress={onCancel} style={styles.cancel}>
          <Text style={[styles.cancelTxt, { color: T.sub }]}>Cancel</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, gap: 28,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub:   { fontSize: 14, textAlign: 'center', marginTop: -16 },
  cooldownBox: {
    borderRadius: 12, padding: 12, borderWidth: 1,
    alignItems: 'center',
  },
  cooldownTxt: { fontSize: 14, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 16 },
  dot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2,
  },
  pad: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, width: SW - 80, maxWidth: 280,
    justifyContent: 'center',
  },
  key: {
    width: (SW - 80 - 24) / 3,
    maxWidth: 80,
    height: 64, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
  keyTxt: { fontSize: 22, fontWeight: '600' },
  cancel: { marginTop: -8 },
  cancelTxt: { fontSize: 14 },
});
