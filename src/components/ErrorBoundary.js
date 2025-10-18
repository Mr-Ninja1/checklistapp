import React from 'react';
import { View, Text } from 'react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // log to console for debugging; avoid throwing
    console.warn('ErrorBoundary caught error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 16 }}>
          <Text style={{ fontWeight: '700', color: '#b00' }}>Preview failed to render</Text>
          <Text style={{ marginTop: 6 }}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
