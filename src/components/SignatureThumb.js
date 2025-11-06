import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

// Renders a signature PNG a few times with tiny horizontal offsets to visually
// thicken faint strokes without modifying the original image data.
export default function SignatureThumb({ uri, width = 140, height = 44, layers = 3, spread = 0.6 }) {
  if (!uri) return null;
  const offsets = [];
  // create small x/y offsets to thicken strokes. We'll distribute points along a small
  // horizontal line and add slight vertical jitter so strokes don't simply overlap exactly.
  const mid = Math.floor(layers / 2);
  for (let i = 0; i < layers; i++) {
    const x = (i - mid) * spread;
    const y = ((i % 2) - 0.5) * (spread / 2); // alternate small vertical jitter
    offsets.push({ x, y });
  }

  return (
    <View style={[styles.container, { width, height }]}> 
      {offsets.map((o, i) => (
        <Image key={i} source={{ uri }} style={[styles.image, { width, height, left: o.x, top: o.y }]} resizeMode="contain" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  image: { position: 'absolute', top: 0, opacity: 1 },
});
