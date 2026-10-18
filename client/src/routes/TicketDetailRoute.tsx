import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { TicketDetail } from "../components/TicketDetail";
import { NotFound } from "../components/common/NotFound";

export function TicketDetailRoute() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Strict integer validation (rejects non-numeric such as 'abc' or '42abc')
  if (!ticketId || !/^\d+$/.test(ticketId)) {
    return <NotFound />;
  }

  const numericId = parseInt(ticketId, 10);
  if (isNaN(numericId) || numericId <= 0) {
    return <NotFound />;
  }

  const handleBack = () => {
    // If internal application history exists, navigate back
    if (location.key !== "default") {
      navigate(-1);
    } else {
      // Safe fallback when accessed via external deep link or new tab
      if (user?.role === "REQUESTER") {
        navigate("/tickets");
      } else {
        navigate("/queue");
      }
    }
  };

  return <TicketDetail ticketId={numericId} onBack={handleBack} />;
}

export default TicketDetailRoute;
