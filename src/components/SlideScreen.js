import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Animated, Easing, StyleSheet, Dimensions,
  BackHandler, PanResponder,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

const SPRING      = { tension: 68, friction: 12, useNativeDriver: true };
const SPRING_LITE = { toValue: 1, tension: 90, friction: 18, useNativeDriver: true };

// ─── SLIDE SCREEN — exact port of App.js SlideScreen ────────────────────────
// originX, originY: screen coords of element that opened this sheet.
// hasOrigin branch → spaghettification from tap point.
// No origin → standard genie from centre-bottom.
export default function SlideScreen({
  children, onClose, zIndex = 50, T, animLevel, originX = 0, originY = 0,
}) {
  const DM = animLevel === 'lite' ? 0.55 : 1.0;

  const screenCX = SW / 2;

  const hasOrigin = originX > 0 && originY > 0;
  const offX = hasOrigin ? (originX - screenCX) : 0;

  const ty     = useRef(new Animated.Value(SH)).current;
  const scaleX = useRef(new Animated.Value(0.04)).current;
  const scaleY = useRef(new Animated.Value(0.04)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  const tx     = useRef(new Animated.Value(offX)).current;

  useEffect(() => {
    if (animLevel === 'none') {
      ty.setValue(0); tx.setValue(0);
      scaleX.setValue(1); scaleY.setValue(1); opac.setValue(1);
      return;
    }

    if (!hasOrigin) {
      // Standard genie from centre-bottom
      Animated.parallel([
        Animated.timing(opac,   { toValue: 1, duration: Math.round(80 * DM), useNativeDriver: true }),
        Animated.timing(ty,     { toValue: 0, duration: Math.round(440 * DM), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(scaleX, { toValue: 0.3,  duration: Math.round(100 * DM), easing: Easing.out(Easing.quad),  useNativeDriver: true }),
          Animated.timing(scaleX, { toValue: 0.7,  duration: Math.round(120 * DM), easing: Easing.out(Easing.quad),  useNativeDriver: true }),
          Animated.spring(scaleX, animLevel === 'lite' ? SPRING_LITE : { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scaleY, { toValue: 1.06, duration: Math.round(260 * DM), easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(scaleY, animLevel === 'lite' ? SPRING_LITE : { toValue: 1, tension: 65, friction: 9, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      // ── SPAGHETTIFICATION from bubble ──────────────────────────────────────
      Animated.parallel([
        Animated.timing(opac, { toValue: 1, duration: Math.round(120 * DM), useNativeDriver: true }),
        Animated.timing(tx,   { toValue: 0, duration: Math.round(460 * DM), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ty,   { toValue: 0, duration: Math.round(460 * DM), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(scaleX, { toValue: 0.08, duration: Math.round(80  * DM), easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.timing(scaleX, { toValue: 0.35, duration: Math.round(140 * DM), easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(scaleX, { toValue: 0.75, duration: Math.round(120 * DM), easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(scaleX, animLevel === 'lite' ? SPRING_LITE : { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scaleY, { toValue: 1.18, duration: Math.round(220 * DM), easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(scaleY, animLevel === 'lite' ? SPRING_LITE : { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, []);

  const genieClose = useCallback(() => {
    if (animLevel === 'none') { onClose(); return; }

    if (!hasOrigin) {
      // Standard close — exact reverse of open
      Animated.parallel([
        Animated.timing(opac, { toValue: 0, duration: Math.round(340 * DM), delay: Math.round(40 * DM), useNativeDriver: true }),
        Animated.timing(ty,   { toValue: SH, duration: Math.round(440 * DM), easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(scaleX, { toValue: 0.7,  duration: Math.round(120 * DM), easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.timing(scaleX, { toValue: 0.3,  duration: Math.round(100 * DM), easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.timing(scaleX, { toValue: 0.04, duration: Math.round(100 * DM), easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scaleY, { toValue: 1.06, duration: Math.round(120 * DM), easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 0.04, duration: Math.round(260 * DM), easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start(onClose);
    } else {
      // ── SPAGHETTIFICATION back to bubble — exact reverse ──────────────────
      Animated.parallel([
        Animated.timing(opac, { toValue: 0, duration: Math.round(360 * DM), delay: Math.round(40 * DM), useNativeDriver: true }),
        Animated.timing(tx,   { toValue: offX, duration: Math.round(460 * DM), easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ty,   { toValue: SH,   duration: Math.round(460 * DM), easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(scaleX, { toValue: 0.75, duration: Math.round(120 * DM), easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.timing(scaleX, { toValue: 0.35, duration: Math.round(140 * DM), easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.timing(scaleX, { toValue: 0.04, duration: Math.round(100 * DM), easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scaleY, { toValue: 1.18, duration: Math.round(180 * DM), easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 0.04, duration: Math.round(280 * DM), easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start(onClose);
    }
  }, [onClose, animLevel, hasOrigin, offX]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      genieClose(); return true;
    });
    return () => sub.remove();
  }, [genieClose]);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => {
      if (g.dy > 0) {
        ty.setValue(g.dy);
        scaleX.setValue(Math.max(0.04, 1 - g.dy / (SH * 1.8)));
        if (hasOrigin) tx.setValue(offX * (g.dy / (SH * 0.6)));
      }
    },
    onPanResponderRelease: (_, g) => {
      if (g.dy > SH * 0.28 || g.vy > 0.8) {
        genieClose();
      } else {
        Animated.parallel([
          Animated.spring(ty,     { toValue: 0, ...SPRING }),
          Animated.spring(tx,     { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
          Animated.spring(scaleX, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
        ]).start();
      }
    },
  })).current;

  return (
    <Animated.View style={[
      StyleSheet.absoluteFillObject,
      {
        zIndex,
        backgroundColor: T.bg,
        opacity: opac,
        transform: [{ translateX: tx }, { translateY: ty }, { scaleX }, { scaleY }],
      },
    ]}>
      <View {...pan.panHandlers} style={styles.dragArea}>
        <View style={styles.dragHandle} />
      </View>
      {children(genieClose)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dragArea: {
    paddingTop: 12, paddingBottom: 4,
    alignItems: 'center', zIndex: 10,
  },
  dragHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
