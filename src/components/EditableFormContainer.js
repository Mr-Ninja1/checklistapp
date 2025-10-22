import React from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Text, Keyboard, View } from 'react-native';
import PropTypes from 'prop-types';

export default function EditableFormContainer({ children, editMode, setEditMode, onSaveDraft }) {
  const isEditing = editMode;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/*
            When not editing, we set pointerEvents='none' on the children wrapper so child inputs
            don't block touch gestures and the ScrollView can receive touch-drag anywhere on the form.
          */}
          {/*
            When not editing we still want scrolling (horizontal tables) to work.
            Use 'box-none' so the wrapper itself doesn't block touch events while
            still allowing children (which should be individually gated) to
            receive touches where appropriate.
          */}
          <View style={{ flex: 1 }} pointerEvents={isEditing ? 'auto' : 'box-none'}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isEditing ? 'Finish editing form' : 'Edit form'}
        // pin to middle-right so it remains fixed and reachable regardless of content scroll
        style={{
          position: 'absolute',
          right: 14,
          top: '50%',
          marginTop: -36,
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: isEditing ? '#34C759' : '#FF3B30',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          elevation: 12, // Android: lift above other content
          shadowColor: '#000', // iOS shadow
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          overflow: 'hidden',
        }}
        onPress={() => {
          if (isEditing) {
            Keyboard.dismiss();
            // NOTE: do not auto-save when the user taps Done — saving can be
            // triggered explicitly via the form action buttons. Calling
            // onSaveDraft here caused UI freezes on some devices/emulators.
          }
          setEditMode(!isEditing);
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{isEditing ? 'Done' : 'Edit'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

EditableFormContainer.propTypes = {
  children: PropTypes.node,
  editMode: PropTypes.bool.isRequired,
  setEditMode: PropTypes.func.isRequired,
  onSaveDraft: PropTypes.func,
};
