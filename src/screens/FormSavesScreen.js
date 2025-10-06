import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewDocumentModal from '../components/ViewDocumentModal';
import { getFormHistory, removeFormHistory } from '../utils/formHistory';
import { useIsFocused } from '@react-navigation/native';

export default function FormSavesScreen() {
  const [savedForms, setSavedForms] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    async function loadHistory() {
      // Prefer centralized history store (works for web and native)
      try {
        setLoadingHistory(true);
        const history = await getFormHistory();
        setSavedForms((history || []).slice().reverse());
        setLoadingHistory(false);
      } catch (e) {
        setLoadingHistory(false);
        setSavedForms([]);
      }
    }
    // reload whenever the screen becomes focused
    loadHistory();
  }, [isFocused]);

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
      // Open PDF file (native)
      if (selectedForm.pdfPath) {
        try {
          if (Platform.OS === 'android' && FileSystem.getContentUriAsync) {
            // Convert file:// URI to content URI that external apps can open
            const { uri } = await FileSystem.getContentUriAsync(selectedForm.pdfPath);
            await Linking.openURL(uri);
          } else {
            // iOS and others can attempt to open directly
            await Linking.openURL(selectedForm.pdfPath);
          }
        } catch (e) {
          // Fallback: try share sheet so user can pick an external app
          try {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(selectedForm.pdfPath);
            } else {
              Alert.alert('Open failed', 'Unable to open the PDF file.');
            }
          } catch (e2) {
            console.warn('open fallback failed', e2, e);
            Alert.alert('Open failed', 'Unable to open the PDF file.');
          }
        }
      }
    }
  };

  // Delete handler
  const handleDelete = async (form, idx, date) => {
    try {
      // Remove files if native
      if (Platform.OS !== 'web') {
        if (form.pdfPath) await FileSystem.deleteAsync(form.pdfPath, { idempotent: true }).catch(() => {});
        // no png files are stored anymore; only PDFs
      }
      // Remove from history store
      await removeFormHistory(f => f.savedAt === form.savedAt && f.pdfPath === form.pdfPath);
      // Reload
      const history = await getFormHistory();
      setSavedForms((history || []).slice().reverse());
    } catch (e) {
      console.warn('delete failed', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Forms (History)</Text>
      {savedForms.length === 0 ? (
        <Text style={styles.placeholder}>{loadingHistory ? 'Loading history...' : 'No saved forms yet.'}</Text>
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
                          // Combine stored history entry and its meta (actual form data).
                          // Use meta values to override shallow history fields (meta should be the full form payload).
                          const merged = { ...form, ...(form.meta || {}) };
                          // Ensure pdfPath and savedAt come from the history record (not overwritten by meta)
                          merged.pdfPath = form.pdfPath;
                          merged.savedAt = form.savedAt;
                          // Remove nested meta to avoid confusion in ReadOnlyForm
                          if (merged.meta) delete merged.meta;
                          console.log('[FormSavesScreen] opening saved form (merged):', merged);
                          setSelectedForm(merged);
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
                      const merged = { ...form, ...(form.meta || {}) };
                      merged.pdfPath = form.pdfPath;
                      merged.savedAt = form.savedAt;
                      if (merged.meta) delete merged.meta;
                      console.log('[FormSavesScreen] opening saved form (native merged):', merged);
                      setSelectedForm(merged);
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
