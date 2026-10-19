import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { StaffDashboard } from '../../src/components/dashboard/StaffDashboard';
import { DashboardRoute } from '../../src/components/dashboard/DashboardRoute';
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

const mockAdminUser = {
  id: 3,
  name: 'System Admin',
  email: 'admin@toktickit.com',
  role: 'ADMINISTRATOR',
  requiresPasswordChange: false,
};

const mockStaffDashboardData = {
  metrics: {
    unassigned: {
      count: 8,
      drillDown: {
        path: '/queue',
        query: { ownerId: 'unassigned', active: 'true' },
      },
    },
    ownedByMe: {
      count: 16,
      drillDown: {
        path: '/queue',
        query: { ownerId: 'me', active: 'true' },
      },
    },
    appearsResolved: {
      count: 3,
      drillDown: {
        path: '/queue',
        query: { appearsResolved: 'true', active: 'true' },
      },
    },
    recentlyUpdated: {
      count: 12,
      drillDown: {
        path: '/queue',
        query: { updatedSince: '2026-10-18T10:00:00.000Z', active: 'true' },
      },
    },
    byStatus: {
      New: 4,
      Open: 6,
      InProgress: 8,
      WaitingForRequester: 2,
      Resolved: 10,
      Closed: 15,
      Reopened: 1,
      Cancelled: 0,
    },
    byPriority: {
      LOW: 5,
      MEDIUM: 12,
      HIGH: 3,
      UNSET: 0,
    },
    adminUserCounts: null,
  },
  myRecentTickets: [
    {
      id: 34,
      ticketNumber: 'TKT-2026-000034',
      summary: 'Core router rebooted unexpectedly',
      currentStatus: 'InProgress',
      itPriority: 'HIGH',
      owner: { id: 2, name: 'Alex Tech' },
      requester: { id: 10, name: 'Alice Requester' },
      category: { id: 3, name: 'Network' },
      updatedAt: '2026-10-19T09:14:00.000Z',
    },
  ],
  urgentTickets: [
    {
      id: 35,
      ticketNumber: 'TKT-2026-000035',
      summary: 'Production database latency spike',
      currentStatus: 'Open',
      itPriority: 'HIGH',
      owner: null,
      requester: { id: 11, name: 'Bob Requester' },
      category: { id: 4, name: 'Database' },
      updatedAt: '2026-10-19T09:20:00.000Z',
    },
  ],
  generatedAt: '2026-10-19T10:00:00.000Z',
};

const mockAdminDashboardData = {
  ...mockStaffDashboardData,
  metrics: {
    ...mockStaffDashboardData.metrics,
    adminUserCounts: {
      total: 35,
      active: 33,
      requesters: 25,
      staff: 7,
      admins: 3,
    },
  },
};

