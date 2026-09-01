import React, { createContext, useContext, useState, useEffect } from "react";
import { Requester } from "../api.js";

interface RequesterContextType {
  activeRequester: Requester | null;
  setRequester: (requester: Requester | null) => void;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export function RequesterProvider({ children }: { children: React.ReactNode }) {
  const [activeRequester, setActiveRequester] = useState<Requester | null>(() => {
    // Try to load from localStorage on init
    const stored = localStorage.getItem("toktickit_requester");
    return stored ? JSON.parse(stored) : null;
  });

  // Keep localStorage in sync
  useEffect(() => {
    if (activeRequester) {
      localStorage.setItem("toktickit_requester", JSON.stringify(activeRequester));
    } else {
      localStorage.removeItem("toktickit_requester");
    }
  }, [activeRequester]);

  return (
    <RequesterContext.Provider value={{ activeRequester, setRequester: setActiveRequester }}>
      {children}
    </RequesterContext.Provider>
  );
}

export function useRequester() {
  const context = useContext(RequesterContext);
  if (context === undefined) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
}
