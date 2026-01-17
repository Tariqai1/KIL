// src/components/UrduEditor/config.js

// --- Constants ---
export const PIXELS_PER_MM = 3.7795275591; // approx 96 DPI

// --- Helper: Convert Millimeters to Pixels ---
export const mmToPx = (mm) => Math.round(mm * PIXELS_PER_MM);

// --- Default A4 Dimensions (Fallback) ---
export const A4_WIDTH_PX = mmToPx(210); // ~794px
export const A4_HEIGHT_PX = mmToPx(297); // ~1123px

// --- Font Families ---
export const FONTS = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Jameel Noori Nastaleeq (Urdu)', value: 'Jameel Noori Nastaleeq' },
  { label: 'Noto Nastaliq Urdu (Urdu)', value: 'Noto Nastaliq Urdu' },
  { label: 'Amiri (Arabic/Urdu)', value: 'Amiri' },
  { label: 'Lateef (Sindhi/Urdu)', value: 'Lateef' },
  { label: 'Scheherazade New (Arabic)', value: 'Scheherazade New' },
  { label: 'Noto Naskh Arabic', value: 'Noto Naskh Arabic' },
  { label: 'Calibri', value: 'Calibri' },
  { label: 'Courier New', value: 'Courier New' },
];

// --- Font Sizes ---
export const FONT_SIZES = [
  { label: '8', value: '1' },
  { label: '10', value: '2' },
  { label: '12', value: '3' },
  { label: '14', value: '4' },
  { label: '18', value: '5' },
  { label: '24', value: '6' },
  { label: '36', value: '7' },
];