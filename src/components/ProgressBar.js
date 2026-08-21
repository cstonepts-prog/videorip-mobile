import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function ProgressBar({ progress = null, height = 6 }) {
  const determinate = typeof progress === 'number' && Number.isFinite(progress);
  const width = determinate ? `${Math.max(0, Math.min(1, progress)) * 100}%` : '30%';
  return (
    <View style={[styles.track, { height }]} accessibilityRole="progressbar" accessibilityValue={determinate ? { min: 0, max: 100, now: Math.round(progress * 100) } : undefined}>
      <View style={[styles.fill, { width, height }, !determinate && styles.indeterminate]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', backgroundColor: '#E2E8F0', borderRadius: 999, overflow: 'hidden' },
  fill: { backgroundColor: '#0B57D0', borderRadius: 999 },
  indeterminate: { opacity: 0.55 },
});
