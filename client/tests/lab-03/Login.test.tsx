import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Login from "../../src/components/auth/Login";
import { AuthProvider } from "../../src/contexts/AuthContext";
import * as api from "../../src/api";

vi.mock("../../src/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/api")>();
  return {
    ...actual,
    login: vi.fn(),
  };
});

describe("Login Component", () => {
  it("renders email and password inputs", () => {
    render(<AuthProvider><Login /></AuthProvider>);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("has a 'Forgot your password?' link placeholder", () => {
    render(<AuthProvider><Login /></AuthProvider>);
    expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument();
  });

  it("shows generic error on login failure (invalid credentials or inactive)", async () => {
    vi.mocked(api.login).mockRejectedValueOnce(new Error("Invalid email or password"));
    render(<AuthProvider><Login /></AuthProvider>);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("disables button when fields are empty", () => {
    render(<AuthProvider><Login /></AuthProvider>);
    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    
    // Initial state empty
    expect(submitBtn).toBeDisabled();

    // Fill one
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    expect(submitBtn).toBeDisabled();

    // Fill both
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });
    expect(submitBtn).not.toBeDisabled();
  });
});
