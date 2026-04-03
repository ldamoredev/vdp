"use client";

import { useQuery } from "@tanstack/react-query";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: "user";
};

type MeResponse = {
  user: CurrentUser;
};

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await fetch("/api/auth/me", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Not authenticated");
  }

  const payload = (await response.json()) as MeResponse;
  return payload.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 30_000,
  });
}
