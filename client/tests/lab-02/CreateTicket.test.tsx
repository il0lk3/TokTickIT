import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateTicket from "../../src/components/CreateTicket";
import { RequesterProvider } from "../../src/contexts/RequesterContext.js";
import * as api from "../../src/api.js";

// Mock the API module
vi.mock("../../src/api.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/api.js")>();
  return {
    ...actual,
    getSystems: vi.fn(),
    createTicket: vi.fn()
  };
});

// Mock the RequesterContext to provide an active user
vi.mock("../../src/contexts/RequesterContext.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/contexts/RequesterContext.js")>();
  return {
    ...actual,
    useRequester: () => ({
      activeRequester: { id: 1, name: "Test User", email: "test@example.com" },
      setRequester: vi.fn()
    })
  };
});

describe("UI-02: CreateTicket Validation", () => {
  const mockCategories = [
    { id: 1, name: "Hardware" },
    { id: 2, name: "Software" }
  ];

  it("Submit without Summary shows field-level error message and API is not called", async () => {
    // Setup mocks
    (api.getSystems as any).mockResolvedValue([
      { id: 1, name: "Windows Laptop" }
    ]);

    render(
      <RequesterProvider>
        <CreateTicket categories={mockCategories} />
      </RequesterProvider>
    );

    // Wait for form to render completely
    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    // Fill in everything EXCEPT Summary
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/Related System/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/Priority/i), { target: { value: "HIGH" } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "My laptop is broken." } });

    // Ensure Summary is empty
    const summaryInput = screen.getByLabelText(/Summary/i);
    expect(summaryInput).toHaveValue("");

    // Submit the form
    const submitBtn = screen.getByRole("button", { name: /Submit Request/i });
    fireEvent.click(submitBtn);

    // Assert validation error appears
    await waitFor(() => {
      expect(screen.getByText("Summary is required.")).toBeInTheDocument();
    });

    // Assert the API was NOT called
    expect(api.createTicket).not.toHaveBeenCalled();
  });
});
