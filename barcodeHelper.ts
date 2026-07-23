// Normalizes a barcode/ID string so that Persian and Arabic-Indic digits,
// stray whitespace, and invisible bidi marks never cause two identical
// barcodes to be treated as different products.
export function normalizeBarcode(input: string): string {
  if (!input) return '';

  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

  let result = '';
  for (const ch of input) {
    const pIndex = persianDigits.indexOf(ch);
    if (pIndex !== -1) {
      result += String(pIndex);
      continue;
    }
    const aIndex = arabicDigits.indexOf(ch);
    if (aIndex !== -1) {
      result += String(aIndex);
      continue;
    }
    result += ch;
  }

  // Strip invisible bidi control characters (RLM, LRM, ZWNJ, ZWJ) that
  // mobile/Windows Persian keyboards sometimes insert silently.
  result = result.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '');

  return result.trim();
}
