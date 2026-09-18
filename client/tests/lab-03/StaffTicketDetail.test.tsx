import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicketDetail } from '../../src/components/TicketDetail';
import { AuthProvider } from '../../src/contexts/AuthContext';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

const mockStaffUser = { id: 2, name: 'Staff User', email: 'staff@test.com', role: 'IT_STAFF', requiresPasswordChange: false };
const mockTicket = {
  id: 1,
  ticketNumber: 'TKT-2026-00001',
  categoryId: 1,
  relatedSystemId: 1,
  summary: 'Detail Test',
  description: 'Desc',
  currentStatus: 'Open',
  appearsResolved: false,
  requestedPriority: 'HIGH',
  itPriority: 'HIGH',
  createdAt: new Date().toISOString(),
  category: { id: 1, name: 'Hardware' },
  relatedSystem: { id: 1, name: 'PC' },
  requester: { id: 1, name: 'Req User' },
  attachments: [],
  publicComments: [],
  internalNotes: [],
  ownerName: null
};

describe('TicketDetail for IT Staff', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      const reqMethod = options?.method || 'GET';
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffUser) });
      }
      if (url.includes('/api/it-staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([mockStaffUser]) });
      }
      if (url.includes('/api/staff/tickets/1') && reqMethod === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicket) });
      }
      if (url.includes('/api/tickets/1') && !url.includes('staff')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicket) });
      }
      if (url.includes('/api/staff/tickets/1') && reqMethod !== 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...mockTicket, currentStatus: 'InProgress' }) });
      }
      return Promise.resolve({ ok: false });
    }));
  });

  it('renders ticket details and IT staff controls', async () => {
    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('TKT-2026-00001')).toBeInTheDocument();
    });

    // IT Priority should be a select dropdown for staff
    const prioritySelect = screen.getAllByRole('combobox').find(el => el.innerHTML.includes('High'));
    expect(prioritySelect).toBeInTheDocument();

    // Status should be a select dropdown
    const statusSelect = screen.getAllByRole('combobox').find(el => el.innerHTML.includes('In Progress'));
    expect(statusSelect).toBeInTheDocument();

    // Tabs for Comments/Notes
    expect(screen.getByText('Public Comments')).toBeInTheDocument();
    expect(screen.getByText('Internal Notes')).toBeInTheDocument();
  });

  it('shows confirmation modal for terminal status', async () => {
    render(
      <AuthProvider>
        <TicketDetail ticketId={1} onBack={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('TKT-2026-00001')).toBeInTheDocument();
    });

    // Find the status dropdown
    const combos = screen.getAllByRole('combobox');
    const statusSelect = combos[1]; // priority, status, owner
    
    fireEvent.change(statusSelect, { target: { value: 'Resolved' } });

    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to change the status to/)).toBeInTheDocument();
    });
  });
});
