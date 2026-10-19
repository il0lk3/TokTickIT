import React from "react";
import { Link } from "react-router-dom";
import { MetricDrillDown } from "../../api";

interface MetricCardProps {
  title: string;
  count: number;
  subtitle?: string;
  drillDown: MetricDrillDown;
  variant?: "primary" | "warning" | "success" | "info" | "secondary" | "danger";
  icon: React.ReactNode;
}

export function MetricCard({
  title,
  count,
  subtitle,
  drillDown,
  variant = "primary",
  icon,
}: MetricCardProps) {
  // Construct safe query string
  const queryParams = new URLSearchParams(drillDown.query || {});
  const queryString = queryParams.toString();
  const to = queryString ? `${drillDown.path}?${queryString}` : drillDown.path;

  // Accessible name composed of visible labels
  const accessibleLabel = `${title}, ${count} tickets, view in ${drillDown.path === "/tickets" ? "My Tickets" : "Ticket Queue"}`;

  const borderVariantClass =
    variant === "danger"
      ? "border-danger border-opacity-25"
      : variant === "warning"
      ? "border-warning border-opacity-25"
      : variant === "success"
      ? "border-success border-opacity-25"
      : variant === "info"
      ? "border-info border-opacity-25"
      : "border-light";

  const countColorClass =
    variant === "danger"
      ? "text-danger"
      : variant === "warning"
      ? "text-warning"
      : variant === "success"
      ? "text-success"
      : variant === "info"
      ? "text-info"
      : "text-zen-primary";

  return (
    <Link
      to={to}
      aria-label={accessibleLabel}
      className={`glass-panel p-4 d-flex flex-column justify-content-between text-decoration-none text-dark transition-all shadow-sm rounded-4 h-100 ${borderVariantClass}`}
      style={{
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        outlineOffset: "3px",
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: "0.5px" }}>
          {title}
        </span>
        <div
          className={`p-2 rounded-3 bg-opacity-10 d-flex align-items-center justify-content-center ${countColorClass} bg-current`}
          style={{ width: "36px", height: "36px" }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      <div className="mt-auto">
        <div className={`display-6 fw-bold mb-1 ${countColorClass}`}>{count}</div>
        {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
      </div>
    </Link>
  );
}