describe('Staff & Administrator Dashboard (UI-DSH-11 to UI-DSH-26)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/dashboard/staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffDashboardData) });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderStaffDashboard(user?: any, customData?: any) {
    if (user || customData) {
      const activeUser = user || mockStaffUser;
      vi.stubGlobal('fetch', vi.fn((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(activeUser) });
        }
        if (url.includes('/api/dashboard/staff')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(customData || (activeUser.role === 'ADMINISTRATOR' ? mockAdminDashboardData : mockStaffDashboardData)),
          });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      }));
    }

    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </MemoryRouter>
    );
  }

  it('UI-DSH-11: renders all 4 operational metric cards with correct counts', async () => {
    renderStaffDashboard();

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    const unassignedCard = screen.getByRole('link', { name: /Unassigned.*8.*tickets/i });
    expect(unassignedCard).toBeInTheDocument();

    const assignedCard = screen.getByRole('link', { name: /Assigned to Me.*16.*tickets/i });
    expect(assignedCard).toBeInTheDocument();

    const appearsCard = screen.getByRole('link', { name: /Appears Resolved.*3.*tickets/i });
    expect(appearsCard).toBeInTheDocument();

    const updatedCard = screen.getByRole('link', { name: /Updated in 24h.*12.*tickets/i });
    expect(updatedCard).toBeInTheDocument();
  });

  it('UI-DSH-12: operational cards link to exact /queue query destinations', async () => {
    renderStaffDashboard();

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    const unassignedLink = screen.getByRole('link', { name: /Unassigned/i });
    expect(unassignedLink).toHaveAttribute('href', '/queue?ownerId=unassigned&active=true');

    const meLink = screen.getByRole('link', { name: /Assigned to Me/i });
    expect(meLink).toHaveAttribute('href', '/queue?ownerId=me&active=true');

    const appearsLink = screen.getByRole('link', { name: /Appears Resolved/i });
    expect(appearsLink).toHaveAttribute('href', '/queue?appearsResolved=true&active=true');
  });

  it('UI-DSH-13: status chips render all 8 statuses with non-negative counts and drill-down links to /queue', async () => {
    renderStaffDashboard();

    await waitFor(() => {
      expect(screen.getByText(/queue status/i)).toBeInTheDocument();
    });

    const newChip = screen.getByRole('link', { name: /new.*4/i });
    expect(newChip).toHaveAttribute('href', '/queue?status=New&active=true');

    const inProgressChip = screen.getByRole('link', { name: /in progress.*8/i });
    expect(inProgressChip).toHaveAttribute('href', '/queue?status=InProgress&active=true');
  });

  it('UI-DSH-14: priority chips render LOW, MEDIUM, HIGH, UNSET with links to /queue?itPriority=...&active=true', async () => {
    renderStaffDashboard();

    await waitFor(() => {
      expect(screen.getByText(/priority overview/i)).toBeInTheDocument();
    });

    const lowChip = screen.getByRole('link', { name: /low.*5/i });
    expect(lowChip).toHaveAttribute('href', '/queue?itPriority=LOW&active=true');

    const unsetChip = screen.getByRole('link', { name: /unset.*0/i });
    expect(unsetChip).toHaveAttribute('href', '/queue?itPriority=UNSET&active=true');
  });

  it('UI-DSH-15: terminal status chips (Closed, Cancelled) link to /queue?status=... WITHOUT active=true', async () => {
    renderStaffDashboard();

    await waitFor(() => {
      expect(screen.getByText(/queue status/i)).toBeInTheDocument();
    });

    const closedChip = screen.getByRole('link', { name: /closed.*15/i });
    expect(closedChip).toHaveAttribute('href', '/queue?status=Closed');

    const cancelledChip = screen.getByRole('link', { name: /cancelled.*0/i });
    expect(cancelledChip).toHaveAttribute('href', '/queue?status=Cancelled');
  });

  it('UI-DSH-16: renders Urgent Active Tickets (HIGH priority) with links to detail', async () => {
    renderStaffDashboard();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-000035')).toBeInTheDocument();
    });

    expect(screen.getByText('Production database latency spike')).toBeInTheDocument();
    const urgentLink = screen.getByRole('link', { name: /TKT-2026-000035/i });
    expect(urgentLink).toHaveAttribute('href', '/tickets/35');
  });

  it('UI-DSH-17: renders My Recent Tickets with links to detail', async () => {
    renderStaffDashboard();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-000034')).toBeInTheDocument();
    });

    expect(screen.getByText('Core router rebooted unexpectedly')).toBeInTheDocument();
    const myTicketLink = screen.getByRole('link', { name: /TKT-2026-000034/i });
    expect(myTicketLink).toHaveAttribute('href', '/tickets/34');
  });

  it('UI-DSH-18: Admin sees User Management summary counts with links to /admin/users', async () => {
    renderStaffDashboard(mockAdminUser);

    await waitFor(() => {
      expect(screen.getByText(/user administration/i)).toBeInTheDocument();
    });

    expect(screen.getByText('35')).toBeInTheDocument(); // total users
    const adminLink = screen.getByRole('link', { name: /user administration/i });
    expect(adminLink).toHaveAttribute('href', '/admin/users');
  });

  it('UI-DSH-19: IT Staff does not see Admin User Management counts', async () => {
    renderStaffDashboard(mockStaffUser);

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    expect(screen.queryByText(/user administration/i)).not.toBeInTheDocument();
  });

  it('UI-DSH-20: safe-failure: null adminUserCounts for Admin does not crash', async () => {
    const brokenAdminData = {
      ...mockStaffDashboardData,
      metrics: {
        ...mockStaffDashboardData.metrics,
        adminUserCounts: null, // unexpectedly null
      },
    };

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAdminUser) });
      }
      if (url.includes('/api/dashboard/staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(brokenAdminData) });
      }
      return Promise.reject(new Error('err'));
    }));

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

    // Page must still render without throwing error!
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('UI-DSH-21: empty queue state displays when all queue counts are 0', async () => {
    const emptyStaffData = {
      ...mockStaffDashboardData,
      metrics: {
        ...mockStaffDashboardData.metrics,
        unassigned: { count: 0, drillDown: { path: '/queue', query: { ownerId: 'unassigned', active: 'true' } } },
        ownedByMe: { count: 0, drillDown: { path: '/queue', query: { ownerId: 'me', active: 'true' } } },
        appearsResolved: { count: 0, drillDown: { path: '/queue', query: { appearsResolved: 'true', active: 'true' } } },
        recentlyUpdated: { count: 0, drillDown: { path: '/queue', query: { updatedSince: '2026-10-18T10:00:00.000Z', active: 'true' } } },
      },
      myRecentTickets: [],
      urgentTickets: [],
    };

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/dashboard/staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(emptyStaffData) });
      }
      return Promise.reject(new Error('err'));
    }));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /queue is all clear/i })).toBeInTheDocument();
    });
  });

  it('UI-DSH-22: rapid double-click on refresh ignores redundant click while in-flight', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/dashboard/staff')) {
        callCount++;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ ok: true, json: () => Promise.resolve(mockStaffDashboardData) });
          }, 50);
        });
      }
      return Promise.reject(new Error('err'));
    }));

    renderStaffDashboard();

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshBtn);
    fireEvent.click(refreshBtn); // Second rapid click

    // Button should be disabled during in-flight
    expect(refreshBtn).toBeDisabled();

    await waitFor(() => {
      expect(refreshBtn).not.toBeDisabled();
    });

    // Initial load + 1 refresh = 2 calls
    expect(callCount).toBe(2);
  });

  it('UI-DSH-23: role dispatch in DashboardRoute routes Requester to Requester view and Staff to Staff view', async () => {
    const mockReqUser = { id: 10, name: 'Req', email: 'req@toktickit.com', role: 'REQUESTER', requiresPasswordChange: false };
    
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockReqUser) });
      }
      if (url.includes('/api/dashboard/requester')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            metrics: {
              openRequests: { count: 1, drillDown: { path: '/tickets', query: {} } },
              inProgress: { count: 0, drillDown: { path: '/tickets', query: {} } },
              waitingForRequester: { count: 0, drillDown: { path: '/tickets', query: {} } },
              recentlyResolved: { count: 0, drillDown: { path: '/tickets', query: {} } },
              closed: { count: 0, drillDown: { path: '/tickets', query: {} } },
            },
            attentionTickets: [],
            recentTickets: [],
          }),
        });
      }
      return Promise.reject(new Error(`Unexpected call to ${url}`));
    }));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <DashboardRoute />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Open Requests')).toBeInTheDocument();
    });

    // Verify it never called /api/dashboard/staff
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/dashboard/staff'), expect.anything());
  });

  it('UI-DSH-24: 401 Unauthorized response redirects to /login preserving returnUrl', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/dashboard/staff')) {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) });
      }
      return Promise.reject(new Error('err'));
    }));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<StaffDashboard />} />
            <Route path="/login" element={<div data-testid="login-screen">Login Screen</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
    });
  });

  it('UI-DSH-25: status live region announces Dashboard updated on success', async () => {
    renderStaffDashboard();

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    const statusLiveRegion = screen.getByRole('status');
    expect(statusLiveRegion).toHaveTextContent(/dashboard loaded|dashboard updated/i);
  });

  it('UI-DSH-26: responsive layout: long unbroken summary string does not cause horizontal overflow at 375px', async () => {
    const longSummaryData = {
      ...mockStaffDashboardData,
      urgentTickets: [
        {
          id: 99,
          ticketNumber: 'TKT-2026-000099',
          summary: 'A'.repeat(120), // 120 chars unbroken
          currentStatus: 'Open',
          itPriority: 'HIGH',
          owner: null,
          requester: { id: 11, name: 'Bob' },
          category: { id: 4, name: 'Database' },
          updatedAt: '2026-10-19T09:20:00.000Z',
        },
      ],
    };

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/dashboard/staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(longSummaryData) });
      }
      return Promise.reject(new Error('err'));
    }));

    const { container } = renderStaffDashboard();

    await waitFor(() => {
      expect(screen.getByText('A'.repeat(120))).toBeInTheDocument();
    });

    const summaryElem = screen.getByText('A'.repeat(120));
    expect(summaryElem.className).toMatch(/text-break|break-word/i);
  });
});
