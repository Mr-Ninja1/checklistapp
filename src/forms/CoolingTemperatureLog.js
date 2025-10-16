import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// --- Global Constants ---
const DRAFT_KEY = 'cooling_temperature_log_draft';
const TOTAL_ROWS = 20;
const RECORD_COUNT = 3;
const RECORD_COLUMNS = ['Time', 'Temp', 'Sign'];

// Initial state for the 20 food item records
const initialLogState = Array.from({ length: TOTAL_ROWS }, (_, index) => ({
  id: index + 1,
  foodItem: '',
  timeIntoCoolingUnit: '', // 'Time into Fridge/Display/Chiller/Deep Freezer/Room/Freezer Room'
  records: [
    { time: '', temp: '', sign: '' }, // 1st Record
    { time: '', temp: '', sign: '' }, // 2nd Record
    { time: '', temp: '', sign: '' }, // 3rd Record
  ],
  staffName: '',
}));

// Initial metadata for the Temperature Record for Cooling
const initialMetadata = {
  docNo: 'BBN-SHEQ-TRC-1.1',
  issueDate: '31/08/25',
  revisionDate: 'N/A',
  compiledBy: '.',
  approvedBy: '',
  versionNo: '',
  revNo: '00',
  date: '',
  chefSignature: '',
  correctiveAction: '',
  complexManager: ''
};

// --- Mock utility functions (adapted for web environment) ---
// Note: In a real app, these would use a database like Firestore.
const getDraft = async () => {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch (e) {
    console.warn('Error loading draft from localStorage:', e);
    return null;
  }
};
const setDraft = async (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log('Draft saved successfully:', key, data);
  } catch (e) {
    console.error('Error saving draft to localStorage:', e);
  }
};
const removeDraft = async () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
    console.log('Draft removed successfully.');
  } catch (e) {
    console.error('Error removing draft to localStorage:', e);
  }
};
const addFormHistory = async (data) => {
  console.log('Form submitted:', data);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
};
// ----------------------------------------------------


/**
 * Custom hook to manage debounced saving and loading
 */
const useFormState = (initialState, initialMeta, showAlert) => {
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
          showAlert('Draft Loaded', 'A previously saved draft was loaded successfully.');
        }
      } catch (e) { console.warn('load draft failed', e); }
    })();
    return () => { mounted = false; };
  }, [showAlert]);

  // Auto-Save Draft
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // Debounce save to prevent excessive calls
    saveTimer.current = setTimeout(() => {
      setDraft(DRAFT_KEY, { formData, metadata });
    }, 1500); // Increased debounce time for better performance
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

  return { formData, setFormData, metadata, setMetadata, busy, setBusy };
};

/**
 * Custom Alert/Message Modal to replace browser alerts
 */
