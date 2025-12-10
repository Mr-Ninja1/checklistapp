import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

export default function NoticeModal({ visible, onClose, deadlineString, contactEmail = 'sikalumbit30@gmail.com', whatsappNumber = '0970105334' }) {
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    let timer = null;
    if (visible) {
      setSecondsLeft(10);
      timer = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      setSecondsLeft(10);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [visible]);

  if (!visible) return null;

  const contactEmailAction = () => {
    const subject = encodeURIComponent('Final instructions — Bravo app');
    const body = encodeURIComponent('Hello,\n\nThe testing/observation period has finished and we would like to confirm final instructions. Please advise next steps.\n\nThanks.');
    Linking.openURL(`mailto:${contactEmail}?subject=${subject}&body=${body}`).catch(() => {});
  };

  const contactWhatsApp = async () => {
    // Try app scheme first, fallback to web wa.me link or tel
    const raw = whatsappNumber.replace(/[^0-9+]/g, '');
    const appUrl = `whatsapp://send?phone=${raw}`;
    const webUrl = `https://wa.me/${raw}`;
    try {
      const opened = await Linking.openURL(appUrl);
      return opened;
    } catch (e) {
      try { await Linking.openURL(webUrl); } catch (_) { Linking.openURL(`tel:${raw}`).catch(() => {}); }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Observation Period Complete</Text>
          <Text style={styles.message}>
            The agreed testing / observation period {deadlineString ? `ended on ${deadlineString}` : 'has ended'}. Thank you — the app has been verified in the supplied environment. Please contact us to confirm final handover or next steps and also get the apps manual(instructions) Book.
          </Text>
            <View style={styles.messageBlock}>
              <Text style={styles.messageLead}>The agreed testing / observation period {deadlineString ? `ended on ${deadlineString}` : 'has ended'}. Thank you — the app has been verified in the supplied environment.</Text>

              <Text style={styles.subHeader}>What you receive</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>• 24/7 technical support during handover and ongoing maintenance.</Text>
                <Text style={styles.bullet}>• A concise user manual to guide daily use and administration.</Text>
                <Text style={styles.bullet}>• All features have been tested and are functioning in the provided environment.</Text>
                <Text style={styles.bullet}>• Reliability commitment: the app is built for robustness and stability. We respond quickly to issues and provide fixes and updates as required.</Text>
              </View>

              <Text style={styles.callToAction}>Please contact us to confirm final handover, request training, or discuss further work — we’d be happy to support additional projects.</Text>
            </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={contactEmailAction}>
              <Text style={styles.contactText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={contactWhatsApp}>
              <Text style={styles.contactText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dismissBtn, secondsLeft > 0 ? styles.dismissBtnDisabled : null]}
              onPress={() => { if (secondsLeft === 0) onClose && onClose(); }}
              disabled={secondsLeft > 0}
            >
              <Text style={[styles.dismissText, secondsLeft > 0 ? styles.dismissTextDisabled : null]}>
                {secondsLeft > 0 ? `Dismiss (${secondsLeft}s)` : 'Dismiss'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.note}>If you need immediate assistance, use the Contact button above.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#185a9d' },
  message: { fontSize: 14, color: '#333', marginBottom: 12, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  contactBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#22c1c3', borderRadius: 8, marginRight: 10 },
  contactText: { color: '#fff', fontWeight: '600' },
  dismissBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#f0f0f0', borderRadius: 8 },
  dismissBtnDisabled: { backgroundColor: '#f5f5f5' },
  dismissText: { color: '#185a9d', fontWeight: '600' },
  dismissTextDisabled: { color: '#999' },
  note: { marginTop: 12, fontSize: 12, color: '#666' },
  messageBlock: { marginTop: 8 },
  messageLead: { fontSize: 14, color: '#333', marginBottom: 10, lineHeight: 20 },
  subHeader: { fontSize: 15, fontWeight: '700', color: '#185a9d', marginBottom: 6 },
  bulletList: { marginLeft: 6, marginBottom: 8 },
  bullet: { fontSize: 13, color: '#333', marginBottom: 6, lineHeight: 18 },
  callToAction: { fontSize: 13, color: '#185a9d', marginTop: 6 },
});
