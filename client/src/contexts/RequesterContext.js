import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from "react";
const RequesterContext = createContext(undefined);
export function RequesterProvider({ children }) {
    const [activeRequester, setActiveRequester] = useState(() => {
        // Try to load from localStorage on init
        try {
            const stored = localStorage.getItem("toktickit_requester");
            return stored ? JSON.parse(stored) : null;
        }
        catch (err) {
            return null;
        }
    });
    // Keep localStorage in sync
    useEffect(() => {
        if (activeRequester) {
            localStorage.setItem("toktickit_requester", JSON.stringify(activeRequester));
        }
        else {
            localStorage.removeItem("toktickit_requester");
        }
    }, [activeRequester]);
    return (_jsx(RequesterContext.Provider, { value: { activeRequester, setRequester: setActiveRequester }, children: children }));
}
export function useRequester() {
    const context = useContext(RequesterContext);
    if (context === undefined) {
        throw new Error("useRequester must be used within a RequesterProvider");
    }
    return context;
}
