import dayjs from "./dayjs";

const PROVIDER_PATTERNS = [
  { provider: "bKash", regex: /bKash/i },
  { provider: "Nagad", regex: /nagad/i },
  { provider: "Rocket", regex: /rocket/i },
];

// SMS from BD wallets rarely name the provider. Cue on the TrxID/Ref prefix
// (Nagad uses NX…, Rocket uses RK…) and fall back to bKash (the most common).
function detectProvider(text) {
  for (const { provider, regex } of PROVIDER_PATTERNS) {
    if (regex.test(text)) return provider;
  }
  const idMatch = text.match(
    /\b(?:trxid|trx|tid|ref)[\s:]*([A-Za-z0-9]{4,})/i
  );
  if (idMatch) {
    const id = idMatch[1].toUpperCase();
    if (id.startsWith("NX") || id.includes("NAGAD")) return "Nagad";
    if (id.startsWith("RK")) return "Rocket";
  }
  // Nagad messages carry a timestamp ("at 10:00 AM"); bKash ends with "Balance: Tk".
  if (/:\d{2}\s*(?:AM|PM)/i.test(text)) return "Nagad";
  return "bKash";
}

const INCOME_KEYWORDS = [
  /received/i,
  /credited/i,
  /cash in/i,
  /cashin/i,
  /refund/i,
  /money received/i,
];

const EXPENSE_KEYWORDS = [
  /payment/i,
  /paid/i,
  /cash out/i,
  /cashout/i,
  /debited/i,
  /sent money/i,
  /charged/i,
  /bill pay/i,
  /purchase/i,
];

const AMOUNT_RE = /Tk\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;

// TrxID is the canonical reference; "Ref" is only a fallback.
const TRX_RE = /\b(?:trxid|trx|tid)\s*[:#]?\s*([A-Za-z0-9]{4,})/i;
const REF_RE = /\bref\s*[:#]?\s*([A-Za-z0-9]{4,})/i;

// Merchant/agent name after "from"/"to". Token-only so punctuation and
// trailing boilerplate ("successful …", "on 2024-03-01 …") don't leak in.
function extractName(slice) {
  const match = slice.match(
    /\b(?:from|to)\s+([A-Za-z0-9][A-Za-z0-9&'/-]*(?: [A-Za-z0-9&'/-]+)*)/i
  );
  if (!match) return null;
  let name = match[1].trim();
  name = name.replace(/\s+(?:successful|successfully|at|on)\b.*$/i, "");
  return name || null;
}

function firstKeywordMatch(text) {
  for (const regex of INCOME_KEYWORDS) {
    const match = text.match(regex);
    if (match) return { type: "income", index: match.index };
  }
  for (const regex of EXPENSE_KEYWORDS) {
    const match = text.match(regex);
    if (match) return { type: "expense", index: match.index };
  }
  return null;
}

export function parseSms(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return { success: false };
  }

  const text = rawText.trim();

  const provider = detectProvider(text);

  const keyword = firstKeywordMatch(text);
  if (!keyword) {
    return { success: false };
  }

  // Parse the amount/name/txId AFTER the action keyword so secondary
  // "Balance: Tk ..." figures are not mistaken for the transaction amount.
  const slice = text.slice(keyword.index);

  const amountMatch = slice.match(AMOUNT_RE);
  if (!amountMatch) {
    return { success: false };
  }
  const amount = parseFloat(amountMatch[1].replace(/,/g, ""));

  const name = extractName(slice) || provider;

  const trxMatch = slice.match(TRX_RE) || slice.match(REF_RE);
  const trxId = trxMatch ? trxMatch[1] : undefined;

  return {
    success: true,
    provider,
    amount,
    type: keyword.type,
    name,
    trxId,
    date: dayjs().format("YYYY-MM-DD"),
  };
}