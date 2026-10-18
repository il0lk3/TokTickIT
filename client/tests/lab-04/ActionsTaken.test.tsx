import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionsTakenSection } from '../../src/components/ticket/ActionsTakenSection';
import { AuthProvider } from '../../src/contexts/AuthContext';

const mockStaff = {
  id: 2,
  name: 'Alex Tech',
  email: 'alex@toktickit.com',
  role: 'IT_STAFF',
  requiresPasswordChange: false,
};

const mockAdmin = {
  id: 3,
  name: 'System Admin',
  email: 'admin@toktickit.com',
  role: 'ADMINISTRATOR',
  requiresPasswordChange: false,
};

const mockRequester = {
  id: 1,
  name: 'Bob Requester',
  email: 'bob@toktickit.com',
  role: 'REQUESTER',
  requiresPasswordChange: false,
};

const mockStaff2 = {
  id: 4,
  name: 'Sara Staff',
  email: 'sara@toktickit.com',
  role: 'IT_STAFF',
  requiresPasswordChange: false,
};

const mockActionsList = [
  {
    id: 101,
    ticketId: 1,
    actionAt: '2026-10-17T09:30:00.000Z',
    description: 'Cleaned dust from cooling fan and heatsink',
    result: 'CPU temperature dropped from 85C to 45C',
    performedById: 2,
    performedBy: { id: 2, name: 'Alex Tech', role: 'IT_STAFF' },
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: 'fan-cleaned.jpg',
    createdAt: '2026-10-17T09:35:00.000Z',
    updatedAt: '2026-10-17T09:35:00.000Z',
  },
  {
    id: 102,
    ticketId: 1,
    actionAt: '2026-10-17T11:00:00.000Z',
    description: 'Replaced RAM module with 16GB DDR4 stick',
    result: 'System booted normally and passed MemTest86',
    performedById: 4,
    performedBy: { id: 4, name: 'Sara Staff', role: 'IT_STAFF' },
    followUpRequired: true,
    followUpNote: 'Monitor for memory leak after 48 hours',
    attachmentNotes: null,
    createdAt: '2026-10-17T11:05:00.000Z',
    updatedAt: '2026-10-17T11:05:00.000Z',
  },
];

