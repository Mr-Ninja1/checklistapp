import React from 'react';
import { ScrollView, View } from 'react-native';

// Simple horizontal wrapper for wide tabular content.
// Usage: <ResponsiveTable minWidth={800}><View style={{...}}>...</View></ResponsiveTable>
export default function ResponsiveTable({ children, minWidth }) {
  // Ensure the table keeps at least full-screen width unless a larger minWidth is specified.
  const wrapperStyle = minWidth ? { minWidth } : { minWidth: '100%' };
  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={true}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={wrapperStyle}>
        {children}
      </View>
    </ScrollView>
  );
}
