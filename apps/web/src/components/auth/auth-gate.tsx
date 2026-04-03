"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && isError) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [isError, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-[var(--foreground-muted)]">
        Cargando sesion...
      </div>
    );
  }

  if (isError) {
    return null;
  }

  return <>{children}</>;
}
