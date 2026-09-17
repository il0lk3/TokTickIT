import React, { useState } from "react";
import { changePassword as apiChangePassword } from "../../api";
import PasswordRuleChecklist from "./PasswordRuleChecklist";
import { useAuth } from "../../contexts/AuthContext";

export default function ChangePassword() {
  const { refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[\W_]/.test(newPassword);

  const isRulesValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const isMatch = newPassword === confirmPassword && newPassword !== "";
  
  const isFormValid = currentPassword.trim() !== "" && isRulesValid && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await apiChangePassword(currentPassword, newPassword, confirmPassword);
      // Fetch user again to clear the requiresPasswordChange flag
      await refreshUser();
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-zen-light animate-enter">
      <div className="card glass-panel shadow-sm border-0" style={{ width: "100%", maxWidth: "420px" }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h4 className="fw-bold text-zen-primary mb-1">Update Password</h4>
            <p className="text-muted small">For your security, you must change your password before continuing.</p>
          </div>

          {error && (
            <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="currentPasswordInput" className="form-label text-muted small fw-medium mb-1">Current Password</label>
              <input
                type="password"
                className="form-control bg-light border-0"
                id="currentPasswordInput"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="newPasswordInput" className="form-label text-muted small fw-medium mb-1">New Password</label>
              <input
                type="password"
                className="form-control bg-light border-0"
                id="newPasswordInput"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div className="mt-2 p-3 bg-white bg-opacity-50 rounded border border-light">
                <PasswordRuleChecklist password={newPassword} />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPasswordInput" className="form-label text-muted small fw-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                className={`form-control bg-light border-0 ${confirmPassword && !isMatch ? 'is-invalid' : ''}`}
                id="confirmPasswordInput"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && !isMatch && (
                <div className="invalid-feedback small mt-1">Passwords do not match</div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-zen-primary w-100 fw-medium d-flex align-items-center justify-content-center gap-2 py-2"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
