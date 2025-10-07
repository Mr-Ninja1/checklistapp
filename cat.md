import React, { useState, useMemo } from 'react';

// --- DATA STRUCTURE (BAKERY SECTION - AM SHIFT) ---
// UPDATED: Time slots now end at 16:00PM (11 total slots, from 06:00AM to 16:00PM)
const TIME_SLOTS = [
  '06:00AM', '07:00AM', '08:00AM', '09:00AM', '10:00AM', '11:00AM', 
  '12:00PM', '13:00PM', '14:00PM', '15:00PM', '16:00PM'
];
const EQUIPMENT_LIST = [
  'MIXING BOWL',
  'PRODUCTION TABLE',
  'FINISHED PRODUCT TBLE',
  'SLICING MACHINE',
  'DUMPING TABLE',
  'BREAD SHELF',
  'SCRAPER',
  'PASTRY TABLE',
];

const initialEquipmentState = EQUIPMENT_LIST.map((name, index) => {
  const times = TIME_SLOTS.reduce((acc, time) => {
    acc[time] = false;
    return acc;
  }, {});

  return {
    id: index,
    name,
    ppm: '',
    staffName: '',
    staffSign: '',
    supName: '',
    supSign: '',
    times,
  };
});

// --- REUSABLE COMPONENTS ---

/**
 * Custom Checkbox Component (using Tailwind classes for styling)
 */
const Checkbox = ({ checked, onPress }) => (
  <button
    onClick={onPress}
    type="button"
    className={`
      w-4 h-4 rounded-sm border border-gray-600 flex items-center justify-center transition duration-100
      ${checked ? 'bg-green-600 border-green-700 shadow-sm print:border-black print:bg-gray-400' : 'bg-white hover:bg-gray-100 print:bg-white print:border-black'}
    `}
    aria-checked={checked}
  >
    {checked && (
      <svg className="w-3 h-3 text-white print:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
      </svg>
    )}
  </button>
);

/**
 * Header Cell component for styling consistency.
 */
const HeaderCell = ({ children, className = '' }) => (
  <div className={`p-2 border-r border-gray-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-800 bg-gray-200 h-full ${className} print:border-black print:bg-gray-300 print:text-black`}>
    {children}
  </div>
);

/**
 * Data Cell component for styling consistency.
 */
const DataCell = ({ children, className = '' }) => (
  <div className={`p-1 border-r border-gray-300 flex-shrink-0 flex items-center justify-center h-full ${className} print:border-gray-500`}>
    {children}
  </div>
);

// --- MAIN APPLICATION COMPONENT ---

