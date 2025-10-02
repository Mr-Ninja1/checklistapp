import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';

// Example config for FOH Cleaning & Sanitizing Log
const cleaningLogConfig = {
  title: 'Food Contact Surface Cleaning And Sanitizing Log Sheet FOH',
  fields: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'shift', label: 'Shift', type: 'select', options: ['AM', 'PM'] },
    { key: 'verifiedBy', label: 'Verified By', type: 'text' },
    { key: 'managerSign', label: 'Complex Manager Sign', type: 'text' },
  ],
  equipmentTable: {
    columns: [
      { key: 'equipment', label: 'Equipment', type: 'text', readonly: true },
      { key: 'sanitize', label: 'Sanitize R-VEG Wash', type: 'checkbox' },
      { key: '16:00', label: '16:00', type: 'checkbox' },
      { key: '17:00', label: '17:00', type: 'checkbox' },
      { key: '18:00', label: '18:00', type: 'checkbox' },
      { key: '19:00', label: '19:00', type: 'checkbox' },
      { key: '20:00', label: '20:00', type: 'checkbox' },
      { key: '21:00', label: '21:00', type: 'checkbox' },
      { key: 'staffName', label: 'Staff Name', type: 'text' },
      { key: 'staffSign', label: 'Staff Sign', type: 'text' },
      { key: 'supName', label: 'Sup Name', type: 'text' },
      { key: 'supSign', label: 'Sup Sign', type: 'text' }
    ],
    rows: [
      { equipment: 'Mixing Bowl' },
      { equipment: 'Production Table' },
      { equipment: 'Finished Product Table' },
      { equipment: 'Slicing Machine' },
      { equipment: 'Dumping Table' },
      { equipment: 'Bread Shelf' },
      { equipment: 'Scraper' },
      { equipment: 'Pastry Table' }
    ]
  },
  instruction: 'All food handlers are required to clean and sanitize the equipment used every after use.'
};

export default function FOHFormScreen({ route, navigation }) {
  // In future, use route.params to select config
  const config = cleaningLogConfig;
  const [formData, setFormData] = useState({ shift: 'AM' });
  const [tableRows, setTableRows] = useState(
    config.equipmentTable.rows.map(row => ({ ...row }))
  );

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleTableChange = (rowIdx, colKey, value) => {
    const updatedRows = [...tableRows];
    updatedRows[rowIdx][colKey] = value;
    setTableRows(updatedRows);
  };

  const handleSubmit = () => {
    // Save logic here (local, PDF, sync, etc.)
    alert('Form submitted!');
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{config.title}</Text>
      {config.fields.map(field => {
        if (field.type === 'date' || field.type === 'text') {
          return (
            <View key={field.key} style={{ marginBottom: 8 }}>
              <Text>{field.label}</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#ccc', padding: 8 }}
                value={formData[field.key] || ''}
                onChangeText={val => handleInputChange(field.key, val)}
              />
            </View>
          );
        }
        if (field.type === 'select') {
          return (
            <View key={field.key} style={{ marginBottom: 8 }}>
              <Text>{field.label}</Text>
              {field.options.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={{ padding: 8, backgroundColor: formData[field.key] === opt ? '#eee' : '#fff', marginVertical: 2 }}
                  onPress={() => handleInputChange(field.key, opt)}
                >
                  <Text>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        }
        return null;
      })}
      <Text style={{ fontWeight: 'bold', marginVertical: 8 }}>Equipment Table</Text>
      <ScrollView horizontal>
        <View>
          <View style={{ flexDirection: 'row' }}>
            {config.equipmentTable.columns.map(col => (
              <Text key={col.key} style={{ width: 100, fontWeight: 'bold', padding: 4 }}>{col.label}</Text>
            ))}
          </View>
          {tableRows.map((row, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row' }}>
              {config.equipmentTable.columns.map(col => (
                <View key={col.key} style={{ width: 100, padding: 4 }}>
                  {col.type === 'text' ? (
                    <TextInput
                      value={row[col.key] || ''}
                      onChangeText={val => handleTableChange(rowIdx, col.key, val)}
                      style={{ borderWidth: 1, borderColor: '#ccc', padding: 4 }}
                      editable={!col.readonly}
                    />
                  ) : col.type === 'checkbox' ? (
                    <TouchableOpacity
                      onPress={() => handleTableChange(rowIdx, col.key, !row[col.key])}
                      style={{ alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text>{row[col.key] ? '✔️' : ''}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <Text style={{ marginVertical: 12, fontStyle: 'italic' }}>{config.instruction}</Text>
      <Button title="Submit" onPress={handleSubmit} />
    </ScrollView>
  );
}
