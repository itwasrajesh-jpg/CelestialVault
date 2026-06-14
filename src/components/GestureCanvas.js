import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { encodeGesture } from '../utils/security';

// ─── GESTURE CANVAS — pure React Native, no SVG dependency ───────────────────
// Draws gesture path using tiny View dots instead of SVG Path
// This avoids react-native-svg entirely — zero crash risk on any device
export default function GestureCanvas({ T, onGestureComplete, height = 220 }) {
  const [dots, setDots]     = useState([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const points = useRef([]);
  const canvasRef = useRef(null);
  const [canvasLayout, setCanvasLayout] = useState({ x: 0, y: 0 });

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,

    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      points.current = [{ x: locationX, y: locationY }];
      setDots([{ x: locationX, y: locationY }]);
      setHasDrawn(false);
    },

    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      points.current.push({ x: locationX, y: locationY });
      // Only keep every 3rd point for rendering — reduces view count
      if (points.current.length % 3 === 0) {
        setDots(prev => [...prev, { x: locationX, y: locationY }]);
      }
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
      ref={canvasRef}
      style={[styles.canvas, { height, borderColor: T.border, backgroundColor: T.surface2 }]}
      {...pan.panHandlers}
    >
      {dots.map((dot, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              left: dot.x - 2,
              top:  dot.y - 2,
              backgroundColor: T.accent,
            },
          ]}
        />
      ))}
      {dots.length === 0 ? (
        <Text style={[styles.hint, { color: T.sub }]}>
          Draw any shape with your finger
        </Text>
      ) : null}
      {hasDrawn ? (
        <Text style={[styles.recorded, { color: T.accent }]}>
          Gesture recorded
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
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
  },
  recorded: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
});
