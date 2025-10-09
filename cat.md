import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// --- Mock utility functions (adapted for web environment) ---
// Note: In a real app, these would be linked to Firestore/API calls.
const getDraft = async () => null;
const setDraft = async (key, data) => console.log('Draft saved:', key, data);
const removeDraft = async () => console.log('Draft removed');
const addFormHistory = async (data) => console.log('Form submitted:', data);

// Use standard window alert for notifications
const showAlert = (title, message) => alert(`${title}: ${message}`);
// ----------------------------------------------------

const DRAFT_KEY = 'dry_storage_checklist_draft';

// Standardized day list
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Checklist items defined from the uploaded image
// Items with a frequency string are simple; items with a frequency number require that many checks per week.
const DRY_STORAGE_LIST = [
  { name: 'Door', frequency: '2', isItem: true }, // Numerical frequency (2 times per week)
  { name: 'Door handle', frequency: 'Daily', isItem: true },
  { name: 'Shelves', frequency: '3', isItem: true }, // Numerical frequency (3 times per week)
  { name: 'Hard to reach floors & skirting', frequency: '3', isItem: true }, // Numerical frequency (3 times per week)
  { name: 'Walls', frequency: '2', isItem: true }, // Numerical frequency (2 times per week)
  { name: 'Ceiling', frequency: '1', isItem: true }, // Numerical frequency (1 time per week)
  { name: 'Lights', frequency: '1', isItem: true }, // Numerical frequency (1 time per week)
  { name: 'Floor', frequency: 'Daily', isItem: true },
  { name: 'Food containers', frequency: 'After use', isItem: true },
];

const initialCleaningState = DRY_STORAGE_LIST.filter(i => i.isItem).map((item, index) => {
  // Determine how many slots/checks are needed for this item across the week.
  const slotsNeeded = isNaN(parseInt(item.frequency)) ? WEEK_DAYS.length : parseInt(item.frequency);
  
  // We'll use 7 slots for all items for consistent UI, but logic can track usage if needed.
  const checks = WEEK_DAYS.reduce((acc, day) => {
    acc[day] = { checked: false, cleanedBy: '' };
    return acc;
  }, {});
  
  return { 
    id: index, 
    name: item.name, 
    frequencyText: item.frequency + (isNaN(parseInt(item.frequency)) ? '' : ' (Per Week)'), // Display original text + (Per Week) if numeric
    frequencyValue: item.frequency,
    checks: checks, // Uses the 7-day structure
    slotsNeeded: slotsNeeded // Metadata about how many checks are required
  };
});

// Initial metadata for the Dry Storage Checklist
const initialMetadata = { 
    location: 'WAREHOUSE AREA', 
    week: '', 
    month: '', 
    year: '', 
    docNo: 'BBN-SHEQ-P-16-R-11f', // Updated Doc No.
    issueDate: '03/03/2025', 
    revisionDate: 'N/A', 
    compiledBy: 'Michael Zulu C.', 
    approvedBy: 'Hassani Ali', 
    versionNo: '01', 
    revNo: '00', 
    hseqManager: '' 
};

