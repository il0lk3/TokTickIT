import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { RequesterDashboard } from '../../src/components/dashboard/RequesterDashboard';
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

const mockRequesterUser = {
  id: 10,
  name: 'Alice Requester',
  email: 'alice@example.com',
  role: 'REQUESTER',
  requiresPasswordChange: false,
};

const mockRequesterDashboardData = {
  metrics: {
    openRequests: {
      count: 3,
      drillDown: {
        path: '/tickets',
        query: { status: 'New,Open,Reopened' },
      },
    },
    inProgress: {
      count: 2,
      drillDown: {
        path: '/tickets',
        query: { status: 'InProgress' },
      },
    },
    waitingForRequester: {
      count: 1,
      drillDown: {
        path: '/tickets',
        query: { status: 'WaitingForRequester' },
      },
    },
    recentlyResolved: {
      count: 5,
      drillDown: {
        path: '/tickets',
        query: { status: 'Resolved', updatedSince: '2026-10-12T00:00:00.000Z' },
      },
    },
    closed: {
      count: 12,
      drillDown: {
        path: '/tickets',
        query: { status: 'Closed' },
      },
    },
  },
  attentionTickets: [
    {
      id: 18,
      ticketNumber: 'TKT-2026-000018',
      summary: 'Need confirmation for software install',
      currentStatus: 'WaitingForRequester',
      updatedAt: '2026-10-19T08:00:00.000Z',
      category: { id: 2, name: 'Software' },
    },
  ],
  recentTickets: [
    {
      id: 24,
      ticketNumber: 'TKT-2026-000024',
      summary: 'Laptop battery drains quickly',
      currentStatus: 'InProgress',
      updatedAt: '2026-10-19T09:14:00.000Z',
      category: { id: 1, name: 'Hardware' },
    },
  ],
  generatedAt: '2026-10-19T10:00:00.000Z',
};

const mockEmptyDashboardData = {
  metrics: {
    openRequests: { count: 0, drillDown: { path: '/tickets', query: { status: 'New,Open,Reopened' } } },
    inProgress: { count: 0, drillDown: { path: '/tickets', query: { status: 'InProgress' } } },
    waitingForRequester: { count: 0, drillDown: { path: '/tickets', query: { status: 'WaitingForRequester' } } },
    recentlyResolved: { count: 0, drillDown: { path: '/tickets', query: { status: 'Resolved', updatedSince: '2026-10-12T00:00:00.000Z' } } },
    closed: { count: 0, drillDown: { path: '/tickets', query: { status: 'Closed' } } },
  },
  attentionTickets: [],
  recentTickets: [],
  generatedAt: '2026-10-19T10:00:00.000Z',
};

describe('Requester Dashboard (UI-DSH-01 to UI-DSH-10)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
      }
      if (url.includes('/api/dashboard/requester')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterDashboardData) });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderDashboard() {
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <RequesterDashboard />
        </AuthProvider>
      </MemoryRouter>
    );
  }

  it('UI-DSH-01: renders all 5 requester metric cards with correct counts', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Open Requests')).toBeInTheDocument();
    });

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Waiting on You')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Recently Resolved')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('UI-DSH-02: metric cards link to exact /tickets query destinations via URLSearchParams', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Open Requests')).toBeInTheDocument();
    });

    const openLink = screen.getByRole('link', { name: /Open Requests/i });
    expect(openLink).toHaveAttribute('href', '/tickets?status=New%2COpen%2CReopened');

    const inProgressLink = screen.getByRole('link', { name: /In Progress/i });
    expect(inProgressLink).toHaveAttribute('href', '/tickets?status=InProgress');

    const waitingLink = screen.getByRole('link', { name: /Waiting on You/i });
    expect(waitingLink).toHaveAttribute('href', '/tickets?status=WaitingForRequester');

    const closedLink = screen.getByRole('link', { name: /Closed/i });
    expect(closedLink).toHaveAttribute('href', '/tickets?status=Closed');
  });

  it('UI-DSH-03: renders Attention Needed list with link to ticket detail', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-000018')).toBeInTheDocument();
    });

    expect(screen.getByText('Need confirmation for software install')).toBeInTheDocument();
    const ticketLink = screen.getByRole('link', { name: /TKT-2026-000018/i });
    expect(ticketLink).toHaveAttribute('href', '/tickets/18');
  });

  it('UI-DSH-04: renders Recent Activity list with link to ticket detail', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('TKT-2026-000024')).toBeInTheDocument();
    });

    expect(screen.getByText('Laptop battery drains quickly')).toBeInTheDocument();
    const ticketLink = screen.getByRole('link', { name: /TKT-2026-000024/i });
    expect(ticketLink).toHaveAttribute('href', '/tickets/24');
  });

  it('UI-DSH-05: empty state displayed when all counts are 0, with Create Ticket action button', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
      }
      if (url.includes('/api/dashboard/requester')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockEmptyDashboardData) });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    }));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/no tickets yet|all caught up/i)).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('link', { name: /create ticket/i });
    expect(createBtn).toHaveAttribute('href', '/tickets/new');
  });

  it('UI-DSH-06: skeleton loader displays during initial loading', async () => {
    // Delay resolution
    let resolveDashboard: any;
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
      }
      if (url.includes('/api/dashboard/requester')) {
        return new Promise(resolve => { resolveDashboard = resolve; });
      }
      return Promise.reject(new Error('error'));
    }));

    renderDashboard();

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();

    resolveDashboard({ ok: true, json: () => Promise.resolve(mockRequesterDashboardData) });

    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText('Open Requests')).toBeInTheDocument();
    });
  });

  it('UI-DSH-07: full error state displayed when initial fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
      }
      if (url.includes('/api/dashboard/requester')) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: 'Server error' }) });
      }
      return Promise.reject(new Error('error'));
    }));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard|unable to connect/i)).toBeInTheDocument();
    });
  });

  it('UI-DSH-08: refresh button re-fetches data, disables during in-flight, retains focus', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Open Requests')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    refreshBtn.focus();
    expect(document.activeElement).toBe(refreshBtn);

    fireEvent.click(refreshBtn);
    expect(refreshBtn).toHaveAttribute('aria-busy', 'true');

    await waitFor(() => {
      expect(refreshBtn).toHaveAttribute('aria-busy', 'false');
    });

    expect(document.activeElement).toBe(refreshBtn);
  });

  it('UI-DSH-09: refresh failure keeps existing metrics visible and displays alert notification', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
      }
      if (url.includes('/api/dashboard/requester')) {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterDashboardData) });
        }
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: 'Failed' }) });
      }
      return Promise.reject(new Error('error'));
    }));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Open Requests')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.getByText(/could not refresh dashboard/i)).toBeInTheDocument();
    });

    // Existing metrics must remain visible!
    expect(screen.getByText('Open Requests')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('UI-DSH-10: 403 response renders accessible forbidden state without data leakage', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
      }
      if (url.includes('/api/dashboard/requester')) {
        return Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) });
      }
      return Promise.reject(new Error('error'));
    }));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/access forbidden/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Open Requests')).not.toBeInTheDocument();
  });
});
