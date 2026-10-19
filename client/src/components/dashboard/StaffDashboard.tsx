import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStaffDashboard, StaffDashboardResponse } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { MetricCard } from "./MetricCard";
import { StatusChipGroup } from "./StatusChipGroup";
import { DashboardForbidden } from "./DashboardForbidden";
import { DashboardSkeleton } from "./DashboardSkeleton";

export function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<StaffDashboardResponse | null>(null);
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
    const currentRequestId = ++requestIdRef.current;

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
      const result = await getStaffDashboard(abortControllerRef.current.signal);

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
    return <DashboardForbidden message="You do not have permission to view the IT Staff Dashboard." />;
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
    unassigned: { count: 0, drillDown: { path: "/queue", query: { ownerId: "unassigned", active: "true" } } },
    ownedByMe: { count: 0, drillDown: { path: "/queue", query: { ownerId: "me", active: "true" } } },
    appearsResolved: { count: 0, drillDown: { path: "/queue", query: { appearsResolved: "true", active: "true" } } },
    recentlyUpdated: { count: 0, drillDown: { path: "/queue", query: { active: "true" } } },
    byStatus: { New: 0, Open: 0, InProgress: 0, WaitingForRequester: 0, Resolved: 0, Closed: 0, Reopened: 0, Cancelled: 0 },
    byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, UNSET: 0 },
    adminUserCounts: null,
  };

  const totalActiveQueue =
    metrics.unassigned.count +
    metrics.ownedByMe.count +
    metrics.appearsResolved.count +
    metrics.recentlyUpdated.count;

  const myRecentTickets = data?.myRecentTickets || [];
  const urgentTickets = data?.urgentTickets || [];
  const byStatus = metrics.byStatus || {};
  const byPriority = metrics.byPriority || { LOW: 0, MEDIUM: 0, HIGH: 0, UNSET: 0 };
  const adminUserCounts = metrics.adminUserCounts;

  const statusChips = [
    { key: "New", label: "New", count: byStatus.New || 0, to: "/queue?status=New&active=true", badgeClass: "bg-zen-info text-white" },
    { key: "Open", label: "Open", count: byStatus.Open || 0, to: "/queue?status=Open&active=true", badgeClass: "bg-zen-primary text-white" },
    { key: "InProgress", label: "In Progress", count: byStatus.InProgress || 0, to: "/queue?status=InProgress&active=true", badgeClass: "bg-zen-warning text-white" },
    { key: "WaitingForRequester", label: "Waiting for Requester", count: byStatus.WaitingForRequester || 0, to: "/queue?status=WaitingForRequester&active=true", badgeClass: "bg-warning text-dark" },
    { key: "Resolved", label: "Resolved", count: byStatus.Resolved || 0, to: "/queue?status=Resolved&active=true", badgeClass: "bg-zen-success text-white" },
    { key: "Reopened", label: "Reopened", count: byStatus.Reopened || 0, to: "/queue?status=Reopened&active=true", badgeClass: "bg-danger text-white" },
    { key: "Closed", label: "Closed", count: byStatus.Closed || 0, to: "/queue?status=Closed", badgeClass: "bg-secondary text-white" },
    { key: "Cancelled", label: "Cancelled", count: byStatus.Cancelled || 0, to: "/queue?status=Cancelled", badgeClass: "bg-light text-muted border" },
  ];

  const priorityChips = [
    { key: "LOW", label: "Low", count: byPriority.LOW || 0, to: "/queue?itPriority=LOW&active=true", badgeClass: "bg-zen-success text-white" },
    { key: "MEDIUM", label: "Medium", count: byPriority.MEDIUM || 0, to: "/queue?itPriority=MEDIUM&active=true", badgeClass: "bg-zen-warning text-white" },
    { key: "HIGH", label: "High", count: byPriority.HIGH || 0, to: "/queue?itPriority=HIGH&active=true", badgeClass: "bg-danger text-white" },
    { key: "UNSET", label: "Unset", count: byPriority.UNSET || 0, to: "/queue?itPriority=UNSET&active=true", badgeClass: "bg-secondary text-white" },
  ];

  return (
    <div className="container-xl py-4 animate-enter">
      {/* Live region for accessibility announcements */}
      <div role="status" aria-live="polite" className="visually-hidden">
        {liveStatus}
      </div>

      {/* Header and Refresh Action */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">
            {user?.role === "ADMINISTRATOR" ? "IT Administration Dashboard" : "IT Support Dashboard"}
          </h1>
          <h2 className="text-muted mb-0 small fs-6 fw-normal">
            Welcome back, {user?.name || "Staff"} — operational workload and support queue health.
          </h2>
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

      {/* Non-destructive Refresh Error Alert */}
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

      {/* Empty State when queue has zero active tickets */}
      {totalActiveQueue === 0 && myRecentTickets.length === 0 && urgentTickets.length === 0 ? (
        <div className="glass-panel p-5 text-center rounded-4 shadow-sm mb-4">
          <div className="mb-3 text-zen-primary" aria-hidden="true">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 className="h4 fw-bold mb-2">Queue is all clear</h2>
          <p className="text-muted mb-4 small" style={{ maxWidth: "460px", margin: "0 auto" }}>
            No active tickets require immediate triage. Review resolved requests or manage system configurations.
          </p>
          <Link to="/queue" className="btn btn-zen-primary rounded-pill px-4 py-2 fw-medium shadow-sm">
            View All Queue
          </Link>
        </div>
      ) : (
        <>
          {/* 4 Operational Metric Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <MetricCard
                title="Unassigned"
                count={metrics.unassigned.count}
                subtitle="Active tickets needing triage"
                drillDown={metrics.unassigned.drillDown}
                variant="warning"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="18" y1="8" x2="23" y2="13"></line>
                    <line x1="23" y1="8" x2="18" y2="13"></line>
                  </svg>
                }
              />
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <MetricCard
                title="Assigned to Me"
                count={metrics.ownedByMe.count}
                subtitle="Your active assigned workload"
                drillDown={metrics.ownedByMe.drillDown}
                variant="primary"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="17 11 19 13 23 9"></polyline>
                  </svg>
                }
              />
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <MetricCard
                title="Appears Resolved"
                count={metrics.appearsResolved.count}
                subtitle="Requester advisory signals"
                drillDown={metrics.appearsResolved.drillDown}
                variant="success"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                }
              />
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <MetricCard
                title="Updated in 24h"
                count={metrics.recentlyUpdated.count}
                subtitle="Recent operational activity"
                drillDown={metrics.recentlyUpdated.drillDown}
                variant="info"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                }
              />
            </div>
          </div>

          {/* Admin User Management Summary (Only if Administrator) */}
          {user?.role === "ADMINISTRATOR" && adminUserCounts && (
            <div className="mb-4">
              <Link
                to="/admin/users"
                aria-label={`User Administration, ${adminUserCounts.total || 0} total users, view user management`}
                className="glass-panel p-4 rounded-4 shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 text-decoration-none text-dark hover-lift"
              >
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-zen-primary rounded-pill small">Admin Access</span>
                    <h2 className="h5 fw-bold mb-0 text-dark">User Administration</h2>
                  </div>
                  <p className="text-muted small mb-0">
                    Manage users, roles, password resets, and account activations across TokTickIT.
                  </p>
                </div>

                <div className="d-flex align-items-center gap-4 flex-wrap">
                  <div className="text-center">
                    <div className="display-6 fw-bold text-zen-primary">{adminUserCounts.total || 0}</div>
                    <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: "0.7rem" }}>Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="h4 fw-bold text-dark mb-0">{adminUserCounts.requesters || 0}</div>
                    <div className="text-muted small text-uppercase" style={{ fontSize: "0.7rem" }}>Requesters</div>
                  </div>
                  <div className="text-center">
                    <div className="h4 fw-bold text-dark mb-0">{adminUserCounts.staff || 0}</div>
                    <div className="text-muted small text-uppercase" style={{ fontSize: "0.7rem" }}>IT Staff</div>
                  </div>
                  <div className="text-center">
                    <div className="h4 fw-bold text-dark mb-0">{adminUserCounts.admins || 0}</div>
                    <div className="text-muted small text-uppercase" style={{ fontSize: "0.7rem" }}>Admins</div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Status & Priority Overview Chips */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-7">
              <StatusChipGroup title="Queue Status Breakdown" chips={statusChips} type="status" />
            </div>

            <div className="col-12 col-lg-5">
              <StatusChipGroup title="Priority Overview" chips={priorityChips} type="priority" />
            </div>
          </div>

          {/* Workload Lists Grid */}
          <div className="row g-4">
            {/* Urgent Active Tickets (HIGH priority) */}
            <div className="col-12 col-lg-6">
              <div className="glass-panel p-4 rounded-4 shadow-sm h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="h6 fw-bold mb-0 text-uppercase text-muted" style={{ letterSpacing: "0.5px" }}>
                    Urgent Active Tickets
                  </h2>
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2-5 py-1 small">
                    {urgentTickets.length} high priority
                  </span>
                </div>

                {urgentTickets.length === 0 ? (
                  <p className="text-muted small py-3 mb-0">No urgent high-priority tickets active.</p>
                ) : (
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                    {urgentTickets.map((t) => (
                      <li key={t.id}>
                        <Link
                          to={`/tickets/${t.id}`}
                          className="p-3 bg-white rounded-3 border border-light d-flex align-items-center justify-content-between text-decoration-none text-dark shadow-xs transition-all hover-lift"
                          style={{ minWidth: 0 }}
                        >
                          <div className="me-3" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                              <span className="fw-bold small text-zen-primary">{t.ticketNumber}</span>
                              <span className="badge bg-danger rounded-pill small">HIGH</span>
                              <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill small">{t.currentStatus}</span>
                            </div>
                            <div className="text-truncate text-break small fw-medium text-dark" style={{ maxWidth: "340px", wordBreak: "break-word" }}>
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

            {/* My Recent Tickets */}
            <div className="col-12 col-lg-6">
              <div className="glass-panel p-4 rounded-4 shadow-sm h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="h6 fw-bold mb-0 text-uppercase text-muted" style={{ letterSpacing: "0.5px" }}>
                    My Recent Tickets
                  </h2>
                  <Link to="/queue?ownerId=me&active=true" className="small text-zen-primary text-decoration-none fw-medium">
                    View my queue &rarr;
                  </Link>
                </div>

                {myRecentTickets.length === 0 ? (
                  <p className="text-muted small py-3 mb-0">No tickets currently assigned to you.</p>
                ) : (
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                    {myRecentTickets.map((t) => (
                      <li key={t.id}>
                        <Link
                          to={`/tickets/${t.id}`}
                          className="p-3 bg-white rounded-3 border border-light d-flex align-items-center justify-content-between text-decoration-none text-dark shadow-xs transition-all hover-lift"
                          style={{ minWidth: 0 }}
                        >
                          <div className="me-3" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                              <span className="fw-bold small text-zen-primary">{t.ticketNumber}</span>
                              <span className="badge bg-zen-primary bg-opacity-10 text-zen-primary rounded-pill small">{t.currentStatus}</span>
                            </div>
                            <div className="text-truncate text-break small fw-medium text-dark" style={{ maxWidth: "340px", wordBreak: "break-word" }}>
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
