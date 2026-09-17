import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from "react";
import { getTickets } from "../api.js";
import { useRequester } from "../contexts/RequesterContext.js";
export function MyTickets({ categories, onSelectTicket }) {
    const { activeRequester } = useRequester();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
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
        if (!activeRequester)
            return;
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
        }
        catch (err) {
            setError(err.message || "Failed to load tickets");
        }
        finally {
            setLoading(false);
        }
    }, [activeRequester, debouncedSearch, categoryId, requestedPriority, status, page, sortBy, sortOrder]);
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        }
        else {
            setSortBy(field);
            setSortOrder("desc");
        }
        setPage(1);
    };
    const SortIcon = ({ field }) => {
        if (sortBy !== field)
            return (_jsx("span", { className: "ms-2 text-black-50 opacity-25", children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "7 15 12 20 17 15" }), _jsx("polyline", { points: "7 9 12 4 17 9" })] }) }));
        return (_jsx("span", { className: "ms-2 text-zen-primary", children: sortOrder === "asc" ? (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "18 15 12 9 6 15" }) })) : (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "6 9 12 15 18 9" }) })) }));
    };
    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);
    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1); // Reset to page 1 on filter change
    };
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "New": return "bg-info bg-opacity-10 text-dark border border-info border-opacity-50";
            case "InProgress": return "bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-50";
            case "Resolved": return "bg-success bg-opacity-10 text-success border border-success border-opacity-50";
            default: return "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";
        }
    };
    const getPriorityBadgeClass = (priority) => {
        switch (priority) {
            case "HIGH": return "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";
            case "MEDIUM": return "bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-50";
            case "LOW": return "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
            default: return "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";
        }
    };
    const categoryMap = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {});
    }, [categories]);
    const activeFilters = useMemo(() => {
        const filters = [];
        if (debouncedSearch)
            filters.push({ label: `Search: "${debouncedSearch}"`, clear: () => setSearch("") });
        if (categoryId)
            filters.push({ label: `Category: ${categoryMap[Number(categoryId)] || categoryId}`, clear: () => setCategoryId("") });
        if (requestedPriority)
            filters.push({ label: `Priority: ${requestedPriority === 'InProgress' ? 'In Progress' : requestedPriority}`, clear: () => setRequestedPriority("") });
        if (status)
            filters.push({ label: `Status: ${status === 'InProgress' ? 'In Progress' : status}`, clear: () => setStatus("") });
        return filters;
    }, [debouncedSearch, categoryId, requestedPriority, status, categoryMap]);
    return (_jsxs("div", { className: "animate-enter", children: [_jsxs("div", { className: "d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "h4 fw-bold mb-1", children: "My Tickets" }), _jsx("p", { className: "text-muted mb-0 small", children: "Manage and track your support requests" })] }), _jsxs("div", { className: "d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-pill shadow-sm border border-light", children: [_jsx("span", { className: "fw-bold text-zen-primary", children: totalTickets }), _jsx("span", { className: "text-muted small fw-medium", children: "Total Tickets" })] })] }), _jsxs("div", { className: "glass-panel p-4 mb-4", children: [_jsxs("div", { className: "row g-3", children: [_jsx("div", { className: "col-12 col-md-4", children: _jsxs("div", { className: "input-group", children: [_jsx("span", { className: "input-group-text bg-white border-end-0", children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-muted", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })] }) }), _jsx("input", { type: "text", className: "form-control border-start-0 ps-0", placeholder: "Search tickets...", value: search, onChange: (e) => setSearch(e.target.value) })] }) }), _jsx("div", { className: "col-12 col-md-3", children: _jsxs("select", { className: "form-select", value: categoryId, onChange: handleFilterChange(setCategoryId), children: [_jsx("option", { value: "", children: "All Categories" }), categories.map(c => _jsx("option", { value: c.id, children: c.name }, c.id))] }) }), _jsx("div", { className: "col-6 col-md-2", children: _jsxs("select", { className: "form-select", value: requestedPriority, onChange: handleFilterChange(setRequestedPriority), children: [_jsx("option", { value: "", children: "Priority" }), _jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" })] }) }), _jsx("div", { className: "col-6 col-md-3", children: _jsxs("select", { className: "form-select", value: status, onChange: handleFilterChange(setStatus), children: [_jsx("option", { value: "", children: "Status" }), _jsx("option", { value: "New", children: "New" }), _jsx("option", { value: "InProgress", children: "In Progress" }), _jsx("option", { value: "Resolved", children: "Resolved" })] }) })] }), activeFilters.length > 0 && (_jsxs("div", { className: "d-flex align-items-center gap-2 mt-3 flex-wrap", children: [_jsx("span", { className: "small text-muted me-1 fw-bold text-uppercase", style: { letterSpacing: '0.5px' }, children: "Filters:" }), activeFilters.map((f, i) => (_jsxs("span", { className: "badge bg-white text-dark border border-secondary border-opacity-25 rounded-pill px-3 py-2 d-flex align-items-center gap-2 shadow-sm fw-medium", children: [f.label, _jsx("button", { type: "button", className: "btn-close btn-close-sm", style: { fontSize: '0.45rem' }, onClick: f.clear })] }, i))), _jsx("button", { className: "btn btn-link btn-sm text-zen-primary text-decoration-none fw-medium ms-1", onClick: () => { setSearch(""); setCategoryId(""); setRequestedPriority(""); setStatus(""); }, children: "Clear All" })] }))] }), error && (_jsx("div", { className: "alert alert-danger mb-4 py-2 small", children: error })), loading && tickets.length === 0 ? (_jsxs("div", { className: "text-center py-5 glass-panel", children: [_jsx("div", { className: "spinner-border text-zen-primary mb-2", role: "status" }), _jsx("p", { className: "text-muted mb-0", children: "Loading tickets..." })] })) : tickets.length === 0 ? (_jsxs("div", { className: "glass-panel p-5 text-center", children: [_jsx("div", { className: "mb-3 text-muted", children: _jsxs("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }), _jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }), _jsx("line", { x1: "9", y1: "21", x2: "9", y2: "9" })] }) }), _jsx("h5", { className: "fw-bold", children: "No tickets found" }), _jsx("p", { className: "text-muted small", children: "Try adjusting your search or filter criteria." })] })) : (_jsxs("div", { className: "glass-panel overflow-hidden", children: [_jsx("div", { className: "table-responsive d-none d-md-block", children: _jsxs("table", { className: "table table-hover align-middle mb-0 custom-table", children: [_jsx("thead", { className: "text-zen-primary small text-uppercase text-nowrap", style: { borderBottom: '2px solid var(--zen-primary)' }, children: _jsxs("tr", { children: [_jsx("th", { className: "border-0 fw-bold ps-4 py-3", style: { cursor: 'pointer', letterSpacing: '0.5px' }, onClick: () => handleSort("ticketNumber"), children: _jsxs("div", { className: "d-flex align-items-center", children: ["Ticket No. ", _jsx(SortIcon, { field: "ticketNumber" })] }) }), _jsx("th", { className: "border-0 fw-bold py-3", style: { letterSpacing: '0.5px' }, children: "Summary" }), _jsx("th", { className: "border-0 fw-bold py-3", style: { letterSpacing: '0.5px' }, children: "Category" }), _jsx("th", { className: "border-0 fw-bold py-3 text-center", style: { cursor: 'pointer', letterSpacing: '0.5px' }, onClick: () => handleSort("requestedPriority"), children: _jsxs("div", { className: "d-flex align-items-center justify-content-center", children: ["Priority ", _jsx(SortIcon, { field: "requestedPriority" })] }) }), _jsx("th", { className: "border-0 fw-bold py-3 text-center", style: { cursor: 'pointer', letterSpacing: '0.5px' }, onClick: () => handleSort("currentStatus"), children: _jsxs("div", { className: "d-flex align-items-center justify-content-center", children: ["Status ", _jsx(SortIcon, { field: "currentStatus" })] }) }), _jsx("th", { className: "border-0 fw-bold py-3 text-end pe-4", style: { cursor: 'pointer', letterSpacing: '0.5px' }, onClick: () => handleSort("createdAt"), children: _jsxs("div", { className: "d-flex align-items-center justify-content-end", children: ["Date ", _jsx(SortIcon, { field: "createdAt" })] }) }), _jsx("th", { className: "border-0 fw-bold py-3 text-end pe-4", style: { cursor: 'pointer', letterSpacing: '0.5px' }, onClick: () => handleSort("updatedAt"), children: _jsxs("div", { className: "d-flex align-items-center justify-content-end", children: ["Last Updated ", _jsx(SortIcon, { field: "updatedAt" })] }) })] }) }), _jsx("tbody", { className: "border-top-0", children: tickets.map((t) => (_jsxs("tr", { className: "transition-all", style: { cursor: "pointer" }, onClick: () => onSelectTicket(t.id), children: [_jsx("td", { className: "ps-4 py-3 text-nowrap", children: _jsx("span", { className: "fw-bold text-zen-primary", style: { fontFamily: 'monospace', letterSpacing: '-0.5px' }, children: t.ticketNumber }) }), _jsx("td", { className: "py-3", children: _jsx("div", { className: "fw-medium text-dark text-truncate", style: { maxWidth: '400px' }, title: t.summary, children: t.summary }) }), _jsx("td", { className: "py-3 text-nowrap", children: _jsx("span", { className: "small text-muted", children: categoryMap[t.categoryId] || 'Unknown' }) }), _jsx("td", { className: "py-3 text-center text-nowrap", children: _jsx("span", { className: `badge rounded-pill fw-medium px-3 py-2 ${getPriorityBadgeClass(t.requestedPriority)}`, children: t.requestedPriority }) }), _jsx("td", { className: "py-3 text-center text-nowrap", children: _jsx("span", { className: `badge rounded-pill fw-medium px-3 py-2 ${getStatusBadgeClass(t.currentStatus)}`, children: t.currentStatus === 'InProgress' ? 'In Progress' : t.currentStatus }) }), _jsx("td", { className: "py-3 text-end pe-4 text-nowrap", children: _jsx("span", { className: "small text-muted", children: new Date(t.createdAt).toLocaleDateString() }) }), _jsx("td", { className: "py-3 text-end pe-4 text-nowrap", children: _jsx("span", { className: "small text-muted", children: new Date(t.updatedAt || t.createdAt).toLocaleDateString() }) })] }, t.id))) })] }) }), _jsxs("div", { className: "d-md-none bg-white", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center px-4 py-3 border-bottom", children: [_jsx("span", { className: "small fw-bold text-muted", children: "Sort by" }), _jsxs("div", { className: "d-flex gap-2", children: [_jsxs("select", { className: "form-select form-select-sm border-0 shadow-sm fw-medium", value: sortBy, onChange: (e) => { setSortBy(e.target.value); setPage(1); }, style: { backgroundColor: '#F8F9FA' }, children: [_jsx("option", { value: "createdAt", children: "Created Date" }), _jsx("option", { value: "updatedAt", children: "Last Updated" }), _jsx("option", { value: "ticketNumber", children: "Ticket No." })] }), _jsx("button", { className: "btn btn-sm btn-light border-0 shadow-sm fw-medium d-flex align-items-center gap-1", onClick: () => handleSort(sortBy), children: sortOrder === "desc" ? (_jsxs(_Fragment, { children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "6 9 12 15 18 9" }) }), " Descending"] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "18 15 12 9 6 15" }) }), " Ascending"] })) })] })] }), _jsx("div", { className: "p-3 bg-light d-flex flex-column gap-3", children: tickets.map((t) => (_jsx("div", { className: "card shadow-sm border-0", style: { cursor: "pointer", borderRadius: '8px' }, onClick: () => onSelectTicket(t.id), children: _jsxs("div", { className: "card-body p-4", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-start mb-3", children: [_jsx("span", { className: "fw-bold text-zen-primary", style: { fontFamily: 'monospace', letterSpacing: '-0.5px' }, children: t.ticketNumber }), _jsx("span", { className: `badge rounded-pill fw-medium px-3 py-1 ${getStatusBadgeClass(t.currentStatus)}`, children: t.currentStatus === 'InProgress' ? 'In Progress' : t.currentStatus })] }), _jsx("div", { className: "text-dark mb-4 lh-sm", style: { fontSize: '0.95rem' }, children: t.summary }), _jsxs("div", { className: "row g-2 small mb-3", style: { fontSize: '0.85rem' }, children: [_jsx("div", { className: "col-5 text-muted", children: "Category" }), _jsx("div", { className: "col-7 text-dark fw-medium text-end", children: categoryMap[t.categoryId] || 'Unknown' }), _jsx("div", { className: "col-5 text-muted", children: "Priority" }), _jsx("div", { className: "col-7 text-end", children: _jsx("span", { className: `badge rounded-pill px-2 py-1 ${getPriorityBadgeClass(t.requestedPriority)}`, children: t.requestedPriority }) }), _jsx("div", { className: "col-5 text-muted", children: "Status" }), _jsx("div", { className: "col-7 fw-medium text-end", children: t.currentStatus === 'InProgress' ? 'In Progress' : t.currentStatus })] }), _jsxs("div", { className: "d-flex justify-content-between text-muted pt-3 border-top border-light", style: { fontSize: '0.75rem' }, children: [_jsxs("div", { children: [_jsx("span", { className: "fw-bold text-dark", children: "Created:" }), " ", new Date(t.createdAt).toLocaleDateString()] }), _jsxs("div", { className: "text-end", children: [_jsx("span", { className: "fw-bold text-dark", children: "Last Updated:" }), " ", new Date(t.updatedAt || t.createdAt).toLocaleDateString()] })] })] }) }, t.id))) })] }), totalPages > 1 && (_jsxs("div", { className: "d-flex justify-content-between align-items-center p-3 border-top bg-white", children: [_jsxs("span", { className: "small text-muted fw-medium ms-2", children: ["Page ", page, " of ", totalPages] }), _jsxs("div", { className: "d-flex gap-2 me-2", children: [_jsxs("button", { className: "btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-3 rounded-pill fw-medium", onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1, children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "15 18 9 12 15 6" }) }), "Prev"] }), _jsxs("button", { className: "btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-3 rounded-pill fw-medium", onClick: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page === totalPages, children: ["Next", _jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "9 18 15 12 9 6" }) })] })] })] }))] }))] }));
}
