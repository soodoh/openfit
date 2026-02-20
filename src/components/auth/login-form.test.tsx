import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as AuthProviderModule from "@/components/providers/auth-provider";
import type * as AuthClientModule from "@/lib/auth-client";
import type * as TanstackReactRouterModule from "@tanstack/react-router";
import { LoginForm } from "./login-form";

const mockNavigate = vi.fn();
const mockSignInEmail = vi.fn();
const mockSignUpEmail = vi.fn();
const mockUseAuth = vi.fn();
const mockGetSession = vi.fn();

vi.mock<typeof TanstackReactRouterModule>("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props} rel="noreferrer">
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}));

vi.mock<typeof AuthProviderModule>(
  "@/components/providers/auth-provider",
  () => ({
    signIn: {
      email: (...args: unknown[]) => mockSignInEmail(...args),
      social: vi.fn(),
      oauth2: vi.fn(),
    },
    signUp: {
      email: (...args: unknown[]) => mockSignUpEmail(...args),
    },
    useAuth: () => mockUseAuth(),
  }),
);

vi.mock<typeof AuthClientModule>("@/lib/auth-client", () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe("LoginForm redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    mockSignInEmail.mockResolvedValue({ error: null });
    mockSignUpEmail.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({
      data: { session: { id: "session-1" } },
    });
  });

  it("redirects to home when already authenticated", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<LoginForm />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/", replace: true });
    });
  });

  it("refreshes session and redirects after email login", async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith({
        email: "person@example.com",
        password: "Password1!",
      });
      expect(mockGetSession).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/", replace: true });
    });
  });

  it("shows an error when session is missing after successful login", async () => {
    mockGetSession.mockResolvedValue({
      data: null,
      error: { message: "missing" },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(
        screen.getByText("Authentication succeeded but session was not ready"),
      ).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
