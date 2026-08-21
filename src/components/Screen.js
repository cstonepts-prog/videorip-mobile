import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Screen({ children, style, keyboard = false, bottomPadding = 12 }) {
  const insets = useSafeAreaInsets();
  const body = (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 8), paddingLeft: insets.left, paddingRight: insets.right }, style]}>
      {children}
      <View style={{ height: bottomPadding }} pointerEvents="none" />
    </View>
  );
  if (!keyboard) return body;
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      {body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
});
