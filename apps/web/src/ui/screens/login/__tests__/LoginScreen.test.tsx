// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { clearCurrentUser, setAuthenticatedUser, navigate } = vi.hoisted(() => ({
  clearCurrentUser: vi.fn(),
  setAuthenticatedUser: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  clearCurrentUser,
  setAuthenticatedUser,
}));

vi.mock("react-router", () => ({
  useNavigate: () => navigate,
}));

import { LoginPageClient } from "../LoginScreen";

describe("LoginScreen", () => {
  beforeEach(() => {
    clearCurrentUser.mockReset();
    setAuthenticatedUser.mockReset();
    navigate.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("clears any stale client user before a login request can fail", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasUsers: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({ message: "Bad Gateway" }),
      } as Response);

    render(<LoginPageClient nextPath="/tasks" />);

    await screen.findByRole("heading", { name: "Bienvenido de nuevo" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "password-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Bienvenido de nuevo" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", expect.anything()));
    const clearOrder = clearCurrentUser.mock.invocationCallOrder[0];
    const loginOrder = fetchMock.mock.invocationCallOrder[1];
    expect(clearOrder).toBeLessThan(loginOrder);
    expect(setAuthenticatedUser).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
