import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useCurrentUser } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isLoading, isError, data } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && isError) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      navigate(`/login${next}`, { replace: true });
    }
  }, [isError, isLoading, pathname, navigate]);

  if (isError) return null;
  if (isLoading && !data) return null;
  if (!data) return null;

  // Do not mount module screens until the browser session is confirmed.
  // Otherwise their presenters can fire API requests, cache error state, and
  // briefly boot module-local stores before the redirect to /login completes.
  return <>{children}</>;
}
