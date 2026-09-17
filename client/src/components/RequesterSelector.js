import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { getRequesters } from "../api.js";
import { useRequester } from "../contexts/RequesterContext.js";
export function RequesterSelector() {
    const { setRequester } = useRequester();
    const [requesters, setRequesters] = useState([]);
    const [state, setState] = useState("idle");
    const [selectedId, setSelectedId] = useState("");
    const fetchRequesters = async () => {
        setState("loading");
        try {
            const data = await getRequesters();
            setRequesters(data);
            if (data.length > 0)
                setSelectedId(String(data[0].id));
            setState("success");
        }
        catch (err) {
            setState("error");
        }
    };
    useEffect(() => {
        fetchRequesters();
    }, []);
    const handleContinue = () => {
        const selected = requesters.find(r => String(r.id) === selectedId);
        if (selected) {
            setRequester(selected);
        }
    };
    return (_jsxs("div", { className: "animate-enter", children: [_jsxs("div", { className: "mb-4 d-flex align-items-center text-zen-primary fw-medium", style: { fontSize: '0.9rem' }, children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "me-2", children: [_jsx("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }), _jsx("polyline", { points: "9 22 9 12 15 12 15 22" })] }), _jsx("span", { className: "text-muted mx-2", children: "\u203A" }), _jsx("span", { children: "Development Requester Selection" })] }), _jsx("div", { className: "d-flex justify-content-center", children: _jsx("div", { className: "glass-panel w-100", style: { maxWidth: '600px' }, children: _jsxs("div", { className: "p-4 p-md-5", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("div", { className: "mb-3 d-inline-flex align-items-center justify-content-center bg-zen-pale rounded-circle", style: { width: '64px', height: '64px' }, children: _jsxs("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "var(--zen-primary)", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "9", cy: "7", r: "4" }), _jsx("line", { x1: "19", y1: "8", x2: "19", y2: "14" }), _jsx("line", { x1: "22", y1: "11", x2: "16", y2: "11" })] }) }), _jsx("h2", { className: "h4 mb-2 fw-bold text-dark", children: "Select Development Requester" }), _jsx("p", { className: "text-muted small mx-auto", style: { maxWidth: '400px' }, children: "Choose a development requester to simulate the current requester context for Lab 2. This is for testing only and is not a login screen." })] }), state === "loading" && (_jsx("div", { className: "text-center my-4", children: _jsx("div", { className: "spinner-border text-zen-primary", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading..." }) }) })), state === "error" && (_jsxs("div", { className: "alert alert-danger mb-4", children: [_jsx("p", { className: "mb-2", children: "Failed to load requesters. Is the API running?" }), _jsx("button", { className: "btn btn-sm btn-outline-danger", onClick: fetchRequesters, children: "Retry" })] })), state === "success" && (_jsxs("div", { className: "mb-4", children: [_jsxs("label", { htmlFor: "requesterSelect", className: "form-label fw-bold", children: ["Development Requester ", _jsx("span", { className: "text-danger", children: "*" })] }), requesters.length === 0 ? (_jsx("div", { className: "alert alert-warning mb-3", children: "No active Development Requesters found." })) : (_jsx("select", { id: "requesterSelect", className: "form-select mb-3", value: selectedId, onChange: (e) => setSelectedId(e.target.value), children: requesters.map((r) => (_jsx("option", { value: r.id, children: r.name }, r.id))) })), _jsxs("div", { className: "alert bg-zen-pale text-zen-secondary d-flex align-items-center p-3 mb-3 border-0 rounded", style: { fontSize: '0.9rem' }, children: [_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "me-3 flex-shrink-0", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })] }), _jsx("div", { children: "Only active development requesters are shown." })] }), _jsxs("div", { className: "alert bg-light text-secondary d-flex align-items-start p-3 mb-0 border rounded", style: { fontSize: '0.9rem' }, children: [_jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "me-3 flex-shrink-0 mt-1", children: _jsx("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }) }), _jsxs("div", { children: [_jsx("div", { className: "fw-bold text-dark mb-1", children: "Authentication coming in Lab 3" }), _jsx("div", { className: "small", children: "In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account." })] })] })] })), _jsxs("div", { className: "d-flex justify-content-end gap-2 pt-3 border-top mt-4", children: [_jsx("button", { className: "btn btn-outline-secondary px-4 fw-medium", children: "Cancel" }), _jsxs("button", { className: "btn btn-primary px-4 fw-medium d-flex align-items-center gap-2", onClick: handleContinue, disabled: state !== "success" || !selectedId, children: ["Continue", _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" }), _jsx("polyline", { points: "12 5 19 12 12 19" })] })] })] })] }) }) })] }));
}