const MessageModal = ({ title, message, onClose, type = 'success' }) => {
  if (!message) return null;

  // Use emoji fallbacks instead of external icon package to avoid bundler issues
  const IconEmoji = type === 'error' ? '⚠️' : '✅';
  const colorClass = type === 'error' ? 'bg-red-500' : 'bg-green-500';

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-start justify-center p-4 pt-10">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full transform transition-all overflow-hidden">
        <div className={`p-4 flex items-center ${colorClass} text-white`}>
          <span className="mr-3 text-2xl" aria-hidden>{IconEmoji}</span>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700 mb-4">{message}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


/**
 * Memoized component for stability, handles inputs for a single record slot (Time, Temp, Sign).
 */
const RecordSlot = React.memo(({ rowIndex, recordIndex, record, handleRecordChange, colWidths }) => {
  const fieldClass = "w-1/3 text-center text-[10px] p-1 h-full focus:outline-none bg-transparent";
  return (
    <div className={`flex flex-row items-stretch border-r border-gray-400`} style={{ width: colWidths.RECORD_SLOT_WIDTH }}>
      {/* Time (W/3) */}
      <input
        type="text"
        value={record.time}
        onChange={e => handleRecordChange(rowIndex, recordIndex, 'time', e.target.value)}
        placeholder="00:00"
        className={`${fieldClass} border-r border-gray-400`}
        maxLength={5}
      />
      {/* Temp (W/3) - Updated placeholder for clarity */}
      <input
        type="text"
        value={record.temp}
        onChange={e => handleRecordChange(rowIndex, recordIndex, 'temp', e.target.value)}
        placeholder="0-10°C"
        className={`${fieldClass} border-r border-gray-400`}
        maxLength={4}
      />
      {/* Sign (W/3) */}
      <input
        type="text"
        value={record.sign}
        onChange={e => handleRecordChange(rowIndex, recordIndex, 'sign', e.target.value)}
        placeholder="Initials"
        className={`${fieldClass}`} // last item in slot, no right border
        maxLength={5}
      />
    </div>
  );
});

// Helper function to get the correct ordinal suffix for the record header
const getRecordOrdinal = (index) => {
  const num = index + 1;
  if (num === 1) return '1st';
  if (num === 2) return '2nd';
  if (num === 3) return '3rd';
  return `${num}th`;
};


export default function CoolingTemperatureLog() {
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertType, setAlertType] = useState('success');

  const showAlert = useCallback((title, message, type = 'success') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
  }, []);

  const { formData, setFormData, metadata, setMetadata, busy, setBusy } = useFormState(initialLogState, initialMetadata, showAlert);

  // Handle cell data change for log records
  const handleRecordChange = useCallback((rowIndex, recordIndex, field, value) => {
    setFormData(prev => prev.map(item => {
      if (item.id === rowIndex) {
        const newRecords = [...item.records];
        newRecords[recordIndex] = { ...newRecords[recordIndex], [field]: value };
        return { ...item, records: newRecords };
      }
      return item;
    }));
  }, [setFormData]);

  // Handle change for general row inputs (Food Item, Time Into, Staff Name)
  const handleItemChange = useCallback((rowIndex, field, value) => {
    setFormData(prev => prev.map(item => {
      if (item.id === rowIndex) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  }, [setFormData]);

  const handleMetadataChange = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Cooling Temperature Log', date: metadata.date || new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, formData } });
      await removeDraft(DRAFT_KEY);
      showAlert('Success', 'Log submitted successfully and draft removed.', 'success');
      // Reset form fields
      setFormData(initialLogState);
      setMetadata(prev => ({
        ...initialMetadata,
        // Keep static data derived from the initial state
        docNo: prev.docNo,
        issueDate: prev.issueDate,
        revisionDate: prev.revisionDate,
        compiledBy: prev.compiledBy,
        approvedBy: prev.approvedBy,
        versionNo: prev.versionNo,
        revNo: prev.revNo,
        date: '', // Clear date
      }));
    } catch (e) {
      showAlert('Error', 'Submission failed. Please check the console for details.', 'error');
      console.error(e);
    }
    finally { setBusy(false); }
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      // Auto-save logic handles the actual setDraft, this button just triggers a quick confirmation
      await setDraft(DRAFT_KEY, { formData, metadata });
      showAlert('Success', 'Draft saved manually!', 'success');
    }
    catch (e) { showAlert('Error', 'Failed to save draft.', 'error'); }
    finally { setBusy(false); }
  };

  // Define widths (using fixed pixel values to maintain table structure, crucial for forms)
  const COL_WIDTHS = useMemo(() => ({
    ITEM_NO: 40,
    FOOD_ITEM: 200,
    TIME_INTO: 150,
    RECORD_SLOT_WIDTH: 150, // 50px each for Time/Temp/Sign
    STAFF_NAME: 150,
  }), []);

  // Calculate minimum total table width for horizontal scrolling on small screens
  const TABLE_MIN_WIDTH = COL_WIDTHS.ITEM_NO + COL_WIDTHS.FOOD_ITEM + COL_WIDTHS.TIME_INTO +
                          (RECORD_COUNT * COL_WIDTHS.RECORD_SLOT_WIDTH) + COL_WIDTHS.STAFF_NAME;

  const renderRow = item => {
    const rowClass = "flex flex-row border-b border-gray-300 bg-white min-h-[30px] items-stretch";
    const cellClass = "flex justify-center items-center border-r border-gray-400 p-1 text-xs text-gray-800 min-h-[30px]";

    return (
      <div key={item.id} className={rowClass}>
        {/* Item No */}
        <div className={`${cellClass} justify-center font-medium flex-shrink-0`} style={{ width: COL_WIDTHS.ITEM_NO }}>
          <p>{item.id}</p>
        </div>

        {/* Food Item */}
        <div className={`${cellClass} justify-start flex-shrink-0 p-0`} style={{ width: COL_WIDTHS.FOOD_ITEM }}>
          <input
            type="text"
            value={item.foodItem}
            onChange={e => handleItemChange(item.id, 'foodItem', e.target.value)}
            placeholder="E.g., Chicken Soup"
            className="w-full h-full text-left text-xs px-2 py-1 focus:outline-none bg-transparent"
          />
        </div>

        {/* Time Into Cooling Unit */}
        <div className={`${cellClass} justify-center flex-shrink-0 p-0`} style={{ width: COL_WIDTHS.TIME_INTO }}>
          <input
            type="text"
            value={item.timeIntoCoolingUnit}
            onChange={e => handleItemChange(item.id, 'timeIntoCoolingUnit', e.target.value)}
            placeholder="00:00 / Location"
            className="w-full h-full text-center text-xs p-1 focus:outline-none bg-transparent"
          />
        </div>

        {/* 1st, 2nd, 3rd Record Columns */}
        {item.records.map((record, index) => (
          <RecordSlot
            key={index}
            rowIndex={item.id}
            recordIndex={index}
            record={record}
            handleRecordChange={handleRecordChange}
            colWidths={COL_WIDTHS}
          />
        ))}

        {/* Staff's Name */}
        <div className={`${cellClass} justify-center flex-1 border-r-0 p-0`} style={{ minWidth: `${COL_WIDTHS.STAFF_NAME}px` }}>
          <input
            type="text"
            value={item.staffName}
            onChange={e => handleItemChange(item.id, 'staffName', e.target.value)}
            placeholder="Name"
            className="w-full h-full text-center text-xs p-1 focus:outline-none bg-transparent"
          />
        </div>
      </div>
    );
  };

  // Helper function to render a single metadata label/value cell (Non-Editable)
  const renderMetaCell = (label, value, extraClass = '') => (
    <div className={`flex flex-row py-1 px-2 items-center ${extraClass}`}>
      <p className="text-[9px] font-semibold text-gray-800 mr-1 flex-shrink-0 whitespace-nowrap">{label}:</p>
      <p className="text-[9px] text-gray-700 flex-1 min-w-[30px] truncate">{value}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-gray-100 font-[Inter] overflow-y-auto">
      <div className="p-2 sm:p-4 min-h-full">
        <div className="bg-white rounded-xl p-4 mb-5 border border-gray-800 shadow-xl max-w-6xl mx-auto">

          {/* HEADER SECTION */}
          <div className="border border-gray-800 mb-4 rounded-lg overflow-hidden">

            {/* Logo and Document Info Row (Top Right) */}
            <div className="flex justify-between items-stretch border-b border-gray-800">
              <div className="flex items-center flex-3 py-1 px-2">
                {/* Actual Logo Image */}
                <div className="w-10 h-10 mr-2 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-800 rounded-md">
                  <img src="image_eba023.jpeg" alt="Food Safety Checkmark Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 justify-center">
                  <p className="text-xs font-bold text-gray-800">Bravo! Food Safety Management System</p>
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
              <p className="text-sm font-extrabold text-gray-800 text-center uppercase">Subject: TEMPERATURE RECORD FOR COOLING</p>
            </div>

            {/* Signature Row */}
            <div className="flex divide-x divide-gray-800 border-b border-gray-800 min-h-[30px]">
              {renderMetaCell('Compiled By', metadata.compiledBy, 'flex-2')}
              {renderMetaCell('Approved By', metadata.approvedBy, 'flex-2')}
              {renderMetaCell('Version No', metadata.versionNo, 'flex-1')}
              {renderMetaCell('Rev no', metadata.revNo, 'flex-1 border-r-0')}
            </div>

            {/* Cooling Temperature Log Title */}
            <div className="py-2 border-b border-gray-800 bg-gray-100">
              <p className="text-base font-extrabold text-gray-900 text-center uppercase">COOLING TEMPERATURE LOG</p>
            </div>

            {/* Date Input */}
            <div className="flex justify-end p-2 border-b border-gray-800 bg-white">
              <div className="flex items-center">
                <p className="text-sm font-semibold text-gray-800 mr-2 whitespace-nowrap">DATE:</p>
                <input
                  type="date"
                  value={metadata.date}
                  onChange={e => handleMetadataChange('date', e.target.value)}
                  className="border border-gray-300 text-sm p-1 h-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <div style={{ minWidth: `${TABLE_MIN_WIDTH}px` }}>

              {/* Table Header Row */}
              <div className="flex flex-row bg-gray-200 border-b-2 border-gray-800 font-bold text-gray-800 text-center items-stretch">

                {/* Column 1: Probe Thermometer Log Title */}
                <div className="flex flex-col border-r border-gray-800" style={{ width: COL_WIDTHS.ITEM_NO + COL_WIDTHS.FOOD_ITEM + COL_WIDTHS.TIME_INTO }}>
                  <p className="text-xs p-1 border-b border-gray-800 font-extrabold">PROBE THERMOMETER TEMPERATURE LOG FOR COOLING FOOD</p>
                  <div className="flex flex-row items-stretch">
                    {/* 1.1 Item No */}
                    <div className="flex justify-center items-center text-[10px] p-1 border-r border-gray-800" style={{ width: COL_WIDTHS.ITEM_NO }}>#</div>
                    {/* 1.2 Food Item */}
                    <div className="flex flex-col justify-center items-center text-xs p-1 border-r border-gray-800" style={{ width: COL_WIDTHS.FOOD_ITEM }}>
                      <p>FOOD ITEM</p>
                      <p className='font-normal text-[10px]'>COOLING ($$10^\circ C$$ within 2 hours)</p>
                    </div>
                    {/* 1.3 Time Into Cooling Unit */}
                    <div className="flex justify-center items-center text-[10px] p-1" style={{ width: COL_WIDTHS.TIME_INTO }}>
                      Time into Fridge/Display/Chiller/Deep Freezer/Room/Freezer Room
                    </div>
                  </div>
                </div>

                {/* Column 2, 3, 4: 1st, 2nd, 3rd Records - Fixed Ordinal Suffix */}
                {Array.from({ length: RECORD_COUNT }).map((_, recordIndex) => (
                  <div key={recordIndex} className="flex flex-col border-r border-gray-800" style={{ width: COL_WIDTHS.RECORD_SLOT_WIDTH }}>
                    <p className="text-xs p-1 border-b border-gray-800">{getRecordOrdinal(recordIndex)} RECORD</p>
                    <div className="flex flex-row items-stretch">
                      {RECORD_COLUMNS.map(label => (
                        <div key={label} className="flex justify-center items-center text-[10px] p-1 border-r border-gray-800 last:border-r-0 w-1/3">
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Column 5: Staff's Name */}
                <div className="flex justify-center items-center text-xs p-1 flex-1" style={{ minWidth: `${COL_WIDTHS.STAFF_NAME}px` }}>
                  STAFF'S NAME
                </div>
              </div>

              {/* Render Log Items */}
              {formData.map(renderRow)}
            </div>
          </div>

          {/* FOOTER - Signatures and Corrective Action */}
          <div className="py-4 mt-4 border-t border-gray-800">
            <div className="flex flex-col space-y-4">

              {/* CHEF Signature */}
              <div className="p-2 border border-gray-400 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-700 mr-4 whitespace-nowrap">CHEF Signature:</p>
                  <input
                    type="text"
                    value={metadata.chefSignature}
                    onChange={e => handleMetadataChange('chefSignature', e.target.value)}
                    className="flex-1 border-b border-gray-500 text-base p-1 focus:outline-none bg-transparent rounded-none"
                    placeholder="........................................."
                  />
                </div>
              </div>

              {/* Corrective Action */}
              <div className="p-2 border border-gray-400 bg-gray-50 rounded-md">
                <p className="text-sm font-bold text-gray-800 mb-2">Corrective Action:</p>
                <textarea
                  rows="3"
                  value={metadata.correctiveAction}
                  onChange={e => handleMetadataChange('correctiveAction', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Enter any necessary corrective actions here..."
                ></textarea>
              </div>

              {/* Verified by: Complex Manager */}
              <div className="p-2 border border-gray-400 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-700 mr-4 whitespace-nowrap">Verified by: Complex Manager:</p>
                  <input
                    type="text"
                    value={metadata.complexManager}
                    onChange={e => handleMetadataChange('complexManager', e.target.value)}
                    className="flex-1 border-b border-gray-500 text-base p-1 focus:outline-none bg-transparent rounded-none"
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
              {busy && alertTitle === 'Draft saved' ? (
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
              {busy && alertTitle !== 'Draft saved' ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                'Submit Log'
              )}
            </button>
          </div>
        </div>
      </div>
      <MessageModal
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => { setAlertMessage(null); setAlertTitle(null); }}
      />
    </div>
  );
}
