import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MyTickets } from "../../src/components/MyTickets.js";
import { RequesterProvider } from "../../src/contexts/RequesterContext.js";
import * as api from "../../src/api.js";

vi.mock("../../src/api.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/api.js")>();
  return {
    ...actual,
    getTickets: vi.fn(),
  };
});

// Helper component to provide context
const TestWrapper = ({ children, requester }: any) => {
  // Mock localStorage for the context
  localStorage.setItem("toktickit_requester", JSON.stringify(requester));
  return <RequesterProvider>{children}</RequesterProvider>;
};

describe("MyTickets Component", () => {
  const mockCategories = [{ id: 1, name: "Hardware" }];
  const mockRequester = { id: 1, name: "Test User", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows loading state initially and fetches tickets", async () => {
    (api.getTickets as any).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 }
    });

    render(
      <TestWrapper requester={mockRequester}>
        <MyTickets categories={mockCategories} onSelectTicket={vi.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading tickets/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/No tickets found/i)).toBeInTheDocument();
    });

    expect(api.getTickets).toHaveBeenCalledWith(
      expect.objectContaining({ search: "", categoryId: "", requestedPriority: "", status: "", page: 1 }),
      mockRequester.id
    );
  });

  it("renders a list of tickets", async () => {
    (api.getTickets as any).mockResolvedValue({
      data: [
        { id: 1, ticketNumber: "TKT-2025-001", summary: "Test Ticket", categoryId: 1, requestedPriority: "HIGH", currentStatus: "New", createdAt: new Date().toISOString() }
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 }
    });

    render(
      <TestWrapper requester={mockRequester}>
        <MyTickets categories={mockCategories} onSelectTicket={vi.fn()} />
      </TestWrapper>
    );

    expect(await screen.findByText("TKT-2025-001")).toBeInTheDocument();
    expect(await screen.findByText("Test Ticket")).toBeInTheDocument();
    expect(await screen.findAllByText("Hardware")).not.toHaveLength(0);
  });

  it("debounces search input and triggers API fetch", async () => {
    (api.getTickets as any).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 }
    });

    render(
      <TestWrapper requester={mockRequester}>
        <MyTickets categories={mockCategories} onSelectTicket={vi.fn()} />
      </TestWrapper>
    );

    const searchInput = await screen.findByPlaceholderText("Search tickets...");
    
    // Clear initial call
    (api.getTickets as any).mockClear();

    fireEvent.change(searchInput, { target: { value: "error" } });
    
    // API shouldn't be called immediately due to debounce
    expect(api.getTickets).not.toHaveBeenCalled();

    // Wait for debounce timeout
    await waitFor(() => {
      expect(api.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ search: "error" }),
        mockRequester.id
      );
    }, { timeout: 1000 });
  });
});
