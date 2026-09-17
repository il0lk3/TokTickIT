import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChangePassword from "../../src/components/auth/ChangePassword";
import { AuthProvider } from "../../src/contexts/AuthContext";
import * as api from "../../src/api";

vi.mock("../../src/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/api")>();
  return {
    ...actual,
    changePassword: vi.fn(),
    getMe: vi.fn().mockResolvedValue({
      id: 1, name: "Test User", email: "test@toktick.com", role: "REQUESTER", requiresPasswordChange: true
    })
  };
});

describe("ChangePassword Component", () => {
  it("renders password inputs and checklist", async () => {
    render(<AuthProvider><ChangePassword /></AuthProvider>);
    
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    
    // Checklist items
    expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Uppercase and lowercase letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Numbers and special characters/i)).toBeInTheDocument();
  });

  it("updates password rule checklist correctly", async () => {
    render(<AuthProvider><ChangePassword /></AuthProvider>);
    const newPasswordInput = screen.getByLabelText(/^new password/i);

    // Initial state: not checked
    const lengthRule = screen.getByText(/At least 8 characters/i);
    expect(lengthRule).toHaveClass("text-muted");

    // Type 8 characters, but no upper/lower/numbers
    fireEvent.change(newPasswordInput, { target: { value: "abcdefgh" } });
    expect(lengthRule).toHaveClass("text-success"); // Should be checked

    // Type upper/lower
    const caseRule = screen.getByText(/Uppercase and lowercase letters/i);
    fireEvent.change(newPasswordInput, { target: { value: "aB" } });
    expect(caseRule).toHaveClass("text-success");
    expect(lengthRule).toHaveClass("text-muted"); // Length failed

    // Type number and special
    const specialRule = screen.getByText(/Numbers and special characters/i);
    fireEvent.change(newPasswordInput, { target: { value: "1!" } });
    expect(specialRule).toHaveClass("text-success");
  });

  it("blocks submission if passwords do not match", async () => {
    render(<AuthProvider><ChangePassword /></AuthProvider>);
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: "NewValid1!" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "NewValid2!" } });

    const submitBtn = screen.getByRole("button", { name: /update password/i });
    expect(submitBtn).toBeDisabled();
  });

  it("allows submission when rules are met and calls api", async () => {
    vi.mocked(api.changePassword).mockResolvedValueOnce(undefined);
    render(<AuthProvider><ChangePassword /></AuthProvider>);
    
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: "NewValid1!" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "NewValid1!" } });

    const submitBtn = screen.getByRole("button", { name: /update password/i });
    expect(submitBtn).not.toBeDisabled();
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.changePassword).toHaveBeenCalledWith("Password123!", "NewValid1!", "NewValid1!");
    });
  });
});