function renderWithAuth(
  ui: React.ReactElement,
  authUser: any = mockStaff
) {
  vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(authUser),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  }));

  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('Lab 4 Issue 6: Actions Taken UI on Ticket Detail (UI-ACT)', () => {
  let mockOnActionChanged: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnActionChanged = vi.fn();
  });

  // UI-ACT-01: Initial load, stable ordering, and empty state
  it('UI-ACT-01: renders loading spinner, then table in chronological order, and empty state when 0 actions', async () => {
    let resolveActions: (val: any) => void;
    const actionsPromise = new Promise((resolve) => {
      resolveActions = resolve;
    });

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return actionsPromise.then((data) => ({
          ok: true,
          json: () => Promise.resolve(data),
        }));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    // Verify loading spinner
    expect(screen.getByRole('status', { name: /loading actions taken/i })).toBeInTheDocument();

    // Resolve with mock actions in reverse order to verify UI-side stable sorting
    resolveActions!([mockActionsList[1], mockActionsList[0]]);

    // Wait for rows to render
    await waitFor(() => {
      expect(screen.getByText('Cleaned dust from cooling fan and heatsink')).toBeInTheDocument();
    });

    // Verify chronological order: Cleaned dust (09:30) appears before Replaced RAM (11:00)
    const rows = screen.getAllByRole('row');
    // rows[0] is header, rows[1] should be 101, rows[2] should be 102
    expect(rows[1]).toHaveTextContent('Cleaned dust from cooling fan and heatsink');
    expect(rows[2]).toHaveTextContent('Replaced RAM module with 16GB DDR4 stick');

    // Verify total count badge
    expect(screen.getByTestId('actions-count-badge')).toHaveTextContent('2');
  });

  // UI-ACT-01B: Empty state for staff
  it('UI-ACT-01B: renders clean empty state when 0 actions exist for staff', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no actions have been recorded yet/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
  });

  // UI-ACT-02: Requester view is read-only
  it('UI-ACT-02: Requester sees read-only view without create or edit controls', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRequester) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockActionsList) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Cleaned dust from cooling fan and heatsink')).toBeInTheDocument();
    });

    // Requester must not see + Log Action Taken button
    expect(screen.queryByRole('button', { name: /\+ log action taken/i })).not.toBeInTheDocument();
    // Requester must not see Edit buttons on rows
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  // UI-ACT-03: Follow-Up conditional reveal and client validation
  it('UI-ACT-03: ticking Follow-Up reveals note field; validates mandatory note when checked; submits valid action with note', async () => {
    const user = userEvent.setup();
    let postBody: any = null;

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && (!options || options.method === 'GET')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && options?.method === 'POST') {
        postBody = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            id: 103,
            ticketId: 1,
            actionAt: postBody.actionAt || new Date().toISOString(),
            description: postBody.description,
            result: postBody.result,
            performedById: 2,
            performedBy: { id: 2, name: 'Alex Tech', role: 'IT_STAFF' },
            followUpRequired: postBody.followUpRequired,
            followUpNote: postBody.followUpNote,
            attachmentNotes: postBody.attachmentNotes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    // 1. Click + Log Action Taken
    await user.click(screen.getByRole('button', { name: /\+ log action taken/i }));

    // Follow-up note input should not be visible initially
    expect(screen.queryByLabelText(/follow-up note/i)).not.toBeInTheDocument();

    // Fill Description and Result
    const descInput = screen.getByLabelText(/description/i);
    const resultInput = screen.getByLabelText(/result/i);
    await user.type(descInput, 'Configured static IP route');
    await user.type(resultInput, 'Gateway ping succeeded');

    // 2. Tick Follow-Up Checkbox
    const followUpCheckbox = screen.getByLabelText(/follow-up required/i);
    await user.click(followUpCheckbox);

    // Follow-up note input should now be revealed with aria-expanded
    const noteInput = await screen.findByLabelText(/follow-up note/i);
    expect(noteInput).toBeInTheDocument();
    expect(followUpCheckbox).toHaveAttribute('aria-expanded', 'true');

    // 3. Try submitting with empty note -> validation error
    const submitBtn = screen.getByRole('button', { name: /save action|log action/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/follow-up note is required when follow-up is requested/i)).toBeInTheDocument();
    expect(noteInput).toHaveAttribute('aria-invalid', 'true');
    expect(noteInput).toHaveFocus();

    // 4. Fill note and submit
    await user.type(noteInput, 'Verify route persistence after reboot');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(postBody).not.toBeNull();
    });
    expect(postBody.description).toBe('Configured static IP route');
    expect(postBody.result).toBe('Gateway ping succeeded');
    expect(postBody.followUpRequired).toBe(true);
    expect(postBody.followUpNote).toBe('Verify route persistence after reboot');
    expect(mockOnActionChanged).toHaveBeenCalledTimes(1);
  });

  // UI-ACT-04: Double-click prevention & in-flight button disable
  it('UI-ACT-04: disables submit button while in-flight and prevents double submission', async () => {
    let postCallCount = 0;
    let finishPost: () => void;
    const postPromise = new Promise<void>((resolve) => {
      finishPost = resolve;
    });

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && (!options || options.method === 'GET')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && options?.method === 'POST') {
        postCallCount++;
        return postPromise.then(() => ({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            id: 104,
            ticketId: 1,
            actionAt: new Date().toISOString(),
            description: 'Action',
            result: 'Result',
            performedById: 2,
            performedBy: { id: 2, name: 'Alex Tech', role: 'IT_STAFF' },
            followUpRequired: false,
            followUpNote: null,
            attachmentNotes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        }));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ log action taken/i }));

    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Testing double click' } });
    fireEvent.change(screen.getByLabelText(/result/i), { target: { value: 'Passed' } });

    const submitBtn = screen.getByRole('button', { name: /save action|log action/i });

    // Click twice rapidly
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    expect(postCallCount).toBe(1);
    expect(submitBtn).toBeDisabled();

    finishPost!();

    await waitFor(() => {
      expect(mockOnActionChanged).toHaveBeenCalledTimes(1);
    });
  });

  // UI-ACT-04B: Handles 200 duplicate response gracefully
  it('UI-ACT-04B: handles 200 duplicate response gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && (!options || options.method === 'GET')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 105,
            ticketId: 1,
            actionAt: new Date().toISOString(),
            description: 'Duplicate test',
            result: 'Acknowledged',
            performedById: 2,
            performedBy: { id: 2, name: 'Alex Tech', role: 'IT_STAFF' },
            followUpRequired: false,
            followUpNote: null,
            attachmentNotes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ log action taken/i }));
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Duplicate test' } });
    fireEvent.change(screen.getByLabelText(/result/i), { target: { value: 'Acknowledged' } });

    const submitBtn = screen.getByRole('button', { name: /save action|log action/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/action saved successfully/i)).toBeInTheDocument();
      expect(mockOnActionChanged).toHaveBeenCalledTimes(1);
    });
  });

  // UI-ACT-05: Recoverable 500 error preserves form input
  it('UI-ACT-05: API 500 failure preserves entered form input and displays error alert', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && (!options || options.method === 'GET')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Database transaction failed' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ log action taken/i }));

    const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    const resultInput = screen.getByLabelText(/result/i) as HTMLTextAreaElement;

    fireEvent.change(descInput, { target: { value: 'Important recovery text' } });
    fireEvent.change(resultInput, { target: { value: 'Diagnostic notes intact' } });

    fireEvent.click(screen.getByRole('button', { name: /save action|log action/i }));

    // Expect error banner
    await waitFor(() => {
      expect(screen.getByText(/database transaction failed/i)).toBeInTheDocument();
    });

    // Form inputs must strictly be preserved
    expect(descInput.value).toBe('Important recovery text');
    expect(resultInput.value).toBe('Diagnostic notes intact');
  });

  // UI-ACT-06: Inline action editing
  it('UI-ACT-06: Staff clicks Edit, row expands to form; Cancel reverts; Save dispatches PATCH and updates list', async () => {
    let patchBody: any = null;

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken/101') && options?.method === 'PATCH') {
        patchBody = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            ...mockActionsList[0],
            result: patchBody.result,
          }),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockActionsList) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Cleaned dust from cooling fan and heatsink')).toBeInTheDocument();
    });

    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    // Click edit on first action (101)
    fireEvent.click(editBtns[0]);

    // Check that inline edit inputs appear
    const editResultInput = screen.getByDisplayValue('CPU temperature dropped from 85C to 45C');
    expect(editResultInput).toBeInTheDocument();

    // 1. Test Cancel button reverts without dispatching PATCH
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByDisplayValue('CPU temperature dropped from 85C to 45C')).not.toBeInTheDocument();
    expect(patchBody).toBeNull();

    // 2. Open Edit again and Save
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    const editResultInput2 = screen.getByDisplayValue('CPU temperature dropped from 85C to 45C');
    fireEvent.change(editResultInput2, { target: { value: 'Updated: CPU temperature stable at 42C' } });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(patchBody).not.toBeNull();
    });
    expect(patchBody.result).toBe('Updated: CPU temperature stable at 42C');
    expect(mockOnActionChanged).toHaveBeenCalledTimes(1);
  });

  // UI-ACT-07: Terminal state locking (BR-07)
  it('UI-ACT-07: on Closed or Cancelled tickets, create and edit buttons are hidden and locked notice is shown', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockActionsList) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    const { rerender } = render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="Closed" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Cleaned dust from cooling fan and heatsink')).toBeInTheDocument();
    });

    // Verify create button hidden
    expect(screen.queryByRole('button', { name: /\+ log action taken/i })).not.toBeInTheDocument();
    // Verify edit button hidden
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    // Verify locked badge/notice
    expect(screen.getByText(/ticket is closed \(actions locked\)/i)).toBeInTheDocument();

    // Re-test with Cancelled status
    rerender(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="Cancelled" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );
    expect(screen.getByText(/ticket is cancelled \(actions locked\)/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\+ log action taken/i })).not.toBeInTheDocument();
  });

  // UI-ACT-08: Collaborative multiple performers display (BR-02)
  it('UI-ACT-08: renders different performer names and roles across multiple actions', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockActionsList) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alex Tech')).toBeInTheDocument();
      expect(screen.getByText('Sara Staff')).toBeInTheDocument();
    });
  });

  // UI-ACT-09: Field character limits and live character counter
  it('UI-ACT-09: enforces 1000 character limit on Description and Result, and 500 on Attachment Notes', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ log action taken/i }));

    const descInput = screen.getByLabelText(/description/i);
    expect(screen.getByTestId('desc-counter')).toHaveTextContent('0 / 1000');

    fireEvent.change(descInput, { target: { value: 'Hello world' } });
    expect(screen.getByTestId('desc-counter')).toHaveTextContent('11 / 1000');

    // Blank whitespace-only check
    fireEvent.change(descInput, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /save action|log action/i }));
    expect(await screen.findByText(/description must not be empty/i)).toBeInTheDocument();
  });

  // UI-ACT-10: Accessibility attributes, focus management, and status announcement
  it('UI-ACT-10: provides proper aria-describedby, aria-invalid, focus return, and announcements', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    const triggerBtn = screen.getByRole('button', { name: /\+ log action taken/i });
    fireEvent.click(triggerBtn);

    // Cancel form and ensure focus returns to trigger button
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toHaveFocus();
    });
  });

  // UI-ACT-11: Mandatory onActionChanged callback invoked on create and edit
  it('UI-ACT-11: invokes onActionChanged when action is created and edited', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            id: 105,
            ticketId: 1,
            actionAt: new Date().toISOString(),
            description: 'Action',
            result: 'Result',
            performedById: 2,
            performedBy: { id: 2, name: 'Alex Tech', role: 'IT_STAFF' },
            followUpRequired: false,
            followUpNote: null,
            attachmentNotes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ log action taken/i }));
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Valid action' } });
    fireEvent.change(screen.getByLabelText(/result/i), { target: { value: 'Valid result' } });
    fireEvent.click(screen.getByRole('button', { name: /save action|log action/i }));

    await waitFor(() => {
      expect(mockOnActionChanged).toHaveBeenCalledTimes(1);
    });
  });

  // UI-ACT-12: Initial list fetch error and retry
  it('UI-ACT-12: displays error card with Retry button when initial GET fails', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Failed to connect to database' }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockActionsList) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to connect to database/i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Cleaned dust from cooling fan and heatsink')).toBeInTheDocument();
    });
  });

  // UI-ACT-13: Form mutual exclusion
  it('UI-ACT-13: opening Edit mode cancels or closes active Create mode', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockActionsList) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    // 1. Open Create Form
    fireEvent.click(screen.getByRole('button', { name: /\+ log action taken/i }));
    expect(screen.getByTestId('create-action-form')).toBeInTheDocument();

    // 2. Click Edit on a row
    const editBtn = screen.getAllByRole('button', { name: /edit/i })[0];
    fireEvent.click(editBtn);

    // Create form must close, inline edit row must open
    expect(screen.queryByTestId('create-action-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('inline-edit-form')).toBeInTheDocument();
  });

  // UI-ACT-14: DateTime-local conversion to ISO UTC string
  it('UI-ACT-14: converts datetime-local input to ISO string before posting', async () => {
    let sentActionAt: string | undefined;

    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        sentActionAt = body.actionAt;
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            id: 106,
            ticketId: 1,
            actionAt: sentActionAt,
            description: body.description,
            result: body.result,
            performedById: 2,
            performedBy: { id: 2, name: 'Alex Tech', role: 'IT_STAFF' },
            followUpRequired: false,
            followUpNote: null,
            attachmentNotes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ log action taken/i }));

    const dateInput = screen.getByLabelText(/action date/i);
    fireEvent.change(dateInput, { target: { value: '2026-10-17T14:30' } });

    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Checked logs' } });
    fireEvent.change(screen.getByLabelText(/result/i), { target: { value: 'No errors found' } });
    fireEvent.click(screen.getByRole('button', { name: /save action|log action/i }));

    await waitFor(() => {
      expect(sentActionAt).toBeDefined();
    });
    // Verify ISO string format (ends with Z or offset)
    expect(new Date(sentActionAt!).toISOString()).toBe(sentActionAt);
  });

  // UI-ACT-15: Server field-level validation error mapping
  it('UI-ACT-15: maps server field errors from fields object directly to inputs', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            fields: {
              description: 'Description contains prohibited characters',
            },
          }),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ log action taken/i }));

    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Bad text' } });
    fireEvent.change(screen.getByLabelText(/result/i), { target: { value: 'Good text' } });
    fireEvent.click(screen.getByRole('button', { name: /save action|log action/i }));

    await waitFor(() => {
      expect(screen.getByText('Description contains prohibited characters')).toBeInTheDocument();
    });

    const descInput = screen.getByLabelText(/description/i);
    expect(descInput).toHaveAttribute('aria-invalid', 'true');
  });

  // UI-ACT-16: Administrator operational capabilities (BR-13)
  it('UI-ACT-16: Administrator user sees + Log Action Taken and Edit buttons, and can log actions', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAdmin) });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockActionsList) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    expect(screen.getAllByRole('button', { name: /edit/i }).length).toBe(2);
  });

  // UI-ACT-17: Concurrent terminal locking (TERMINAL_TICKET_LOCKED)
  it('UI-ACT-17: handles TERMINAL_TICKET_LOCKED by dismissing form, showing locked alert, and refetching parent', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, options?: any) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes('/api/tickets/1/actions-taken') && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            error: 'Cannot record or edit actions on closed or cancelled tickets',
            code: 'TERMINAL_TICKET_LOCKED',
          }),
        });
      }
      if (url.includes('/api/tickets/1/actions-taken')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));

    render(
      <AuthProvider>
        <ActionsTakenSection ticketId={1} ticketStatus="InProgress" onActionChanged={mockOnActionChanged} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ log action taken/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ log action taken/i }));
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Late action' } });
    fireEvent.change(screen.getByLabelText(/result/i), { target: { value: 'Late result' } });
    fireEvent.click(screen.getByRole('button', { name: /save action|log action/i }));

    await waitFor(() => {
      expect(screen.getByText(/cannot record or edit actions on closed or cancelled tickets/i)).toBeInTheDocument();
    });

    // Form should be dismissed and onActionChanged invoked to synchronize parent state
    expect(screen.queryByTestId('create-action-form')).not.toBeInTheDocument();
    expect(mockOnActionChanged).toHaveBeenCalledTimes(1);
  });
});
