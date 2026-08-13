import { createContext, useContext, type ReactNode } from "react";
import { useDeviceState } from "@/hooks/useDevice";

type DeviceContextValue = ReturnType<typeof useDeviceState>;

const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const value = useDeviceState();
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return ctx;
}
