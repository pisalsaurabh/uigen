import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { AuthDialog } from "@/components/auth/AuthDialog";

vi.mock("@/components/auth/SignInForm", () => ({
  SignInForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="sign-in-form">
      <button onClick={onSuccess}>Mock Sign In</button>
    </div>
  ),
}));

vi.mock("@/components/auth/SignUpForm", () => ({
  SignUpForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="sign-up-form">
      <button onClick={onSuccess}>Mock Sign Up</button>
    </div>
  ),
}));

const onOpenChange = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("AuthDialog — rendering", () => {
  test("does not render content when closed", () => {
    render(
      <AuthDialog open={false} onOpenChange={onOpenChange} />
    );
    expect(screen.queryByTestId("sign-in-form")).toBeNull();
    expect(screen.queryByTestId("sign-up-form")).toBeNull();
  });

  test("renders SignInForm by default when open", () => {
    render(<AuthDialog open={true} onOpenChange={onOpenChange} />);
    expect(screen.getByTestId("sign-in-form")).toBeDefined();
    expect(screen.queryByTestId("sign-up-form")).toBeNull();
  });

  test("renders SignUpForm when defaultMode is signup", () => {
    render(
      <AuthDialog open={true} onOpenChange={onOpenChange} defaultMode="signup" />
    );
    expect(screen.getByTestId("sign-up-form")).toBeDefined();
    expect(screen.queryByTestId("sign-in-form")).toBeNull();
  });
});

describe("AuthDialog — title and description", () => {
  test("shows 'Welcome back' title in signin mode", () => {
    render(<AuthDialog open={true} onOpenChange={onOpenChange} />);
    expect(screen.getByText("Welcome back")).toBeDefined();
  });

  test("shows 'Create an account' title in signup mode", () => {
    render(
      <AuthDialog open={true} onOpenChange={onOpenChange} defaultMode="signup" />
    );
    expect(screen.getByText("Create an account")).toBeDefined();
  });

  test("shows signin description in signin mode", () => {
    render(<AuthDialog open={true} onOpenChange={onOpenChange} />);
    expect(screen.getByText(/sign in to your account/i)).toBeDefined();
  });

  test("shows signup description in signup mode", () => {
    render(
      <AuthDialog open={true} onOpenChange={onOpenChange} defaultMode="signup" />
    );
    expect(screen.getByText(/start creating ai-powered/i)).toBeDefined();
  });
});

describe("AuthDialog — mode switching", () => {
  test("switches to signup when 'Sign up' link is clicked", async () => {
    render(<AuthDialog open={true} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(screen.getByTestId("sign-up-form")).toBeDefined();
      expect(screen.queryByTestId("sign-in-form")).toBeNull();
    });
  });

  test("switches back to signin when 'Sign in' link is clicked from signup", async () => {
    render(
      <AuthDialog open={true} onOpenChange={onOpenChange} defaultMode="signup" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByTestId("sign-in-form")).toBeDefined();
      expect(screen.queryByTestId("sign-up-form")).toBeNull();
    });
  });

  test("updates title when switching modes", async () => {
    render(<AuthDialog open={true} onOpenChange={onOpenChange} />);
    expect(screen.getByText("Welcome back")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(screen.getByText("Create an account")).toBeDefined();
    });
  });
});

describe("AuthDialog — success handling", () => {
  test("calls onOpenChange(false) when SignInForm succeeds", async () => {
    render(<AuthDialog open={true} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Mock Sign In" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("calls onOpenChange(false) when SignUpForm succeeds", async () => {
    render(
      <AuthDialog open={true} onOpenChange={onOpenChange} defaultMode="signup" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Mock Sign Up" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("AuthDialog — defaultMode prop update", () => {
  test("syncs mode when defaultMode prop changes", async () => {
    const { rerender } = render(
      <AuthDialog open={true} onOpenChange={onOpenChange} defaultMode="signin" />
    );
    expect(screen.getByTestId("sign-in-form")).toBeDefined();

    rerender(
      <AuthDialog open={true} onOpenChange={onOpenChange} defaultMode="signup" />
    );

    await waitFor(() => {
      expect(screen.getByTestId("sign-up-form")).toBeDefined();
    });
  });
});
