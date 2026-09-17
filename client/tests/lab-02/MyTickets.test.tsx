import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MyTickets } from "../../src/components/MyTickets.js";
import { AuthProvider } from "../../src/contexts/AuthContext";
import * as api from "../../src/api";

vi.mock("../../src/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/api")>();
  return {
    ...actual,
    getTickets: vi.fn()
  };
});

const { mockUser } = vi.hoisted(() => ({
  mockUser: { id: 1, name: "Test User", email: "test@example.com", role: "REQUESTER", requiresPasswordChange: false }
}));

vi.mock("../../src/contexts/AuthContext", () => {
  return {
    useAuth: () => ({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
    }),
    AuthProvider: ({ children }: any) => children
  };
});


// Helper component to provide context
const TestWrapper = ({ children, requester }: any) => {
  // Mock localStorage for the context
  localStorage.setItem("toktickit_requester", JSON.stringify(requester));
  return <>{children}</>;
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
      <TestWrapper>
        <MyTickets categories={mockCategories} onSelectTicket={vi.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading tickets/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/No tickets found/i)).toBeInTheDocument();
    });

    expect(api.getTickets).toHaveBeenCalledWith(
      expect.objectContaining({ search: "", categoryId: "", requestedPriority: "", status: "", page: 1 })
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
      <TestWrapper>
        <MyTickets categories={mockCategories} onSelectTicket={vi.fn()} />
      </TestWrapper>
    );

    const tickets = await screen.findAllByText("TKT-2025-001");
    expect(tickets[0]).toBeInTheDocument();
    
    const summaries = await screen.findAllByText("Test Ticket");
    expect(summaries[0]).toBeInTheDocument();
    
    expect(await screen.findAllByText("Hardware")).not.toHaveLength(0);
  });

  it("debounces search input and triggers API fetch", async () => {
    (api.getTickets as any).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 }
    });

    render(
      <TestWrapper>
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
        expect.objectContaining({ search: "error" })
      );
    }, { timeout: 1000 });
  });

  it("handles sorting when header is clicked", async () => {
    (api.getTickets as any).mockResolvedValue({
      data: [{ id: 1, ticketNumber: "TKT-2025-001", summary: "Test", categoryId: 1, requestedPriority: "HIGH", currentStatus: "New", createdAt: new Date().toISOString() }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    render(
      <TestWrapper>
        <MyTickets categories={mockCategories} onSelectTicket={vi.fn()} />
      </TestWrapper>
    );

    // Initial fetch
    await waitFor(() => {
      expect(api.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "createdAt", sortOrder: "desc" })
      );
    });

    // Click Ticket No. header
    const ticketHeaders = screen.getAllByText(/Ticket No\./i);
    const ticketHeader = ticketHeaders[0];
    fireEvent.click(ticketHeader);

    await waitFor(() => {
      expect(api.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "ticketNumber", sortOrder: "desc" })
      );
    });
    
    // Click again to toggle order
    fireEvent.click(ticketHeader);
    await waitFor(() => {
      expect(api.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "ticketNumber", sortOrder: "asc" })
      );
    });
  });
});
