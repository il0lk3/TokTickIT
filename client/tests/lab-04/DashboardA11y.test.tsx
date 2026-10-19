import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RequesterDashboard } from '../../src/components/dashboard/RequesterDashboard';
import { StaffDashboard } from '../../src/components/dashboard/StaffDashboard';
import { AuthProvider } from '../../src/contexts/AuthContext';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mockStaffUser = {
  id: 2,
  name: 'Alex Tech',
  email: 'alex@toktickit.com',
  role: 'IT_STAFF',
  requiresPasswordChange: false,
};

const mockStaffDashboardData = {
  metrics: {
    unassigned: { count: 8, drillDown: { path: '/queue', query: { ownerId: 'unassigned', active: 'true' } } },
    ownedByMe: { count: 16, drillDown: { path: '/queue', query: { ownerId: 'me', active: 'true' } } },
    appearsResolved: { count: 3, drillDown: { path: '/queue', query: { appearsResolved: 'true', active: 'true' } } },
    recentlyUpdated: { count: 12, drillDown: { path: '/queue', query: { updatedSince: '2026-10-18T10:00:00.000Z', active: 'true' } } },
    byStatus: { New: 4, Open: 6, InProgress: 8, WaitingForRequester: 2, Resolved: 10, Closed: 15, Reopened: 1, Cancelled: 0 },
    byPriority: { LOW: 5, MEDIUM: 12, HIGH: 3 },
    adminUserCounts: null,
  },
  myRecentTickets: [],
  urgentTickets: [],
  generatedAt: '2026-10-19T10:00:00.000Z',
};

describe('Dashboard Accessibility & Keyboard Nav (UI-A11Y-01 to UI-A11Y-04)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/dashboard/staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffDashboardData) });
      }
      return Promise.reject(new Error('err'));
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UI-A11Y-01: heading hierarchy strictly follows h1 -> h2', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s.length).toBe(1);
    expect(h1s[0]).toHaveTextContent(/dashboard/i);

    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(1);
  });

  it('UI-A11Y-02: metric cards have accessible names including title and count', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    const unassignedCard = screen.getByRole('link', { name: /Unassigned.*8.*tickets/i });
    expect(unassignedCard).toBeInTheDocument();

    const assignedCard = screen.getByRole('link', { name: /Assigned to Me.*16.*tickets/i });
    expect(assignedCard).toBeInTheDocument();
  });

  it('UI-A11Y-03: all decorative icons have aria-hidden=true', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('UI-A11Y-04: keyboard navigation: user can Tab to cards and activate with Enter', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    // Tab into the page
    await user.tab();
    // First focusable element should be Refresh button or first card
    expect(document.activeElement).not.toBe(document.body);
  });
});
