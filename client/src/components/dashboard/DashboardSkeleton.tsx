import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="container-xl py-4 animate-enter" data-testid="dashboard-skeleton">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="placeholder-glow mb-2">
            <span className="placeholder col-6 rounded" style={{ height: "28px", width: "220px", display: "inline-block" }}></span>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder col-4 rounded" style={{ height: "16px", width: "160px", display: "inline-block" }}></span>
          </div>
        </div>
        <div className="placeholder-glow">
          <span className="placeholder rounded-pill" style={{ height: "36px", width: "110px", display: "inline-block" }}></span>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="row g-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <div className="glass-panel p-4 rounded-4 shadow-sm placeholder-glow h-100" style={{ minHeight: "140px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="placeholder col-5 rounded"></span>
                <span className="placeholder rounded" style={{ width: "28px", height: "28px" }}></span>
              </div>
              <span className="placeholder col-4 rounded display-6" style={{ height: "40px", display: "inline-block" }}></span>
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton Lists */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="glass-panel p-4 rounded-4 shadow-sm placeholder-glow">
            <div className="d-flex justify-content-between mb-3">
              <span className="placeholder col-4 rounded"></span>
            </div>
            <div className="d-flex flex-column gap-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="p-3 bg-white rounded-3 border border-light">
                  <span className="placeholder col-3 rounded mb-2 d-block"></span>
                  <span className="placeholder col-8 rounded d-block"></span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="glass-panel p-4 rounded-4 shadow-sm placeholder-glow">
            <div className="d-flex justify-content-between mb-3">
              <span className="placeholder col-4 rounded"></span>
            </div>
            <div className="d-flex flex-column gap-3">
              {[1, 2, 3].map((k) => (
                <div key={k} className="p-3 bg-white rounded-3 border border-light">
                  <span className="placeholder col-3 rounded mb-2 d-block"></span>
                  <span className="placeholder col-8 rounded d-block"></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
