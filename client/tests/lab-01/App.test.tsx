import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

vi.mock("../../src/api.js", () => ({
  getRequesters: vi.fn(),
  checkSystem: vi.fn(),
  getSystems: vi.fn()
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the TokTickIT heading", () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  it("auto-fetches categories and shows Create Ticket form on successful login", async () => {
    (api.getRequesters as any).mockResolvedValue([
      { id: 1, name: "Test User", email: "test@example.com" }
    ]);
    (api.checkSystem as any).mockResolvedValue({
      online: true,
      categories: [
        { id: 1, name: "Hardware" },
        { id: 2, name: "Software" }
      ]
    });
    (api.getSystems as any).mockResolvedValue([]);

    render(<App />);
    
    const continueBtn = await screen.findByRole("button", { name: "Continue" });
    fireEvent.click(continueBtn);

    expect(await screen.findByText(/Hardware/i)).toBeInTheDocument();
    expect(screen.getByText(/Software/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit a New Request/i)).toBeInTheDocument();
  });

  it("shows an Offline error message when checkSystem fails", async () => {
    (api.getRequesters as any).mockResolvedValue([
      { id: 1, name: "Test User", email: "test@example.com" }
    ]);
    (api.checkSystem as any).mockRejectedValue(new Error("Unable to connect"));

    render(<App />);
    
    const continueBtn = await screen.findByRole("button", { name: "Continue" });
    fireEvent.click(continueBtn);

    expect(await screen.findByText(/Connection Error/i)).toBeInTheDocument();
  });
});
