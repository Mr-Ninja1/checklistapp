import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Hardcoded credentials for now
    if (username === 'admin' && password === 'admin') {
      navigation.replace('Home');
    }
  };

  return (
    <LinearGradient colors={["#43cea2", "#185a9d"]} style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Supervisor Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#ccc"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: 400,
    maxWidth: '90%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    alignSelf: 'center',
  },
  input: {
      title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 32,
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        textAlign: 'center',
        backgroundColor: 'rgba(67,206,162,0.15)',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        overflow: 'hidden',
      },
    color: '#fff',
    fontSize: 18,
  },
  button: {
    backgroundColor: '#185a9d',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
