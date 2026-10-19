import React, { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { TicketQueue } from "../components/TicketQueue";
import { Category } from "../api";

interface TicketQueueRouteProps {
  categories: Category[];
}

const VALID_STATUSES = new Set([
  "New", "Open", "InProgress", "WaitingForRequester", "Resolved", "Closed", "Reopened", "Cancelled"
]);
const VALID_PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "UNSET"]);

export function TicketQueueRoute({ categories }: TicketQueueRouteProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parse and sanitize query parameters from URL (URL as single source of truth)
  const filters = useMemo(() => {
    const rawStatus = searchParams.get("status");
    let status = "";
    if (rawStatus) {
      const parts = rawStatus.split(",").map(s => s.trim());
      const validParts = parts.filter(s => VALID_STATUSES.has(s));
      if (validParts.length > 0) {
        status = validParts.join(",");
      }
    }

    const rawOwnerId = searchParams.get("ownerId");
    let ownerId = "";
    if (rawOwnerId === "unassigned" || rawOwnerId === "me" || (rawOwnerId && /^\d+$/.test(rawOwnerId))) {
      ownerId = rawOwnerId;
    }

    const rawItPriority = searchParams.get("itPriority");
    let itPriority = "";
    if (rawItPriority && VALID_PRIORITIES.has(rawItPriority)) {
      itPriority = rawItPriority;
    }

    const rawRequestedPriority = searchParams.get("requestedPriority");
    let requestedPriority = "";
    if (rawRequestedPriority && VALID_PRIORITIES.has(rawRequestedPriority)) {
      requestedPriority = rawRequestedPriority;
    }

    const rawActive = searchParams.get("active");
    const active = rawActive === "true" ? "true" : "";

    const rawAppearsResolved = searchParams.get("appearsResolved");
    const appearsResolved = rawAppearsResolved === "true" ? "true" : "";

    const updatedSince = searchParams.get("updatedSince") || "";

    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;

    return {
      status,
      ownerId,
      itPriority,
      requestedPriority,
      search,
      categoryId,
      page,
      active,
      appearsResolved,
      updatedSince
    };
  }, [searchParams]);

  const handleFilterChange = (updated: Record<string, string | number | undefined>) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updated).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    // Reset page to 1 when changing filters other than page
    if (!("page" in updated)) {
      nextParams.delete("page");
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <TicketQueue
      categories={categories}
      onSelectTicket={(id: number) => navigate(`/tickets/${id}`)}
      status={filters.status}
      ownerId={filters.ownerId}
      itPriority={filters.itPriority}
      requestedPriority={filters.requestedPriority}
      search={filters.search}
      categoryId={filters.categoryId}
      page={filters.page}
      active={filters.active}
      appearsResolved={filters.appearsResolved}
      updatedSince={filters.updatedSince}
      onFilterChange={handleFilterChange}
    />
  );
}

export default TicketQueueRoute;

