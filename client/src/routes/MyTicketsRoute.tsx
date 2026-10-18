import React, { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MyTickets } from "../components/MyTickets";
import { Category } from "../api";

interface MyTicketsRouteProps {
  categories: Category[];
}

const VALID_STATUSES = new Set([
  "New", "Open", "InProgress", "WaitingForRequester", "Resolved", "Closed", "Reopened", "Cancelled"
]);
const VALID_PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH"]);

export function MyTicketsRoute({ categories }: MyTicketsRouteProps) {
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

    const rawRequestedPriority = searchParams.get("requestedPriority");
    let requestedPriority = "";
    if (rawRequestedPriority && VALID_PRIORITIES.has(rawRequestedPriority)) {
      requestedPriority = rawRequestedPriority;
    }

    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;

    return {
      status,
      requestedPriority,
      search,
      categoryId,
      page
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

    if (!("page" in updated)) {
      nextParams.delete("page");
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <MyTickets
      categories={categories}
      onSelectTicket={(id: number) => navigate(`/tickets/${id}`)}
      status={filters.status}
      requestedPriority={filters.requestedPriority}
      search={filters.search}
      categoryId={filters.categoryId}
      page={filters.page}
      onFilterChange={handleFilterChange}
    />
  );
}

export default MyTicketsRoute;
