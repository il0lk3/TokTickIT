import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { TicketQueue } from "../../src/components/TicketQueue";
import { AuthProvider } from "../../src/contexts/AuthContext";

// Create a wrapper component to inject AuthContext state
const renderWithAuth = (ui: React.ReactElement, userRole = "IT_STAFF") => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
};

describe("TicketQueue Component", () => {
  const mockCategories = [{ id: 1, name: "Network" }];
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      console.log("FETCH MOCK CALLED WITH URL", url);
      if (url.includes("/api/auth/me") || url.includes("/api/auth/session")) {
        return {
          ok: true,
          json: async () => ({
            user: { id: 1, name: "Test User", email: "test@example.com", role: "IT_STAFF", isActive: true, requiresPasswordChange: false }
          })
        };
      }
      if (url.includes("/api/it-staff")) {
        return {
          ok: true,
          json: async () => ([
            { id: 1, name: "IT Staff 1", email: "staff1@example.com", role: "IT_STAFF" }
          ])
        };
      }
      if (url.includes("/api/staff/tickets")) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 1,
                ticketNumber: "T-001",
                summary: "Network Down",
                description: "Help!",
                requestedPriority: "HIGH",
                itPriority: "HIGH",
                currentStatus: "New",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                requesterId: 2,
                categoryId: 1,
                ownerId: null,
                owner: null,
                appearsResolved: false,
                relatedSystemId: null
              }
            ],
            meta: { total: 1, page: 1, limit: 10, totalPages: 1 }
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should render ticket queue table with fetched tickets", async () => {
    renderWithAuth(<TicketQueue categories={mockCategories} onSelectTicket={vi.fn()} />);
    
    // Wait for the ticket to appear
    await waitFor(() => {
      expect(screen.getAllByText("T-001").length).toBeGreaterThan(0);
    }, { timeout: 2000 }).catch(e => {
      console.error(e);
      throw e;
    });
    
    expect(screen.getAllByText("Network Down").length).toBeGreaterThan(0);
    expect(screen.getAllByText("New").length).toBeGreaterThan(0);
  });

  it("should show Access Denied when 403 Forbidden is returned", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/api/auth/me") || url.includes("/api/auth/session")) {
        return { ok: true, json: async () => ({ user: { id: 1, role: "IT_STAFF", isActive: true } }) };
      }
      if (url.includes("/api/it-staff")) {
        return { ok: true, json: async () => ([]) };
      }
      if (url.includes("/api/staff/tickets")) {
        return { ok: false, status: 403, json: async () => ({ message: "403 Forbidden" }) };
      }
      return { ok: true, json: async () => ({}) };
    }));
    
    renderWithAuth(<TicketQueue categories={mockCategories} onSelectTicket={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
    expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
  });

  it("should trigger getStaffTickets with updated page when clicking next", async () => {
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/api/auth/me") || url.includes("/api/auth/session")) {
        return { ok: true, json: async () => ({ user: { id: 1, role: "IT_STAFF", isActive: true } }) };
      }
      if (url.includes("/api/it-staff")) {
        return { ok: true, json: async () => ([]) };
      }
      if (url.includes("/api/staff/tickets")) {
        callCount++;
        return {
          ok: true,
          json: async () => ({
            data: [{
              id: 2, ticketNumber: "T-002", summary: "Test 2", requestedPriority: "LOW", itPriority: "LOW", currentStatus: "New", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), requesterId: 2, categoryId: 1, ownerId: null, owner: null, appearsResolved: false, relatedSystemId: null
            }],
            meta: { total: 20, page: callCount, limit: 10, totalPages: 2 }
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    }));
    
    renderWithAuth(<TicketQueue categories={mockCategories} onSelectTicket={vi.fn()} />);
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });
    
    // Click Next button
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);
    
    // Wait for API call with page 2
    await waitFor(() => {
      expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    });
  });
});
