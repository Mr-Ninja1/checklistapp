// Helper to normalize temperature strings to include °C when unit missing
export default function formatTemp(v) {
  try {
    if (v === null || v === undefined) return '';
    const s = String(v).trim();
    if (s === '') return '';
    // If already contains a degree sign or letter C/F, assume unit present
    if (s.includes('°') || /\bC\b|\bF\b|c\b|f\b/i.test(s) || /[CFcf]$/.test(s)) return s;
    // Common case: numeric value (integer or decimal)
    if (/^-?\d+(?:\.\d+)?$/.test(s)) return `${s}°C`;
    // If contains letters like 'C' or 'c' somewhere, leave as-is
    if (/[A-Za-z]/.test(s)) return s;
    // Fallback: append °C
    return `${s}°C`;
  } catch (e) {
    return String(v || '');
  }
}
