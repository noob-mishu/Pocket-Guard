import { extractTotal, extractMerchant } from "./receiptExtractor";

const RECEIPT = `
KFC Dhaka  Store #123
KFC Fried Chicken     Tk 450.00
Pepsi                  Tk  60.00
Subtotal               Tk 510.00
VAT 5%                 Tk  25.50
TOTAL                  Tk 535.50
Thank you for visiting
`;

describe("receiptExtractor", () => {
  it("extracts the largest total amount", () => {
    expect(extractTotal(RECEIPT)).toBe(535.5);
  });

  it("extracts totals with commas", () => {
    expect(extractTotal("GRAND TOTAL           Tk 1,250.75")).toBe(1250.75);
  });

  it("falls back to currency-prefixed numbers when no total keyword exists", () => {
    expect(extractTotal("Paid: Tk 100.00\nEnjoy!")).toBe(100);
  });

  it("extracts the merchant from the first non-amount line", () => {
    expect(extractMerchant(RECEIPT)).toContain("KFC");
  });

  it("skips amount-like lines when finding the merchant", () => {
    const text = "SuperMart\nItems total 500.00\nThanks";
    expect(extractMerchant(text)).toBe("SuperMart");
  });

  it("returns null for empty text", () => {
    expect(extractTotal(null)).toBe(null);
    expect(extractMerchant("")).toBe(null);
  });
});