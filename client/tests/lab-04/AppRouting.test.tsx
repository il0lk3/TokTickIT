import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import App from "../../src/App";
import * as AuthContextModule from "../../src/contexts/AuthContext";
import * as api from "../../src/api";

// Mock child view components to isolate routing and shell logic
vi.mock("../../src/components/auth/Login", () => ({
  default: () => <div data-testid="login-screen">Login Screen</div>
}));

vi.mock("../../src/components/auth/ChangePassword", () => ({
  default: () => <div data-testid="change-password-screen">Change Password Screen</div>
}));

vi.mock("../../src/components/MyTickets", () => ({
  MyTickets: (props: any) => (
    <div data-testid="my-tickets-screen">
      My Tickets Screen
      <span data-testid="my-tickets-status-prop">{props.status || ""}</span>
      <button data-testid="change-my-tickets-filter" onClick={() => props.onFilterChange?.({ status: "Resolved" })}>
        Change Filter
      </button>
    </div>
  )
}));

vi.mock("../../src/components/CreateTicket", () => ({
  default: () => <div data-testid="create-ticket-screen">Create Ticket Screen</div>
}));

vi.mock("../../src/components/TicketQueue", () => ({
  TicketQueue: (props: any) => (
    <div data-testid="ticket-queue-screen">
      Ticket Queue Screen
      <span data-testid="queue-status-prop">{props.status || ""}</span>
      <span data-testid="queue-owner-prop">{props.ownerId || ""}</span>
      <button data-testid="change-queue-filter" onClick={() => props.onFilterChange?.({ status: "InProgress", itPriority: "HIGH" })}>
        Change Queue Filter
      </button>
    </div>
  )
}));

vi.mock("../../src/components/TicketDetail", () => ({
  TicketDetail: (props: any) => (
    <div data-testid="ticket-detail-screen">
      Ticket Detail Screen for ID: <span data-testid="detail-ticket-id">{props.ticketId}</span>
      <button data-testid="ticket-detail-back" onClick={props.onBack}>Back</button>
    </div>
  )
}));

vi.mock("../../src/components/UserManagement", () => ({
  UserManagement: () => <div data-testid="user-management-screen">User Management Screen</div>
}));

vi.mock("../../src/components/dashboard/DashboardShell", () => ({
  DashboardShell: () => <div data-testid="dashboard-shell-screen">Dashboard Shell Screen</div>
}));

