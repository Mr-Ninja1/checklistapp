import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform, TextInput, Modal, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewDocumentModal from '../components/ViewDocumentModal';
import DriveFloatingButton from '../components/DriveFloatingButton';
import formStorage from '../utils/formStorage';
import { getFormHistory, removeFormHistory } from '../utils/formHistory';
import { normalizeSavedAtUsingFiles } from '../utils/formHistory';
import { useIsFocused } from '@react-navigation/native';

export default function FormSavesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [savedForms, setSavedForms] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [opening, setOpening] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('date');
  const [activeMonth, setActiveMonth] = useState('all');
  const [dateFilter, setDateFilter] = useState({ from: null, to: null });
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  // Local temp values to edit both from/to inside modal before applying
  const [tempFrom, setTempFrom] = useState(null);
  const [tempTo, setTempTo] = useState(null);
  const [lastDaysInput, setLastDaysInput] = useState('');
  const [lastDaysModalVisible, setLastDaysModalVisible] = useState(false);
  const [lastDaysValue, setLastDaysValue] = useState('');
  const [activeFilterLabel, setActiveFilterLabel] = useState('All months');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const adjustTemp = (side, field, delta) => {
    const cur = side === 'from' ? (tempFrom || Date.now()) : (tempTo || Date.now());
    const d = new Date(cur);
    if (field === 'year') d.setFullYear(d.getFullYear() + delta);
    if (field === 'month') d.setMonth(d.getMonth() + delta);
    if (field === 'day') d.setDate(d.getDate() + delta);
    if (side === 'from') setTempFrom(d.getTime()); else setTempTo(d.getTime());
  };
  // Calendar view state for richer picker
  const [viewFromYear, setViewFromYear] = useState(new Date().getFullYear());
  const [viewFromMonth, setViewFromMonth] = useState(new Date().getMonth()); // 0-indexed
  const [viewToYear, setViewToYear] = useState(new Date().getFullYear());
  const [viewToMonth, setViewToMonth] = useState(new Date().getMonth());

  const formatYMD = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const parseYMD = (s) => {
    if (!s) return null;
    // allow yyyy-mm-dd or locale parse
    const iso = s.indexOf('-') === 4 ? s : null;
    const d = iso ? new Date(s) : new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.getTime();
  };
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
  const isFocused = useIsFocused();
  // Extracted loader so we can call it manually (Refresh button) and from useEffect
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await getFormHistory();
      setSavedForms((history || []).slice().reverse());
      setLoadingHistory(false);
    } catch (e) {
      setLoadingHistory(false);
      setSavedForms([]);
    }
  };

  useEffect(() => {
    // reload whenever the screen becomes focused
    loadHistory();
    // If navigated here with a request to open the Drive sign-in modal, clear the param after consuming
    try {
      if (route && route.params && route.params.openDriveModal) {
        // reset param so it doesn't reopen on back/soft re-render
        try { navigation.setParams({ openDriveModal: false }); } catch (e) {}
      }
    } catch (e) {}
  }, [isFocused]);

  // Filter saved forms by search term and active month
  const monthKeyFor = (form) => {
    if (form && form.savedAt) {
      try {
        const d = new Date(form.savedAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      } catch (e) {
        return 'unknown';
      }
    }
    return 'unknown';
  };

  const filteredForms = savedForms.filter(f => {
    const term = (searchTerm || '').toLowerCase().trim();
  // (no category filter) only month filter applies
    // month filter check
    if (activeMonth && activeMonth !== 'all' && monthKeyFor(f) !== activeMonth) return false;
    // date range filter (savedAt in ms)
    if (dateFilter.from || dateFilter.to) {
      const t = f.savedAt ? Number(f.savedAt) : null;
      if (!t) return false;
      // Convert all timestamps to start of day for comparison
      const dayTs = Math.floor(t / 86400000) * 86400000;
      const fromDay = dateFilter.from ? Math.floor(dateFilter.from / 86400000) * 86400000 : null;
      const toDay = dateFilter.to ? Math.floor(dateFilter.to / 86400000) * 86400000 : null;
      // Include the entire day for both from and to dates
      if (fromDay && dayTs < fromDay) return false;
      if (toDay && dayTs > (toDay + 86400000 - 1)) return false;
    }
    if (!term) return true;
    // search across title, location, and stored meta payload text
    const hay = `${f.title || ''} ${f.location || ''} ${JSON.stringify(f.meta || {})}`.toLowerCase();
    return hay.indexOf(term) !== -1;
  });

  // Group forms by savedAt date (localized) (DD/MM/YYYY)
  const groupedByDate = filteredForms.reduce((acc, form) => {
    const dateKey = form.savedAt ? new Date(form.savedAt).toLocaleDateString() : 'Unknown Date';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(form);
    return acc;
  }, {});

  // Group forms by category (fallback to 'Uncategorized') - used when `viewMode` is 'category'
  const groupedByCategory = filteredForms.reduce((acc, form) => {
    const cat = (form.meta && (form.meta.category || form.meta.type)) || form.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(form);
    return acc;
  }, {});

  // compile unique categories for filter buttons (not used - date only approach)

  // compile unique months (YYYY-MM) for quick month/year filters, sort descending
  const monthSet = new Set(savedForms.map(f => {
    const k = monthKeyFor(f);
    return k || 'unknown';
  }));
  const monthList = Array.from(monthSet).sort((a, b) => (a === 'unknown' ? 1 : b === 'unknown' ? -1 : b.localeCompare(a)));

  // Build a year -> months map from savedForms so we can show years in header
  // and reveal months for a single year in a modal when tapped.
  const yearMap = (savedForms || []).reduce((acc, f) => {
    try {
      if (!f || !f.savedAt) return acc;
      const d = new Date(f.savedAt);
      if (isNaN(d.getTime())) return acc;
      const y = String(d.getFullYear());
      const m = String(d.getMonth() + 1).padStart(2, '0');
      if (!acc[y]) acc[y] = new Set();
      acc[y].add(m);
    } catch (e) { /* ignore */ }
    return acc;
  }, {});
  const yearList = Object.keys(yearMap).sort((a, b) => Number(b) - Number(a));

  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [modalYear, setModalYear] = useState(null);
  const [modalYearMonths, setModalYearMonths] = useState([]);

  const openYearModal = (y) => {
    try {
      const months = Array.from(yearMap[y] || []).sort((a, b) => Number(b) - Number(a));
      setModalYearMonths(months);
      setModalYear(y);
      setYearModalVisible(true);
    } catch (e) { setModalYearMonths([]); setModalYear(y); setYearModalVisible(true); }
  };

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
      <View style={{ width: '100%', paddingHorizontal: 24 }}>
        {/* Search and grouping controls */}
        <View style={styles.controlsWrap}>
          <TextInput
            placeholder="Search saved forms (title, location, contents...)"
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchInput}
            placeholderTextColor="#6b7280"
          />
          {/* Manual refresh placed below the search input for immediate visibility after restores */}
          <View style={{ marginTop: 8, marginBottom: 8, alignItems: 'flex-end' }}>
            <TouchableOpacity style={styles.smallActionBtnCompact} onPress={() => loadHistory()}>
              <Text style={styles.smallActionBtnText}>{loadingHistory ? 'Refreshing...' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>
          {/* Year -> Months modal: shows months available for the selected year */}
          <Modal visible={yearModalVisible} animationType="slide" transparent>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <View style={{ width: '90%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
                <Text style={{ fontWeight: '800', fontSize: 18, marginBottom: 8 }}>Months in {modalYear}</Text>
                <ScrollView>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {modalYearMonths && modalYearMonths.length ? (
                      modalYearMonths.map(m => {
                        const label = `${monthNames[Number(m) - 1] || m} ${modalYear}`;
                        const key = `${modalYear}-${m}`;
                        return (
                          <TouchableOpacity key={key} onPress={() => { setActiveMonth(`${modalYear}-${m}`); setYearModalVisible(false); }} style={[styles.categoryBtn, { margin: 6 }]}>
                            <Text style={styles.categoryBtnText}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={{ color: '#666' }}>No months found for this year.</Text>
                    )}
                  </View>
                </ScrollView>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                  <TouchableOpacity style={[styles.clearBtn, { marginRight: 8 }]} onPress={() => { setActiveMonth('all'); setYearModalVisible(false); }}>
                    <Text style={styles.clearBtnText}>All months</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.applyBtn} onPress={() => setYearModalVisible(false)}>
                    <Text style={styles.applyBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          {activeMonth !== 'all' ? (
            <Text style={{ marginTop: 6, color: '#374151' }}>Scoped to: {activeMonth === 'unknown' ? 'Unknown' : `${monthNames[Math.max(0, Number(activeMonth.split('-')[1]) - 1)]} ${activeMonth.split('-')[0]}`} — clear to search all months</Text>
          ) : null}
          <View style={styles.controlsRow}>
            {/* month chips (primary filter) with friendly labels */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.categoryScroll, { marginLeft: 8 }]} contentContainerStyle={{ alignItems: 'center' }}>
              {/* All months chip removed (now available via toolbar filter buttons) */}
              {/* Quick actions: Set to today and Last N days */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                <TouchableOpacity style={[styles.filterBtn, activeFilterLabel === 'Today' ? styles.filterBtnActive : null]} onPress={() => {
                  const now = new Date();
                  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                  setDateFilter({ from: startOfDay, to: startOfDay });
                  setActiveMonth('all');
                  setActiveFilterLabel('Today');
                }}>
                  <Text style={activeFilterLabel === 'Today' ? styles.filterBtnTextActive : styles.filterBtnText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterBtn, activeFilterLabel === 'All months' ? styles.filterBtnActive : null, { marginLeft: 8 }]} onPress={() => {
                  setDateFilter({ from: null, to: null });
                  setActiveMonth('all');
                  setActiveFilterLabel('All months');
                }}>
                  <Text style={activeFilterLabel === 'All months' ? styles.filterBtnTextActive : styles.filterBtnText}>All months</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterBtn, { marginLeft: 8 }]} onPress={() => setLastDaysModalVisible(true)}>
                  <Text style={styles.filterBtnText}>Last N days</Text>
                </TouchableOpacity>
              </View>
              {/* years are shown in the separate scrollable row below (no inline year chips here) */}
              {/* Date range chip next to months */}
              <TouchableOpacity
                style={[styles.dateRangeBtn, { marginLeft: 8 }]}
                onPress={() => {
                    const from = dateFilter.from || null;
                    const to = dateFilter.to || null;
                    setTempFrom(from);
                    setTempTo(to);
                    if (from) {
                      const d = new Date(from);
                      setViewFromYear(d.getFullYear()); setViewFromMonth(d.getMonth());
                    } else { const now = new Date(); setViewFromYear(now.getFullYear()); setViewFromMonth(now.getMonth()); }
                    if (to) {
                      const d2 = new Date(to);
                      setViewToYear(d2.getFullYear()); setViewToMonth(d2.getMonth());
                    } else { const now2 = new Date(); setViewToYear(now2.getFullYear()); setViewToMonth(now2.getMonth()); }
                    setDatePickerVisible(true);
                }}
              >
                <Text style={styles.dateRangeBtnText}>{dateFilter.from || dateFilter.to ? (
                  `${dateFilter.from ? new Date(dateFilter.from).toLocaleDateString() : 'Any'} → ${dateFilter.to ? new Date(dateFilter.to).toLocaleDateString() : 'Any'}`
                ) : 'Date range'}</Text>
              </TouchableOpacity>
              {/* Drive button inline (appears after date range) */}
              <DriveFloatingButton inline openOnMount={Boolean(route && route.params && route.params.openDriveModal)} onSyncComplete={async () => {
                try {
                  const history = await getFormHistory();
                  setSavedForms((history || []).slice().reverse());
                } catch (e) { /* ignore */ }
              }} />
            </ScrollView>
          </View>
          </View>
          {/* Years container: separate horizontal scroll placed below the top filter controls */}
          <View style={{ width: '100%', paddingTop: 8, paddingBottom: 6 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ alignItems: 'center', paddingLeft: 8, paddingRight: 16 }}>
              {yearList && yearList.length ? yearList.map(y => {
                const isAnyMonthActive = activeMonth && activeMonth.indexOf(String(y)) === 0;
                return (
                  <TouchableOpacity key={y} onPress={() => openYearModal(y)} style={[styles.categoryBtn, isAnyMonthActive ? styles.categoryBtnActive : null, { marginRight: 8 }]}>
                    <Text style={isAnyMonthActive ? styles.categoryBtnTextActive : styles.categoryBtnText}>{y}</Text>
                  </TouchableOpacity>
                );
              }) : (
                <Text style={{ color: '#666', marginLeft: 8 }}>No years available</Text>
              )}
            </ScrollView>
          </View>
          {/* Date picker modal */}
          <Modal visible={datePickerVisible} animationType="slide" transparent>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <View style={{ width: '95%', maxHeight: '90%', backgroundColor: '#fff', borderRadius: 12 }}>
                <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
                  <Text style={{ fontWeight: '700', marginBottom: 8 }}>Filter by date range</Text>
                  <Text style={{ color: '#374151', marginBottom: 12 }}>Click a field to type, or pick from the month/year lists or day grid below.</Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={styles.pickerColumn}>
                    <Text style={styles.pickerHeader}>From</Text>
                    <TextInput placeholder="yyyy-mm-dd" value={formatYMD(tempFrom)} onChangeText={t => setTempFrom(parseYMD(t))} style={{ borderWidth: 1, borderColor: '#e6eef2', padding: 8, borderRadius: 8, marginTop: 6 }} />

                    {/* month selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {monthNames.map((mn, idx) => (
                        <TouchableOpacity key={mn} onPress={() => { const y = viewFromYear; const d = new Date(y, idx, tempFrom ? new Date(tempFrom).getDate() : 1); setTempFrom(d.getTime()); setViewFromMonth(idx); setViewFromYear(y); }} style={[styles.categoryBtn, viewFromMonth === idx ? styles.categoryBtnActive : null, { marginRight: 8 }]}>
                          <Text style={viewFromMonth === idx ? styles.categoryBtnTextActive : styles.categoryBtnText}>{mn}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* year controls */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <TouchableOpacity style={styles.smallBtn} onPress={() => { setViewFromYear(y => y - 1); setTempFrom(d => { const cur = d || Date.now(); const cd = new Date(cur); cd.setFullYear(cd.getFullYear() - 1); return cd.getTime(); }); }}><Text>-</Text></TouchableOpacity>
                      <Text style={{ paddingHorizontal: 12 }}>{viewFromYear}</Text>
                      <TouchableOpacity style={styles.smallBtn} onPress={() => { setViewFromYear(y => y + 1); setTempFrom(d => { const cur = d || Date.now(); const cd = new Date(cur); cd.setFullYear(cd.getFullYear() + 1); return cd.getTime(); }); }}><Text>+</Text></TouchableOpacity>
                    </View>

                    {/* day grid for From */}
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ marginBottom: 6 }}>{monthNames[viewFromMonth]} {viewFromYear}</Text>
                      <View style={{ flexDirection: 'row' }}>
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <Text key={d} style={{ flex: 1, textAlign: 'center', fontWeight: '700' }}>{d}</Text>)}
                      </View>
                      <View>
                        {(() => {
                          const rows = [];
                          const first = firstDayOfMonth(viewFromYear, viewFromMonth);
                          const total = daysInMonth(viewFromYear, viewFromMonth);
                          let cur = 1 - first;
                          for (let r = 0; r < 6; r++) {
                            const cols = [];
                            for (let c = 0; c < 7; c++, cur++) {
                                      if (cur < 1 || cur > total) {
                                        cols.push(<View key={`${r}-${c}`} style={{ flex: 1, padding: 4 }} />);
                                      } else {
                                        const ts = new Date(viewFromYear, viewFromMonth, cur).getTime();
                                        const active = tempFrom && Math.floor(tempFrom / 86400000) === Math.floor(ts / 86400000);
                                        cols.push(
                                          <TouchableOpacity key={`${r}-${c}`} onPress={() => setTempFrom(ts)} style={{ flex: 1, padding: 4 }}>
                                            <View style={{ backgroundColor: active ? '#185a9d' : '#f3f4f6', borderRadius: 6, paddingVertical: 6 }}>
                                              <Text style={{ textAlign: 'center', color: active ? '#fff' : '#111', fontSize: 13 }}>{cur}</Text>
                                            </View>
                                          </TouchableOpacity>
                                        );
                                      }
                            }
                            rows.push(<View key={`row-${r}`} style={{ flexDirection: 'row', marginBottom: 6 }}>{cols}</View>);
                          }
                          return rows;
                        })()}
                      </View>
                    </View>
            </View>
            <View style={styles.divider} />

            {/* To picker column */}
            <View style={styles.pickerColumn}>
                    <Text style={styles.pickerHeader}>To</Text>
                    <TextInput placeholder="yyyy-mm-dd" value={formatYMD(tempTo)} onChangeText={t => setTempTo(parseYMD(t))} style={{ borderWidth: 1, borderColor: '#e6eef2', padding: 8, borderRadius: 8, marginTop: 6 }} />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {monthNames.map((mn, idx) => (
                        <TouchableOpacity key={mn} onPress={() => { const y = viewToYear; const d = new Date(y, idx, tempTo ? new Date(tempTo).getDate() : 1); setTempTo(d.getTime()); setViewToMonth(idx); setViewToYear(y); }} style={[styles.categoryBtn, viewToMonth === idx ? styles.categoryBtnActive : null, { marginRight: 8 }]}>
                          <Text style={viewToMonth === idx ? styles.categoryBtnTextActive : styles.categoryBtnText}>{mn}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <TouchableOpacity style={styles.smallBtn} onPress={() => { setViewToYear(y => y - 1); setTempTo(d => { const cur = d || Date.now(); const cd = new Date(cur); cd.setFullYear(cd.getFullYear() - 1); return cd.getTime(); }); }}><Text>-</Text></TouchableOpacity>
                      <Text style={{ paddingHorizontal: 12 }}>{viewToYear}</Text>
                      <TouchableOpacity style={styles.smallBtn} onPress={() => { setViewToYear(y => y + 1); setTempTo(d => { const cur = d || Date.now(); const cd = new Date(cur); cd.setFullYear(cd.getFullYear() + 1); return cd.getTime(); }); }}><Text>+</Text></TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 8 }}>
                      <Text style={{ marginBottom: 6 }}>{monthNames[viewToMonth]} {viewToYear}</Text>
                      <View style={{ flexDirection: 'row' }}>
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <Text key={d} style={{ flex: 1, textAlign: 'center', fontWeight: '700' }}>{d}</Text>)}
                      </View>
                      <View>
                        {(() => {
                          const rows = [];
                          const first = firstDayOfMonth(viewToYear, viewToMonth);
                          const total = daysInMonth(viewToYear, viewToMonth);
                          let cur = 1 - first;
                          for (let r = 0; r < 6; r++) {
                            const cols = [];
                            for (let c = 0; c < 7; c++, cur++) {
                              if (cur < 1 || cur > total) {
                                cols.push(<View key={`${r}-${c}`} style={{ flex: 1, padding: 4 }} />);
                              } else {
                                const ts = new Date(viewToYear, viewToMonth, cur).getTime();
                                const active = tempTo && Math.floor(tempTo / 86400000) === Math.floor(ts / 86400000);
                                cols.push(
                                  <TouchableOpacity key={`${r}-${c}`} onPress={() => setTempTo(ts)} style={{ flex: 1, padding: 4 }}>
                                    <View style={{ backgroundColor: active ? '#185a9d' : '#f3f4f6', borderRadius: 6, paddingVertical: 6 }}>
                                      <Text style={{ textAlign: 'center', color: active ? '#fff' : '#111', fontSize: 13 }}>{cur}</Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              }
                            }
                            rows.push(<View key={`row-to-${r}`} style={{ flexDirection: 'row', marginBottom: 6 }}>{cols}</View>);
                          }
                          return rows;
                        })()}
                      </View>
                    </View>
                  </View>
                    </View>
                  </ScrollView>

                {/* (Previously had a single-date shortcut here; moved to toolbar) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity style={[styles.clearBtn, { flex: 1, marginRight: 8 }]} onPress={() => { setDateFilter({ from: null, to: null }); setTempFrom(null); setTempTo(null); setDatePickerVisible(false); setActiveMonth('all'); }}>
                    <Text style={styles.clearBtnText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.applyBtn, { flex: 1 }]} onPress={() => {
                    setDateFilter({ from: tempFrom || null, to: tempTo || null });
                    setDatePickerVisible(false);
                    setActiveMonth('all');
                  }}>
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
          {/* Last N days modal */}
          <Modal visible={lastDaysModalVisible} animationType="slide" transparent>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <View style={{ width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 18 }}>
                <Text style={{ fontWeight: '700', marginBottom: 8 }}>Filter last N days</Text>
                <Text style={{ color: '#374151', marginBottom: 12 }}>Enter number of days (e.g., 2 for last 2 days)</Text>
                <TextInput keyboardType="numeric" placeholder="Days" value={lastDaysValue} onChangeText={setLastDaysValue} style={{ borderWidth: 1, borderColor: '#e6eef2', padding: 10, borderRadius: 8, marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity style={[styles.clearBtn, { marginRight: 8 }]} onPress={() => setLastDaysModalVisible(false)}>
                    <Text style={styles.clearBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.applyBtn} onPress={() => {
                    const n = parseInt(lastDaysValue, 10);
                    if (!n || n <= 0) return Alert.alert('Invalid', 'Enter a number greater than 0');
                    const now = new Date();
                    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                    const start = end - (n - 1) * 86400000;
                    setDateFilter({ from: start, to: end });
                    setActiveMonth('all');
                    setActiveFilterLabel(`Last ${n} days`);
                    setLastDaysModalVisible(false);
                    setLastDaysValue('');
                  }}>
                    <Text style={styles.applyBtnText}>Go</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
      </View>
      {savedForms.length === 0 ? (
        <Text style={styles.placeholder}>{loadingHistory ? 'Loading history...' : 'No saved forms yet.'}</Text>
      ) : (
        <ScrollView style={{ width: '100%', flex: 1 }} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 24 }}>
          {Platform.OS === 'web' || viewMode === 'date' ? (
            // render grouped by date
            Object.keys(groupedByDate).map(date => (
              <View key={date} style={{ marginBottom: 24 }}>
                <Text style={styles.dateHeading}>{date === 'Unknown Date' ? 'Unknown saved date' : date}</Text>
                {groupedByDate[date].map((form, idx) => (
                  <View key={form.savedAt || idx} style={styles.cardRow}>
                    <TouchableOpacity
                      style={styles.card}
                      activeOpacity={0.8}
                      onPress={async () => {
                          if (opening) return; // prevent double-tap
                          setOpening(true);
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

                            // 3) If still not found, fall back to history entry fields
                            if (!payload) payload = form;

                            // Ensure savedAt/pdfPath/title remain available for the modal
                            payload.pdfPath = form.pdfPath;
                            payload.savedAt = form.savedAt;
                            payload.title = payload.title || form.title || form.pdfPath?.split('/')?.pop();
                            if (payload.meta) delete payload.meta;

                            setSelectedForm(payload);
                            setModalVisible(true);
                            setOpening(false);
                          } catch (e) {
                            console.warn('failed loading saved payload', e);
                            Alert.alert('Open failed', 'Unable to load saved form payload.');
                            setOpening(false);
                          }
                        }}
                    >
                      <Text style={styles.cardTitle}>{form.title || 'Saved Form'}</Text>
                      <Text style={styles.cardMeta}>Location: {form.location || ''}</Text>
                      <Text style={styles.cardMeta}>Saved: {form.savedAt ? new Date(form.savedAt).toLocaleString() : 'Unknown'}</Text>
                      <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => handleDelete(form, idx, date)}>
                        <Text style={styles.deleteBtnTextSmall}>Delete</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          ) : (
            // render grouped by category
            Object.keys(groupedByCategory).map(cat => (
              <View key={cat} style={{ marginBottom: 24 }}>
                <Text style={styles.dateHeading}>{cat.toUpperCase()}</Text>
                {groupedByCategory[cat].map((form, idx) => (
                  <View key={form.savedAt || idx} style={styles.cardRow}>
                    <TouchableOpacity
                      style={styles.card}
                      activeOpacity={0.8}
                      onPress={async () => {
                        if (opening) return; // prevent double-tap
                        setOpening(true);
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

                          setSelectedForm(payload);
                          setModalVisible(true);
                          setOpening(false);
                        } catch (e) {
                          console.warn('failed loading saved payload', e);
                          Alert.alert('Open failed', 'Unable to load saved form payload.');
                          setOpening(false);
                        }
                      }}
                    >
                      <Text style={styles.cardTitle}>{form.title || 'Saved Form'}</Text>
                      <Text style={styles.cardMeta}>Date: {form.date || ''} | Location: {form.location || ''}</Text>
                      <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => handleDelete(form, idx)}>
                        <Text style={styles.deleteBtnTextSmall}>Delete</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
      <ViewDocumentModal
        visible={modalVisible}
        form={selectedForm}
        onClose={() => setModalVisible(false)}
        onDownload={handleDownload}
      />
      {/* Overlay shown while a saved form payload is being loaded */}
      <Modal visible={opening} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 18, borderRadius: 12, alignItems: 'center', minWidth: 180 }}>
            <ActivityIndicator size="large" color="#185a9d" />
            <Text style={{ marginTop: 12, fontWeight: '700', color: '#111' }}>Loading form...</Text>
          </View>
        </View>
      </Modal>
      {/* Google Drive button is shown inline in the filter row now */}
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
    backgroundColor: '#e70e0eff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginLeft: 8,
    marginRight:40,
    alignSelf: 'stretch',
    justifyContent: 'center',
    width:40,

    
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // small delete button placed inside card
  deleteBtnSmall: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#ff5e62',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnTextSmall: { color: '#fff', fontWeight: '700', fontSize: 14 },
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
    paddingRight: 48, // leave room for inline delete button (slightly inset)
    marginBottom: 18,
    shadowColor: '#185a9d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
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
  controlsWrap: {
    marginBottom: 14,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6eef2',
    fontSize: 15,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  controlsRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  groupToggles: { flexDirection: 'row', alignItems: 'center' },
  groupToggle: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', marginRight: 8, backgroundColor: 'transparent' },
  groupToggleActive: { backgroundColor: '#185a9d', borderColor: '#185a9d' },
  groupToggleText: { color: '#185a9d', fontWeight: '700' },
  groupToggleTextActive: { color: '#fff', fontWeight: '700' },
  categoryScroll: { marginLeft: 12 },
  categoryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  categoryBtnActive: { backgroundColor: '#185a9d' },
  categoryBtnText: { color: '#374151', fontWeight: '600', textTransform: 'capitalize' },
  categoryBtnTextActive: { color: '#fff', fontWeight: '700', textTransform: 'capitalize' },
  dateRangeBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#185a9d' },
  dateRangeBtnText: { color: '#fff', fontWeight: '700' },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#eef2ff', marginHorizontal: 6, minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  pickerColumn: { minWidth: 260, flex: 1, paddingRight: 12 },
  divider: { width: 1, backgroundColor: '#e6eef2', marginHorizontal: 12, borderRadius: 1, alignSelf: 'stretch' },
  pickerHeader: { fontWeight: '800', fontSize: 18, marginBottom: 6 },
  clearBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ff5e62', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: '#ff5e62', fontWeight: '700' },
  applyBtn: { backgroundColor: '#185a9d', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '800' },
  smallActionBtn: { backgroundColor: '#185a9d', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  smallActionBtnText: { color: '#fff', fontWeight: '700' },
  smallActionBtnCompact: { backgroundColor: '#185a9d', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 96, alignItems: 'center' },
  lastDaysInput: { width: 54, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: '#e6eef2', textAlign: 'center' },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: '#185a9d', backgroundColor: 'transparent' },
  filterBtnActive: { backgroundColor: '#185a9d' },
  filterBtnText: { color: '#000', fontWeight: '700' },
  filterBtnTextActive: { color: '#fff', fontWeight: '700' },
});
