import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import GenericReadOnlyForm from '../GenericReadOnlyForm';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Checkbox = ({ checked }) => (
    <View style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]}>
        {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
    </View>
);

export default function ReadOnlyKitchenWeeklyCleaningChecklist({ form }) {
    if (!form) return null;
    const formData = form.formData || form.areas || form.form || [];
    const metadata = form.metadata || form.meta || form.meta?.metadata || form.meta || {};

    const adaptedForm = {
        ...form,
        metadata: {
            location: metadata?.location,
            week: metadata?.week,
            month: metadata?.month,
            year: metadata?.year,
        },
        verification: {
            hseqManager: metadata?.hseqManager,
            complexManager: metadata?.complexManager,
        }
    };

    return (
        <GenericReadOnlyForm
            form={adaptedForm}
            title="KITCHEN WEEKLY CLEANING CHECKLIST"
            area="KITCHEN"
        >
            <ScrollView horizontal>
                <View>
                    <View style={styles.headerRow}>
                        <Text style={styles.headerCell}>Area to be cleaned</Text>
                        <Text style={styles.headerCell}>Frequency (Per Week)</Text>
                        {WEEK_DAYS.map(d => (
                            <View key={d} style={styles.headerGroup}>
                                <Text style={styles.headerCell}>{d}</Text>
                                <Text style={styles.headerCell}>Cleaned BY</Text>
                            </View>
                        ))}
                    </View>

                    {(formData || []).map(item => (
                        <View key={item.id || item.name} style={styles.row}>
                            <Text style={styles.cell}>{item.name || ''}</Text>
                            <Text style={styles.cell}>{item.frequency || ''}</Text>
                            {WEEK_DAYS.map(day => {
                                const dayObj = (item.checks && item.checks[day]) || (item.days && item.days[day]) || { checked: false, cleanedBy: '' };
                                return (
                                    <View key={day} style={styles.dayGroup}>
                                        <View style={styles.cell}>
                                            <Checkbox checked={!!dayObj.checked} />
                                        </View>
                                        <View style={styles.cell}>
                                            <Text>{dayObj.cleanedBy || ''}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </GenericReadOnlyForm>
    );
}

const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', backgroundColor: '#4B5563', paddingVertical: 6 },
    headerCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#4B5563', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700' },
    headerGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#4B5563' },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#4B5563', minHeight: 40, backgroundColor: '#fff' },
    cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#4B5563', justifyContent: 'center' },
    dayGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#4B5563' },
    checkbox: { width: 26, height: 26, borderWidth: 1.5, borderColor: '#4B5563', borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
    checkboxUnchecked: { backgroundColor: '#fff', borderColor: '#4B5563' },
    checkboxTick: { color: '#fff', fontWeight: '700' },
});
