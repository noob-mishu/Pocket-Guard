// Pure helpers for receipt OCR results (no tesseract dependency here, so the
// extraction logic is easily unit-testable).
const TOTAL_RE =
  /\b(?:total|amount|amt|due|payable|grand\s*total|balance)\b[^\d\n]{0,20}(?:Tk|BDT|৳|Rs\.?|₹)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;

const CURRENCY_AMOUNT_RE = /(?:Tk|BDT|৳|Rs\.?|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;

export function extractTotal(text) {
  if (!text) return null;

  let match;
  let candidates = [];
  TOTAL_RE.lastIndex = 0;
  while ((match = TOTAL_RE.exec(text)) !== null) {
    candidates.push(parseFloat(match[1].replace(/,/g, "")));
  }

  if (candidates.length > 0) {
    return Math.max(...candidates);
  }

  CURRENCY_AMOUNT_RE.lastIndex = 0;
  candidates = [];
  while ((match = CURRENCY_AMOUNT_RE.exec(text)) !== null) {
    candidates.push(parseFloat(match[1].replace(/,/g, "")));
  }
  return candidates.length > 0 ? Math.max(...candidates) : null;
}

const MERCHANT_STOP_WORDS =
  /\b(total|amount|amt|due|payable|grand|balance|subtotal|tax|vat|cash|change|thank|save|invoice|receipt|phone|mobile|order|tel|bill|item|items)\b/i;

export function extractMerchant(text) {
  if (!text) return null;
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1);

  const seen = [];
  for (const line of lines) {
    const isAmountish =
      /(?:Tk|BDT|৳|Rs\.?)\s*\d|\d+\.\d{2}\b|\b(?:total|subtotal|amount|amt|due|payable|balance|tax|vat|item|items)\b/i.test(
        line
      );
    if (isAmountish) continue;
    if (MERCHANT_STOP_WORDS.test(line)) continue;
    if (line.length > 40) continue;
    seen.push(line);
  }

  return seen.length > 0 ? seen[0].replace(/[^A-Za-z0-9 .,&'/-]/g, "").slice(0, 60) : null;
}