export const EXPENSE_TAGS = [
  { value: "food", label: "Food" },
  { value: "education", label: "Education" },
  { value: "office", label: "Office" },
  { value: "rent", label: "Rent" },
  { value: "transport", label: "Transport" },
  { value: "shopping", label: "Shopping" },
  { value: "utilities", label: "Utilities" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
];

export const INCOME_TAGS = [
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investment" },
  { value: "gift", label: "Gift" },
  { value: "other", label: "Other" },
];

export function expenseTagLabel(value) {
  const tag = EXPENSE_TAGS.find((t) => t.value === value);
  return tag ? tag.label : "Expense";
}

export function incomeTagLabel(value) {
  const tag = INCOME_TAGS.find((t) => t.value === value);
  return tag ? tag.label : "Income";
}