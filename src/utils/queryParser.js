import dayjs from "./dayjs";
import { EXPENSE_TAGS } from "./tags";

const CATEGORY_PATTERNS = [
  { value: "food", regex: /\bfood|lunch|dinner|eat|restaurant|grocery\b/i },
  { value: "transport", regex: /\btransport|uber|pathao|bus|fuel|petrol|travel\b/i },
  { value: "rent", regex: /\brent|house|home\b/i },
  { value: "shopping", regex: /\bshopping|clothes|market|\bbuy\b/i },
  { value: "utilities", regex: /\butilities?|bill|electric|internet\b/i },
  { value: "education", regex: /\beducation|school|university|tuition\b/i },
];

export function parseRange(text) {
  if (/\btoday\b/.test(text)) {
    return { from: dayjs().format("YYYY-MM-DD"), to: dayjs().format("YYYY-MM-DD") };
  }
  if (/\byesterday\b/.test(text)) {
    const from = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    return { from, to: from };
  }
  if (/\blast week\b/.test(text)) {
    const from = dayjs().subtract(1, "week").startOf("week");
    const to = dayjs().subtract(1, "week").endOf("week");
    return { from: from.format("YYYY-MM-DD"), to: to.format("YYYY-MM-DD") };
  }
  if (/\bthis week\b|\bweek\b/.test(text)) {
    const from = dayjs().startOf("week");
    const to = dayjs().endOf("week");
    return { from: from.format("YYYY-MM-DD"), to: to.format("YYYY-MM-DD") };
  }
  if (/\blast month\b/.test(text)) {
    const from = dayjs().subtract(1, "month").startOf("month");
    const to = dayjs().subtract(1, "month").endOf("month");
    return { from: from.format("YYYY-MM-DD"), to: to.format("YYYY-MM-DD") };
  }
  if (/\bthis year\b/.test(text)) {
    const from = dayjs().startOf("year");
    const to = dayjs().endOf("year");
    return { from: from.format("YYYY-MM-DD"), to: to.format("YYYY-MM-DD") };
  }
  const from = dayjs().startOf("month");
  const to = dayjs().endOf("month");
  return { from: from.format("YYYY-MM-DD"), to: to.format("YYYY-MM-DD") };
}

function detectCategories(text) {
  const found = [];
  for (const { value, regex } of CATEGORY_PATTERNS) {
    if (regex.test(text)) found.push(value);
  }
  return found;
}

export function parseQuery(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return { intent: "unknown" };
  }
  const text = rawText.trim().toLowerCase();
  const range = parseRange(text);
  const categories = detectCategories(text);

  if (/\bvs\b|compare|versus/.test(text)) {
    return { intent: "compare", range, categories };
  }
  if (/biggest|largest|top\b/.test(text)) {
    return { intent: "biggest", range, categories };
  }
  if (/spend|spent|total|sum|how much|cost|paid/.test(text)) {
    return { intent: "spending", range, categories };
  }
  if (/average|avg/.test(text)) {
    return { intent: "average", range, categories };
  }
  return { intent: "unknown", range, categories };
}

export const CATEGORY_LABELS = Object.fromEntries(
  EXPENSE_TAGS.map((t) => [t.value, t.label])
);