import { getFirebaseErrorMessage } from "./firebaseErrors";

describe("getFirebaseErrorMessage", () => {
  it("maps known Firebase auth codes to friendly messages", () => {
    expect(getFirebaseErrorMessage({ code: "auth/wrong-password" })).toBe(
      "Incorrect password. Please try again."
    );
  });

  it("falls back to the error message for unknown codes", () => {
    expect(
      getFirebaseErrorMessage({ code: "auth/unknown", message: "Raw error" })
    ).toBe("Raw error");
  });

  it("returns a generic message when no error details are available", () => {
    expect(getFirebaseErrorMessage(null)).toBe(
      "Something went wrong. Please try again."
    );
  });
});
