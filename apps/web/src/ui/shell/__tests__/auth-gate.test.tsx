import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth";

const { useCurrentUser, navigate } = vi.hoisted(() => ({
  useCurrentUser: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  useCurrentUser,
}));

vi.mock("react-router", () => ({
  useLocation: () => ({ pathname: "/health" }),
  useNavigate: () => navigate,
}));

import { AuthGate } from "../auth-gate";

const user: CurrentUser = {
  id: "user-1",
  email: "test@example.com",
  displayName: "Test User",
  role: "user",
};

describe("AuthGate", () => {
  beforeEach(() => {
    useCurrentUser.mockReset();
    navigate.mockReset();
  });

  it("does not mount protected content while the initial session check is loading", () => {
    useCurrentUser.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const markup = renderToStaticMarkup(
      <AuthGate>
        <div>protected module booted</div>
      </AuthGate>,
    );

    expect(markup).not.toContain("protected module booted");
  });

  it("renders protected content when a user is already confirmed", () => {
    useCurrentUser.mockReturnValue({
      data: user,
      error: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const markup = renderToStaticMarkup(
      <AuthGate>
        <div>protected module booted</div>
      </AuthGate>,
    );

    expect(markup).toContain("protected module booted");
  });
});
