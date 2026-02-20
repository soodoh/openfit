import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as TanstackReactRouterModule from "@tanstack/react-router";
import type * as HooksModule from "@/hooks";
import type { Units, WorkoutSessionWithData } from "@/lib/types";
import type * as WorkoutListModule from "@/components/workoutSet/workout-list";
import { CurrentSessionPage } from "./current-session-page";
import type * as CurrentDurationModule from "./current-duration";
import type * as EditSessionMenuModule from "./edit-session-menu";
const mockNavigate = vi.fn();
const mockMutateAsync = vi.fn();
vi.mock<typeof TanstackReactRouterModule>("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props} rel="noreferrer">
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}));
vi.mock<typeof HooksModule>("@/hooks", () => ({
  useUpdateSession: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));
vi.mock<typeof WorkoutListModule>(
  "@/components/workoutSet/workout-list",
  () => ({
    WorkoutList: () => <div data-testid="workout-list" />,
  }),
);
vi.mock<typeof CurrentDurationModule>("./current-duration", () => ({
  CurrentDuration: () => <div data-testid="current-duration" />,
}));
vi.mock<typeof EditSessionMenuModule>("./edit-session-menu", () => ({
  EditSessionMenu: () => <div data-testid="edit-session-menu" />,
}));
const mockSession = {
  id: "session-1",
  userId: "user-1",
  name: "Leg Day",
  notes: "",
  impression: null,
  startTime: new Date("2026-02-19T10:00:00.000Z"),
  endTime: null,
  templateId: null,
  createdAt: new Date("2026-02-19T10:00:00.000Z"),
  updatedAt: new Date("2026-02-19T10:00:00.000Z"),
  setGroups: [],
} as unknown as WorkoutSessionWithData;
const mockUnits: Units = {
  repetitionUnits: [],
  weightUnits: [],
};
describe("CurrentSessionPage end session confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  it("opens a confirmation dialog and does nothing when canceled", () => {
    render(<CurrentSessionPage session={mockSession} units={mockUnits} />);
    fireEvent.click(screen.getByRole("button", { name: "End Session" }));
    expect(screen.getByText("End Session?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("ends the session and navigates to logs after confirmation", async () => {
    render(<CurrentSessionPage session={mockSession} units={mockUnits} />);
    fireEvent.click(screen.getByRole("button", { name: "End Session" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, End Session" }));
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });
    const [payload] = mockMutateAsync.mock.calls[0];
    expect(payload.id).toBe(mockSession.id);
    expectTypeOf(payload.endTime).toBeNumber();
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/logs" });
  });
});
