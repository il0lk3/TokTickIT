const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
// Issue 2 + Issue 4 — call the backend.
// Steps: fetch `${API_URL}/api/health`; if not ok, throw.
//        then fetch `${API_URL}/api/categories`; if not ok, throw.
//        return { online: true, categories }.
// Throwing on failure lets the UI show a single Offline/error state.
export async function checkSystem() {
    const healthRes = await fetch(`${API_URL}/api/health`);
    if (!healthRes.ok) {
        throw new Error("Unable to connect to TokTickIT API");
    }
    const categoriesRes = await fetch(`${API_URL}/api/categories`);
    if (!categoriesRes.ok) {
        throw new Error("Unable to fetch categories");
    }
    const categories = await categoriesRes.json();
    return { online: true, categories };
}
export async function getRequesters() {
    const res = await fetch(`${API_URL}/api/requesters`);
    if (!res.ok) {
        throw new Error("Failed to fetch requesters");
    }
    return res.json();
}
export async function getSystems() {
    const res = await fetch(`${API_URL}/api/systems`);
    if (!res.ok) {
        throw new Error("Failed to fetch systems");
    }
    return res.json();
}
export async function createTicket(payload, requesterId) {
    const res = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Requester-Id": requesterId.toString()
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create ticket");
    }
    return res.json();
}
export async function getTickets(params, requesterId) {
    const query = new URLSearchParams();
    if (params.search)
        query.append("search", params.search);
    if (params.categoryId)
        query.append("categoryId", params.categoryId);
    if (params.requestedPriority)
        query.append("requestedPriority", params.requestedPriority);
    if (params.status)
        query.append("status", params.status);
    if (params.page)
        query.append("page", params.page.toString());
    if (params.limit)
        query.append("limit", params.limit.toString());
    if (params.sortBy)
        query.append("sortBy", params.sortBy);
    if (params.sortOrder)
        query.append("sortOrder", params.sortOrder);
    const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`, {
        headers: {
            "X-Requester-Id": requesterId.toString()
        }
    });
    if (!res.ok) {
        throw new Error("Failed to fetch tickets");
    }
    return res.json();
}
export async function getTicketDetail(id, requesterId) {
    const res = await fetch(`${API_URL}/api/tickets/${id}`, {
        headers: {
            "X-Requester-Id": requesterId.toString()
        }
    });
    if (!res.ok) {
        let errMsg = "Failed to fetch ticket detail";
        try {
            const errBody = await res.json();
            if (errBody.error)
                errMsg = errBody.error;
        }
        catch (e) {
            // Use fallback
        }
        throw new Error(errMsg);
    }
    return res.json();
}
export async function uploadAttachment(ticketId, file, requesterId) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        headers: {
            "X-Requester-Id": requesterId.toString()
        },
        body: formData
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload attachment");
    }
    return res.json();
}
export async function removeAttachment(ticketId, attachmentId, reason, requesterId) {
    const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "X-Requester-Id": requesterId.toString()
        },
        body: JSON.stringify({ reason })
    });
    if (!res.ok) {
        throw new Error("Failed to remove attachment");
    }
}
export async function downloadAttachmentBlob(ticketId, attachmentId, requesterId) {
    const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments/${attachmentId}/download`, {
        headers: {
            "X-Requester-Id": requesterId.toString()
        }
    });
    if (!res.ok) {
        throw new Error("Failed to download attachment");
    }
    return res.blob();
}
