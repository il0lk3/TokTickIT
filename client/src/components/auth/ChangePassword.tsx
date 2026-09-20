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
  
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  const toggleVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(newPassword);

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {visible ? (
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"></path>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </>
      )}
    </svg>
  );

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-zen-light animate-enter">
      <div className="card glass-panel shadow-sm border-0" style={{ width: "100%", maxWidth: "480px" }}>
        <div className="p-3 p-md-4">
          <div className="border rounded p-4" style={{ borderColor: '#e9ecef' }}>
            <div className="mb-4">
              <h4 className="fw-bold text-dark mb-1">Change Your Password</h4>
              <p className="text-muted small">You must change your password to continue.</p>
            </div>

            {error && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4" style={{ backgroundColor: 'var(--zen-error-bg)', color: 'var(--zen-error)', borderColor: 'rgba(211,47,47,0.2)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <fieldset disabled={isSubmitting} className="border-0 p-0 m-0">
                <div className="mb-3">
                  <label htmlFor="currentPasswordInput" className="form-label text-dark small fw-medium mb-1">Current (temporary) password</label>
                  <div className="position-relative">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      className="form-control bg-light border-0 pe-5"
                      id="currentPasswordInput"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button type="button" className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none px-3 py-0" onClick={() => toggleVisibility('current')} tabIndex={-1}>
                      <EyeIcon visible={showPassword.current} />
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="newPasswordInput" className="form-label text-dark small fw-medium mb-1">New password</label>
                  <div className="position-relative">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      className="form-control bg-light border-0 pe-5"
                      id="newPasswordInput"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button type="button" className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none px-3 py-0" onClick={() => toggleVisibility('new')} tabIndex={-1}>
                      <EyeIcon visible={showPassword.new} />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPasswordInput" className="form-label text-dark small fw-medium mb-1">Confirm new password</label>
                  <div className="position-relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      className={`form-control bg-light border-0 pe-5 ${confirmPassword && !isMatch ? 'is-invalid' : ''}`}
                      id="confirmPasswordInput"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button type="button" className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none px-3 py-0" onClick={() => toggleVisibility('confirm')} tabIndex={-1}>
                      <EyeIcon visible={showPassword.confirm} />
                    </button>
                  </div>
                  {confirmPassword && !isMatch && (
                    <div className="invalid-feedback small mt-1 d-block">Passwords do not match</div>
                  )}
                </div>

                <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#eef8f2', border: '1px solid #d4edda' }}>
                  <p className="fw-bold text-dark small mb-2">Password must:</p>
                  <PasswordRuleChecklist password={newPassword} />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 fw-medium d-flex align-items-center justify-content-center gap-2 py-2"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
