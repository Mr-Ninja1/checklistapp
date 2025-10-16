import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewDocumentModal from '../components/ViewDocumentModal';
import formStorage from '../utils/formStorage';
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
        // no jpeg files are stored anymore; only PDFs
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
                        onPress={async () => {
                            try {
                              // Attempt multiple strategies to obtain the canonical saved payload
                              let payload = null;
                              const meta = form.meta || {};

                              // 1) If meta.formId present, load stored payload
                              if (meta.formId) {
                                try {
                                  const loaded = await formStorage.loadForm(meta.formId);
                                  if (loaded && loaded.payload) payload = loaded.payload;
                                } catch (e) {
                                  console.warn('FormSavesScreen: loadForm failed for formId', meta.formId, e);
                                }
                              }

                              // 2) If not found, check meta.formData or meta.payload shape
                              if (!payload) {
                                // Some forms (e.g. FruitWashingLog) stored metadata and formData inside the history `meta` object.
                                // In that case meta.formData is an array of rows — reconstruct a canonical payload:
                                if (meta && Array.isArray(meta.formData)) {
                                  const m = { ...meta };
                                  const rows = m.formData || [];
                                  delete m.formData;
                                  payload = { metadata: m, formData: rows };
                                } else if (meta.formData && Object.keys(meta.formData).length) {
                                  // fallback for unexpected shapes
                                  payload = meta.formData;
                                } else if (meta.payload && Object.keys(meta.payload).length) {
                                  payload = meta.payload;
                                } else if (Array.isArray(meta.handlers) && Array.isArray(meta.timeSlots)) {
                                  payload = meta;
                                }
                              }

                              // 3) If still not found, fall back to history entry fields
                              if (!payload) payload = form;

                              // Ensure savedAt/pdfPath remain available for the modal
                              payload.pdfPath = form.pdfPath;
                              payload.savedAt = form.savedAt;
                              if (payload.meta) delete payload.meta;

                              // opened saved form

                              setSelectedForm(payload);
                              setModalVisible(true);
                            } catch (e) {
                              console.warn('failed loading saved payload', e);
                              Alert.alert('Open failed', 'Unable to load saved form payload.');
                            }
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
                    onPress={async () => {
                        try {
                          let payload = null;
                          const meta = form.meta || {};
                          if (meta.formId) {
                            try {
                              const loaded = await formStorage.loadForm(meta.formId);
                              if (loaded && loaded.payload) payload = loaded.payload;
                            } catch (e) { console.warn('FormSavesScreen: loadForm failed for formId', meta.formId, e); }
                          }
                          if (!payload) {
                            if (meta && Array.isArray(meta.formData)) {
                              const m = { ...meta };
                              const rows = m.formData || [];
                              delete m.formData;
                              payload = { metadata: m, formData: rows };
                            } else if (meta.formData && Object.keys(meta.formData).length) {
                              payload = meta.formData;
                            } else if (meta.payload && Object.keys(meta.payload).length) {
                              payload = meta.payload;
                            } else if (Array.isArray(meta.handlers) && Array.isArray(meta.timeSlots)) {
                              payload = meta;
                            }
                          }
                          if (!payload) payload = form;
                          payload.pdfPath = form.pdfPath;
                          payload.savedAt = form.savedAt;
                          if (payload.meta) delete payload.meta;

                              // opened saved form

                          setSelectedForm(payload);
                          setModalVisible(true);
                        } catch (e) {
                          console.warn('failed loading saved payload', e);
                          Alert.alert('Open failed', 'Unable to load saved form payload.');
                        }
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
