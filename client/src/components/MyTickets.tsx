import { useState, useEffect, useCallback, useMemo } from "react";
import { getTickets, TicketResponse, Category } from "../api.js";
import { useRequester } from "../contexts/RequesterContext.js";

interface MyTicketsProps {
  categories: Category[];
}

export function MyTickets({ categories }: MyTicketsProps) {
  const { activeRequester } = useRequester();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("");
  const [status, setStatus] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search change
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchTickets = useCallback(async () => {
    if (!activeRequester) return;
    setLoading(true);
    setError("");
    try {
      const res = await getTickets({
        search: debouncedSearch,
        categoryId,
        requestedPriority,
        status,
        page,
        limit: 10,
        sortBy,
        sortOrder
      }, activeRequester.id);
      setTickets(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalTickets(res.meta.total);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [activeRequester, debouncedSearch, categoryId, requestedPriority, status, page, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="ms-1 text-black-50">↕</span>;
    return <span className="ms-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1); // Reset to page 1 on filter change
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "New": return "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25";
      case "InProgress": return "bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25";
      case "Resolved": return "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
      default: return "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "HIGH": return "text-danger";
      case "MEDIUM": return "text-warning";
      case "LOW": return "text-success";
      default: return "text-muted";
    }
  };

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<number, string>);
  }, [categories]);

  return (
    <div className="animate-enter">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="h4 fw-bold mb-1">My Tickets</h2>
          <p className="text-muted mb-0 small">Manage and track your support requests</p>
        </div>
        <div className="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-pill shadow-sm border border-light">
          <span className="fw-bold text-zen-primary">{totalTickets}</span>
          <span className="text-muted small fw-medium">Total Tickets</span>
        </div>
      </div>

      <div className="glass-panel p-4 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-0" 
                placeholder="Search tickets..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-3">
            <select className="form-select" value={categoryId} onChange={handleFilterChange(setCategoryId)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={requestedPriority} onChange={handleFilterChange(setRequestedPriority)}>
              <option value="">Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={status} onChange={handleFilterChange(setStatus)}>
              <option value="">Status</option>
              <option value="New">New</option>
              <option value="InProgress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4 py-2 small">{error}</div>
      )}

      {loading && tickets.length === 0 ? (
        <div className="text-center py-5 glass-panel">
          <div className="spinner-border text-zen-primary mb-2" role="status"></div>
          <p className="text-muted mb-0">Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-panel p-5 text-center">
          <div className="mb-3 text-muted">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <h5 className="fw-bold">No tickets found</h5>
          <p className="text-muted small">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead className="bg-light bg-opacity-50 text-muted small text-uppercase">
                <tr>
                  <th className="border-0 fw-bold ps-4 py-3" style={{ cursor: 'pointer' }} onClick={() => handleSort("ticketNumber")}>Ticket No. <SortIcon field="ticketNumber" /></th>
                  <th className="border-0 fw-bold py-3">Summary</th>
                  <th className="border-0 fw-bold py-3">Category</th>
                  <th className="border-0 fw-bold py-3 text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort("requestedPriority")}>Priority <SortIcon field="requestedPriority" /></th>
                  <th className="border-0 fw-bold py-3 text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort("currentStatus")}>Status <SortIcon field="currentStatus" /></th>
                  <th className="border-0 fw-bold py-3 text-end pe-4" style={{ cursor: 'pointer' }} onClick={() => handleSort("createdAt")}>Date <SortIcon field="createdAt" /></th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {tickets.map((t) => (
                  <tr key={t.id} className="transition-all" style={{ cursor: "pointer" }}>
                    <td className="ps-4 py-3">
                      <span className="fw-bold text-zen-primary" style={{ fontFamily: 'monospace', letterSpacing: '-0.5px' }}>{t.ticketNumber}</span>
                    </td>
                    <td className="py-3">
                      <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '250px' }} title={t.summary}>
                        {t.summary}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="small text-muted">{categoryMap[t.categoryId] || 'Unknown'}</span>
                    </td>
                    <td className="py-3 text-center">
                      <div className={`d-inline-flex align-items-center justify-content-center bg-light rounded-circle ${getPriorityBadgeClass(t.requestedPriority)}`} style={{ width: '28px', height: '28px' }} title={t.requestedPriority}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`badge rounded-pill fw-medium px-3 py-2 ${getStatusBadgeClass(t.currentStatus)}`}>
                        {t.currentStatus === 'InProgress' ? 'In Progress' : t.currentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-end pe-4">
                      <span className="small text-muted">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light bg-opacity-50">
              <span className="small text-muted ms-2">
                Showing page {page} of {totalPages}
              </span>
              <div className="btn-group me-2">
                <button 
                  className="btn btn-sm btn-outline-secondary px-3" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary px-3" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
