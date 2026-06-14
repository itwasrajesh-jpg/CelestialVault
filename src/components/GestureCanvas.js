import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { encodeGesture } from '../utils/security';

// ─── GESTURE CANVAS ───────────────────────────────────────────────────────────
// PanResponder-based drawing canvas.
// User draws any shape. Points are captured and encoded on release.
// onGestureComplete(encodedVectors) called when user lifts finger.
export default function GestureCanvas({ T, onGestureComplete, height = 220 }) {
  const [pathD, setPathD] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const points = useRef([]);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      points.current = [{ x: locationX, y: locationY }];
      setPathD(`M${locationX},${locationY}`);
      setHasDrawn(false);
    },

    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      points.current.push({ x: locationX, y: locationY });
      setPathD(d => d + `L${locationX},${locationY}`);
    },

    onPanResponderRelease: () => {
      if (points.current.length > 5) {
        setHasDrawn(true);
        const encoded = encodeGesture(points.current);
        onGestureComplete && onGestureComplete(encoded, points.current);
      }
    },
  })).current;

  return (
    <View
      style={[styles.canvas, { height, borderColor: T.border, backgroundColor: T.surface2 }]}
      {...pan.panHandlers}
    >
      <Svg style={StyleSheet.absoluteFill}>
        {pathD ? (
          <Path
            d={pathD}
            stroke={T.accent}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
      {!hasDrawn && !pathD ? (
        <Text style={[styles.hint, { color: T.sub }]}>
          Draw any shape with your finger
        </Text>
      ) : null}
      {hasDrawn ? (
        <Text style={[styles.recorded, { color: T.accent }]}>
          ✓ Gesture recorded
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 14, textAlign: 'center' },
  recorded: {
    position: 'absolute',
    bottom: 12, alignSelf: 'center',
    fontSize: 13, fontWeight: '600',
  },
});
