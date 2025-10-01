import { render, screen } from "@testing-library/react";
import { useAuth } from "@clerk/nextjs";
import Home from "./page";

jest.mock("@clerk/nextjs", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/socket", () => ({
  socketService: {
    connect: jest.fn(() => ({
      on: jest.fn(),
      emit: jest.fn(),
    })),
    disconnect: jest.fn(),
    getSocket: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders sign in message when user is not signed in", () => {
    mockUseAuth.mockReturnValue({
      getToken: jest.fn(),
      isSignedIn: false,
      userId: null,
      isLoaded: true,
      signOut: jest.fn(),
      sessionId: null,
      sessionClaims: null,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      has: jest.fn(),
    });

    render(<Home />);

    expect(
      screen.getByText("Please sign in to use the AI Playground")
    ).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("renders AI playground when user is signed in", () => {
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockResolvedValue("mock-token"),
      isSignedIn: true,
      userId: "test-user-id",
      isLoaded: true,
      signOut: jest.fn(),
      sessionId: "test-session-id",
      sessionClaims: {
        sub: "test-user-id",
        iat: 1234567890,
        exp: 1234567890,
      } as any,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      has: jest.fn(),
    });

    render(<Home />);

    expect(screen.getByText("AI Model Playground")).toBeInTheDocument();
    expect(
      screen.getByText("Compare AI responses side-by-side")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Select Providers (minimum 2):")
    ).toBeInTheDocument();
  });

  it("displays provider selection options", () => {
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockResolvedValue("mock-token"),
      isSignedIn: true,
      userId: "test-user-id",
      isLoaded: true,
      signOut: jest.fn(),
      sessionId: "test-session-id",
      sessionClaims: {
        sub: "test-user-id",
        iat: 1234567890,
        exp: 1234567890,
      } as any,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      has: jest.fn(),
    });

    render(<Home />);

    expect(screen.getByText("Google Gemini")).toBeInTheDocument();
    expect(screen.getByText("Anthropic Claude")).toBeInTheDocument();
  });
});
