import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password. Please try again.");
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
      <div className="card shadow-sm border-0" style={{ width: "100%", maxWidth: "480px", borderRadius: "10px", overflow: "hidden" }}>
        
        <div className="bg-zen-primary text-white d-flex align-items-center gap-2 p-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <h5 className="mb-0 fw-bold">TokTickIT</h5>
        </div>

        <div className="p-3 p-md-4">
          <div className="border rounded p-4" style={{ borderColor: '#e9ecef' }}>
            <h5 className="fw-bold text-dark mb-4">Sign in to your account</h5>

            {error && (
              <div className="alert alert-danger py-2 px-3 small d-flex gap-2 mb-4" style={{ backgroundColor: '#fde9e8', color: '#c62828', borderColor: '#f8d5d4' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '18px', marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                  <span className="d-block fw-medium">{error}</span>
                  <span>Please try again.</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <fieldset disabled={isSubmitting} className="border-0 p-0 m-0">
                <div className="mb-3">
                  <label htmlFor="emailInput" className="form-label text-dark small fw-medium mb-1">Email address</label>
                  <input
                    type="email"
                    className="form-control bg-white"
                    style={{ border: '1px solid #ced4da' }}
                    id="emailInput"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="passwordInput" className="form-label text-dark small fw-medium mb-1">Password</label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control bg-white pe-5"
                      style={{ border: '1px solid #ced4da' }}
                      id="passwordInput"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button 
                      type="button" 
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none px-3 py-0" 
                      onClick={() => setShowPassword(!showPassword)} 
                      tabIndex={-1}
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 fw-medium d-flex align-items-center justify-content-center gap-2 py-2 mb-3"
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

                <div className="text-center mt-3">
                  <a href="#" className="small fw-medium text-zen-primary text-decoration-none" onClick={(e) => e.preventDefault()}>
                    Forgot your password?
                  </a>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