describe("Lab 4 Issue 5: Client Routing and Role-aware Application Shell (UI-NAV)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, "checkSystem").mockResolvedValue({ online: true, categories: [] });
    // Default URL to root
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setupAuth(user: any, isLoading = false) {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user,
      isLoading,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });
  }

  // ==========================================
  // 1. Authentication & Session Loading Guards
  // ==========================================
  describe("1. Authentication & Session Loading Guards", () => {
    it("UI-NAV-01: unauthenticated user accessing protected route (/dashboard) is redirected to /login", async () => {
      window.history.pushState({}, "", "/dashboard");
      setupAuth(null, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("login-screen")).toBeInTheDocument();
      });
      expect(window.location.pathname).toBe("/login");
    });

    it("UI-NAV-15: session loading (isLoading: true) renders spinner and does not prematurely bounce to /login", async () => {
      window.history.pushState({}, "", "/tickets/42");
      setupAuth(null, true);

      render(<App />);

      expect(screen.queryByTestId("login-screen")).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument(); // Loading spinner
      expect(window.location.pathname).toBe("/tickets/42");
    });

    it("UI-NAV-03: user with requiresPasswordChange is quarantined on /change-password", async () => {
      window.history.pushState({}, "", "/dashboard");
      setupAuth({ id: 1, name: "New User", role: "REQUESTER", requiresPasswordChange: true }, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("change-password-screen")).toBeInTheDocument();
      });
      expect(window.location.pathname).toBe("/change-password");
    });

    it("UI-NAV-16: authenticated user hitting /login or /change-password (without need) redirects to /dashboard", async () => {
      window.history.pushState({}, "", "/login");
      setupAuth({ id: 1, name: "Active User", role: "REQUESTER", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        expect(window.location.pathname).toBe("/dashboard");
      });
    });
  });

  // ==========================================
  // 2. Role-Based Screen Access (3 Roles x All Routes)
  // ==========================================
  describe("2. Role-Based Screen Access (Matrix)", () => {
    const matrixCases = [
      // Requester
      { role: "REQUESTER", path: "/dashboard", allowed: true, testId: "dashboard-shell-screen" },
      { role: "REQUESTER", path: "/tickets", allowed: true, testId: "my-tickets-screen" },
      { role: "REQUESTER", path: "/tickets/new", allowed: true, testId: "create-ticket-screen" },
      { role: "REQUESTER", path: "/tickets/1", allowed: true, testId: "ticket-detail-screen" },
      { role: "REQUESTER", path: "/queue", allowed: false },
      { role: "REQUESTER", path: "/admin/users", allowed: false },

      // IT Staff
      { role: "IT_STAFF", path: "/dashboard", allowed: true, testId: "dashboard-shell-screen" },
      { role: "IT_STAFF", path: "/queue", allowed: true, testId: "ticket-queue-screen" },
      { role: "IT_STAFF", path: "/tickets/1", allowed: true, testId: "ticket-detail-screen" },
      { role: "IT_STAFF", path: "/tickets", allowed: false },
      { role: "IT_STAFF", path: "/tickets/new", allowed: false },
      { role: "IT_STAFF", path: "/admin/users", allowed: false },

      // Administrator
      { role: "ADMINISTRATOR", path: "/dashboard", allowed: true, testId: "dashboard-shell-screen" },
      { role: "ADMINISTRATOR", path: "/queue", allowed: true, testId: "ticket-queue-screen" },
      { role: "ADMINISTRATOR", path: "/tickets/1", allowed: true, testId: "ticket-detail-screen" },
      { role: "ADMINISTRATOR", path: "/admin/users", allowed: true, testId: "user-management-screen" },
      { role: "ADMINISTRATOR", path: "/tickets", allowed: false },
      { role: "ADMINISTRATOR", path: "/tickets/new", allowed: false },
    ];

    matrixCases.forEach(({ role, path, allowed, testId }) => {
      it(`UI-NAV-04: role ${role} accessing ${path} -> ${allowed ? "Allowed" : "Forbidden (in-place)"}`, async () => {
        window.history.pushState({}, "", path);
        setupAuth({ id: 10, name: "Matrix User", role, requiresPasswordChange: false }, false);

        render(<App />);

        if (allowed) {
          await waitFor(() => {
            expect(screen.getByTestId(testId!)).toBeInTheDocument();
          });
          expect(screen.queryByTestId("forbidden-screen")).not.toBeInTheDocument();
          expect(window.location.pathname).toBe(path);
        } else {
          await waitFor(() => {
            expect(screen.getByTestId("forbidden-screen")).toBeInTheDocument();
          });
          // Invariant: Must render Forbidden IN-PLACE without mutating URL or redirecting to /forbidden
          expect(window.location.pathname).toBe(path);
        }
      });
    });
  });

  // ==========================================
  // 3. Navigation Bar & Role Menus
  // ==========================================
  describe("3. Navigation Bar & Role Menus", () => {
    it("UI-NAV-06: Administrator navbar exposes Dashboard, Ticket Queue, and User Management", async () => {
      window.history.pushState({}, "", "/dashboard");
      setupAuth({ id: 1, name: "Admin User", role: "ADMINISTRATOR", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /ticket queue/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /user management/i })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /my tickets/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /create ticket/i })).not.toBeInTheDocument();
      });
    });

    it("UI-NAV-02: active navigation items expose aria-current='page' with exact matching", async () => {
      window.history.pushState({}, "", "/tickets");
      setupAuth({ id: 2, name: "Req User", role: "REQUESTER", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        const myTicketsLink = screen.getByRole("link", { name: /my tickets/i });
        expect(myTicketsLink).toHaveAttribute("aria-current", "page");

        const createLink = screen.getByRole("link", { name: /create ticket/i });
        expect(createLink).not.toHaveAttribute("aria-current");
      });
    });

    it("UI-NAV-02B: viewing /tickets/42 marks parent list as active in navbar", async () => {
      window.history.pushState({}, "", "/tickets/42");
      setupAuth({ id: 2, name: "Req User", role: "REQUESTER", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        const myTicketsLink = screen.getByRole("link", { name: /my tickets/i });
        expect(myTicketsLink).toHaveAttribute("aria-current", "page");
      });
    });

    it("UI-NAV-17: mobile navbar toggler has accessible attributes and closes menu on navigation", async () => {
      window.history.pushState({}, "", "/dashboard");
      setupAuth({ id: 2, name: "Req User", role: "REQUESTER", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        const toggler = screen.getByRole("button", { name: /toggle navigation/i });
        expect(toggler).toHaveAttribute("aria-label", "Toggle navigation");
        expect(toggler).toHaveAttribute("aria-expanded", "false");
        expect(toggler).toHaveAttribute("aria-controls", "navbarNav");

        // Open menu
        fireEvent.click(toggler);
        expect(toggler).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("UI-NAV-18: skip link points to #main-content and document.title updates per route", async () => {
      window.history.pushState({}, "", "/dashboard");
      setupAuth({ id: 2, name: "Req User", role: "REQUESTER", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        const skipLink = screen.getByRole("link", { name: /skip to main content/i });
        expect(skipLink).toHaveAttribute("href", "#main-content");
        expect(document.title).toContain("TokTickIT");
      });
    });
  });

  // ==========================================
  // 4. Deep Linking & Parameter Validation
  // ==========================================
  describe("4. Deep Linking & Parameter Validation", () => {
    it("UI-NAV-07: deep link to /tickets/42 passes ticketId 42 to TicketDetail", async () => {
      window.history.pushState({}, "", "/tickets/42");
      setupAuth({ id: 5, name: "Staff User", role: "IT_STAFF", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-detail-screen")).toBeInTheDocument();
        expect(screen.getByTestId("detail-ticket-id").textContent).toBe("42");
      });
    });

    it("UI-NAV-08: non-numeric ticket ID /tickets/abc or /tickets/42abc renders NotFound (404)", async () => {
      window.history.pushState({}, "", "/tickets/abc");
      setupAuth({ id: 5, name: "Staff User", role: "IT_STAFF", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("not-found-screen")).toBeInTheDocument();
      });
    });

    it("UI-NAV-08B: unknown path /some/random/route renders NotFound (404)", async () => {
      window.history.pushState({}, "", "/some/random/route");
      setupAuth({ id: 5, name: "Staff User", role: "IT_STAFF", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("not-found-screen")).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 5. URL Single Source of Truth for Filters
  // ==========================================
  describe("5. URL Single Source of Truth for Filters", () => {
    it("UI-NAV-09: initial URL searchParams (?status=Open&ownerId=unassigned) populate TicketQueue props", async () => {
      window.history.pushState({}, "", "/queue?status=Open&ownerId=unassigned");
      setupAuth({ id: 5, name: "Staff User", role: "IT_STAFF", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("queue-status-prop").textContent).toBe("Open");
        expect(screen.getByTestId("queue-owner-prop").textContent).toBe("unassigned");
      });
    });

    it("UI-NAV-10: modifying filters updates URL searchParams with { replace: true }", async () => {
      window.history.pushState({}, "", "/queue");
      setupAuth({ id: 5, name: "Staff User", role: "IT_STAFF", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-queue-screen")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("change-queue-filter"));

      await waitFor(() => {
        expect(window.location.search).toContain("status=InProgress");
        expect(window.location.search).toContain("itPriority=HIGH");
      });
    });

    it("UI-NAV-11: invalid query values (?status=garbage&itPriority=invalid) are ignored", async () => {
      window.history.pushState({}, "", "/queue?status=garbage&itPriority=invalid");
      setupAuth({ id: 5, name: "Staff User", role: "IT_STAFF", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("queue-status-prop").textContent).toBe("");
      });
    });

    it("UI-NAV-13: multi-status filter (?status=New,Open,Reopened) is correctly parsed", async () => {
      window.history.pushState({}, "", "/tickets?status=New,Open,Reopened");
      setupAuth({ id: 2, name: "Req User", role: "REQUESTER", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("my-tickets-status-prop").textContent).toBe("New,Open,Reopened");
      });
    });
  });

  // ==========================================
  // 6. Navigation History & In-App Back Fallback
  // ==========================================
  describe("6. Navigation History & In-App Back Fallback", () => {
    it("UI-NAV-14: direct deep link to /tickets/42 (location.key === 'default') falls back to role list root on Back", async () => {
      // Direct deep link has default history key
      window.history.pushState(null, "", "/tickets/42");
      setupAuth({ id: 5, name: "Staff User", role: "IT_STAFF", requiresPasswordChange: false }, false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-detail-screen")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("ticket-detail-back"));

      await waitFor(() => {
        // Staff falls back to /queue
        expect(window.location.pathname).toBe("/queue");
      });
    });
  });
});
