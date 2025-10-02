import warnOnce from '../utils/warnOnce';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Platform, Dimensions, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Form data from Index.tsx
const formCategories = {
  foh: {
    name: "FOH Records",
    color: ["#43cea2", "#185a9d"],
    forms: [
      { id: 1, title: "Daily Cleaning & Sanitizing - AM", status: "completed", priority: "high", dueTime: "6:00 AM", location: "Front Counter" },
      { id: 2, title: "Daily Cleaning & Sanitizing - PM", status: "pending", priority: "high", dueTime: "6:00 PM", location: "Front Counter" },
      { id: 3, title: "Weekly Cleaning - AM", status: "pending", priority: "medium", dueTime: "Monday 6:00 AM", location: "Dining Area" },
      { id: 4, title: "Monthly Temp Logs - Chillers", status: "overdue", priority: "critical", dueTime: "2 hours ago", location: "Display Area" },
      { id: 5, title: "Fruit Washing & Sanitizing", status: "pending", priority: "high", dueTime: "Every 4 hours", location: "Prep Station" },
      { id: 6, title: "Customer Survey Logs", status: "completed", priority: "low", dueTime: "Daily", location: "Reception" },
      { id: 7, title: "Product Release Log", status: "pending", priority: "medium", dueTime: "Before service", location: "Service Counter" }
    ]
  },
  production: {
    name: "Prod Records",
    color: ["#ff9966", "#ff5e62"],
    forms: [
      { id: 8, title: "Certificates of Analysis", status: "pending", priority: "critical", dueTime: "Daily", location: "Production Floor" },
      { id: 9, title: "5 Why Report/Non-conformance", status: "completed", priority: "high", dueTime: "As needed", location: "Production Floor" },
      { id: 10, title: "Product Release", status: "pending", priority: "critical", dueTime: "Before dispatch", location: "Quality Lab" },
      { id: 11, title: "Daily Handwashing - AM", status: "completed", priority: "high", dueTime: "6:00 AM", location: "Production Entry" },
      { id: 12, title: "Daily Handwashing - PM", status: "pending", priority: "high", dueTime: "6:00 PM", location: "Production Entry" },
      { id: 13, title: "Weekly Showering Logs", status: "pending", priority: "medium", dueTime: "Weekly", location: "Locker Room" },
      { id: 14, title: "Food Sample Collection", status: "overdue", priority: "critical", dueTime: "1 hour ago", location: "Production Line" }
    ]
  },
  kitchen: {
    name: "Kitchen Records",
    color: ["#56ccf2", "#2f80ed"],
    forms: [
      { id: 15, title: "Daily Cleaning & Sanitizing", status: "pending", priority: "high", dueTime: "After each shift", location: "Main Kitchen" },
      { id: 16, title: "Weekly Cleaning Log", status: "completed", priority: "medium", dueTime: "Monday", location: "Kitchen Area" },
      { id: 17, title: "Monthly Temp - Under Bar Chillers", status: "pending", priority: "high", dueTime: "Monthly", location: "Kitchen Bar" },
      { id: 18, title: "Cooking Temp Log", status: "pending", priority: "critical", dueTime: "Every cooking", location: "Cooking Station" },
      { id: 19, title: "Cooling Temp Log", status: "overdue", priority: "critical", dueTime: "30 min ago", location: "Cooling Area" },
      { id: 20, title: "Thawing Temp Log", status: "pending", priority: "high", dueTime: "During thawing", location: "Prep Area" },
      { id: 21, title: "Hot Holding Temp Log", status: "completed", priority: "critical", dueTime: "Every 2 hours", location: "Service Line" },
      { id: 22, title: "Vegetable & Fruit Washing", status: "pending", priority: "high", dueTime: "Before use", location: "Wash Station" },
      { id: 23, title: "Shelf Life Inspection", status: "pending", priority: "medium", dueTime: "Daily", location: "Storage Area" }
    ]
  },
  bakery: {
    name: "Bakery Records", 
    color: ["#fa709a", "#fee140"],
    forms: [
      { id: 24, title: "Baking, Moulding & Proofing", status: "pending", priority: "high", dueTime: "Each batch", location: "Bakery Floor" },
      { id: 25, title: "Cooling Log", status: "completed", priority: "medium", dueTime: "After baking", location: "Cooling Racks" },
      { id: 26, title: "Temp Records - Under Bar Chillers", status: "pending", priority: "high", dueTime: "Every 4 hours", location: "Bakery Chillers" },
      { id: 27, title: "Baking Control Sheet", status: "overdue", priority: "critical", dueTime: "45 min ago", location: "Oven Station" },
      { id: 28, title: "Mixing Control Sheet", status: "pending", priority: "high", dueTime: "Each mix", location: "Mixing Station" },
      { id: 29, title: "Shelf Life Inspection", status: "completed", priority: "medium", dueTime: "Daily", location: "Display Case" },
      { id: 30, title: "Net Content Log", status: "pending", priority: "low", dueTime: "Per batch", location: "Packaging Area" }
    ]
  },
  boh: {
    name: "BOH Records",
    color: ["#f7971e", "#ffd200"],
    forms: [
      { id: 31, title: "Weekly Storage Room Cleaning", status: "pending", priority: "medium", dueTime: "Monday", location: "Storage Room" },
      { id: 32, title: "Weekly Cleaning Materials Log", status: "completed", priority: "low", dueTime: "Weekly", location: "Chemical Storage" },
      { id: 33, title: "Weekly Scullery Area Cleaning", status: "pending", priority: "medium", dueTime: "Sunday", location: "Scullery" },
      { id: 34, title: "Weekly Welfare Facility Cleaning", status: "overdue", priority: "medium", dueTime: "2 days ago", location: "Staff Area" },
      { id: 35, title: "Weekly Cold Room Cleaning", status: "pending", priority: "high", dueTime: "Saturday", location: "Cold Storage" },
      { id: 36, title: "Pest Control Log", status: "completed", priority: "high", dueTime: "Monthly", location: "Entire Facility" },
      { id: 37, title: "Monthly Temp - Walking Freezer", status: "pending", priority: "critical", dueTime: "Daily", location: "Walk-in Freezer" },
      { id: 38, title: "Employee PPE Register", status: "completed", priority: "medium", dueTime: "Daily", location: "Entry Points" },
      { id: 39, title: "Personal Hygiene Checklist", status: "pending", priority: "high", dueTime: "Start of shift", location: "Locker Room" },
      { id: 40, title: "Health Status Checklist", status: "pending", priority: "critical", dueTime: "Daily", location: "HR Office" }
    ]
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return { backgroundColor: '#43cea2', color: '#fff' };
    case 'pending': return { backgroundColor: '#ffd200', color: '#333' };
    case 'overdue': return { backgroundColor: '#ff5e62', color: '#fff' };
    default: return { backgroundColor: '#eee', color: '#333' };
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'critical': return { borderColor: '#ff5e62', color: '#ff5e62' };
    case 'high': return { borderColor: '#ffd200', color: '#ffd200' };
    case 'medium': return { borderColor: '#43cea2', color: '#43cea2' };
    case 'low': return { borderColor: '#aaa', color: '#aaa' };
    default: return { borderColor: '#eee', color: '#333' };
  }
};

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('foh');
  const [searchTerm, setSearchTerm] = useState('');
  // Date/time
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const yearString = now.getFullYear();

  // Filter forms by category and search
  function getFilteredForms(category) {
    const forms = formCategories[category].forms;
    if (!searchTerm) return forms;
    return forms.filter(f =>
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Status color helpers
  function getStatusColor(status) {
    switch (status) {
      case 'completed': return { backgroundColor: '#43cea2', color: '#fff' };
      case 'pending': return { backgroundColor: '#ffd200', color: '#222' };
      case 'overdue': return { backgroundColor: '#ff5e62', color: '#fff' };
      default: return { backgroundColor: '#eee', color: '#222' };
    }
  }
  function getPriorityColor(priority) {
    switch (priority) {
      case 'high': return { borderColor: '#ffd200', color: '#ffd200' };
      case 'medium': return { borderColor: '#43cea2', color: '#43cea2' };
      case 'critical': return { borderColor: '#ff5e62', color: '#ff5e62' };
      case 'low': return { borderColor: '#aaa', color: '#aaa' };
      default: return { borderColor: '#eee', color: '#222' };
    }
  }

  const { width, height } = useWindowDimensions();
  const isWide = width > 700;
  const isMobile = width < 700;

  // Main UI
  return (
    <View style={{ flex: 1, backgroundColor: '#f6fdff', width: '100%' }}>
      <LinearGradient
        colors={["#22c1c3", "#43cea2", "#185a9d"]}
        style={{
          width: '100%',
          paddingBottom: isMobile ? 0 : 24,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          alignSelf: 'stretch',
        }}
      >
        {/* Polished mobile app header */}
        {isMobile ? (
          <View style={{ padding: 0, margin: 0 }}>
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 18,
                marginHorizontal: 14,
                marginTop: 14,
                marginBottom: 0,
                padding: 16,
                elevation: 5,
                shadowColor: '#185a9d',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.13,
                shadowRadius: 12,
                borderWidth: 1,
                borderColor: '#eaf7f7',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Image
                  source={require('../logo.png')}
                  style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', marginRight: 12, shadowColor: '#185a9d', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 }}
                  resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#185a9d', letterSpacing: 1, textAlign: 'left', marginBottom: 2 }}>Bravo!</Text>
                  <Text style={{ fontSize: 15, color: '#43cea2', opacity: 0.95, textAlign: 'left', marginBottom: 0, fontWeight: '500' }}>Food Safety Inspections</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 15, color: '#22c1c3', fontWeight: 'bold', marginRight: 6 }}>📍</Text>
                <Text style={{ fontSize: 14, color: '#22c1c3', fontWeight: 'bold', marginRight: 8 }}>Lusaka, Zambia</Text>
                <Text style={{ fontSize: 13, color: '#185a9d', fontWeight: '500' }}>Bravo Brands Central</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 13, color: '#185a9d', marginRight: 8 }}>5 Sites</Text>
                <Text style={{ fontSize: 13, color: '#185a9d', marginRight: 8 }}>| 42 Staff</Text>
                <Text style={{ fontSize: 13, color: '#43cea2', fontWeight: 'bold' }}>● Active</Text>
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 24,
              paddingBottom: 0,
            }}
          >
            <Image
              source={require('../logo.png')}
              style={{ width: 48, height: 48, borderRadius: 12, marginRight: 16, backgroundColor: '#fff' }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 1 }}>Bravo!</Text>
              <Text style={{ fontSize: 15, color: '#fff', opacity: 0.85 }}>Food Safety Inspections</Text>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 12, minWidth: 220, alignItems: 'flex-start', elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 16, color: '#22c1c3', fontWeight: 'bold', marginRight: 6 }}>📍</Text>
                <Text style={{ fontSize: 15, color: '#22c1c3', fontWeight: 'bold' }}>Lusaka, Zambia</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#185a9d', marginBottom: 2 }}>Bravo Brands Central</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#185a9d', marginRight: 8 }}>5 Sites</Text>
                <Text style={{ fontSize: 13, color: '#185a9d', marginRight: 8 }}>| 42 Staff</Text>
                <Text style={{ fontSize: 13, color: '#43cea2', fontWeight: 'bold' }}>● Active</Text>
              </View>
            </View>
          </View>
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: isMobile ? 12 : 24,
            paddingBottom: isMobile ? 8 : 16,
            marginTop: isMobile ? 4 : 8,
          }}
        >
          <Text style={{ fontSize: isMobile ? 15 : 20, color: '#fff', marginRight: 8 }}>🕒</Text>
          <Text style={{ fontSize: isMobile ? 16 : 22, fontWeight: 'bold', color: '#fff', marginRight: 16 }}>{timeString}</Text>
          <Text style={{ fontSize: isMobile ? 13 : 18, color: '#fff', marginRight: 8 }}>📅</Text>
          <Text style={{ fontSize: isMobile ? 13 : 16, color: '#fff', fontWeight: 'bold' }}>{dateString}, {yearString}</Text>
        </View>
      </LinearGradient>


      {/* Category Tabs - now static, directly below header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#f6fdff',
        borderRadius: 16,
        padding: 4,
        marginBottom: 0, // Remove space below category tab
        marginTop: 0,    // Remove space above category tab
        alignSelf: 'stretch',
        position: 'relative',
        zIndex: 2,
      }}>
        {Object.entries(formCategories).map(([key, category], idx) => (
          <TouchableOpacity
            key={key}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 12, backgroundColor: activeCategory === key ? '#43cea2' : 'transparent' }}
            onPress={() => setActiveCategory(key)}
          >
            <Text style={{ fontSize: 18, color: activeCategory === key ? '#fff' : '#185a9d', fontWeight: 'bold' }}>
              {idx === 0 ? '🍽️' : idx === 1 ? '🏭' : idx === 2 ? '🍳' : idx === 3 ? '🍞' : '🏢'} {category.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Form Lists */}
      <View style={{ flex: 1, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Use View for web scroll, not ScrollView */}
        <View style={[styles.formListContent, { minHeight: 0 }]}> 
          {getFilteredForms(activeCategory).map((form) => (
            <View key={form.id}>
              <View style={[styles.formCard, { borderLeftColor: getStatusColor(form.status).backgroundColor, backgroundColor: '#fff' }]}> 
                <View style={styles.formCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formTitle, { color: '#222' }]}>{form.title}</Text>
                    <Text style={[styles.formLocation, { color: '#555' }]}>{form.location}</Text>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, backgroundColor: getStatusColor(form.status).backgroundColor }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: getStatusColor(form.status).color }}>{form.status.charAt(0).toUpperCase() + form.status.slice(1)}</Text>
                  </View>
                  <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 2, borderColor: getPriorityColor(form.priority).borderColor, marginRight: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: getPriorityColor(form.priority).color }}>{form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => {}}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Bravo @ {new Date().getFullYear()}</Text>
      </View>
    </View>
  );
}

// Add missing styles object
import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  formCard: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 6,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formLocation: {
    fontSize: 14,
    color: '#888',
  },
  formListContent: {
    padding: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#43cea2',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
  footer: {
    alignItems: 'center',
    padding: 12,
    marginTop: 16,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
});
