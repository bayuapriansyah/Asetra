"use client";

import { useRole, type Role } from "@/lib/context/RoleContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RoleGuard({ allowed, children }: { allowed: Role[]; children: React.ReactNode }) {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role && !allowed.includes(role)) {
      router.replace("/app");
    }
  }, [role, allowed, router]);

  if (!role || !allowed.includes(role)) return null;

  return <>{children}</>;
}
