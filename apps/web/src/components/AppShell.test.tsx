import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/NotificationBell", () => ({
  default: () => <div>NotificationBellStub</div>,
}));

vi.mock("@/components/SchoolSelector", () => ({
  default: () => <div>SchoolSelectorStub</div>,
}));

vi.mock("@/components/TopRightQuickActions", () => ({
  default: () => <div>TopRightQuickActionsStub</div>,
}));

vi.mock("@k12/ui", async () => {
  const actual = await vi.importActual<typeof import("@k12/ui")>("@k12/ui");
  return {
    ...actual,
    LiveRegion: () => <div>LiveRegionStub</div>,
  };
});

describe("AppShell", () => {
  const mockedUsePathname = vi.mocked(usePathname);
  const mockedUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    mockedUsePathname.mockReturnValue("/dashboard");
    mockedUseAuth.mockReturnValue({
      user: createMockUser(),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders nav items filtered by user role (teacher)", () => {
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["teacher"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Teach" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assess" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Report" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Communicate" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("renders nav items filtered by user role (admin)", () => {
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["admin"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Teach" })).toBeInTheDocument();
  });

  it("hides curriculum profile management links for non-admin roles", () => {
    mockedUsePathname.mockReturnValue("/admin/dashboard");
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["curriculum_lead"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    fireEvent.mouseEnter(screen.getByRole("link", { name: "Admin" }).closest("div") as HTMLElement);
    expect(screen.queryByRole("link", { name: "Curriculum Profiles" })).not.toBeInTheDocument();
  });

  it("renders district nav item for district administrators", () => {
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["district_admin"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "District" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Teach" })).not.toBeInTheDocument();
  });

  it("renders nav items filtered by user role (student)", () => {
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["student"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Learn" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Communicate" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Plan" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Teach" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("highlights active route", () => {
    mockedUsePathname.mockReturnValue("/plan/units");

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Plan" })).toHaveAttribute("aria-current", "page");
  });

  it("expands child nav items for active section", () => {
    mockedUsePathname.mockReturnValue("/plan/units");

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Units" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
  });

  it("does not show child nav for inactive section", () => {
    mockedUsePathname.mockReturnValue("/dashboard");

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.queryByRole("link", { name: "Units" })).not.toBeInTheDocument();
  });

  it("shows flyout child nav on hover for sidebar sections", () => {
    mockedUsePathname.mockReturnValue("/dashboard");

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    const planLink = screen.getByRole("link", { name: "Plan" });
    const planListItem = planLink.closest("li");
    expect(planListItem).toBeTruthy();
    fireEvent.mouseEnter(planListItem as HTMLElement);

    expect(screen.getByRole("link", { name: "Units" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Calendar" })).toBeInTheDocument();
  });

  it("toggles mobile sidebar", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    const openButton = screen.getByRole("button", { name: "Open navigation menu" });
    fireEvent.click(openButton);
    expect(screen.getAllByRole("button", { name: "Close navigation menu" }).length).toBeGreaterThan(
      0,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Close navigation menu" })[0]);
    expect(screen.queryByRole("button", { name: "Close navigation menu" })).toBeInTheDocument();
  });

  it("renders top-right quick actions when user is present", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByText("TopRightQuickActionsStub")).toBeInTheDocument();
  });

  it("does not render authenticated header controls when no user", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.queryByText("SchoolSelectorStub")).not.toBeInTheDocument();
    expect(screen.queryByText("NotificationBellStub")).not.toBeInTheDocument();
    expect(screen.queryByText("TopRightQuickActionsStub")).not.toBeInTheDocument();
  });

  it("displays skip navigation link", () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
  });
});
