import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, Image, useWindowDimensions } from 'react-native';
import SignatureField from '../components/SignatureField';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';
import formStorage from '../utils/formStorage';
import EditableFormContainer from '../components/EditableFormContainer';
import FormActionBar from '../components/FormActionBar';

const DRAFT_KEY = 'moulding_proofing_baking_log_draft';

const initialRows = Array.from({ length: 20 }, (_, i) => ({
	id: i,
 	product: '',
 	mouldingTime: '',
 	mouldingSign: '',
 	proofTimeIn: '',
 	proofTimeOut: '',
 	proofSign: '',
 	bakeTimeIn: '',
 	bakeTemp: '',
 	bakeTimeOut: '',
 	staffName: ''
}));

const initialMetadata = {
	date: new Date().toLocaleDateString(),
	location: '',
	compiledBy: 'Michael zulu',
	approvedBy: 'Hassani Ali',
	issueDate: new Date().toLocaleDateString(),
	docNo: '',
	revisionDate: 'NA',
	page: '',
	correctiveAction: '',
};

// Fixed column widths (px) to guarantee alignment between header/subheader and inputs
const COL_WIDTHS = {
	num: 40,
	food: 220,
	mouldingTime: 90,
	mouldingSign: 110,
	proofTimeIn: 90,
	proofTimeOut: 90,
	proofSign: 110,
	bakeTimeIn: 90,
	bakeTemp: 70,
	bakeTimeOut: 90,
	staff: 140
};

