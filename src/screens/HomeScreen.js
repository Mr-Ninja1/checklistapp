
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
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
    name: "Production Records",
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
  const [now, setNow] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getFilteredForms = (categoryKey) => {
    const forms = formCategories[categoryKey]?.forms || [];
    return forms.filter(form =>
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const stats = (() => {
    const allForms = Object.values(formCategories).flatMap(cat => cat.forms);
    return {
      total: allForms.length,
      completed: allForms.filter(f => f.status === 'completed').length,
      pending: allForms.filter(f => f.status === 'pending').length,
      overdue: allForms.filter(f => f.status === 'overdue').length
    };
  })();

  // Format time and date
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateString = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' });
  const yearString = now.getFullYear();

  return (
    <LinearGradient colors={["#43cea2", "#185a9d"]} style={[styles.container, { flex: 1, width: '100%' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bravo!</Text>
        <Text style={styles.headerSubtitle}>Food Safety Inspections</Text>
      </View>

      {/* Greeting Card */}
      <View style={styles.greetingCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={styles.greetingTimeIcon}>🕒</Text>
          <Text style={styles.greetingTime}>{timeString}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.greetingDateIcon}>📅</Text>
          <View>
            <Text style={styles.greetingDate}>{dateString}</Text>
            <Text style={styles.greetingYear}>{yearString}</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}><Text style={styles.statNumber}>{stats.total}</Text><Text style={styles.statLabel}>Total Forms</Text></View>
        <View style={styles.statBox}><Text style={[styles.statNumber, { color: '#43cea2' }]}>{stats.completed}</Text><Text style={styles.statLabel}>Completed</Text></View>
        <View style={styles.statBox}><Text style={[styles.statNumber, { color: '#ffd200' }]}>{stats.pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
        <View style={styles.statBox}><Text style={[styles.statNumber, { color: '#ff5e62' }]}>{stats.overdue}</Text><Text style={styles.statLabel}>Overdue</Text></View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search forms, locations..."
          placeholderTextColor="#aaa"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsList}>
        {Object.entries(formCategories).map(([key, category]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabTrigger, activeCategory === key && styles.tabActive]}
            onPress={() => setActiveCategory(key)}
          >
            <Text style={[styles.tabText, activeCategory === key && styles.tabTextActive]}>{category.name.split(' ')[0]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Form Lists */}
      <View style={{ flex: 1, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Use View for web scroll, not ScrollView */}
        <View style={[styles.formListContent, { minHeight: 0 }]}> 
          {getFilteredForms(activeCategory).map((form) => (
            <View key={form.id} style={[styles.formCard, { borderLeftColor: getStatusColor(form.status).backgroundColor, backgroundColor: '#fff' }]}> 
              <View style={styles.formCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formTitle, { color: '#222' }]}>{form.title}</Text>
                  <Text style={[styles.formLocation, { color: '#555' }]}>{form.location}</Text>
                </View>
              </View>
              <View style={styles.formCardBottom}>
                <View style={styles.badgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(form.status).backgroundColor }]}> 
                    <Text style={[styles.badgeText, { color: getStatusColor(form.status).color }]}>{form.status.charAt(0).toUpperCase() + form.status.slice(1)}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { borderColor: getPriorityColor(form.priority).borderColor }]}> 
                    <Text style={[styles.badgeText, { color: getPriorityColor(form.priority).color }]}>{form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}</Text>
                  </View>
                </View>
                <Text style={[styles.dueText, { color: '#185a9d' }]}>Due: {form.dueTime}</Text>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  greetingCard: {
    backgroundColor: '#f6fdff',
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 8,
    width: '90%',
    alignSelf: 'center',
    padding: 18,
    shadowColor: '#43cea2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#43cea2',
    minWidth: 280,
    maxWidth: 1200,
  },
  greetingTimeIcon: {
    fontSize: 20,
    marginRight: 6,
    color: '#43cea2',
  },
  greetingTime: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2196f3',
    letterSpacing: 1,
  },
  greetingDateIcon: {
    fontSize: 18,
    marginRight: 6,
    color: '#43cea2',
  },
  greetingDate: {
    fontSize: 16,
    color: '#43cea2',
    fontWeight: 'bold',
  },
  greetingYear: {
    fontSize: 14,
    color: '#43cea2',
    opacity: 0.8,
    marginTop: -2,
  },
  container: {
    flex: 1,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  header: {
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'flex-start',
    width: '90%',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.85,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    marginBottom: 8,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  searchBarContainer: {
    width: '90%',
    marginTop: 8,
    marginBottom: 8,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    elevation: 2,
  },
  tabsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    marginBottom: 8,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 4,
  },
  tabTrigger: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#43cea2',
  },
  tabText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#185a9d',
  },
  formListContent: {
    paddingBottom: 32,
    alignItems: 'center',
    width: '100%',
  },
  formCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 8,
    padding: 18,
    borderLeftWidth: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  formCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  formLocation: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  formCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  priorityBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dueText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: '#185a9d',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: -2,
  },
  footer: {
    marginTop: 32,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.7,
    letterSpacing: 1,
  },
});
