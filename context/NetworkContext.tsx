"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface NetworkContextType {
  isOnline: boolean;
  checkNetwork: () => boolean;
  showNetworkError: () => void;
  hideNetworkError: () => void;
  networkErrorVisible: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [networkErrorVisible, setNetworkErrorVisible] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkErrorVisible(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkErrorVisible(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkNetwork = () => {
    const online = navigator.onLine;
    setIsOnline(online);
    if (!online) {
      setNetworkErrorVisible(true);
    }
    return online;
  };

  const showNetworkError = () => setNetworkErrorVisible(true);
  const hideNetworkError = () => setNetworkErrorVisible(false);

  const value: NetworkContextType = {
    isOnline,
    checkNetwork,
    showNetworkError,
    hideNetworkError,
    networkErrorVisible,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}