export default function MouldingProofingBakingLog(props = {}) {
	const { width: windowWidth } = useWindowDimensions();

	const [rows, setRows] = useState(initialRows);
	const [meta, setMeta] = useState(initialMetadata);
	// correctiveAction is stored in meta.correctiveAction
	const [headChefSign, setHeadChefSign] = useState('');
	const [verifiedBySign, setVerifiedBySign] = useState('');
	const [complexManagerSign, setComplexManagerSign] = useState('');
	const [busy, setBusy] = useState(false);
	const saveTimer = useRef(null);
	const [editMode, setEditMode] = useState(false);
	const [logoDataUri, setLogoDataUri] = useState(null);

	// Normalize signature values into canonical data URI strings where possible.
	const normalizeSig = (v) => {
		if (v === undefined || v === null) return '';
		let x = v;
		if (typeof x !== 'string') {
			const maybe = x && (x.uri || x.data || x.base64 || x);
			if (typeof maybe === 'string') x = maybe;
			else return '';
		}
		x = String(x).trim();
		if (!x) return '';
		if (x.startsWith('data:')) return x;
		const compact = x.replace(/\s+/g, '');
		if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
		return x;
	};

	// compute dynamic widths so columns share available space and remove blank gap
	const totalFixed = Object.values(COL_WIDTHS).reduce((s, v) => s + v, 0);
	const contentPadding = 24; // matches styles.content padding (12 left + 12 right)
	const available = Math.max(windowWidth - contentPadding, totalFixed);
	const dynamicWidths = { ...COL_WIDTHS };
	if (available > totalFixed) {
		const extra = available - totalFixed;
		const variableKeys = ['food','mouldingTime','mouldingSign','proofTimeIn','proofTimeOut','proofSign','bakeTimeIn','bakeTemp','bakeTimeOut','staff'];
		const varTotal = variableKeys.reduce((s, k) => s + COL_WIDTHS[k], 0);
		variableKeys.forEach(k => {
			dynamicWidths[k] = COL_WIDTHS[k] + Math.round(extra * (COL_WIDTHS[k] / varTotal));
		});
	}

	// table width computed from dynamic column widths — used to allow horizontal scrolling
	const tableWidth = Object.values(dynamicWidths).reduce((s, v) => s + v, 0);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const d = await getDraft(DRAFT_KEY);
				if (d) {
					// Ensure we always show 20 rows in the UI. If a draft has fewer rows,
					// merge the saved row values into a full 20-entry array.
					if (d.rows && Array.isArray(d.rows)) {
						const merged = Array.from({ length: 20 }, (_, i) => {
							const src = d.rows[i] || {};
							return {
								id: i,
								product: src.product || '',
								mouldingTime: src.mouldingTime || '',
								mouldingSign: src.mouldingSign || '',
								proofTimeIn: src.proofTimeIn || '',
								proofTimeOut: src.proofTimeOut || '',
								proofSign: src.proofSign || '',
								bakeTimeIn: src.bakeTimeIn || '',
								bakeTemp: src.bakeTemp || '',
								bakeTimeOut: src.bakeTimeOut || '',
								staffName: src.staffName || ''
							};
						});
						setRows(merged);
					}
					if (d.meta) setMeta(d.meta);
					// Restore signatures if present (allow empty string as valid value)
					if (Object.prototype.hasOwnProperty.call(d, 'headChefSign')) setHeadChefSign(d.headChefSign ?? '');
					if (Object.prototype.hasOwnProperty.call(d, 'verifiedBySign')) setVerifiedBySign(d.verifiedBySign ?? '');
					if (Object.prototype.hasOwnProperty.call(d, 'complexManagerSign')) setComplexManagerSign(d.complexManagerSign ?? '');
				}
				try {
					const asset = Asset.fromModule(require('../assets/logo.jpeg'));
					if (!asset.localUri) await asset.downloadAsync();
					const uri = asset.localUri || asset.uri;
					const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
					if (b64 && mounted) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
				} catch (e) { /* ignore */ }
			} catch (e) { /* ignore */ }
		})();
		return () => { mounted = false; };
	}, []);

	useEffect(() => {
		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => {
			// normalize signatures for draft storage
			const rowsForDraft = rows.map(r => ({ ...r, mouldingSign: normalizeSig(r.mouldingSign), proofSign: normalizeSig(r.proofSign) }));
			const normHead = normalizeSig(headChefSign);
			const normVerified = normalizeSig(verifiedBySign);
			const normComplex = normalizeSig(complexManagerSign);
			setDraft(DRAFT_KEY, { rows: rowsForDraft, meta, headChefSign: normHead, verifiedBySign: normVerified, complexManagerSign: normComplex });
		}, 700);
		return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
	}, [rows, meta, headChefSign, verifiedBySign, complexManagerSign]);

	const setRowField = (id, field, value) => setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
	const setMetaField = (k, v) => setMeta(prev => ({ ...prev, [k]: v }));

	const handleSubmit = async () => {
		setBusy(true);
		try {


			// normalize footer signatures
			const normHead = normalizeSig(headChefSign);
			const normVerified = normalizeSig(verifiedBySign);
			const normComplex = normalizeSig(complexManagerSign);
			// Normalize bakeTemp values and build layout hints for saved payload
			const normalizedRows = rows.map(r => {
				const copy = { ...r };
				if (copy.bakeTemp || copy.bakeTemp === 0) {
					let v = String(copy.bakeTemp).trim();
					if (!v) { copy.bakeTemp = ''; }
					else if (v.includes('°') || /\b°|c$|C$/.test(v)) { copy.bakeTemp = v; }
					else { copy.bakeTemp = `${v} °C`; }
				}
				return copy;
			});
			// normalize any per-row signatures
			normalizedRows.forEach(rr => {
				rr.mouldingSign = normalizeSig(rr.mouldingSign);
				rr.proofSign = normalizeSig(rr.proofSign);
			});

			const tableWidth = Object.values(dynamicWidths).reduce((s, v) => s + v, 0);
			// Ensure correctiveAction is present in metadata (some presentational
			// renderers read it from metadata.correctiveAction) and include a
			// legacy 'corrective' key for older consumers.
			const metadataWithCorrective = { ...meta, correctiveAction: meta.correctiveAction ?? '' };
			const payload = {
				formType: 'MouldingProofingBakingLog',
				templateVersion: 'v1.0',
				title: 'MOULDING PROOFING AND BAKING LOG SHEET',
				date: metadataWithCorrective.date,
				metadata: metadataWithCorrective,
				formData: normalizedRows,
				correctiveAction: metadataWithCorrective.correctiveAction,
				corrective: metadataWithCorrective.correctiveAction, // legacy alias
				headChefSign: normHead,
				verifiedBySign: normVerified,
				complexManagerSign: normComplex,
				assets: logoDataUri ? { logoDataUri } : {},
				layoutHints: dynamicWidths,
				_tableWidth: tableWidth,
				savedAt: Date.now()
			};
			const formId = `${payload.formType}_${Date.now()}`;
			try {
				await formStorage.saveForm(formId, payload);
			} catch (e) {
				try { await addFormHistory({ title: payload.title, date: payload.date, savedAt: payload.savedAt, meta: { metadata: meta, formData: rows } }); } catch (err) { /* ignore */ }
			}
			try { await removeDraft(DRAFT_KEY); } catch (e) {}
			setRows(initialRows);
			setMeta(initialMetadata);
			setHeadChefSign('');
			setVerifiedBySign('');
			setComplexManagerSign('');
			Alert.alert('Saved', 'Form saved');
		} catch (e) {
			Alert.alert('Error', 'Failed to save form');
		}
		setBusy(false);
	};

	const handleSaveDraft = async () => {
		setBusy(true);
		try {
			const rowsForDraft = rows.map(r => ({ ...r, mouldingSign: normalizeSig(r.mouldingSign), proofSign: normalizeSig(r.proofSign) }));
			const normHead = normalizeSig(headChefSign);
			const normVerified = normalizeSig(verifiedBySign);
			const normComplex = normalizeSig(complexManagerSign);
			await setDraft(DRAFT_KEY, { rows: rowsForDraft, meta, headChefSign: normHead, verifiedBySign: normVerified, complexManagerSign: normComplex });
			Alert.alert('Draft saved');
		} catch (e) { Alert.alert('Failed to save draft'); }
		setBusy(false);
	};

	const actionButtons = (
		<FormActionBar onBack={() => props.navigation?.navigate?.('Home')} onSaveDraft={handleSaveDraft} onSubmit={handleSubmit} showSavePdf={false} isSaving={busy} />
	);

	return (
		<EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft} actionButtons={actionButtons}>
			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				<View style={styles.metaBox}>
					<View style={styles.headerDocBox}>
						<Image source={require('../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
						<View style={{ flex: 1, paddingLeft: 8 }}>
							<Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
							<Text style={styles.headerSubject}>MOULDING PROOFING AND BAKING LOG SHEET</Text>
							<Text style={styles.smallNote}>Subject: MOULDING PROOFING AND BAKING LOG SHEET</Text>
						</View>
						<View style={styles.docBox}>
							<View style={styles.docRow}><Text style={styles.docLabel}>Issue Date:</Text><TextInput style={styles.docInput} value={meta.issueDate} onChangeText={t => setMetaField('issueDate', t)} /></View>
							<View style={styles.docRow}><Text style={styles.docLabel}>Revision Date:</Text><TextInput style={styles.docInput} value={meta.revisionDate} onChangeText={t => setMetaField('revisionDate', t)} /></View>
							<View style={styles.docRow}><Text style={styles.docLabel}>Location:</Text><TextInput style={styles.docInput} value={meta.location} onChangeText={t => setMetaField('location', t)} /></View>
						</View>
					</View>
					<View style={[styles.metaRow, { marginTop: 8 }]}>
						<View style={styles.metaItem}><Text style={styles.label}>Compiled By:</Text><TextInput style={styles.input} value={meta.compiledBy || 'Michael zulu'} onChangeText={t => setMetaField('compiledBy', t)} /></View>
						<View style={styles.metaItem}><Text style={styles.label}>Approved By:</Text><TextInput style={styles.input} value={meta.approvedBy || 'Hassani Ali'} onChangeText={t => setMetaField('approvedBy', t)} /></View>
					</View>
				</View>
				{/* Table: grouped header + rows — make horizontally scrollable when needed */}
				<ScrollView horizontal contentContainerStyle={{ minWidth: tableWidth }} style={{ borderWidth: 1, borderColor: '#e6eef2', borderRadius: 6, backgroundColor: '#fff' }}>
					<View style={{ minWidth: tableWidth }}>
						<View style={[styles.headerTopRow, { width: tableWidth }] }>
							<View style={[styles.headerGroup, { width: dynamicWidths.num }]}><Text style={styles.headerGroupText}>#</Text></View>
							<View style={[styles.headerGroup, { width: dynamicWidths.food }]}><Text style={styles.headerGroupText}>FOOD ITEM</Text></View>
							<View style={[styles.headerGroup, { width: dynamicWidths.mouldingTime + dynamicWidths.mouldingSign }]}><Text style={styles.headerGroupText}>MOULDING</Text></View>
							<View style={[styles.headerGroup, { width: dynamicWidths.proofTimeIn + dynamicWidths.proofTimeOut + dynamicWidths.proofSign }]}><Text style={styles.headerGroupText}>PROOFING</Text></View>
							<View style={[styles.headerGroup, { width: dynamicWidths.bakeTimeIn + dynamicWidths.bakeTemp + dynamicWidths.bakeTimeOut }]}><Text style={styles.headerGroupText}>BAKING TEMP (180°C - 300°C)</Text></View>
							<View style={[styles.headerGroup, { width: dynamicWidths.staff }]}><Text style={styles.headerGroupText}>STAFF'S NAME</Text></View>
						</View>

						<View style={[styles.headerSubRow, { width: tableWidth }] }>
							<View style={[styles.headerSubCell, { width: dynamicWidths.num }]}><Text style={styles.col}>#</Text></View>
							<View style={[styles.headerSubCell, { width: dynamicWidths.food }]}><Text style={styles.col}></Text></View>
							<View style={[styles.headerSubCell, { width: dynamicWidths.mouldingTime }]}><Text style={styles.col}>TIME</Text></View>
							<View style={[styles.headerSubCell, { width: dynamicWidths.mouldingSign }]}><Text style={styles.col}>SIGN</Text></View>
							<View style={[styles.headerSubCell, { width: dynamicWidths.proofTimeIn }]}><Text style={styles.col}>TIME IN</Text></View>
							<View style={[styles.headerSubCell, { width: dynamicWidths.proofTimeOut }]}><Text style={styles.col}>TIME OUT</Text></View>
							<View style={[styles.headerSubCell, { width: dynamicWidths.proofSign }]}><Text style={styles.col}>SIGN</Text></View>
							<View style={[styles.headerSubCell, { width: dynamicWidths.bakeTimeIn }]}><Text style={styles.col}>TIME IN</Text></View>
							<View style={[styles.headerSubCell, { width: dynamicWidths.bakeTemp }]}><Text style={styles.col}>TEMP</Text></View>
							<View style={[styles.headerSubCell, { width: dynamicWidths.bakeTimeOut }]}><Text style={styles.col}>TIME OUT</Text></View>
							<View style={[styles.headerSubCell, { width: dynamicWidths.staff }]}><Text style={styles.col}></Text></View>
						</View>

						{rows.map((r, idx) => (
							<View key={r.id} style={[styles.row, { width: tableWidth }]}>
								<View style={[styles.cell, { width: dynamicWidths.num, alignItems: 'center', justifyContent: 'center' }]}>
									<Text>{idx + 1}</Text>
								</View>
								<TextInput style={[styles.cell, { width: dynamicWidths.food }]} value={r.product} onChangeText={t => setRowField(r.id, 'product', t)} editable={editMode} />
								<TextInput style={[styles.cell, { width: dynamicWidths.mouldingTime }]} value={r.mouldingTime} onChangeText={t => setRowField(r.id, 'mouldingTime', t)} editable={editMode} />
																<View
																	style={[styles.cell, { width: dynamicWidths.mouldingSign, alignItems: 'center' }]}
																	onStartShouldSetResponder={() => true}
																	onResponderTerminationRequest={() => true}
																>
																		<SignatureField value={r.mouldingSign} onChange={v => setRowField(r.id, 'mouldingSign', v)} editable={true} width={Math.max(40, dynamicWidths.mouldingSign - 12)} height={36} />
																</View>
								<TextInput style={[styles.cell, { width: dynamicWidths.proofTimeIn }]} value={r.proofTimeIn} onChangeText={t => setRowField(r.id, 'proofTimeIn', t)} editable={editMode} />
								<TextInput style={[styles.cell, { width: dynamicWidths.proofTimeOut }]} value={r.proofTimeOut} onChangeText={t => setRowField(r.id, 'proofTimeOut', t)} editable={editMode} />
																<View
																	style={[styles.cell, { width: dynamicWidths.proofSign, alignItems: 'center' }]}
																	onStartShouldSetResponder={() => true}
																	onResponderTerminationRequest={() => true}
																>
																		<SignatureField value={r.proofSign} onChange={v => setRowField(r.id, 'proofSign', v)} editable={true} width={Math.max(40, dynamicWidths.proofSign - 12)} height={36} />
																</View>
								<TextInput style={[styles.cell, { width: dynamicWidths.bakeTimeIn }]} value={r.bakeTimeIn} onChangeText={t => setRowField(r.id, 'bakeTimeIn', t)} editable={editMode} />
								<View style={[styles.cell, { width: dynamicWidths.bakeTemp }]}> 
									<TextInput
										style={styles.innerTempInput}
										value={(r.bakeTemp && String(r.bakeTemp).replace(/\s*°\s*[cC]?\.?$/i, '')) || ''}
										onChangeText={t => setRowField(r.id, 'bakeTemp', String(t).replace(/\s*°\s*[cC]?\.?$/i, ''))}
										editable={editMode}
									/>
								</View>
								<TextInput style={[styles.cell, { width: dynamicWidths.bakeTimeOut }]} value={r.bakeTimeOut} onChangeText={t => setRowField(r.id, 'bakeTimeOut', t)} editable={editMode} />
								<TextInput style={[styles.cell, { width: dynamicWidths.staff }]} value={r.staffName} onChangeText={t => setRowField(r.id, 'staffName', t)} editable={editMode} />
								</View>
						))}
					</View>
				</ScrollView>

				{/* Footer: corrective action and signatures */}
				<View style={styles.footerContainer}>
					<View style={styles.footerField} onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => true}>
						<Text style={styles.footerLabel}>Head Chef/Baker Signature:</Text>
						<SignatureField value={headChefSign} onChange={setHeadChefSign} editable={true} width={320} height={64} />
					</View>
					<View style={styles.footerField}>
						<Text style={styles.footerLabel}>Corrective Action:</Text>
						<TextInput value={meta.correctiveAction} onChangeText={t => setMetaField('correctiveAction', t)} style={styles.correctiveInput} editable={editMode} multiline numberOfLines={3} />
					</View>
					<View style={styles.verificationRow}>
						<View style={{ flex: 1 }}>
														<Text style={styles.footerLabel}>Verified By:</Text>
														<View onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => true}>
															<SignatureField value={verifiedBySign} onChange={setVerifiedBySign} editable={true} width={280} height={64} />
														</View>
						</View>
						<View style={{ flex: 1, alignItems: 'flex-end' }}>
														<Text style={[styles.footerLabel, { textAlign: 'right' }]}>Complex Manager Signature</Text>
														<View onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => true}>
															<SignatureField value={complexManagerSign} onChange={setComplexManagerSign} editable={true} width={260} height={64} />
														</View>
						</View>
					</View>
				</View>

			</ScrollView>
		</EditableFormContainer>
	);
}

const styles = StyleSheet.create({
	content: { padding: 12, backgroundColor: '#f7fbfc' },
	metaBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 6, marginBottom: 12 },
	headerDocBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4, backgroundColor: '#fff' },
	companyName: { fontWeight: '800', color: '#185a9d' },
	headerSubject: { fontWeight: '800', fontSize: 14 },
	smallNote: { fontSize: 11, color: '#374151', marginTop: 4 },
	docBox: { width: 260, borderLeftWidth: 1, borderColor: '#eee', paddingLeft: 8 },
	docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
	docLabel: { fontWeight: '700', fontSize: 11, color: '#374151', width: 100 },
	docInput: { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 2, paddingHorizontal: 6, flex: 1 },
	title: { fontWeight: '800', fontSize: 14, textAlign: 'center', marginBottom: 8 },
	metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
	metaItem: { flex: 1, marginRight: 8 },
	label: { fontWeight: '700', fontSize: 12, marginBottom: 4 },
	input: { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 6, paddingHorizontal: 8 },
	headerTopRow: { flexDirection: 'row', backgroundColor: '#eef2ff', paddingVertical: 8, alignItems: 'center' },
	headerGroup: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 6 },
	headerGroupText: { fontWeight: '800' },
	headerSubRow: { flexDirection: 'row', backgroundColor: '#eef7ff', padding: 0, borderBottomWidth: 1, borderColor: '#dbeafe', marginBottom: 6 },
	headerSubCell: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 6, borderRightWidth: 1, borderColor: '#dbeafe' },
	col: { fontWeight: '700', textAlign: 'center' },
	row: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e6eef2', paddingVertical: 6, alignItems: 'center' },
	cell: { paddingHorizontal: 6, paddingVertical: 6, borderRightWidth: 1, borderColor: '#dbeafe' },
	innerTempInput: { paddingVertical: 6, paddingHorizontal: 6, borderWidth: 0, color: '#111' },
	logo: { width: 56, height: 44, marginRight: 10 },
	headerRowTop: { flexDirection: 'row', alignItems: 'center' },
	headerSpacer: { flex: 1 },
	footerContainer: { marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6 },
	footerField: { marginBottom: 10 },
	footerLabel: { fontWeight: '700', marginBottom: 6 },
	correctiveInput: { borderWidth: 1, borderColor: '#e6eef2', padding: 8, minHeight: 60, textAlignVertical: 'top', backgroundColor: '#fafafa' },
	verificationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }
});

