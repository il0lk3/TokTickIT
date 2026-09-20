import { useState, useEffect, useCallback, useMemo } from "react";
import { getStaffTickets, getItStaff, TicketResponse, Category, UserResponse } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface TicketQueueProps {
  categories: Category[];
  onSelectTicket: (id: number) => void;
}

type QueueTicket = TicketResponse & { 
  ownerId?: number | null; 
  owner?: { id: number; name: string } | null;
  requester?: { id: number; name: string; email: string } | null;
};

export function TicketQueue({ categories, onSelectTicket }: TicketQueueProps) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);
  
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("");
  const [itPriority, setItPriority] = useState("");
  const [status, setStatus] = useState("");
  const [ownerId, setOwnerId] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  // Fetch IT staff for owner filter dropdown
  useEffect(() => {
    getItStaff().then(setStaffUsers).catch(console.error);
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search change
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    setIsForbidden(false);
    try {
      const res = await getStaffTickets({
        search: debouncedSearch,
        categoryId,
        requestedPriority,
        itPriority,
        status,
        ownerId,
        page,
        limit: 10,
        sortBy,
        sortOrder
      });
      setTickets(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalTickets(res.meta.total);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("403")) {
        setIsForbidden(true);
      } else {
        setError(err.message || "Failed to load tickets");
      }
    } finally {
      setLoading(false);
    }
  }, [user, debouncedSearch, categoryId, requestedPriority, itPriority, status, ownerId, page, sortBy, sortOrder]);

  const isMobile = useMediaQuery('(max-width: 991.98px)');

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
    if (sortBy !== field) return (
      <span className="ms-2 text-black-50 opacity-25">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 15 12 20 17 15"></polyline><polyline points="7 9 12 4 17 9"></polyline></svg>
      </span>
    );
    return (
      <span className="ms-2 text-zen-primary">
        {sortOrder === "asc" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        )}
      </span>
    );
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
      case "New": return "badge-zen-info";
      case "InProgress": return "badge-zen-warning";
      case "WaitingForRequester": return "badge-zen-warning";
      case "Resolved":
      case "Closed": return "badge-zen-success";
      default: return "badge-zen-secondary";
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "HIGH": return "badge-zen-danger";
      case "MEDIUM": return "badge-zen-warning";
      case "LOW": return "badge-zen-success";
      default: return "badge-zen-secondary";
    }
  };

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<number, string>);
  }, [categories]);

  const ownerMap = useMemo(() => {
    return staffUsers.reduce((acc, u) => {
      acc[u.id] = u.name;
      return acc;
    }, {} as Record<number, string>);
  }, [staffUsers]);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (debouncedSearch) filters.push({ label: `Search: "${debouncedSearch}"`, clear: () => setSearch("") });
    if (categoryId) filters.push({ label: `Category: ${categoryMap[Number(categoryId)] || categoryId}`, clear: () => setCategoryId("") });
    if (requestedPriority) filters.push({ label: `Req Priority: ${requestedPriority}`, clear: () => setRequestedPriority("") });
    if (itPriority) filters.push({ label: `IT Priority: ${itPriority}`, clear: () => setItPriority("") });
    if (status) filters.push({ label: `Status: ${status === 'InProgress' ? 'In Progress' : status}`, clear: () => setStatus("") });
    if (ownerId) filters.push({ label: `Owner: ${ownerId === 'unassigned' ? 'Unassigned' : ownerMap[Number(ownerId)] || ownerId}`, clear: () => setOwnerId("") });
    return filters;
  }, [debouncedSearch, categoryId, requestedPriority, itPriority, status, ownerId, categoryMap, ownerMap]);

  if (isForbidden) {
    return (
      <div className="animate-enter glass-panel p-5 text-center mt-4">
        <div className="mb-3 text-danger">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <h4 className="fw-bold text-danger">Access Denied</h4>
        <p className="text-muted">You do not have permission to view the Ticket Queue or your session has expired.</p>
        <button className="btn btn-outline-secondary mt-3" onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  return (
    <div className="animate-enter">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="h4 fw-bold mb-1">Ticket Queue</h2>
          <p className="text-muted mb-0 small">Manage and triage all support requests</p>
        </div>
        <div className="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-pill shadow-sm border border-light">
          <span className="fw-bold text-zen-primary">{totalTickets}</span>
          <span className="text-muted small fw-medium">Total Tickets</span>
        </div>
      </div>

      <div className="glass-panel p-4 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-3">
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
                placeholder="Search ticket number or summary..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-4 col-md-2">
            <select className="form-select" value={status} onChange={handleFilterChange(setStatus)}>
              <option value="">Status</option>
              <option value="New">New</option>
              <option value="Open">Open</option>
              <option value="InProgress">In Progress</option>
              <option value="WaitingForRequester">Waiting For Requester</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-4 col-md-2">
            <select className="form-select" value={categoryId} onChange={handleFilterChange(setCategoryId)}>
              <option value="">Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={requestedPriority} onChange={handleFilterChange(setRequestedPriority)}>
              <option value="">Req Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={itPriority} onChange={handleFilterChange(setItPriority)}>
              <option value="">IT Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={ownerId} onChange={handleFilterChange(setOwnerId)}>
              <option value="">Owner</option>
              <option value="unassigned">Unassigned</option>
              {staffUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
            <span className="small text-muted me-1 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Filters:</span>
            {activeFilters.map((f, i) => (
              <span key={i} className="badge bg-white text-dark border border-secondary border-opacity-25 rounded-pill px-3 py-2 d-flex align-items-center gap-2 shadow-sm fw-medium">
                {f.label}
                <button type="button" aria-label="Clear filter" className="btn-close btn-close-sm" style={{ fontSize: '0.45rem' }} onClick={f.clear}></button>
              </span>
            ))}
            <button 
              className="btn btn-link btn-sm text-zen-primary text-decoration-none fw-medium ms-1" 
              onClick={() => { setSearch(""); setCategoryId(""); setRequestedPriority(""); setItPriority(""); setStatus(""); setOwnerId(""); }}
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger mb-4 py-2 small">{error}</div>
      )}

      {loading && tickets.length === 0 ? (
        <div className="text-center py-5 glass-panel">
          <div className="spinner-border text-zen-primary mb-2" role="status"></div>
          <p className="text-muted mb-0">Loading queue...</p>
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
          {/* Desktop Table View */}
          {/* Desktop Table View */}
          {!isMobile && (
          <div className="table-responsive bg-white rounded-3 shadow-sm border-0" data-testid="desktop-table">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead className="text-zen-primary small text-uppercase text-nowrap">
                <tr>
                  <th tabIndex={0} aria-label="Sort by Ticket Number" onKeyDown={(e) => e.key === 'Enter' && handleSort("ticketNumber")} className={`border-0 fw-bold ps-4 py-3 ${sortBy === 'ticketNumber' ? 'active-sort' : ''}`} style={{ cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleSort("ticketNumber")}>
                    <div className="d-flex align-items-center">Ticket No. <SortIcon field="ticketNumber" /></div>
                  </th>
                  <th tabIndex={0} aria-label="Sort by Date" onKeyDown={(e) => e.key === 'Enter' && handleSort("createdAt")} className={`border-0 fw-bold py-3 ${sortBy === 'createdAt' ? 'active-sort' : ''}`} style={{ cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleSort("createdAt")}>
                    <div className="d-flex align-items-center">Date <SortIcon field="createdAt" /></div>
                  </th>
                  <th className="border-0 fw-bold py-3" style={{ letterSpacing: '0.5px' }}>Summary</th>
                  <th className="border-0 fw-bold py-3" style={{ letterSpacing: '0.5px' }}>Category</th>
                  <th tabIndex={0} aria-label="Sort by Requested Priority" onKeyDown={(e) => e.key === 'Enter' && handleSort("requestedPriority")} className={`border-0 fw-bold py-3 text-center ${sortBy === 'requestedPriority' ? 'active-sort' : ''}`} style={{ cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleSort("requestedPriority")}>
                    <div className="d-flex align-items-center justify-content-center">Req Pri <SortIcon field="requestedPriority" /></div>
                  </th>
                  <th tabIndex={0} aria-label="Sort by IT Priority" onKeyDown={(e) => e.key === 'Enter' && handleSort("itPriority")} className={`border-0 fw-bold py-3 text-center ${sortBy === 'itPriority' ? 'active-sort' : ''}`} style={{ cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleSort("itPriority")}>
                    <div className="d-flex align-items-center justify-content-center">IT Pri <SortIcon field="itPriority" /></div>
                  </th>
                  <th tabIndex={0} aria-label="Sort by Status" onKeyDown={(e) => e.key === 'Enter' && handleSort("status")} className={`border-0 fw-bold py-3 text-center ${sortBy === 'status' ? 'active-sort' : ''}`} style={{ cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleSort("status")}>
                    <div className="d-flex align-items-center justify-content-center">Status <SortIcon field="status" /></div>
                  </th>
                  <th className="border-0 fw-bold py-3 text-center" style={{ letterSpacing: '0.5px' }}>Owner</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {tickets.map((t: QueueTicket) => (
                  <tr key={t.id} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelectTicket(t.id)} aria-label={`View ticket ${t.ticketNumber}`} className="transition-all" style={{ cursor: "pointer" }} onClick={() => onSelectTicket(t.id)}>
                    <td className="ps-4 py-3 text-nowrap">
                      <span className="fw-bold text-zen-primary" style={{ fontFamily: 'monospace', letterSpacing: '-0.5px' }}>{t.ticketNumber}</span>
                    </td>
                    <td className="py-3 text-nowrap">
                      <span className="small text-muted">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3">
                      <div className="fw-medium text-dark text-truncate d-none d-lg-block" style={{ maxWidth: '300px' }} title={t.summary}>
                        {t.summary}
                      </div>
                    </td>
                    <td className="py-3 text-nowrap">
                      <span className="small text-muted">{categoryMap[t.categoryId] || 'Unknown'}</span>
                    </td>
                    <td className="py-3 text-center text-nowrap">
                      <span className={`badge rounded-pill fw-medium px-3 py-2 ${getPriorityBadgeClass(t.requestedPriority)}`}>
                        {t.requestedPriority}
                      </span>
                    </td>
                    <td className="py-3 text-center text-nowrap">
                      {t.itPriority ? (
                        <span className={`badge rounded-pill fw-medium px-3 py-2 ${getPriorityBadgeClass(t.itPriority)}`}>
                          {t.itPriority}
                        </span>
                      ) : (
                        <span className="text-muted small">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center text-nowrap">
                      <span className={`badge rounded-pill fw-medium px-3 py-2 ${getStatusBadgeClass(t.currentStatus)}`}>
                        {t.currentStatus === 'InProgress' ? 'In Progress' : t.currentStatus === 'WaitingForRequester' ? 'Waiting' : t.currentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-center text-nowrap">
                      {t.owner ? (
                        <span className="fw-medium text-dark">{t.owner.name}</span>
                      ) : (
                        <span className="text-muted fst-italic small">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          
          {/* Mobile Card View */}
          {isMobile && (
          <div className="bg-white" data-testid="mobile-cards">
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
              <span className="small fw-bold text-muted">Sort by</span>
              <div className="d-flex gap-2">
                <select 
                  className="form-select form-select-sm border-0 shadow-sm fw-medium" 
                  value={sortBy} 
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  style={{ backgroundColor: '#F8F9FA' }}
                >
                  <option value="createdAt">Date</option>
                  <option value="ticketNumber">Ticket No.</option>
                  <option value="status">Status</option>
                </select>
                <button 
                  className="btn btn-sm btn-light border-0 shadow-sm fw-medium d-flex align-items-center gap-1"
                  onClick={() => handleSort(sortBy)}
                >
                  {sortOrder === "desc" ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg> Descending</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg> Ascending</>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-light d-flex flex-column gap-3">
              {tickets.map((t: QueueTicket) => (
                <div key={t.id} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelectTicket(t.id)} aria-label={`View ticket ${t.ticketNumber}`} className="card shadow-sm border-0" style={{ cursor: "pointer", borderRadius: '8px' }} onClick={() => onSelectTicket(t.id)}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="fw-bold text-zen-primary" style={{ fontFamily: 'monospace', letterSpacing: '-0.5px' }}>{t.ticketNumber}</span>
                      <span className={`badge rounded-pill fw-medium px-3 py-1 ${getStatusBadgeClass(t.currentStatus)}`}>
                        {t.currentStatus === 'InProgress' ? 'In Progress' : t.currentStatus === 'WaitingForRequester' ? 'Waiting' : t.currentStatus}
                      </span>
                    </div>
                    
                    <div className="text-dark mb-4 lh-sm" style={{ fontSize: '0.95rem' }}>{t.summary}</div>
                    
                    <div className="row g-2 small mb-3" style={{ fontSize: '0.85rem' }}>
                      <div className="col-5 text-muted">Category</div>
                      <div className="col-7 text-dark fw-medium text-end">{categoryMap[t.categoryId] || 'Unknown'}</div>
                      
                      <div className="col-5 text-muted">Requested Priority</div>
                      <div className="col-7 text-dark fw-medium text-end">
                        <span className={`badge rounded-pill ${getPriorityBadgeClass(t.requestedPriority)}`}>{t.requestedPriority}</span>
                      </div>
                      
                      <div className="col-5 text-muted">IT Priority</div>
                      <div className="col-7 text-dark fw-medium text-end">
                        {t.itPriority ? (
                          <span className={`badge rounded-pill ${getPriorityBadgeClass(t.itPriority)}`}>{t.itPriority}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </div>

                      <div className="col-5 text-muted">Owner</div>
                      <div className="col-7 text-end">
                        {t.owner ? (
                          <span className="fw-medium text-dark">{t.owner.name}</span>
                        ) : (
                          <span className="text-muted fst-italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-muted pt-3 border-top border-light text-end" style={{ fontSize: '0.75rem' }}>
                      <span className="fw-bold text-dark">Date:</span> {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
          
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-white">
              <span className="small text-muted fw-medium ms-2">
                Page {page} of {totalPages}
              </span>
              <div className="d-flex gap-2 me-2">
                <button 
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-3 rounded-pill fw-medium" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  Prev
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-3 rounded-pill fw-medium" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
