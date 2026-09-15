"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type ElementType,
} from "react";
import { ShieldCheck, Coins, TrendingUp } from "lucide-react";

export type Role = "admin" | "issuer" | "investor";

interface RoleContextValue {
  role: Role | null;
  setRole: (role: Role) => void;
  clearRole: () => void;
  isRoleSelected: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "assetflow-role";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  issuer: "Issuer",
  investor: "Investor",
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Verify assets & monitor protocol activity",
  issuer: "Create, tokenize & list real-world assets",
  investor: "Buy tokens, earn yield, collateralize & borrow",
};

const ROLE_ICONS: Record<Role, ElementType> = {
  admin: ShieldCheck,
  issuer: Coins,
  investor: TrendingUp,
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === "admin" || stored === "issuer" || stored === "investor")) {
      setRoleState(stored as Role);
    }
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    localStorage.setItem(STORAGE_KEY, r);
  }, []);

  const clearRole = useCallback(() => {
    setRoleState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <RoleContext.Provider
      value={{ role, setRole, clearRole, isRoleSelected: role !== null }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) return { role: null, setRole: () => {}, clearRole: () => {}, isRoleSelected: false };
  return ctx;
}

export { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS };
