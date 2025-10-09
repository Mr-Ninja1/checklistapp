import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// --- Mock utility functions (adapted for web environment) ---
// NOTE: In a real environment, these would be calls to Firebase Firestore or a local storage wrapper.
const getDraft = async () => null;
const setDraft = async (key, data) => console.log('Draft saved:', key, data);
const removeDraft = async () => console.log('Draft removed');
const addFormHistory = async (data) => console.log('Form submitted:', data);
const showAlert = (title, message) => alert(`${title}: ${message}`);
// ----------------------------------------------------

const DRAFT_KEY = 'walkin_freezer_log_draft';
const TOTAL_DAYS = 31;
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];

// Initial state for the 31 daily records
const initialLogState = Array.from({ length: TOTAL_DAYS }, (_, index) => ({
  day: index + 1,
  // Each slot now includes Temp, Time, and Sign, as requested for maximum detail.
  Morning: { temp: '', time: '', sign: '' },
  Afternoon: { temp: '', time: '', sign: '' },
  Evening: { temp: '', time: '', sign: '' },
  correctiveAction: '', // 'If temperature is out of specification, what was done about it?'
  supNameSign: '',
}));

// Initial metadata for the Walk-In Freezer Temperature Log Sheet 
const initialMetadata = { 
    docNo: 'BBN-SHEQ-KN-SOP-6.8.10b', // Document number for freezer log
    issueDate: '05/08/2025', 
    revisionDate: 'N/A', 
    compiledBy: 'Michael Zulu C.', 
    approvedBy: 'Hassani Ali', 
    versionNo: '01', 
    revNo: '00', 
    month: '', 
    year: '', 
    location: '', 
    hseqManagerSign: '',
    complexManagerSign: '',
};

/**
 * Custom hook to manage debounced saving and loading
 */
const useFormState = (initialState, initialMeta) => {
  const [formData, setFormData] = useState(initialState);
  const [metadata, setMetadata] = useState(initialMeta);
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);

  // Load Draft
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(DRAFT_KEY);
        if (d && mounted) {
          if (d.formData) setFormData(d.formData);
          if (d.metadata) setMetadata(d.metadata);
        }
      } catch (e) { console.warn('load draft failed', e); }
    })();
    return () => { mounted = false; };
  }, []);

  // Auto-Save Draft
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { formData, metadata }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);
  
  return { formData, setFormData, metadata, setMetadata, busy, setBusy };
};

/**
 * Component for a single record slot (Temp taken, Time taken, Staff sign)
 */
const TempRecordSlot = React.memo(({ day, slotName, record, handleRecordChange, colWidths }) => {
    return (
        <div className={`flex flex-row items-stretch border-r border-gray-400`} style={{ width: colWidths.RECORD_SLOT_WIDTH }}>
            {/* Temp taken */}
            <input 
                type="text"
                value={record.temp} 
                onChange={e => handleRecordChange(day, slotName, 'temp', e.target.value)} 
                placeholder="°C" 
                className="w-1/3 text-center text-[10px] p-1 focus:outline-none bg-transparent border-r border-gray-400"
                maxLength={4} 
            />
            {/* Time taken */}
            <input 
                type="text"
                value={record.time} 
                onChange={e => handleRecordChange(day, slotName, 'time', e.target.value)} 
                placeholder="hh:mm" 
                className="w-1/3 text-center text-[10px] p-1 focus:outline-none bg-transparent border-r border-gray-400"
                maxLength={5} 
            />
            {/* Staff Sign */}
            <input 
                type="text"
                value={record.sign} 
                onChange={e => handleRecordChange(day, slotName, 'sign', e.target.value)} 
                placeholder="Initials" 
                className="w-1/3 text-center text-[10px] p-1 focus:outline-none bg-transparent"
                maxLength={5} 
            />
        </div>
    );
});


export default function WalkInFreezerLog() {
  const { formData, setFormData, metadata, setMetadata, busy, setBusy } = useFormState(initialLogState, initialMetadata);

  // Handle cell data change for log records
  const handleRecordChange = useCallback((day, slotName, field, value) => {
    setFormData(prev => prev.map(item => {
      if (item.day === day) {
        return { ...item, [slotName]: { ...item[slotName], [field]: value } };
      }
      return item;
    }));
  }, [setFormData]);
  
  // Handle change for corrective action and supervisor sign
  const handleDailyChange = useCallback((day, field, value) => {
    setFormData(prev => prev.map(item => {
      if (item.day === day) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  }, [setFormData]);

  const handleMetadataChange = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Walk-In Freezer Log', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, formData } });
      await removeDraft(DRAFT_KEY);
      showAlert('Success', 'Log submitted');
      // Reset form fields
      setFormData(initialLogState);
      setMetadata(prev => ({ 
        ...initialMetadata,
        docNo: prev.docNo, // Keep static data
        issueDate: prev.issueDate,
        revisionDate: prev.revisionDate,
        compiledBy: prev.compiledBy,
        approvedBy: prev.approvedBy,
        versionNo: prev.versionNo,
        revNo: prev.revNo,
      }));
    } catch (e) { showAlert('Error', 'Submission failed'); }
    finally { setBusy(false); }
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try { await setDraft(DRAFT_KEY, { formData, metadata }); showAlert('Success', 'Draft saved'); }
    catch (e) { showAlert('Error', 'Failed to save draft'); }
    finally { setBusy(false); }
  };

  // Define widths (for fixed column structure)
  const COL_WIDTHS = useMemo(() => ({ 
      DATE: 40, 
      ACTION: 250, 
      SIGNATURE: 150, 
      RECORD_SLOT_WIDTH: 225, // 75px each for Temp/Time/Sign (3 * 75)
  }), []);
  
  const TABLE_MIN_WIDTH = COL_WIDTHS.DATE + (TIME_SLOTS.length * COL_WIDTHS.RECORD_SLOT_WIDTH) + COL_WIDTHS.ACTION + COL_WIDTHS.SIGNATURE;

  const renderRow = item => {
    const rowClass = "flex flex-row border-b border-gray-300 bg-white min-h-[30px] items-stretch";
    const cellClass = "flex justify-center items-center border-r border-gray-400 p-1 text-xs text-gray-800 min-h-[30px]";

    return (
      <div key={item.day} className={rowClass}>
        {/* Day No */}
        <div className={`${cellClass} justify-center font-medium flex-shrink-0`} style={{ width: COL_WIDTHS.DATE }}>
          <p>{item.day}st</p>
        </div>
        
        {/* Morning, Afternoon, Evening Records */}
        {TIME_SLOTS.map(slot => (
            <TempRecordSlot
                key={slot}
                day={item.day}
                slotName={slot}
                record={item[slot]}
                handleRecordChange={handleRecordChange}
                colWidths={COL_WIDTHS}
            />
        ))}

        {/* Corrective Action */}
        <div className={`${cellClass} justify-start flex-shrink-0`} style={{ width: COL_WIDTHS.ACTION }}>
          <input 
              type="text"
              value={item.correctiveAction} 
              onChange={e => handleDailyChange(item.day, 'correctiveAction', e.target.value)} 
              placeholder="Action taken..." 
              className="w-full text-left text-[10px] p-1 focus:outline-none bg-transparent"
          />
        </div>

        {/* Sup Name & Sign */}
        <div className={`${cellClass} justify-center flex-1 min-w-[${COL_WIDTHS.SIGNATURE}px] border-r-0`}>
          <input 
              type="text"
              value={item.supNameSign} 
              onChange={e => handleDailyChange(item.day, 'supNameSign', e.target.value)} 
              placeholder="Name & Sign" 
              className="w-full text-center text-xs p-1 focus:outline-none bg-transparent"
          />
        </div>
      </div>
    );
  };

  // Helper function to render a single metadata label/value cell (Non-Editable)
  const renderMetaCell = (label, value, extraClass = '') => (
    <div className={`flex flex-row py-1 px-1 items-center ${extraClass}`}>
      <p className="text-[9px] font-semibold text-gray-800 mr-1 flex-shrink-0 whitespace-nowrap">{label}:</p>
      <p className="text-[9px] text-gray-700 flex-1 min-w-[30px] truncate">{value}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-gray-100 font-[Inter] overflow-y-auto">
      <div className="p-2 sm:p-4 min-h-full">
        <div className="bg-white rounded-lg p-4 mb-5 border border-gray-800 shadow-xl max-w-6xl mx-auto">
          
          {/* HEADER SECTION */}
          <div className="border border-gray-800 mb-4 rounded-md overflow-hidden">
            
            {/* Logo and Document Info Row (Top Right) */}
            <div className="flex justify-between items-stretch border-b border-gray-800">
              <div className="flex items-center flex-3 py-1 px-2">
                {/* Logo Placeholder */}
                <div className="w-10 h-10 mr-2 bg-gray-300 rounded-md border border-gray-500 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    LOGO
                </div>
                <div className="flex-1 justify-center">
                    <p className="text-xs font-bold text-gray-800">[BRAVO BRANDS LIMITED]</p>
                    <p className="text-[10px] text-gray-700">Food Safety Management System</p>
                </div>
              </div>
              
              <div className="flex flex-col flex-2 border-l border-gray-800 divide-y divide-gray-300">
                {renderMetaCell('Doc No', metadata.docNo)}
                {renderMetaCell('Issue Date', metadata.issueDate)}
                {renderMetaCell('Revision Date', metadata.revisionDate)}
              </div>
              <div className="flex flex-col justify-center items-center flex-1 border-l border-gray-800">
                <p className="text-[10px] text-center font-bold text-gray-800">Page 1 of 1</p>
              </div>
            </div>

            {/* Subject Row */}
            <div className="py-2 border-b border-gray-800 bg-gray-50">
                <p className="text-sm font-extrabold text-gray-800 text-center uppercase">Subject: WALK-IN FREEZER TEMPERATURE LOG SHEET</p>
            </div>

            {/* Signature Row */}
            <div className="flex divide-x divide-gray-800 border-b border-gray-800 min-h-[30px]">
                {renderMetaCell('Compiled By', metadata.compiledBy, 'flex-2')}
                {renderMetaCell('Approved By', metadata.approvedBy, 'flex-2')}
                {renderMetaCell('Version No', metadata.versionNo, 'flex-1')}
                {renderMetaCell('Rev no', metadata.revNo, 'flex-1 border-r-0')}
            </div>
            
            {/* Month, Year, Location Inputs */}
            <div className="flex flex-wrap items-center justify-between p-2 border-b border-gray-800 bg-white">
                <div className="flex items-center w-full sm:w-1/3 p-1">
                    <p className="text-sm font-semibold text-gray-800 mr-2 whitespace-nowrap">Month:</p>
                    <input 
                        type="text"
                        value={metadata.month} 
                        onChange={e => handleMetadataChange('month', e.target.value)} 
                        className="flex-1 border-b border-gray-500 text-sm p-1 focus:outline-none bg-transparent" 
                        placeholder="................................."
                    />
                </div>
                <div className="flex items-center w-full sm:w-1/3 p-1">
                    <p className="text-sm font-semibold text-gray-800 mr-2 whitespace-nowrap">Year:</p>
                    <input 
                        type="text"
                        value={metadata.year} 
                        onChange={e => handleMetadataChange('year', e.target.value)} 
                        className="flex-1 border-b border-gray-500 text-sm p-1 focus:outline-none bg-transparent" 
                        placeholder="................................."
                    />
                </div>
                <div className="flex items-center w-full sm:w-1/3 p-1">
                    <p className="text-sm font-semibold text-gray-800 mr-2 whitespace-nowrap">Location:</p>
                    <input 
                        type="text"
                        value={metadata.location} 
                        onChange={e => handleMetadataChange('location', e.target.value)} 
                        className="flex-1 border-b border-gray-500 text-sm p-1 focus:outline-none bg-transparent" 
                        placeholder="................................."
                    />
                </div>
            </div>

            {/* Instruction Row (CORRECTED) */}
            <div className="py-2 border-b border-gray-800 bg-yellow-50">
                <p className="text-sm font-extrabold text-red-700 text-center">Instruction: The temperature of the Walk-in Freezer should be less than $$-12^\circ C$$.</p>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="overflow-x-auto rounded-md border border-gray-800">
            <div style={{ minWidth: `${TABLE_MIN_WIDTH}px` }}>
              
              {/* Table Header Row */}
              <div className="flex flex-row bg-gray-200 border-b-2 border-gray-800 font-bold text-gray-800 text-center items-stretch">
                
                {/* Column 1: Date */}
                <div className="flex flex-col justify-center items-center text-[10px] p-1 border-r border-gray-800" style={{ width: COL_WIDTHS.DATE }}>
                    Date
                </div>
                
                {/* Column 2, 3, 4: Morning, Afternoon, Evening */}
                {TIME_SLOTS.map(slot => (
                    <div key={slot} className="flex flex-col border-r border-gray-800" style={{ width: COL_WIDTHS.RECORD_SLOT_WIDTH }}>
                        <p className="text-xs p-1 border-b border-gray-800">{slot}</p>
                        <div className="flex flex-row items-stretch">
                            <div className="flex justify-center items-center text-[10px] p-1 border-r border-gray-800 w-1/3">
                                Temp taken
                            </div>
                            <div className="flex justify-center items-center text-[10px] p-1 border-r border-gray-800 w-1/3">
                                Time taken
                            </div>
                            <div className="flex justify-center items-center text-[10px] p-1 w-1/3">
                                Staff sign
                            </div>
                        </div>
                    </div>
                ))}

                {/* Corrective Action */}
                <div className="flex flex-col justify-center items-center text-xs p-1 border-r border-gray-800" style={{ width: COL_WIDTHS.ACTION }}>
                  If temperature is out of specification, what was done about it?
                </div>

                {/* Sup Name & Sign */}
                <div className="flex justify-center items-center text-xs p-1 flex-1 min-w-[${COL_WIDTHS.SIGNATURE}px]">
                  Sup Name &amp; Sign
                </div>
              </div>
              
              {/* Render Log Items */}
              {formData.map(renderRow)}
            </div>
          </div>

          {/* FOOTER - Signatures */}
          <div className="py-4 mt-4 border-t border-gray-800">
            <div className="flex flex-col space-y-4">
              
              {/* Verified by: HSEQ Manager */}
              <div className="p-2 border border-gray-400 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-700 mr-4 whitespace-nowrap">Verified by: HSEQ Manager Sign:</p>
                  <input 
                      type="text"
                      value={metadata.hseqManagerSign} 
                      onChange={e => handleMetadataChange('hseqManagerSign', e.target.value)} 
                      className="flex-1 border-b border-gray-500 text-base p-1 focus:outline-none bg-transparent" 
                      placeholder="........................................."
                  />
                </div>
              </div>
              
              {/* Verified by: Complex Manager */}
              <div className="p-2 border border-gray-400 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-700 mr-4 whitespace-nowrap">Complex Manager Sign:</p>
                  <input 
                      type="text"
                      value={metadata.complexManagerSign} 
                      onChange={e => handleMetadataChange('complexManagerSign', e.target.value)} 
                      className="flex-1 border-b border-gray-500 text-base p-1 focus:outline-none bg-transparent" 
                      placeholder="........................................."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end pt-4 space-x-3">
            <button 
                onClick={handleSaveDraft} 
                className="w-32 py-2 px-4 rounded-lg bg-yellow-500 text-white font-semibold shadow-md hover:bg-yellow-600 transition disabled:opacity-50 flex items-center justify-center" 
                disabled={busy}
            >
                {busy ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    'Save Draft'
                )}
            </button>
            <button 
                onClick={handleSubmit} 
                className="w-32 py-2 px-4 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center" 
                disabled={busy}
            >
                {busy ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    'Submit Log'
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
