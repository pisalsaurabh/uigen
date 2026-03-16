import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SignInForm } from "@/components/auth/SignInForm";
import { useAuth } from "@/hooks/use-auth";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const mockSignIn = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as any).mockReturnValue({ signIn: mockSignIn, isLoading: false });
});

afterEach(() => {
  cleanup();
});

describe("SignInForm — rendering", () => {
  test("renders email and password inputs", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
  });

  test("renders submit button with 'Sign In' text", () => {
    render(<SignInForm />);
    expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
  });

  test("does not show error initially", () => {
    render(<SignInForm />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("inputs are enabled when not loading", () => {
    render(<SignInForm />);
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    expect(emailInput.disabled).toBe(false);
    expect(passwordInput.disabled).toBe(false);
  });
});

describe("SignInForm — loading state", () => {
  test("disables inputs and button when loading", () => {
    (useAuth as any).mockReturnValue({ signIn: mockSignIn, isLoading: true });
    render(<SignInForm />);

    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    const button = screen.getByRole("button") as HTMLButtonElement;

    expect(emailInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
    expect(button.disabled).toBe(true);
  });

  test("shows 'Signing in...' text when loading", () => {
    (useAuth as any).mockReturnValue({ signIn: mockSignIn, isLoading: true });
    render(<SignInForm />);
    expect(screen.getByText("Signing in...")).toBeDefined();
  });
});

describe("SignInForm — submission", () => {
  test("calls signIn with entered credentials on submit", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "secret123");
    });
  });

  test("calls onSuccess callback when sign in succeeds", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    render(<SignInForm onSuccess={onSuccess} />);

    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  test("does not call onSuccess when sign in fails", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
    const onSuccess = vi.fn();
    render(<SignInForm onSuccess={onSuccess} />);

    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => {
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});

describe("SignInForm — error handling", () => {
  test("displays error message from server on failure", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
    render(<SignInForm />);

    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeDefined();
    });
  });

  test("falls back to generic error message when server returns none", async () => {
    mockSignIn.mockResolvedValue({ success: false });
    render(<SignInForm />);

    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Failed to sign in")).toBeDefined();
    });
  });

  test("clears previous error on new submission", async () => {
    mockSignIn
      .mockResolvedValueOnce({ success: false, error: "First error" })
      .mockResolvedValueOnce({ success: true });

    render(<SignInForm />);
    const form = screen.getByLabelText("Email").closest("form")!;

    fireEvent.submit(form);
    await waitFor(() => screen.getByText("First error"));

    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.queryByText("First error")).toBeNull();
    });
  });
});
