import { parseSms } from "./parseSms";

describe("parseSms", () => {
  describe("bKash", () => {
    const formats = [
      {
        text:
          "You have received Tk 500.00 from 01712345678. Ref: 9H4G8F2D1A. " +
          "Balance: Tk 1,234.56. TrxID 9H4G8F2D1A5B",
        amount: 500,
        type: "income",
        trxId: "9H4G8F2D1A5B",
      },
      {
        text:
          "Payment Tk 200.00 to XYZ Store successful. TrxID 1A2B3C4D5E. " +
          "Balance: Tk 800.00",
        amount: 200,
        type: "expense",
        name: "XYZ Store",
        trxId: "1A2B3C4D5E",
      },
      {
        text:
          "Cash Out Tk 1,000.00 from agent 01712345678. TrxID CASHOUT01. " +
          "Balance: Tk 2,500.00",
        amount: 1000,
        type: "expense",
        name: "agent 01712345678",
      },
    ];

    formats.forEach(({ text, ...expected }, i) => {
      it(`parses bKash format ${i + 1}`, () => {
        const result = parseSms(text);
        expect(result.success).toBe(true);
        expect(result.provider).toBe("bKash");
        expect(result.amount).toBe(expected.amount);
        expect(result.type).toBe(expected.type);
        if (expected.name) expect(result.name).toBe(expected.name);
        if (expected.trxId) expect(result.trxId).toBe(expected.trxId);
      });
    });
  });

  describe("Nagad", () => {
    const formats = [
      {
        text:
          "You have received Tk 1200.00 from 01912345678 on 2024-03-01 at " +
          "10:00 AM. TrxID NAGAD201234567890",
        amount: 1200,
        type: "income",
        trxId: "NAGAD201234567890",
      },
      {
        text:
          "Payment Tk 350.00 to Dhaka Mart successful at 12:30 PM. " +
          "TrxID NX98012345",
        amount: 350,
        type: "expense",
        name: "Dhaka Mart",
      },
      {
        text:
          "Cash out Tk 500.00 from agent 01812345678. TrxID NX00112233",
        amount: 500,
        type: "expense",
        name: "agent 01812345678",
      },
    ];

    formats.forEach(({ text, ...expected }, i) => {
      it(`parses Nagad format ${i + 1}`, () => {
        const result = parseSms(text);
        expect(result.success).toBe(true);
        expect(result.provider).toBe("Nagad");
        expect(result.amount).toBe(expected.amount);
        expect(result.type).toBe(expected.type);
        if (expected.name) expect(result.name).toBe(expected.name);
        if (expected.trxId) expect(result.trxId).toBe(expected.trxId);
      });
    });
  });

  describe("Rocket", () => {
    const formats = [
      {
        text:
          "Cash In Tk 1000.00 from 01712345678. Ref: RK123456. TrxID " +
          "RKTRXLONGID001",
        amount: 1000,
        type: "income",
        trxId: "RKTRXLONGID001",
      },
      {
        text:
          "Cash Out Tk 400.00 to 01812345678. Ref: RK987654",
        amount: 400,
        type: "expense",
        name: "01812345678",
      },
      {
        text: "Bill Pay Tk 250.00 to DPDC successful. TrxID RKBILL001",
        amount: 250,
        type: "expense",
        name: "DPDC",
      },
    ];

    formats.forEach(({ text, ...expected }, i) => {
      it(`parses Rocket format ${i + 1}`, () => {
        const result = parseSms(text);
        expect(result.success).toBe(true);
        expect(result.provider).toBe("Rocket");
        expect(result.amount).toBe(expected.amount);
        expect(result.type).toBe(expected.type);
        if (expected.name) expect(result.name).toBe(expected.name);
        if (expected.trxId) expect(result.trxId).toBe(expected.trxId);
      });
    });
  });

  it("returns success false for unrecognized text", () => {
    expect(parseSms("Happy new year!").success).toBe(false);
    expect(parseSms("").success).toBe(false);
    expect(parseSms(null).success).toBe(false);
  });
});