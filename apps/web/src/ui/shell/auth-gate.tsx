import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useCurrentUser } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && isError) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      navigate(`/login${next}`, { replace: true });
    }
  }, [isError, isLoading, pathname, navigate]);

  if (isError) {
    return null;
  }

  // Optimistic render while /api/auth/me resolves: the middleware already
  // guaranteed a session cookie exists for any non-public route, so blocking
  // the whole shell here would add a full roundtrip to every cold load. An
  // invalid cookie still redirects via the effect above; until then the shell
  // renders with its own loading states.
  return <>{children}</>;
}
