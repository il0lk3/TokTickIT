import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../../src/App';
import * as AuthContextModule from '../../src/contexts/AuthContext';

// Mock the components so we just test the routing logic of AppShell
vi.mock('../../src/components/auth/Login', () => ({
  default: () => <div data-testid="login-mock">Login Screen</div>
}));

vi.mock('../../src/components/auth/ChangePassword', () => ({
  default: () => <div data-testid="change-password-mock">Change Password Screen</div>
}));

vi.mock('../../src/components/MyTickets', () => ({
  MyTickets: () => <div data-testid="my-tickets-mock">My Tickets Screen</div>
}));

// Mock checkSystem API call
vi.mock('../../src/api', () => ({
  checkSystem: vi.fn().mockResolvedValue({ online: true, categories: [] })
}));

describe('App Shell Routing (AC-01/02/11)', () => {
  it('renders Login screen when user is unauthenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });

    render(<App />);
    expect(screen.getByTestId('login-mock')).toBeInTheDocument();
  });

  it('renders Change Password screen when user requires password change', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'Test', email: 'test@example.com', role: 'REQUESTER', requiresPasswordChange: true },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });

    render(<App />);
    expect(screen.getByTestId('change-password-mock')).toBeInTheDocument();
  });

  it('renders Main App when user is authenticated and password change is not required', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'Test', email: 'test@example.com', role: 'REQUESTER', requiresPasswordChange: false },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    });

    render(<App />);
    
    // Wait for the async appState to resolve
    await waitFor(() => {
      expect(screen.getByTestId('my-tickets-mock')).toBeInTheDocument();
    });
    
    // Verify navbar is rendered
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
