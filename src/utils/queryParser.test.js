import { parseQuery } from "./queryParser";

describe("parseQuery", () => {
  it("defaults to this month for spending questions", () => {
    const q = parseQuery("how much did I spend?");
    expect(q.intent).toBe("spending");
  });

  it("parses last month ranges", () => {
    const q = parseQuery("my spending last month");
    expect(q.intent).toBe("spending");
    expect(q.range).toBeDefined();
  });

  it("detects compare intent for X vs Y", () => {
    const q = parseQuery("food vs transport spending this month");
    expect(q.intent).toBe("compare");
    expect(q.categories).toContain("food");
    expect(q.categories).toContain("transport");
  });

  it("detects biggest expense intent", () => {
    const q = parseQuery("what was my biggest expense last week");
    expect(q.intent).toBe("biggest");
  });

  it("detects today range", () => {
    const q = parseQuery("spending today");
    expect(q.range.from).toBe(q.range.to);
  });

  it("returns unknown for gibberish", () => {
    expect(parseQuery("hello world").intent).toBe("unknown");
    expect(parseQuery("").intent).toBe("unknown");
  });
});