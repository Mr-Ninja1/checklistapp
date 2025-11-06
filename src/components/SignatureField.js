import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image, Dimensions } from 'react-native';
import Signature from 'react-native-signature-canvas';

export default function SignatureField({ value, onChange, editable = true, height = 140, width = 200, placeholder = 'Sign here', debugMode = false }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const { width: sw, height: sh } = Dimensions.get('window');

  const modalWidth = Math.max(300, Math.min(sw - 40, 1000));
  const modalHeight = Math.max(240, Math.min(Math.round(sh * 0.7), 700));

  const handleOK = (base64Data) => {
    // react-native-signature-canvas typically returns a data URL (data:image/png;base64,...)
    const dataUri = base64Data && base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
    try {
      onChange && onChange(dataUri);
    } catch (e) {
      // swallow errors from parent handler to avoid leaving modal open
      console.warn('SignatureField: onChange handler threw', e);
    } finally {
      setVisible(false);
    }
  };

  const handleEmpty = () => {
    // no signature drawn
  };

  const handleClear = () => {
    onChange && onChange('');
  };

  const previewUri = value && (value.startsWith('data:') ? value : `data:image/png;base64,${value}`);

  if (!editable) {
    return previewUri ? <Image source={{ uri: previewUri }} style={{ width, height, resizeMode: 'contain' }} /> : <Text style={{ color: '#666' }}>{placeholder}</Text>;
  }

  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; }
    html, body { height: 100%; margin: 0; padding: 0; }
    .m-signature-pad--body { height: 100%; }
    .m-signature-pad--body canvas { width: 100% !important; height: 100% !important; touch-action: none; }
    .m-signature-pad--footer { display: none; }
  `;

  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity onPress={() => setVisible(true)} style={[styles.previewWrap, { width, height }] } activeOpacity={0.8} accessible={true} accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={{ width: width, height: height, resizeMode: 'contain' }} />
        ) : (
          <Text style={styles.placeholder}>Tap to sign</Text>
        )}
      </TouchableOpacity>
      <Modal visible={visible} transparent={!debugMode} animationType="fade" onRequestClose={() => setVisible(false)} onDismiss={() => setVisible(false)}>
        <View style={[styles.overlay, debugMode ? styles.overlayDebug : null]}>
          <View style={[styles.modalBox, { width: modalWidth, height: modalHeight }] }>
            <Signature
              ref={ref}
              onOK={handleOK}
              onEmpty={handleEmpty}
              descriptionText="Sign above"
              clearText="Clear"
              confirmText="Save"
              webStyle={webStyle}
              autoClear={false}
              penColor="#000000"
              backgroundColor="rgba(255,255,255,1)"
              // request slightly thicker strokes (props are passed to the inner signaturePad)
              minWidth={2}
              maxWidth={4}
              dotSize={1}
              // set height so the internal canvas has enough room
              height={modalHeight - 80}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setVisible(false)} style={[styles.signBtn, { backgroundColor: '#6b7280' }]}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
              {debugMode && (
                <TouchableOpacity onPress={() => setVisible(false)} style={[styles.signBtn, { backgroundColor: '#ef4444' }]}><Text style={styles.btnText}>Force Close</Text></TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => { ref.current && ref.current.readSignature(); }} style={styles.signBtn}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrap: { borderWidth: 0, borderColor: 'transparent', padding: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  placeholder: { color: '#9ca3af' },
  signBtn: { backgroundColor: '#185a9d', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  overlayDebug: { backgroundColor: 'rgba(0,0,0,0.85)' },
  modalBox: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  modalBtns: { padding: 12, flexDirection: 'row', justifyContent: 'space-between' },
});
