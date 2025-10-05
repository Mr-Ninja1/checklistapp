import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import ViewDocumentModal from '../components/ViewDocumentModal';

export default function FormSavesScreen() {
  const [savedForms, setSavedForms] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      // Native: load from forms/ directory
      if (Platform.OS !== 'web') {
        try {
          const dir = FileSystem.documentDirectory + 'forms/';
          const files = await FileSystem.readDirectoryAsync(dir);
          // Try to load metadata for each PDF (if you have a metadata store, use it; else, just show file info)
          const forms = files.filter(f => f.endsWith('.pdf')).map(f => ({
            pdfPath: dir + f,
            title: f.replace('.pdf', ''),
            date: '',
            shift: '',
            location: '',
            savedAt: '',
            handlers: [],
          }));
          setSavedForms(forms.reverse());
        } catch (e) {
          setSavedForms([]);
        }
      } else {
        // Web: load from localStorage
        const history = JSON.parse(window.localStorage.getItem('formHistory') || '[]');
        setSavedForms(history.reverse());
      }
    }
    loadHistory();
  }, []);

  // Group forms by date (DD/MM/YYYY)
  const groupedByDate = savedForms.reduce((acc, form) => {
    const date = form.date || 'Unknown Date';
    if (!acc[date]) acc[date] = [];
    acc[date].push(form);
    return acc;
  }, {});

  // Download handler (web: download JSON, native: open PDF)
  const handleDownload = async () => {
    if (!selectedForm) return;
    if (Platform.OS === 'web') {
      try {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedForm, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', `form_${selectedForm.date || 'unknown'}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } catch (e) {
        Alert.alert('Download failed', 'Unable to download the document.');
      }
    } else {
      // Open PDF file
      if (selectedForm.pdfPath) {
        try {
          await Linking.openURL(selectedForm.pdfPath);
        } catch (e) {
          Alert.alert('Open failed', 'Unable to open the PDF file.');
        }
      }
    }
  };

  // Delete handler
  const handleDelete = async (form, idx, date) => {
    if (Platform.OS === 'web') {
      // Remove from localStorage
      const history = JSON.parse(window.localStorage.getItem('formHistory') || '[]');
      const filtered = history.filter(f => !(f.savedAt === form.savedAt && f.pdfPath === form.pdfPath));
      window.localStorage.setItem('formHistory', JSON.stringify(filtered));
      setSavedForms(filtered.reverse());
    } else {
      // Remove PDF file
      if (form.pdfPath) {
        try {
          await FileSystem.deleteAsync(form.pdfPath, { idempotent: true });
        } catch (e) {}
      }
      // Remove from list
      setSavedForms(prev => prev.filter((f, i) => !(f.pdfPath === form.pdfPath)));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Forms (History)</Text>
      {savedForms.length === 0 ? (
        <Text style={styles.placeholder}>No saved forms yet.</Text>
      ) : (
        <ScrollView style={{ width: '100%', flex: 1, paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 40 }}>
          {Platform.OS === 'web'
            ? Object.keys(groupedByDate).map(date => (
                <View key={date} style={{ marginBottom: 24 }}>
                  <Text style={styles.dateHeading}>{date}</Text>
                  {groupedByDate[date].map((form, idx) => (
                    <View key={form.savedAt || idx} style={styles.cardRow}>
                      <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedForm(form);
                          setModalVisible(true);
                        }}
                      >
                        <Text style={styles.cardTitle}>{form.title || 'Food Handlers Handwashing Log'}</Text>
                        <Text style={styles.cardMeta}>Shift: {form.shift} | Location: {form.location}</Text>
                        <Text style={styles.cardMeta}>Saved: {form.savedAt ? new Date(form.savedAt).toLocaleString() : ''}</Text>
                        <Text style={styles.cardMeta}>Handlers: {form.handlers ? form.handlers.length : 0}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(form, idx, date)}>
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))
            : savedForms.map((form, idx) => (
                <View key={form.pdfPath || idx} style={styles.cardRow}>
                  <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedForm(form);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.cardTitle}>{form.title || form.pdfPath?.split('/').pop() || 'Saved PDF'}</Text>
                    <Text style={styles.cardMeta}>PDF: {form.pdfPath?.split('/').pop()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(form, idx)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
        </ScrollView>
      )}
      <ViewDocumentModal
        visible={modalVisible}
        form={selectedForm}
        onClose={() => setModalVisible(false)}
        onDownload={handleDownload}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteBtn: {
    backgroundColor: '#ff5e62',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginLeft: 8,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#185a9d',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: '#888',
  },
  dateHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#185a9d',
    marginBottom: 8,
    marginTop: 8,
    backgroundColor: '#e9e9e9',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#185a9d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#185a9d',
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
});
