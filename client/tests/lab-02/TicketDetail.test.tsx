import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TicketDetail } from "../../src/components/TicketDetail.js";
import { AuthProvider } from "../../src/contexts/AuthContext";
import * as api from "../../src/api";

vi.mock("../../src/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/api")>();
  return {
    ...actual,
    getTicketDetail: vi.fn()
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


const TestWrapper = ({ children }: any) => { return <>{children}</>; };

describe("TicketDetail Component", () => {
  const mockRequester = { id: 1, name: "Test User", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders ticket details successfully", async () => {
    (api.getTicketDetail as any).mockResolvedValue({
      id: 1,
      ticketNumber: "TKT-2026-001",
      summary: "My broken laptop",
      description: "It just won't turn on.",
      requestedPriority: "HIGH",
      currentStatus: "New",
      category: { name: "Hardware" },
      relatedSystem: { name: "Corporate Laptop" },
      requester: mockRequester,
      attachments: [
        { id: 1, originalName: "error.png", size: 1024, isRemoved: false }
      ],
      createdAt: new Date().toISOString()
    });

    render(
      <TestWrapper>
        <TicketDetail ticketId={1} onBack={vi.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading ticket details/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue("TKT-2026-001")).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("My broken laptop")).toBeInTheDocument();
    expect(screen.getByDisplayValue("It just won't turn on.")).toBeInTheDocument();
    expect(screen.getByText("error.png")).toBeInTheDocument();
    expect(api.getTicketDetail).toHaveBeenCalledWith(1);
  });
});
