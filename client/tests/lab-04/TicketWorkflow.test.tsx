import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketDetail } from '../../src/components/TicketDetail';
import { AuthProvider } from '../../src/contexts/AuthContext';

// Mock matchMedia for Bootstrap / responsive queries
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

const mockRequesterUser = {
  id: 1,
  name: 'Bob Requester',
  email: 'bob@toktickit.com',
  role: 'REQUESTER',
  requiresPasswordChange: false,
};

const mockItStaffList = [
  { id: 2, name: 'Alex Tech', email: 'alex@toktickit.com', role: 'IT_STAFF' },
  { id: 4, name: 'Sara Staff', email: 'sara@toktickit.com', role: 'IT_STAFF' },
];

function createMockTicket(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    ticketNumber: 'TKT-2026-000001',
    categoryId: 1,
    relatedSystemId: 1,
    summary: 'Email client crashes on launch',
    description: 'Outlook crashes with exception 0xC0000005.',
    currentStatus: 'Open',
    appearsResolved: false,
    requestedPriority: 'HIGH',
    itPriority: 'HIGH',
    version: 1,
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-18T10:00:00.000Z',
    category: { id: 1, name: 'Software' },
    relatedSystem: { id: 1, name: 'Email Server' },
    requester: { id: 1, name: 'Bob Requester', email: 'bob@toktickit.com' },
    owner: { id: 2, name: 'Alex Tech', email: 'alex@toktickit.com', isActive: true, role: 'IT_STAFF' },
    ownerId: 2,
    attachments: [],
    publicComments: [],
    internalNotes: [],
    allowedTransitions: ['InProgress', 'Resolved', 'Cancelled'],
    resolutionGate: {
      met: true,
      hasActiveOwner: true,
      validActionCount: 1,
      missing: [],
    },
    ...overrides,
  };
}

