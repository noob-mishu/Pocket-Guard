import dayjs from "./dayjs";
import { EXPENSE_TAGS, INCOME_TAGS } from "./tags";

const EXPENSE_TAG_SET = new Set(EXPENSE_TAGS.map((t) => t.value));
const INCOME_TAG_SET = new Set(INCOME_TAGS.map((t) => t.value));

const INCOME_VERBS =
  /\b(received|got|earned|income|salar(y|ies)|paid\s+me|cash\s*in|comes?\s*in|came\s+in|credited|deposited|refund(ed)?|cashback|cash\s*back|prize|winnings?|won|allowance|stipend|bonus|profit)\b/i;

const TAG_KEYWORDS = {
  food: /\b(lunch|food|dinner|breakfast|coffee|kfc|restaurant|pizza|burger|kabab|kebab|biryani|dosa|sandwich|grocery|groceries|snack|tiffin|eat|thai|chinese)\b/i,
  education: /\b(education|college|university|school|tuition|books?|course|certificate|exam|exams|classes|academic)\b/i,
  office: /\b(office|stationery|work|meeting|supplies|printer)\b/i,
  rent: /\b(rent|flat|house|apartment|hostel|landlord|lease|mortgage|deposit)\b/i,
  transport: /\b(transport|uber|pathao|bus|rickshaw|bike|cycl|petrol|fuel|ola|cab|taxi|trip|travel|auto|tuktuk|tuk|train|metro|launch|ferry|toll|parking)\b/i,
  shopping: /\b(shopping|market|amazon|clothes|shoes|electronics|gadget|gadgets|furniture|cosmetics)\b/i,
  utilities: /\b(utility|utilities|bill|electricity|electric|water|gas|internet|wifi|phone|recharge|energy|cable|broadband|data|meter|dth)\b/i,
  health: /\b(health|doctor|medicine|pharmacy|medical|hospital|clinic|dental|physio|therapy)\b/i,
  freelance: /\b(freelance|upwork|fiverr|gig|design|client)\b/i,
  investment: /\b(investment|stocks?|fund|mutual|bond|crypto)\b/i,
  gift: /\b(gift|present|birthday|wedding)\b/i,
};

const AMOUNT_RE = /([0-9][0-9,]*(?:\.[0-9]{1,2})?)/;

// Generic descriptors/stop words. Brand-like tokens (KFC, uber, amazon…)
// are intentionally NOT here so they survive as the transaction name.
const NAME_STOP_RE =
  /\b(lunch|dinner|breakfast|coffee|food|grocery|groceries|snack|eat|tea|tiffin|burger|pizza|kabab|kebab|biryani|dosa|sandwich|thai|chinese|shopping|market|clothes|shoes|electronics|gadget|gadgets|furniture|cosmetics|transport|bus|rickshaw|bike|cycle|cycling|petrol|fuel|cab|taxi|trip|travel|ticket|auto|tuktuk|tuk|train|metro|launch|ferry|toll|parking|bill|utilities|utility|electricity|electric|water|gas|internet|wifi|phone|recharge|energy|cable|broadband|data|meter|dth|rent|house|apartment|hostel|landlord|flat|lease|mortgage|deposit|education|college|university|school|tuition|books|book|course|certificate|exam|exams|classes|academic|office|stationery|work|meeting|supplies|printer|health|doctor|medicine|pharmacy|medical|hospital|clinic|dental|physio|therapy|salary|salaries|income|freelance|design|designs|client|investment|stocks|stock|fund|mutual|bond|crypto|gift|present|birthday|wedding|received|got|earned|paid|pay|paid\s+me|cash\s*(in|back)|cashback|credited|deposited|refund|refunded|prize|won|winnings|allowance|stipend|bonus|profit|monthly|last|month|my|a|an|the|of|with|at|on|to|this|that|and|much|some|bought|purchase|paid|before|yesterday|today|ago|week|weeks)\b/gi;

const DATE_EXPLICIT_RE = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/;

// "3 days ago", "2 weeks ago", "1 month ago"
const DATE_AGO_RE = /\b(\d+)\s+(day|days|week|weeks|month|months)\s+ago\b/i;

const MONTH_SHORT = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const MONTH_SRC =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember|t)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

// "Jan 5", "January 5", "Jan 5, 2026"
const NAMED_DATE_FWD_RE = new RegExp(
  `\\b(${MONTH_SRC})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:\\s*,?\\s+(20\\d{2}))?`,
  "i"
);

// "5 Jan", "5th January 2026"
const NAMED_DATE_REV_RE = new RegExp(
  `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_SRC})\\.?(?:\\s*,?\\s+(20\\d{2}))?\\b`,
  "i"
);

