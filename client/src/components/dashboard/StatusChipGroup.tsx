import React from "react";
import { Link } from "react-router-dom";

interface ChipItem {
  key: string;
  label: string;
  count: number;
  to: string;
  badgeClass?: string;
}

interface StatusChipGroupProps {
  title: string;
  chips: ChipItem[];
  type: "status" | "priority";
}

export function StatusChipGroup({ title, chips, type }: StatusChipGroupProps) {
  return (
    <div className="glass-panel p-4 rounded-4 shadow-sm h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h6 fw-bold mb-0 text-uppercase text-muted" style={{ letterSpacing: "0.5px" }}>
          {title}
        </h2>
      </div>

      <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0" aria-label={title}>
        {chips.map((chip) => {
          const accessibleName = `${type === "status" ? "Status" : "Priority"}: ${chip.label}, ${chip.count} tickets, view in queue`;

          return (
            <li key={chip.key}>
              <Link
                to={chip.to}
                aria-label={accessibleName}
                className="badge bg-white text-dark border border-secondary border-opacity-25 rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2 text-decoration-none shadow-sm transition-all fw-medium"
                style={{
                  transition: "background-color 0.15s ease, transform 0.15s ease",
                  outlineOffset: "2px",
                }}
              >
                <span>{chip.label}</span>
                <span
                  className={`badge rounded-pill ${
                    chip.badgeClass || (chip.count > 0 ? "bg-zen-primary text-white" : "bg-light text-muted")
                  }`}
                >
                  {chip.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