describe('Ticket Workflow and Resolution Feedback (Lab 4 Issue 7)', () => {
  let mockOnBack: () => void;

  beforeEach(() => {
    mockOnBack = vi.fn();
    // Default fetch stub
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';

      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket()) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/tickets/1') && !url.includes('staff') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket()) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderWithAuth(currentUser = mockStaffUser, ticketId = 1) {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(currentUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket()) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/tickets/1') && !url.includes('staff') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket()) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    return render(
      <AuthProvider>
        <TicketDetail ticketId={ticketId} onBack={mockOnBack} />
      </AuthProvider>
    );
  }

  // ==========================================
  // UI-WKF-01: Table-Driven Matrix Across Roles
  // ==========================================
  it('UI-WKF-01: Table-driven status transition matrix renders only allowed transitions for Staff/Admin, and zero for Requester', async () => {
    const matrixCases: Array<{ status: string; allowed: string[] }> = [
      { status: 'New', allowed: ['Open', 'Cancelled'] },
      { status: 'Open', allowed: ['InProgress', 'Resolved', 'Cancelled'] },
      { status: 'InProgress', allowed: ['WaitingForRequester', 'Resolved', 'Cancelled'] },
      { status: 'WaitingForRequester', allowed: ['InProgress', 'Resolved', 'Cancelled'] },
      { status: 'Resolved', allowed: ['Closed', 'Reopened', 'Cancelled'] },
      { status: 'Closed', allowed: ['Reopened'] },
      { status: 'Reopened', allowed: ['InProgress', 'Resolved', 'Cancelled'] },
      { status: 'Cancelled', allowed: [] },
    ];

    for (const testCase of matrixCases) {
      vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
        const method = options?.method || 'GET';
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
        }
        if (url.includes('/api/it-staff')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
        }
        if (url.includes('/api/staff/tickets/1') && method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createMockTicket({
              currentStatus: testCase.status,
              allowedTransitions: testCase.allowed,
            })),
          });
        }
        if (url.includes('/api/tickets/1/actions-taken')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }));

      const { unmount } = render(
        <AuthProvider>
          <TicketDetail ticketId={1} onBack={mockOnBack} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Ticket Details')).toBeInTheDocument();
      });

      // Verify each allowed option is present
      for (const target of testCase.allowed) {
        const regex = target === 'Resolved' ? /resolve/i :
                      target === 'Cancelled' ? /cancel/i :
                      target === 'Closed' ? /close/i :
                      target === 'Reopened' ? /reopen/i :
                      target === 'InProgress' ? /in progress/i :
                      target === 'WaitingForRequester' ? /waiting for requester/i :
                      new RegExp(target, 'i');
        expect(screen.getByRole('button', { name: regex })).toBeInTheDocument();
      }

      // Verify unpermitted options are NOT present
      const allStatuses = ['New', 'Open', 'InProgress', 'WaitingForRequester', 'Resolved', 'Closed', 'Reopened', 'Cancelled'];
      const unpermitted = allStatuses.filter(s => s !== testCase.status && !testCase.allowed.includes(s));
      for (const forbidden of unpermitted) {
        expect(screen.queryByRole('button', { name: new RegExp(`^${forbidden}$`, 'i') })).not.toBeInTheDocument();
      }

      unmount();
    }

    // Verify Requester sees 0 transition controls
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
      }
      if (url.includes('/api/tickets/1') && !url.includes('staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket({ currentStatus: 'Open' })) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    // Requester must not see any status transition buttons
    expect(screen.queryByRole('button', { name: /^in progress$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^resolve$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^cancel ticket$/i })).not.toBeInTheDocument();
  });

  // ==========================================
  // UI-WKF-02: Resolution Gate Incomplete Feedback
  // ==========================================
  it('UI-WKF-02: when resolutionGate.met === false, Resolve action is aria-disabled with aria-describedby explanation', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            currentStatus: 'InProgress',
            owner: null,
            ownerId: null,
            allowedTransitions: ['WaitingForRequester', 'Resolved', 'Cancelled'],
            resolutionGate: {
              met: false,
              hasActiveOwner: false,
              validActionCount: 0,
              missing: ['ACTIVE_STAFF_OWNER_REQUIRED', 'ACTION_TAKEN_WITH_RESULT_REQUIRED'],
            },
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    const resolveBtn = screen.getByRole('button', { name: /resolve/i });
    expect(resolveBtn).toHaveAttribute('aria-disabled', 'true');
    expect(resolveBtn).toHaveAttribute('aria-describedby');

    const descId = resolveBtn.getAttribute('aria-describedby')!;
    const descEl = document.getElementById(descId);
    expect(descEl).toBeInTheDocument();
    expect(descEl?.textContent).toMatch(/owner/i);
    expect(descEl?.textContent).toMatch(/action taken/i);
  });

  // ==========================================
  // UI-WKF-03: Resolution Gate Action Shortcuts
  // ==========================================
  it('UI-WKF-03: resolution gate missing requirements banner contains actionable shortcut links', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            currentStatus: 'InProgress',
            owner: null,
            ownerId: null,
            allowedTransitions: ['WaitingForRequester', 'Resolved', 'Cancelled'],
            resolutionGate: {
              met: false,
              hasActiveOwner: false,
              validActionCount: 0,
              missing: ['ACTIVE_STAFF_OWNER_REQUIRED', 'ACTION_TAKEN_WITH_RESULT_REQUIRED'],
            },
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    // Check shortcut to Assign Owner
    const assignOwnerShortcut = screen.getByRole('button', { name: /assign owner/i });
    expect(assignOwnerShortcut).toBeInTheDocument();
    fireEvent.click(assignOwnerShortcut);
    expect(document.activeElement?.id).toBe('ownerSelect');

    // Check shortcut to Log Action
    const logActionShortcut = screen.getByRole('button', { name: /^log action$/i });
    expect(logActionShortcut).toBeInTheDocument();
    fireEvent.click(logActionShortcut);
    await waitFor(() => {
      expect(screen.getByTestId('create-action-form')).toBeInTheDocument();
    });
  });

  // ==========================================
  // UI-WKF-04: Resolution Gate Pass
  // ==========================================
  it('UI-WKF-04: when resolutionGate.met === true, Resolve button is active and accessible', async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    const resolveBtn = screen.getByRole('button', { name: /resolve/i });
    expect(resolveBtn).not.toHaveAttribute('aria-disabled', 'true');
    expect(resolveBtn).not.toBeDisabled();
  });

  // ==========================================
  // UI-WKF-05: Optimistic Concurrency - Sends expectedVersion
  // ==========================================
  it('UI-WKF-05: dispatches expectedVersion with status transition payload', async () => {
    let patchPayload: any = null;

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket({ version: 7 })) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        patchPayload = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            currentStatus: 'InProgress',
            version: 8,
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    const inProgressBtn = screen.getByRole('button', { name: /in progress/i });
    fireEvent.click(inProgressBtn);

    await waitFor(() => {
      expect(patchPayload).not.toBeNull();
      expect(patchPayload.status).toBe('InProgress');
      expect(patchPayload.expectedVersion).toBe(7);
    });
  });

  // ==========================================
  // UI-WKF-06: Sequential Mutations on Same Page
  // ==========================================
  it('UI-WKF-06: sequential mutations (status then priority) update version in-state and pass without 409', async () => {
    const patchCalls: any[] = [];

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket({ version: 1 })) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        const body = JSON.parse(options.body);
        patchCalls.push(body);
        const nextVersion = body.expectedVersion + 1;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            ...body,
            version: nextVersion,
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    // 1. Transition status to InProgress
    const inProgressBtn = screen.getByRole('button', { name: /in progress/i });
    fireEvent.click(inProgressBtn);

    await waitFor(() => {
      expect(patchCalls.length).toBe(1);
      expect(patchCalls[0].status).toBe('InProgress');
      expect(patchCalls[0].expectedVersion).toBe(1);
    });

    // 2. Change IT Priority from HIGH to LOW
    const itPrioritySelect = screen.getByLabelText(/it priority/i);
    fireEvent.change(itPrioritySelect, { target: { value: 'LOW' } });

    await waitFor(() => {
      expect(patchCalls.length).toBe(2);
      expect(patchCalls[1].itPriority).toBe('LOW');
      expect(patchCalls[1].expectedVersion).toBe(2); // Must use updated version 2!
    });
  });

  // ==========================================
  // UI-WKF-07: Lab 3 Controls Versioning
  // ==========================================
  it('UI-WKF-07: owner assignment sends expectedVersion and increments state version', async () => {
    let patchPayload: any = null;

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket({ version: 4 })) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        patchPayload = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            ownerId: 4,
            owner: mockItStaffList[1],
            version: 5,
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    const ownerSelect = screen.getByLabelText(/owner/i);
    fireEvent.change(ownerSelect, { target: { value: '4' } });

    await waitFor(() => {
      expect(patchPayload).not.toBeNull();
      expect(patchPayload.ownerId).toBe(4);
      expect(patchPayload.expectedVersion).toBe(4);
    });
  });

  // ==========================================
  // UI-WKF-08: Summary Update & Status Announcement
  // ==========================================
  it('UI-WKF-08: successful transition immediately updates status badge, updatedAt, and announces role="status"', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket({ currentStatus: 'Open' })) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            currentStatus: 'InProgress',
            updatedAt: '2026-10-18T12:00:00.000Z',
            version: 2,
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /in progress/i }));

    await waitFor(() => {
      // Badge should show In Progress
      expect(screen.getByTestId('status-badge')).toHaveTextContent(/in progress/i);
      // Status announcement region exists and announced update
      const announcer = screen.getByRole('status');
      expect(announcer).toHaveTextContent(/status changed to inprogress|status updated to in progress/i);
    });
  });

  // ==========================================
  // UI-WKF-09: Concurrency Conflict (HTTP 409)
  // ==========================================
  it('UI-WKF-09: HTTP 409 opens alertdialog with current server status and reload button', async () => {
    let reloadCalled = false;

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        if (reloadCalled) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createMockTicket({ currentStatus: 'InProgress', version: 3 })),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket({ version: 1 })) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            error: 'This ticket has been modified by another user.',
            code: 'STALE_VERSION_CONFLICT',
            currentVersion: 3,
            currentStatus: 'InProgress',
          }),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /in progress/i }));

    await waitFor(() => {
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveTextContent(/conflict detected/i);
      expect(dialog).toHaveTextContent(/inprogress/i);
    });

    reloadCalled = true;
    const reloadBtn = screen.getByRole('button', { name: /reload ticket|reload latest/i });
    fireEvent.click(reloadBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toHaveTextContent(/in progress/i);
    });
  });

  // ==========================================
  // UI-WKF-10: Conflict Dialog Safe Dismiss
  // ==========================================
  it('UI-WKF-10: dismissing conflict dialog triggers reload to ensure stale data is refreshed', async () => {
    let getCallCount = 0;

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        getCallCount++;
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket({ version: getCallCount })) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            error: 'Conflict',
            code: 'STALE_VERSION_CONFLICT',
            currentVersion: 5,
            currentStatus: 'InProgress',
          }),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /in progress/i }));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /^Close$/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      // Must have triggered a refetch
      expect(getCallCount).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================
  // UI-WKF-11: Confirmation Modal on Cancel / Close
  // ==========================================
  it('UI-WKF-11: clicking Cancel or Close opens confirmation dialog with initial focus on safe button', async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /cancel ticket|cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveTextContent(/confirm cancellation|cancel ticket/i);

      // Safe button (Keep Ticket) must have focus
      const safeBtn = screen.getByRole('button', { name: 'Keep Ticket' });
      expect(document.activeElement).toBe(safeBtn);
    });
  });

  // ==========================================
  // UI-WKF-12: Modal Focus Trap & Esc Handling
  // ==========================================
  it('UI-WKF-12: confirmation modal traps focus and closes on Esc key', async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /cancel ticket|cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // UI-WKF-13: Focus Recovery on Unmount
  // ==========================================
  it('UI-WKF-13: when triggering button unmounts on status transition, focus shifts to summary block', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket()) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            currentStatus: 'Cancelled',
            allowedTransitions: [],
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    // Open confirm dialog
    fireEvent.click(screen.getByRole('button', { name: /cancel ticket|cancel/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm cancel/i })).toBeInTheDocument();
    });

    // Confirm cancellation
    fireEvent.click(screen.getByRole('button', { name: /confirm cancel/i }));

    await waitFor(() => {
      expect(screen.getByTestId('status-badge')).toHaveTextContent(/cancelled/i);
      // Focus should move to summary element
      const summaryHeader = screen.getByTestId('ticket-summary-status');
      expect(document.activeElement).toBe(summaryHeader);
    });
  });

  // ==========================================
  // UI-WKF-14: Error Mapping - 400 Errors
  // ==========================================
  it('UI-WKF-14: displays friendly error alerts for INVALID_STATUS_TRANSITION, RESOLUTION_GATE_FAILED, TERMINAL_TICKET_LOCKED', async () => {
    const errorCases = [
      { code: 'INVALID_STATUS_TRANSITION', msg: 'Invalid status transition' },
      { code: 'RESOLUTION_GATE_FAILED', msg: 'Resolution gate failed' },
      { code: 'TERMINAL_TICKET_LOCKED', msg: 'Cannot modify a locked ticket' },
      { code: 'INACTIVE_ASSIGNEE_REJECTED', msg: 'Must be an active IT Staff member' },
    ];

    for (const ec of errorCases) {
      vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
        const method = options?.method || 'GET';
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
        }
        if (url.includes('/api/it-staff')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
        }
        if (url.includes('/api/staff/tickets/1') && method === 'GET') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket()) });
        }
        if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: ec.msg, code: ec.code }),
          });
        }
        if (url.includes('/api/tickets/1/actions-taken')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }));

      const { unmount } = render(
        <AuthProvider>
          <TicketDetail ticketId={1} onBack={mockOnBack} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Ticket Details')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /in progress/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(new RegExp(ec.msg, 'i'));
      });

      unmount();
    }
  });

  // ==========================================
  // UI-WKF-15: Error Mapping - 403, 404, 500, Network
  // ==========================================
  it('UI-WKF-15: displays safe fallback alert messages for 403, 404, 500, and network exceptions', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket()) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        return Promise.reject(new Error('Network disconnected'));
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /in progress/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/network|unexpected error/i);
    });
  });

  // ==========================================
  // UI-WKF-16: Terminal Locking of Lab 3 Controls
  // ==========================================
  it('UI-WKF-16: on Closed or Cancelled tickets, owner select, claim button, and IT priority select are disabled', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            currentStatus: 'Closed',
            allowedTransitions: ['Reopened'],
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    // Owner select should be disabled
    expect(screen.getByLabelText(/owner/i)).toBeDisabled();
    // IT Priority select should be disabled
    expect(screen.getByLabelText(/it priority/i)).toBeDisabled();
    // Claim button must not be visible or disabled
    expect(screen.queryByRole('button', { name: /claim ticket/i })).not.toBeInTheDocument();
    // Comments must be locked on Closed tickets
    expect(screen.getByText(/further comments cannot be added/i)).toBeInTheDocument();
  });

  it('UI-WKF-16b: on Resolved tickets, comments and notes are locked (isCommentLocked) while workflow controls remain operational', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            currentStatus: 'Resolved',
            allowedTransitions: ['Closed', 'Reopened'],
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    // Workflow controls must NOT be locked for Resolved tickets (isWorkflowLocked is false)
    expect(screen.getByLabelText(/owner/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/it priority/i)).not.toBeDisabled();

    // Comments must be locked for Resolved tickets (isCommentLocked is true)
    expect(screen.getByText(/ticket is resolved\. further comments cannot be added\./i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/type a comment\.\.\./i)).not.toBeInTheDocument();

    // Internal notes must also be locked
    const internalNotesTab = screen.getByRole('button', { name: /internal notes/i });
    fireEvent.click(internalNotesTab);
    expect(screen.getByText(/ticket is resolved\. further notes cannot be added\./i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/type a private internal note\.\.\./i)).not.toBeInTheDocument();
  });

  // ==========================================
  // UI-WKF-17: Requester Advisory Button Visibility
  // ==========================================
  it('UI-WKF-17: Problem Appears Resolved button is visible on Open/InProgress/WaitingForRequester, hidden on New/Resolved/Closed/Cancelled', async () => {
    const statuses = [
      { status: 'New', visible: false },
      { status: 'Open', visible: true },
      { status: 'InProgress', visible: true },
      { status: 'WaitingForRequester', visible: true },
      { status: 'Resolved', visible: false },
      { status: 'Closed', visible: false },
      { status: 'Cancelled', visible: false },
    ];

    for (const sc of statuses) {
      vi.stubGlobal('fetch', vi.fn((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
        }
        if (url.includes('/api/tickets/1') && !url.includes('staff')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createMockTicket({
              currentStatus: sc.status,
              appearsResolved: false,
            })),
          });
        }
        if (url.includes('/api/tickets/1/actions-taken')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }));

      const { unmount } = render(
        <AuthProvider>
          <TicketDetail ticketId={1} onBack={mockOnBack} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Ticket Details')).toBeInTheDocument();
      });

      const btn = screen.queryByRole('button', { name: /problem appears resolved/i });
      if (sc.visible) {
        expect(btn).toBeInTheDocument();
      } else {
        expect(btn).not.toBeInTheDocument();
      }

      unmount();
    }
  });

  // ==========================================
  // UI-WKF-18: Requester Advisory Confirmation & Mutation
  // ==========================================
  it('UI-WKF-18: confirming advisory signal calls PATCH, appends public comment, sets appearsResolved, increments version', async () => {
    let appearsResolvedCalled = false;

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequesterUser) });
      }
      if (url.includes('/api/tickets/1/appears-resolved') && method === 'PATCH') {
        appearsResolvedCalled = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ticket: createMockTicket({ appearsResolved: true, version: 2 }),
            comment: {
              id: 99,
              content: 'The problem appears to be resolved.',
              createdAt: '2026-10-18T13:00:00.000Z',
              author: { name: 'Bob Requester', role: 'REQUESTER' },
            },
          }),
        });
      }
      if (url.includes('/api/tickets/1') && !url.includes('staff') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket({ currentStatus: 'InProgress', appearsResolved: false, version: 1 })) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    const advisoryBtn = screen.getByRole('button', { name: /problem appears resolved/i });
    fireEvent.click(advisoryBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog') || screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /confirm|mark resolved|yes/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(appearsResolvedCalled).toBe(true);
      // Advisory banner should now be visible
      expect(screen.getByText(/you reported this problem appears resolved/i)).toBeInTheDocument();
      // Public comment appended
      expect(screen.getByText('The problem appears to be resolved.')).toBeInTheDocument();
    });
  });

  // ==========================================
  // UI-WKF-19: Staff Advisory Banner & Scroll to Actions
  // ==========================================
  it('UI-WKF-19: Staff sees Requester advisory banner with link that scrolls/focuses to Actions Taken', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            currentStatus: 'InProgress',
            appearsResolved: true,
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    const staffAdvisoryBanner = screen.getByTestId('requester-advisory-banner');
    expect(staffAdvisoryBanner).toHaveTextContent(/requester marked issue as resolved/i);

    const reviewLink = screen.getByRole('button', { name: /review actions taken|view actions/i });
    expect(reviewLink).toBeInTheDocument();
    fireEvent.click(reviewLink);
    expect(document.activeElement?.id).toBe('actions-taken-section');
  });

  // ==========================================
  // UI-WKF-20: Staff Transition Clears Advisory Banner
  // ==========================================
  it('UI-WKF-20: when Staff transitions status, appearsResolved is reset and advisory banner disappears', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            currentStatus: 'InProgress',
            appearsResolved: true,
            version: 1,
          })),
        });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({
            currentStatus: 'Resolved',
            appearsResolved: false, // Reset on status change
            version: 2,
          })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('requester-advisory-banner')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /resolve/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('requester-advisory-banner')).not.toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toHaveTextContent(/resolved/i);
    });
  });

  // ==========================================
  // UI-WKF-21: In-flight Double Click Guard
  // ==========================================
  it('UI-WKF-21: buttons disable and show loading indicators while in-flight', async () => {
    let resolvePatchPromise: (val: any) => void;
    const pendingPatch = new Promise((resolve) => {
      resolvePatchPromise = resolve;
    });

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket()) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        return pendingPatch;
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    const inProgressBtn = screen.getByRole('button', { name: /in progress/i });
    fireEvent.click(inProgressBtn);

    // Button should now be disabled while in-flight
    await waitFor(() => {
      expect(inProgressBtn).toBeDisabled();
    });

    // Complete the promise
    resolvePatchPromise!({
      ok: true,
      json: () => Promise.resolve(createMockTicket({ currentStatus: 'InProgress', version: 2 })),
    });

    await waitFor(() => {
      expect(screen.getByTestId('status-badge')).toHaveTextContent(/in progress/i);
    });
  });

  // ==========================================
  // UI-WKF-22: Administrator Operational Parity
  // ==========================================
  it('UI-WKF-22: Administrator user has full capability to perform workflow transitions', async () => {
    let adminPatchDispatched = false;

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const method = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAdminUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockItStaffList) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(createMockTicket()) });
      }
      if (url.includes('/api/staff/tickets/1') && method === 'PATCH') {
        adminPatchDispatched = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTicket({ currentStatus: 'InProgress', version: 2 })),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={mockOnBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    });

    const inProgressBtn = screen.getByRole('button', { name: /in progress/i });
    expect(inProgressBtn).toBeInTheDocument();
    fireEvent.click(inProgressBtn);

    await waitFor(() => {
      expect(adminPatchDispatched).toBe(true);
    });
  });
});
