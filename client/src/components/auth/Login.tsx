import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-zen-light animate-enter">
      <div className="card glass-panel shadow-sm border-0" style={{ width: "100%", maxWidth: "420px" }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--zen-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <h3 className="fw-bold text-zen-primary mb-1">TokTickIT</h3>
            <p className="text-muted small">Sign in to your account</p>
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
            <fieldset disabled={isSubmitting} className="border-0 p-0 m-0">
              <div className="mb-3">
                <label htmlFor="emailInput" className="form-label text-muted small fw-medium mb-1">Email</label>
                <input
                  type="email"
                  className="form-control bg-light border-0"
                  id="emailInput"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="passwordInput" className="form-label text-muted small fw-medium mb-0">Password</label>
                  <a href="#" className="small text-decoration-none text-zen-primary" onClick={(e) => e.preventDefault()}>
                    Forgot your password?
                  </a>
                </div>
                <input
                  type="password"
                  className="form-control bg-light border-0"
                  id="passwordInput"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

            <button 
              type="submit" 
              className="btn btn-zen-primary w-100 fw-medium d-flex align-items-center justify-content-center gap-2 py-2"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}
