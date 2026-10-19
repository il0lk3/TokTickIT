import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRequesterDashboard, RequesterDashboardResponse } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { MetricCard } from "./MetricCard";
import { DashboardForbidden } from "./DashboardForbidden";
import { DashboardSkeleton } from "./DashboardSkeleton";

export function RequesterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<RequesterDashboardResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialError, setInitialError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const refreshButtonRef = useRef<HTMLButtonElement | null>(null);

  const fetchDashboard = useCallback(async (isBackground = false) => {
    // Increment request sequence to avoid race conditions
    const currentRequestId = ++requestIdRef.current;

    // Abort any prior in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (isBackground) {
      setIsRefreshing(true);
      setRefreshError("");
    } else {
      setInitialLoading(true);
      setInitialError("");
    }

    try {
      const result = await getRequesterDashboard(abortControllerRef.current.signal);

      // If a newer request was dispatched, discard this response
      if (currentRequestId !== requestIdRef.current) return;

      setData(result);
      setIsForbidden(false);
      setLiveStatus(isBackground ? "Dashboard updated" : "Dashboard loaded");
    } catch (err: any) {
      if (err.name === "AbortError") return;
      if (currentRequestId !== requestIdRef.current) return;

      if (err.status === 401) {
        navigate("/login", { state: { returnUrl: "/dashboard" } });
        return;
      }

      if (err.status === 403) {
        setIsForbidden(true);
        return;
      }

      const errMsg = err.message || "Failed to load dashboard";
      if (isBackground) {
        setRefreshError("Could not refresh dashboard. Showing previously loaded data.");
        setLiveStatus("Could not refresh dashboard");
      } else {
        setInitialError(errMsg);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboard(false);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDashboard]);

  const handleRefresh = () => {
    if (isRefreshing) return;
    fetchDashboard(true);
  };

  if (isForbidden) {
    return <DashboardForbidden message="You do not have permission to view the Requester Dashboard." />;
  }

  if (initialLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (initialError && !data) {
    return (
      <div className="container-xl py-5 animate-enter">
        <div className="glass-panel p-5 text-center mx-auto rounded-4 shadow-sm" style={{ maxWidth: "560px" }}>
          <div className="mb-3 text-danger" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 className="h4 fw-bold mb-2">Unable to connect to dashboard</h1>
          <p className="text-muted mb-4">{initialError}</p>
          <button
            className="btn btn-zen-primary rounded-pill px-4"
            onClick={() => fetchDashboard(false)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    openRequests: { count: 0, drillDown: { path: "/tickets", query: { status: "New,Open,Reopened" } } },
    inProgress: { count: 0, drillDown: { path: "/tickets", query: { status: "InProgress" } } },
    waitingForRequester: { count: 0, drillDown: { path: "/tickets", query: { status: "WaitingForRequester" } } },
    recentlyResolved: { count: 0, drillDown: { path: "/tickets", query: { status: "Resolved" } } },
    closed: { count: 0, drillDown: { path: "/tickets", query: { status: "Closed" } } },
  };

  const totalCount =
    metrics.openRequests.count +
    metrics.inProgress.count +
    metrics.waitingForRequester.count +
    metrics.recentlyResolved.count +
    metrics.closed.count;

  const attentionTickets = data?.attentionTickets || [];
  const recentTickets = data?.recentTickets || [];

  return (
    <div className="container-xl py-4 animate-enter">
      {/* Live region for accessibility announcements */}
      <div role="status" aria-live="polite" className="visually-hidden">
        {liveStatus}
      </div>

      {/* Header and Refresh Action */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Requester Dashboard</h1>
          <p className="text-muted mb-0 small">
            Welcome back, {user?.name || "Requester"} — track and manage your support requests.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            ref={refreshButtonRef}
            type="button"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 shadow-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-busy={isRefreshing ? "true" : "false"}
            aria-label="Refresh dashboard data"
          >
            <svg
              className={isRefreshing ? "spinner-border spinner-border-sm" : ""}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span className="small fw-medium">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Non-destructive Refresh Error Notification */}
      {refreshError && (
        <div className="alert alert-warning alert-dismissible fade show rounded-3 mb-4 shadow-sm" role="alert">
          <div className="d-flex align-items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span className="small">{refreshError}</span>
          </div>
          <button type="button" className="btn-close" aria-label="Close alert" onClick={() => setRefreshError("")}></button>
        </div>
      )}

      {/* Empty State when zero total tickets exist */}
      {totalCount === 0 ? (
        <div className="glass-panel p-5 text-center rounded-4 shadow-sm mb-4">
          <div className="mb-3 text-zen-primary" aria-hidden="true">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 className="h4 fw-bold mb-2">You have no tickets yet</h2>
          <p className="text-muted mb-4 small" style={{ maxWidth: "460px", margin: "0 auto" }}>
            All caught up! You have not submitted any support tickets. If you need assistance with hardware, software, or network systems, create a ticket now.
          </p>
          <Link to="/tickets/new" className="btn btn-zen-primary rounded-pill px-4 py-2 fw-medium shadow-sm">
            Create Ticket
          </Link>
        </div>
      ) : (
        <>
          {/* Top 5 Metric Cards Grid */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg">
              <MetricCard
                title="Open Requests"
                count={metrics.openRequests.count}
                subtitle="New, Open & Reopened"
                drillDown={metrics.openRequests.drillDown}
                variant="primary"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                }
              />
            </div>

            <div className="col-12 col-sm-6 col-lg">
              <MetricCard
                title="In Progress"
                count={metrics.inProgress.count}
                subtitle="Under active investigation"
                drillDown={metrics.inProgress.drillDown}
                variant="info"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                }
              />
            </div>

            <div className="col-12 col-sm-6 col-lg">
              <MetricCard
                title="Waiting on You"
                count={metrics.waitingForRequester.count}
                subtitle="Needs your response"
                drillDown={metrics.waitingForRequester.drillDown}
                variant="warning"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                }
              />
            </div>

            <div className="col-12 col-sm-6 col-lg">
              <MetricCard
                title="Recently Resolved"
                count={metrics.recentlyResolved.count}
                subtitle="Past 7 days"
                drillDown={metrics.recentlyResolved.drillDown}
                variant="success"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                }
              />
            </div>

            <div className="col-12 col-sm-6 col-lg">
              <MetricCard
                title="Closed"
                count={metrics.closed.count}
                subtitle="Completed tickets"
                drillDown={metrics.closed.drillDown}
                variant="secondary"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="21 8 21 21 3 21 3 8"></polyline>
                    <rect x="1" y="3" width="22" height="5"></rect>
                    <line x1="10" y1="12" x2="14" y2="12"></line>
                  </svg>
                }
              />
            </div>
          </div>

          {/* Activity Sections */}
          <div className="row g-4">
            {/* Attention Needed Section */}
            <div className="col-12 col-lg-6">
              <div className="glass-panel p-4 rounded-4 shadow-sm h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="h6 fw-bold mb-0 text-uppercase text-muted" style={{ letterSpacing: "0.5px" }}>
                    Attention Needed
                  </h2>
                  <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-2-5 py-1 small">
                    {attentionTickets.length} pending
                  </span>
                </div>

                {attentionTickets.length === 0 ? (
                  <p className="text-muted small py-3 mb-0">No tickets currently require your attention.</p>
                ) : (
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                    {attentionTickets.map((t) => (
                      <li key={t.id}>
                        <Link
                          to={`/tickets/${t.id}`}
                          className="p-3 bg-white rounded-3 border border-light d-flex align-items-center justify-content-between text-decoration-none text-dark shadow-xs transition-all hover-lift"
                          style={{ minWidth: 0 }}
                        >
                          <div className="me-3" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="fw-bold small text-zen-primary">{t.ticketNumber}</span>
                              <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill small">Waiting</span>
                            </div>
                            <div className="text-truncate text-break small fw-medium text-dark" style={{ maxWidth: "340px" }}>
                              {t.summary}
                            </div>
                          </div>
                          <span className="text-muted small text-nowrap">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="col-12 col-lg-6">
              <div className="glass-panel p-4 rounded-4 shadow-sm h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="h6 fw-bold mb-0 text-uppercase text-muted" style={{ letterSpacing: "0.5px" }}>
                    Recent Activity
                  </h2>
                  <Link to="/tickets" className="small text-zen-primary text-decoration-none fw-medium">
                    View all &rarr;
                  </Link>
                </div>

                {recentTickets.length === 0 ? (
                  <p className="text-muted small py-3 mb-0">No recent ticket activity.</p>
                ) : (
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                    {recentTickets.map((t) => (
                      <li key={t.id}>
                        <Link
                          to={`/tickets/${t.id}`}
                          className="p-3 bg-white rounded-3 border border-light d-flex align-items-center justify-content-between text-decoration-none text-dark shadow-xs transition-all hover-lift"
                          style={{ minWidth: 0 }}
                        >
                          <div className="me-3" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="fw-bold small text-zen-primary">{t.ticketNumber}</span>
                              <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill small">{t.currentStatus}</span>
                            </div>
                            <div className="text-truncate text-break small fw-medium text-dark" style={{ maxWidth: "340px" }}>
                              {t.summary}
                            </div>
                          </div>
                          <span className="text-muted small text-nowrap">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
