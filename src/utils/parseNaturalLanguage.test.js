import dayjs from "./dayjs";
import { parseNaturalLanguage } from "./parseNaturalLanguage";

describe("parseNaturalLanguage", () => {
  it("parses '500 lunch at KFC yesterday'", () => {
    const result = parseNaturalLanguage("500 lunch at KFC yesterday");
    expect(result.success).toBe(true);
    expect(result.amount).toBe(500);
    expect(result.type).toBe("expense");
    expect(result.tag).toBe("food");
    expect(result.date).toBe(dayjs().subtract(1, "day").format("YYYY-MM-DD"));
    expect(result.name).toBe("KFC");
  });

  it("parses 'received 2000 salary today' as income", () => {
    const result = parseNaturalLanguage("received 2000 salary today");
    expect(result.success).toBe(true);
    expect(result.amount).toBe(2000);
    expect(result.type).toBe("income");
    expect(result.tag).toBe("salary");
    expect(result.date).toBe(dayjs().format("YYYY-MM-DD"));
  });

  it("parses '3 days ago' relative dates", () => {
    const result = parseNaturalLanguage("400 uber ride 3 days ago");
    expect(result.success).toBe(true);
    expect(result.amount).toBe(400);
    expect(result.type).toBe("expense");
    expect(result.tag).toBe("transport");
    expect(result.date).toBe(dayjs().subtract(3, "days").format("YYYY-MM-DD"));
  });

  it("parses '2 weeks ago' relative dates", () => {
    const result = parseNaturalLanguage("900 groceries 2 weeks ago");
    expect(result.success).toBe(true);
    expect(result.amount).toBe(900);
    expect(result.date).toBe(dayjs().subtract(2, "weeks").format("YYYY-MM-DD"));
  });

  it("parses 'the day before yesterday'", () => {
    const result = parseNaturalLanguage("200 groceries the day before yesterday");
    expect(result.success).toBe(true);
    expect(result.amount).toBe(200);
    expect(result.tag).toBe("food");
    expect(result.date).toBe(dayjs().subtract(2, "days").format("YYYY-MM-DD"));
  });

  it("parses explicit YYYY-MM-DD dates", () => {
    const result = parseNaturalLanguage("1200 rent 2026-09-01");
    expect(result.success).toBe(true);
    expect(result.amount).toBe(1200);
    expect(result.tag).toBe("rent");
    expect(result.date).toBe("2026-09-01");
  });

  it("parses month-first dates like 'on Jan 5'", () => {
    const result = parseNaturalLanguage("400 uber ride on Jan 5");
    expect(result.success).toBe(true);
    expect(result.amount).toBe(400);
    expect(result.type).toBe("expense");
    expect(result.tag).toBe("transport");
    expect(result.date).toBe(`${dayjs().year()}-01-05`);
  });

  it("parses day-first dates like 'on 5th January 2026'", () => {
    const result = parseNaturalLanguage("1500 house rent on 5th January 2026");
    expect(result.success).toBe(true);
    expect(result.amount).toBe(1500);
    expect(result.tag).toBe("rent");
    expect(result.type).toBe("expense");
    expect(result.date).toBe("2026-01-05");
  });

  it("parses commas in amounts", () => {
    const result = parseNaturalLanguage("paid 1,500 shopping at amazon");
    expect(result.success).toBe(true);
    expect(result.amount).toBe(1500);
    expect(result.type).toBe("expense");
    expect(result.tag).toBe("shopping");
  });

  it("treats 'earned 800 freelance' as income", () => {
    const result = parseNaturalLanguage("earned 800 freelance this month");
    expect(result.success).toBe(true);
    expect(result.type).toBe("income");
    expect(result.tag).toBe("freelance");
  });

  it("treats 'cashback 250 pathao' as income", () => {
    const result = parseNaturalLanguage("cashback 250 from pathao");
    expect(result.success).toBe(true);
    expect(result.type).toBe("income");
    expect(result.amount).toBe(250);
    // pathao maps to transport, which is not a valid income tag → salary.
    expect(result.tag).toBe("salary");
  });

  it("treats 'deposited 3000 stipend' as income with a clean name", () => {
    const result = parseNaturalLanguage("deposited 3000 stipend last month");
    expect(result.success).toBe(true);
    expect(result.type).toBe("income");
    expect(result.amount).toBe(3000);
    expect(result.tag).toBe("salary");
    expect(result.name).toBe("Salary");
  });

  it("keeps income-only tags like 'gift' from leaking into expenses", () => {
    const result = parseNaturalLanguage("500 gift for mom");
    expect(result.success).toBe(true);
    expect(result.type).toBe("expense");
    // 'gift' is an income tag → falls back to the expense default.
    expect(result.tag).toBe("food");
  });

  it("returns success false when no amount is present", () => {
    expect(parseNaturalLanguage("bought some food").success).toBe(false);
    expect(parseNaturalLanguage("").success).toBe(false);
    expect(parseNaturalLanguage(null).success).toBe(false);
  });
});