const Checkbox = ({ checked, onClick }) => (
  <button
    onClick={onClick}
    className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-colors 
      ${checked ? 'border-green-500 bg-green-500' : 'border-gray-500 bg-white'}`}
    aria-checked={checked}
    type="button"
  >
    {checked && <span className="text-white text-xs font-bold leading-none">✓</span>}
  </button>
);

/**
 * Memoized component for stability, handles individual Checkbox and Cleaned By inputs.
 */
const CleaningCell = React.memo(({ item, day, colWidths, handleCellChange, canInteract }) => {
    // Tailwind classes used for layout and borders
    const dayGroupClass = `flex flex-row border-r border-gray-400 min-h-[30px]`;
    
    return (
        <div key={day} className={dayGroupClass} style={{ width: colWidths.DAY_GROUP_WIDTH }}>
            {/* Checkbox */}
            <div className={`flex items-center justify-center p-1 border-r-0`} style={{ width: colWidths.CHECK }}>
                <Checkbox 
                    checked={item.checks[day].checked} 
                    onClick={() => canInteract && handleCellChange(item.id, day, 'checked')} 
                />
            </div>
            {/* Input for Cleaned By */}
            <div className={`flex-1 flex items-center justify-center border-l border-gray-400 px-1`}>
                <input 
                    type="text"
                    value={item.checks[day].cleanedBy} 
                    onChange={e => canInteract && handleCellChange(item.id, day, 'cleanedBy', e.target.value)} 
                    placeholder="Name" 
                    className="w-full text-center text-xs p-1 h-7 focus:outline-none bg-transparent"
                    maxLength={12} 
                    disabled={!canInteract}
                />
            </div>
        </div>
    );
});


export default function DryStorageChecklist() {
  const [formData, setFormData] = useState(initialCleaningState);
  const [metadata, setMetadata] = useState(initialMetadata);
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
    // Debounce state save
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { formData, metadata }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

  // Handle cell data change (Checkbox or Input)
  const handleCellChange = useCallback((id, day, type, value) => {
    setFormData(prev => prev.map(item => {
      if (item.id === id) {
        const newChecks = { ...item.checks };
        if (type === 'checked') {
          newChecks[day].checked = !newChecks[day].checked;
          // If unchecking, clear name
          if (!newChecks[day].checked) newChecks[day].cleanedBy = '';
        } else if (type === 'cleanedBy') {
          newChecks[day].cleanedBy = value;
          // If entering name, check the box
          if (value.trim() !== '') newChecks[day].checked = true;
        }
        return { ...item, checks: newChecks };
      }
      return item;
    }));
  }, []);

  const handleMetadataChange = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Dry Storage Area Cleaning Checklist', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, formData } });
      await removeDraft(DRAFT_KEY);
      showAlert('Success', 'Checklist submitted');
      // Reset form fields
      setFormData(initialCleaningState);
      setMetadata(prev => ({ 
        ...prev, 
        week: '', 
        month: '', 
        year: '', 
        hseqManager: '' 
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

  // Define widths (using pixels for predictable table layout)
  const COL_WIDTHS = useMemo(() => ({ 
      AREA: 260, 
      FREQUENCY: 150, 
      DAY_GROUP_WIDTH: 140, 
      CHECK: 40, 
  }), []);
  
  // Calculate total table width for horizontal scrolling
  const TABLE_WIDTH = COL_WIDTHS.AREA + COL_WIDTHS.FREQUENCY + (WEEK_DAYS.length * COL_WIDTHS.DAY_GROUP_WIDTH);

  const renderRow = rowItem => {
    // Find the current state data for this item (for ID/checks)
    const stateItem = formData.find(i => i.name === rowItem.name);
    // Use fallback if somehow state is not initialized
    const item = stateItem || { id: `fallback-${rowItem.name}`, name: rowItem.name, frequencyText: rowItem.frequencyText, checks: WEEK_DAYS.reduce((a, d) => { a[d] = { checked: false, cleanedBy: '' }; return a; }, {}) };
    const canInteract = !!stateItem; // Only interact if the item exists in the state array

    // Base row classes
    const rowClass = "flex flex-row border-b border-gray-300 bg-white min-h-[30px] items-stretch";
    // Base cell classes
    const cellClass = "flex justify-center items-center border-r border-gray-400 p-1 text-xs text-gray-800 min-h-[30px]";

    return (
      <div key={item.id} className={rowClass}>
        {/* Area to be cleaned */}
        <div className={`${cellClass} justify-start font-medium`} style={{ width: COL_WIDTHS.AREA }}>
          <p>{item.name}</p>
        </div>
        
        {/* Frequency */}
        <div className={`${cellClass}`} style={{ width: COL_WIDTHS.FREQUENCY }}>
          <p>{item.frequencyText || item.frequencyValue}</p>
        </div>
        
        {/* Day Check/Cleaned By Columns */}
        {WEEK_DAYS.map(day => (
            <CleaningCell
                key={`${item.id}-${day}`}
                item={item}
                day={day}
                colWidths={COL_WIDTHS}
                handleCellChange={handleCellChange}
                canInteract={canInteract}
            />
        ))}
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

  // Helper function for editable metadata (Input)
  const renderMetaInput = (label, key, placeholder = '', flexClass = 'flex-1') => (
    <div className={`flex flex-row items-center py-1 px-2 border-r border-gray-700 last:border-r-0 ${flexClass}`}>
      <p className="text-xs font-semibold text-gray-800 mr-1 flex-shrink-0 whitespace-nowrap">{label}</p>
      <input 
        type="text"
        value={metadata[key]} 
        onChange={e => handleMetadataChange(key, e.target.value)} 
        className="flex-1 border-b border-gray-500 text-sm p-0.5 h-6 focus:outline-none bg-transparent" 
        placeholder={placeholder}
      />
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
                <p className="text-sm font-extrabold text-gray-800 text-center uppercase">Subject: DRY STORAGE AREA CLEANING CHECKLIST</p>
            </div>

            {/* Signature Row */}
            <div className="flex divide-x divide-gray-800 border-b border-gray-800 min-h-[30px]">
                {renderMetaCell('Compiled By', metadata.compiledBy, 'flex-2')}
                {renderMetaCell('Approved By', metadata.approvedBy, 'flex-2')}
                {renderMetaCell('Version No', metadata.versionNo, 'flex-1')}
                {renderMetaCell('Rev no', metadata.revNo, 'flex-1 border-r-0')}
            </div>

            {/* Location/Date Input Row */}
            <div className="flex border-b border-gray-800 bg-gray-100">
                {renderMetaInput('LOCATION', 'location', 'WAREHOUSE AREA', 'flex-2')}
                {renderMetaInput('WEEK', 'week', 'Week #', 'flex-1')}
                {renderMetaInput('MONTH', 'month', 'Month', 'flex-1')}
                <div className="flex flex-row items-center py-1 px-2 flex-1">
                    <p className="text-xs font-semibold text-gray-800 mr-1 flex-shrink-0 whitespace-nowrap">YEAR:</p>
                    <input 
                        type="text"
                        value={metadata.year} 
                        onChange={e => handleMetadataChange('year', e.target.value)} 
                        className="flex-1 border-b border-gray-500 text-sm p-0.5 h-6 focus:outline-none bg-transparent" 
                        placeholder="YYYY"
                    />
                </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="overflow-x-auto rounded-md border border-gray-800">
            <div style={{ width: TABLE_WIDTH }}>
              {/* Table Header Row */}
              <div className="flex flex-row bg-gray-200 border-b-2 border-gray-800 font-bold text-gray-800 text-center min-h-[40px] items-stretch">
                {/* Area and Frequency Headers */}
                <div className="flex justify-center items-center border-r border-gray-800 text-xs p-1" style={{ width: COL_WIDTHS.AREA }}>
                  Area to be cleaned
                </div>
                {/* Frequency Header adapted to show (Per Week) */}
                <div className="flex flex-col justify-center items-center border-r border-gray-800 text-xs p-1" style={{ width: COL_WIDTHS.FREQUENCY }}>
                  <p>Frequency</p>
                  <p className='font-normal text-[10px]'>(Per Week)</p>
                </div>
                
                {/* Day Columns */}
                {WEEK_DAYS.map(day => (
                  <div key={day} className="flex flex-row border-r border-gray-800" style={{ width: COL_WIDTHS.DAY_GROUP_WIDTH }}>
                    {/* Day Name (Check) */}
                    <div className="flex justify-center items-center bg-gray-300 text-[10px] p-1 border-b border-gray-800" style={{ width: COL_WIDTHS.CHECK }}>
                      {day}
                    </div>
                    {/* Cleaned By Header */}
                    <div className="flex justify-center items-center text-xs p-1 border-l border-gray-800 border-b border-gray-800 flex-1">
                      Cleaned BY
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Render Checklist Items */}
              {initialCleaningState.map(renderRow)}
            </div>
          </div>

          {/* VERIFICATION FOOTER */}
          <div className="py-4 mt-4 border-t border-gray-800">
            <div className="p-2 border border-gray-400 bg-gray-50 rounded-md">
              <p className="text-sm font-bold text-gray-800 mb-2">Verified by:</p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <p className="text-sm font-medium text-gray-700 sm:mr-4 mb-2 sm:mb-0 whitespace-nowrap">HSEQ Manager:</p>
                <div className="flex-1 min-w-[200px] sm:min-w-0">
                    <input 
                        type="text"
                        value={metadata.hseqManager} 
                        onChange={e => handleMetadataChange('hseqManager', e.target.value)} 
                        className="w-full border-b border-gray-500 text-base p-1 focus:outline-none bg-transparent" 
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
                    'Submit Checklist'
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
