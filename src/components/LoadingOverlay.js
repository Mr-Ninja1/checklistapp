import React from 'react';
import { Modal, View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';

export default function LoadingOverlay({ visible = false, message = 'Please wait' }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#185a9d" />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    minWidth: 200,
    padding: 18,
    borderRadius: 12,
    backgroundColor: Platform.OS === 'web' ? 'white' : '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#185a9d',
    fontWeight: '600',
    textAlign: 'center',
  },
});
