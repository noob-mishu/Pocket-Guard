import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { useAuthState } from "react-firebase-hooks/auth";

jest.mock("react-firebase-hooks/auth", () => ({
  useAuthState: jest.fn(() => [null, false, null]),
}));

jest.mock("../firebase", () => ({
  auth: {},
  db: {},
}));

describe("Dashboard", () => {
  beforeEach(() => {
    useAuthState.mockReturnValue([null, false, null]);
  });

  it("renders loading state while auth is pending", () => {
    useAuthState.mockReturnValue([null, true, null]);
    render(<Dashboard />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("prompts unauthenticated users to log in", () => {
    render(<Dashboard />);
    expect(
      screen.getByText("Please log in to view your dashboard.")
    ).toBeInTheDocument();
  });
});