const SanitizingLogBakery = () => {
  const [formData, setFormData] = useState(initialEquipmentState);
  const [metadata, setMetadata] = useState({
    date: '03/08/2025',
    location: '',
    shift: 'AM',
    verifiedBy: '',
  });

  const handleMetadataChange = (key, value) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleInputChange = (id, field, value) => {
    setFormData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleTimeCheck = (id, timeSlot) => {
    setFormData(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, times: { ...item.times, [timeSlot]: !item.times[timeSlot] } }
          : item
      )
    );
  };

  // --- COLUMN WIDTH DEFINITIONS (Optimized for A4 Landscape) ---
  // Now 11 time slots.
  const COL_WIDTHS = useMemo(() => ({
    EQUIPMENT: 'w-[150px]', // 150px
    PPM: 'w-[100px]', // 100px
    TIME_SLOT: 'w-[50px]', // 50px * 11 = 550px
    STAFF_NAME: 'w-[110px]', // Increased slightly to use freed space
    SIGNATURE: 'w-[110px]',
    SUP_NAME: 'w-[110px]',
    SUP_SIGN: 'w-[110px]',
  }), []);

  // Calculate total width (150 + 100 + 550 + 110 + 110 + 110 + 110 = 1240px)
  const TOTAL_TABLE_WIDTH_PX = 1240; 

  // The main row rendering function
  const renderLogRow = (item) => (
    <div key={item.id} className="flex border-b border-gray-200 hover:bg-indigo-50/30 transition duration-150 bg-white print:border-gray-500" style={{ minWidth: `${TOTAL_TABLE_WIDTH_PX}px` }}>
      
      {/* Equipment Name (Left-aligned) */}
      <DataCell className={`${COL_WIDTHS.EQUIPMENT} justify-start pl-3 text-xs font-medium text-gray-700 print:text-black print:font-normal`}>
        {item.name}
      </DataCell>

      {/* SANITIZE R-VEG WASH (PPM) */}
      <DataCell className={COL_WIDTHS.PPM}>
        <input
          className="w-full text-xs text-center border border-gray-300 rounded-sm px-1 py-0.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 print:border-black print:border-b"
          type="number"
          onChange={(e) => handleInputChange(item.id, 'ppm', e.target.value)}
          value={item.ppm}
          placeholder="0"
        />
      </DataCell>

      {/* TIME INTERVAL CHECKBOXES (Crucial Alignment) */}
      <div className="flex border-l border-gray-300 print:border-gray-500">
        {TIME_SLOTS.map(time => (
          <DataCell key={time} className={`${COL_WIDTHS.TIME_SLOT} h-[34px]`}>
            {/* THIS IS THE CHECKBOX FOR THE TIME SLOT */}
            <Checkbox
              checked={item.times[time]}
              onPress={() => handleTimeCheck(item.id, time)}
            />
          </DataCell>
        ))}
      </div>

      {/* STAFF NAME */}
      <DataCell className={`${COL_WIDTHS.STAFF_NAME}`}>
        <input
          className="w-full text-xs text-center border-b border-gray-300 px-1 focus:border-indigo-500 focus:ring-0 print:border-black"
          type="text"
          onChange={(e) => handleInputChange(item.id, 'staffName', e.target.value)}
          value={item.staffName}
        />
      </DataCell>

      {/* STAFF SIGN */}
      <DataCell className={COL_WIDTHS.SIGNATURE}>
        <input
          className="w-full text-xs text-center border-b border-gray-300 px-1 focus:border-indigo-500 focus:ring-0 print:border-black"
          type="text"
          onChange={(e) => handleInputChange(item.id, 'staffSign', e.target.value)}
          value={item.staffSign}
        />
      </DataCell>

      {/* SUP NAME */}
      <DataCell className={COL_WIDTHS.SUP_NAME}>
        <input
          className="w-full text-xs text-center border-b border-gray-300 px-1 focus:border-indigo-500 focus:ring-0 print:border-black"
          type="text"
          onChange={(e) => handleInputChange(item.id, 'supName', e.target.value)}
          value={item.supName}
        />
      </DataCell>

      {/* SUP SIGN */}
      <DataCell className={`${COL_WIDTHS.SUP_SIGN} border-r-0`}>
        <input
          className="w-full text-xs text-center border-b border-gray-300 px-1 focus:border-indigo-500 focus:ring-0 print:border-black"
          type="text"
          onChange={(e) => handleInputChange(item.id, 'supSign', e.target.value)}
          value={item.supSign}
        />
      </DataCell>
    </div>
  );

  const tailwindConfigScript = {
    __html: `
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              inter: ['Arial', 'sans-serif'], 
            },
          },
        },
      };
    `,
  };


  return (
    <div className="p-4 bg-gray-50 min-h-screen font-inter print:p-0 print:bg-white print:min-h-0">
      {/* Load Tailwind CSS */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* FIX: Use dangerouslySetInnerHTML to properly inject script content and avoid JSX parsing conflict */}
      <script dangerouslySetInnerHTML={tailwindConfigScript} />
      
      {/* Print-specific CSS Stylesheet for A4-like formatting (Landscape) */}
      <style>
        {`
        @media print {
            /* Targeting A4 Landscape width (approx 297mm) */
            .print-container {
                width: 280mm !important; 
                margin: 0 auto !important;
                box-shadow: none !important;
                border: none !important;
                overflow: visible !important;
                padding: 0 !important;
            }
            /* Ensure the content is visible and does not break across pages badly */
            .print-header, .print-footer {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            /* Hide the horizontal scrollbar wrapper when printing */
            .overflow-x-auto {
                overflow-x: hidden !important;
            }
            /* Input fields should look like lines on paper */
            input {
                border-top: none !important;
                border-left: none !important;
                border-right: none !important;
                background-color: transparent !important;
                padding: 0 4px !important;
                box-shadow: none !important;
            }
            /* Checkboxes should appear as simple boxes */
            button[aria-checked] {
                border: 1px solid black !important;
                background-color: white !important;
                box-shadow: none !important;
            }
            /* Checked state for print */
            button[aria-checked="true"] {
                 /* Use a simple checkmark icon or darker background for checked */
                 background-color: #ddd !important;
            }
            button[aria-checked="true"] svg {
                 color: black !important;
            }
        }
        `}
      </style>

      <div className="max-w-full mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-gray-300 print-container">
        
        {/* Header Info */}
        <div className="p-4 border-b-4 border-gray-800 bg-indigo-50/50 print-header print:border-black print:bg-white print:p-2">
          <h1 className="text-sm md:text-lg font-extrabold text-center text-gray-900 uppercase tracking-wider mb-2 print:text-black print:text-base">
            FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET {" "} BAKERY SECTION
          </h1>
          
          {/* Metadata Row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs md:text-sm print:text-xs">
            {Object.keys(metadata).map(key => (
              <div key={key} className="flex items-center">
                <label className="font-semibold text-gray-700 capitalize mr-1 print:text-black">
                  {key.replace(/([A-Z])/g, ' $1')}:
                </label>
                <input
                  className="border-b border-gray-400 focus:border-indigo-600 focus:ring-0 px-1 py-0.5 text-gray-800 print:border-black print:font-normal"
                  type="text"
                  value={metadata[key]}
                  onChange={(e) => handleMetadataChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-bold text-green-700 bg-green-100 p-1 rounded-sm inline-block print:text-black print:bg-transparent print:font-normal print:border print:border-black">
            ✓ TICK AFTER CLEANING
          </p>
        </div>

        {/* Table Container - Horizontal Scroll */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${TOTAL_TABLE_WIDTH_PX}px` }}>
            {/* Table Header Row */}
            <div className="flex border-b-2 border-gray-700 bg-gray-300 font-bold uppercase text-center h-12 sticky top-0 print:border-black print:bg-gray-200">
              
              {/* Main Columns */}
              <HeaderCell className={COL_WIDTHS.EQUIPMENT}>
                EQUIPMENT
              </HeaderCell>
              <HeaderCell className={COL_WIDTHS.PPM}>
                SANITIZE R-VEG WASH (200PPM)
              </HeaderCell>

              {/* TIME INTERVAL HEADER */}
              <div className="flex flex-col border-l border-gray-700 print:border-black">
                <div className="p-1 border-b border-gray-700 flex items-center justify-center text-[10px] h-6 bg-gray-400 print:border-black print:bg-gray-300 print:text-black">
                  TIME INTERVAL
                </div>
                <div className="flex">
                  {TIME_SLOTS.map((time, index) => (
                    <HeaderCell key={index} className={`${COL_WIDTHS.TIME_SLOT} !h-6 !text-[9px] !p-1 bg-gray-200 print:border-black print:bg-white print:text-black`}>
                      {/* Remove AM/PM for cleaner header display */}
                      {time.replace(/([A-Z])/g, '')}
                    </HeaderCell>
                  ))}
                </div>
              </div>
              
              {/* Right Side Columns */}
              <HeaderCell className={COL_WIDTHS.STAFF_NAME}>STAFF NAME</HeaderCell>
              <HeaderCell className={COL_WIDTHS.SIGNATURE}>STAFF SIGN</HeaderCell>
              <HeaderCell className={COL_WIDTHS.SUP_NAME}>SUP NAME</HeaderCell>
              <HeaderCell className={`${COL_WIDTHS.SUP_SIGN} border-r-0`}>SUP SIGN</HeaderCell>
            </div>

            {/* Table Body */}
            {formData.map(renderLogRow)}
          </div>
        </div>

        {/* Footer Instruction */}
        <div className="p-4 border-t border-gray-300 bg-gray-50 print-footer print:border-black print:bg-white">
          <p className="text-xs text-gray-600 italic text-center print:text-black print:font-normal">
            Instruction: All food handlers are required to clean and sanitize the equipment used every after use.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SanitizingLogBakery;
