import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      let greet = 'Good morning';
      if (hours >= 12 && hours < 18) greet = 'Good afternoon';
      else if (hours >= 18) greet = 'Good evening';
      setGreeting(greet);
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Example categories
  const categories = [
    { name: 'Kitchen', color: ['#ff9966', '#ff5e62'] },
    { name: 'Utensils', color: ['#56ccf2', '#2f80ed'] },
    { name: 'Food', color: ['#43e97b', '#38f9d7'] },
    { name: 'Staff Hygiene', color: ['#fa709a', '#fee140'] },
    { name: 'Equipment', color: ['#f7971e', '#ffd200'] },
  ];

  return (
    <LinearGradient colors={["#43cea2", "#185a9d"]} style={styles.container}>
      {/* Hamburger menu at absolute top left */}
      <View style={styles.menuBar}>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.hamburger}>
          <Ionicons name={menuOpen ? 'close' : 'menu'} size={36} color="#fff" />
        </TouchableOpacity>
        {menuOpen && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuOpen(false)}>
              <Ionicons name="home" size={24} color="#185a9d" />
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.replace('Login')}>
              <Ionicons name="log-out-outline" size={24} color="#185a9d" />
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Greeting card below hamburger */}
      <View style={styles.topCard}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.time}>{currentTime}</Text>
        <Text style={styles.date}>{currentDate}</Text>
      </View>
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>Categories</Text>
        <View style={styles.gridList}>
          {categories.map((cat, idx) => (
            <TouchableOpacity key={cat.name} style={styles.categoryCard}>
              <LinearGradient colors={cat.color} style={styles.categoryGradient}>
                <Text style={styles.categoryText}>{cat.name}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  menuBar: {
    position: 'absolute',
    top: 32,
    left: 24,
    zIndex: 10,
  },
  hamburger: {
    padding: 8,
    backgroundColor: 'rgba(24,90,157,0.7)',
    borderRadius: 12,
  },
  menuDropdown: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 18,
    color: '#185a9d',
    marginLeft: 12,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    paddingTop: 32,
    paddingBottom: 16,
  },
  topCard: {
    marginTop: 56,
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  time: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  date: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.85,
    textAlign: 'center',
  },
  categorySection: {
    marginTop: 32,
    flex: 1,
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: 1,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  categoryCard: {
    width: 150,
    height: 120,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  categoryGradient: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
