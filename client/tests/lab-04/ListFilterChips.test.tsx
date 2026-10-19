import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MyTicketsRoute } from '../../src/routes/MyTicketsRoute';
import { TicketQueueRoute } from '../../src/routes/TicketQueueRoute';
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

const mockStaffUser = {
  id: 2,
  name: 'Alex Tech',
  email: 'alex@toktickit.com',
  role: 'IT_STAFF',
  requiresPasswordChange: false,
};

const mockCategories = [
  { id: 1, name: 'Hardware' },
  { id: 2, name: 'Software' },
];

describe('List Filter Chips and Count Parity (UI-FLT-01 to UI-FLT-06)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 2, name: 'Alex Tech' }]) });
      }
      if (url.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                id: 1,
                ticketNumber: 'TKT-2026-000001',
                summary: 'Sample Open Ticket',
                currentStatus: 'Open',
                requestedPriority: 'HIGH',
                itPriority: 'HIGH',
                createdAt: '2026-10-18T10:00:00.000Z',
              },
            ],
            meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      }
      if (url.includes('/api/staff/tickets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                id: 2,
                ticketNumber: 'TKT-2026-000002',
                summary: 'Sample Unassigned Ticket',
                currentStatus: 'New',
                requestedPriority: 'MEDIUM',
                itPriority: null,
                ownerId: null,
                createdAt: '2026-10-18T10:00:00.000Z',
              },
            ],
            meta: { total: 8, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UI-FLT-01: MyTickets displays active filter chip when URL has status=New,Open,Reopened', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
      }
      if (url.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [],
            meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      }
      return Promise.reject(new Error('err'));
    }));

    render(
      <MemoryRouter initialEntries={['/tickets?status=New,Open,Reopened']}>
        <AuthProvider>
          <MyTicketsRoute categories={mockCategories} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-filter-chips')).toBeInTheDocument();
    });

    expect(screen.getByText(/New, Open, Reopened|Open Requests/i)).toBeInTheDocument();
  });

  it('UI-FLT-02: TicketQueue displays active filter chips for ownerId=unassigned, active=true, itPriority=UNSET', async () => {
    render(
      <MemoryRouter initialEntries={['/queue?ownerId=unassigned&active=true&itPriority=UNSET']}>
        <AuthProvider>
          <TicketQueueRoute categories={mockCategories} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-filter-chips')).toBeInTheDocument();
    });

    const chips = screen.getByTestId('active-filter-chips');
    expect(chips).toHaveTextContent(/Owner: Unassigned/i);
    expect(chips).toHaveTextContent(/Active Only/i);
    expect(chips).toHaveTextContent(/Priority: Unset/i);
  });

  it('UI-FLT-03: clicking remove on a filter chip clears that filter', async () => {
    render(
      <MemoryRouter initialEntries={['/queue?ownerId=unassigned&active=true']}>
        <AuthProvider>
          <TicketQueueRoute categories={mockCategories} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-filter-chips')).toBeInTheDocument();
    });

    const removeUnassignedBtn = screen.getByRole('button', { name: /Remove filter: Owner: Unassigned/i });
    fireEvent.click(removeUnassignedBtn);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Remove filter: Owner: Unassigned/i })).not.toBeInTheDocument();
    });
  });

  it('UI-FLT-04: clicking Clear all filters removes all filters', async () => {
    render(
      <MemoryRouter initialEntries={['/queue?ownerId=unassigned&active=true']}>
        <AuthProvider>
          <TicketQueueRoute categories={mockCategories} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });

    const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('active-filter-chips')).not.toBeInTheDocument();
    });
  });

  it('UI-FLT-05: total count on MyTickets matches meta.total', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
      }
      if (url.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [],
            meta: { total: 42, page: 1, limit: 10, totalPages: 5 },
          }),
        });
      }
      return Promise.reject(new Error('err'));
    }));

    render(
      <MemoryRouter initialEntries={['/tickets']}>
        <AuthProvider>
          <MyTicketsRoute categories={mockCategories} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const totalCountElem = screen.getByTestId('list-total-count');
      expect(totalCountElem).toHaveTextContent('42');
    });
  });

  it('UI-FLT-06: total count on TicketQueue matches meta.total', async () => {
    render(
      <MemoryRouter initialEntries={['/queue']}>
        <AuthProvider>
          <TicketQueueRoute categories={mockCategories} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const totalCountElem = screen.getByTestId('list-total-count');
      expect(totalCountElem).toHaveTextContent('8');
    });
  });
});