// Everything a user could phrase as "when" — stripped before amount parsing
// so year-like numbers or "Jan 5" don't get read as the transaction amount.
const DATE_PHRASE_RE = new RegExp(
  [
    "\\b(?:the\\s+)?day\\s+before\\s+yesterday\\b",
    "\\btoday\\b|\\byesterday\\b|\\blast\\s+night\\b|\\b(?:this\\s+)?(?:morning|afternoon|evening|tonight|midnight)\\b",
    DATE_AGO_RE.source,
    DATE_EXPLICIT_RE.source,
    NAMED_DATE_FWD_RE.source,
    NAMED_DATE_REV_RE.source,
  ].join("|"),
  "gi"
);

function buildNamedDate(monthToken, dayStr, yearStr) {
  const key = monthToken.toLowerCase().slice(0, 3);
  const day = parseInt(dayStr, 10);
  const year = yearStr ? parseInt(yearStr, 10) : dayjs().year();
  if (!MONTH_SHORT[key] || day < 1 || day > 31) return null;
  // customParseFormat is case-sensitive for month names ("jan" is invalid).
  const display = key.charAt(0).toUpperCase() + key.slice(1);
  const d = dayjs(`${display} ${day} ${year}`, "MMM D YYYY");
  if (!d.isValid()) return null;
  if (d.date() !== day || d.month() + 1 !== MONTH_SHORT[key]) return null;
  return d.format("YYYY-MM-DD");
}

function parseDate(text) {
  if (/(\btoday\b|this morning|this afternoon|this evening|tonight|midnight)/i.test(text)) {
    return dayjs().format("YYYY-MM-DD");
  }
  if (/\byesterday\b|\blast night\b|\b(?:the\s+)?day\s+before\s+yesterday\b/i.test(text)) {
    if (/\b(?:the\s+)?day\s+before\s+yesterday\b/i.test(text)) {
      return dayjs().subtract(2, "day").format("YYYY-MM-DD");
    }
    return dayjs().subtract(1, "day").format("YYYY-MM-DD");
  }
  const ago = text.match(DATE_AGO_RE);
  if (ago) {
    const count = parseInt(ago[1], 10);
    const unit = ago[2].startsWith("d")
      ? "day"
      : ago[2].startsWith("w")
      ? "week"
      : "month";
    return dayjs().subtract(count, unit).format("YYYY-MM-DD");
  }
  const explicit = text.match(DATE_EXPLICIT_RE);
  if (explicit) {
    const d = dayjs(`${explicit[1]}-${explicit[2]}-${explicit[3]}`);
    return d.isValid() ? d.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
  }
  const named =
    parseNamedDate(text) || parseNamedDateReversed(text);
  if (named) return named;
  return dayjs().format("YYYY-MM-DD");
}

function parseNamedDate(text) {
  const m = NAMED_DATE_FWD_RE.exec(text);
  if (!m) return null;
  return buildNamedDate(m[1], m[2], m[3]);
}

function parseNamedDateReversed(text) {
  const m = NAMED_DATE_REV_RE.exec(text);
  if (!m) return null;
  return buildNamedDate(m[2], m[1], m[3]);
}

function detectTag(text) {
  for (const [tag, regex] of Object.entries(TAG_KEYWORDS)) {
    if (regex.test(text)) return tag;
  }
  return null;
}

export function parseNaturalLanguage(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return { success: false };
  }

  const original = rawText.trim();
  if (!original) return { success: false };

  const date = parseDate(original);

  // Work from a copy with the date expression stripped so the year/amount
  // of an explicit date is not mistaken for the transaction amount.
  const text = original.replace(DATE_PHRASE_RE, " ");

  const amountMatch = text.match(AMOUNT_RE);
  if (!amountMatch) {
    return { success: false };
  }
  const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false };
  }

  const type = INCOME_VERBS.test(text) ? "income" : "expense";

  // Only ever map to tags that exist for the detected type, so the pre-filled
  // modal always has a matching option.
  let tag = detectTag(text);
  const validTags = type === "income" ? INCOME_TAG_SET : EXPENSE_TAG_SET;
  if (tag && !validTags.has(tag)) tag = null;
  if (!tag) tag = type === "income" ? "salary" : "food";

  let name = text
    .replace(AMOUNT_RE, " ")
    .replace(INCOME_VERBS, " ")
    .replace(NAME_STOP_RE, " ")
    .replace(/\s+/g, " ")
    .trim();

  const fallbackName =
    type === "income"
      ? tag === "salary"
        ? "Salary"
        : "Income"
      : "Expense";

  return {
    success: true,
    amount,
    type,
    tag,
    date,
    name: name || fallbackName,
  };
}