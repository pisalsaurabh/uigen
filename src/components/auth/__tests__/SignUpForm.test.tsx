import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useAuth } from "@/hooks/use-auth";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const mockSignUp = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as any).mockReturnValue({ signUp: mockSignUp, isLoading: false });
});

afterEach(() => {
  cleanup();
});

describe("SignUpForm — rendering", () => {
  test("renders email, password, and confirm password inputs", () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByLabelText("Confirm Password")).toBeDefined();
  });

  test("renders submit button with 'Sign Up' text", () => {
    render(<SignUpForm />);
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();
  });

  test("shows minimum password length hint", () => {
    render(<SignUpForm />);
    expect(screen.getByText(/at least 8 characters/i)).toBeDefined();
  });

  test("does not show error initially", () => {
    render(<SignUpForm />);
    expect(screen.queryByText(/passwords do not match/i)).toBeNull();
  });
});

describe("SignUpForm — loading state", () => {
  test("disables all inputs and button when loading", () => {
    (useAuth as any).mockReturnValue({ signUp: mockSignUp, isLoading: true });
    render(<SignUpForm />);

    expect((screen.getByLabelText("Email") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Password") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Confirm Password") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });

  test("shows 'Creating account...' when loading", () => {
    (useAuth as any).mockReturnValue({ signUp: mockSignUp, isLoading: true });
    render(<SignUpForm />);
    expect(screen.getByText("Creating account...")).toBeDefined();
  });
});

describe("SignUpForm — validation", () => {
  test("shows password mismatch error without calling signUp", async () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password1" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password2" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeDefined();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  test("proceeds with signUp when passwords match", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "securepass" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "securepass" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "securepass");
    });
  });
});

describe("SignUpForm — submission", () => {
  test("calls onSuccess callback on successful sign up", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    render(<SignUpForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "mypassword" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "mypassword" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  test("does not call onSuccess when sign up fails", async () => {
    mockSignUp.mockResolvedValue({ success: false, error: "Email taken" });
    const onSuccess = vi.fn();
    render(<SignUpForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "mypassword" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "mypassword" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => {
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});

describe("SignUpForm — error handling", () => {
  test("displays server error on failure", async () => {
    mockSignUp.mockResolvedValue({ success: false, error: "Email already registered" });
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "pass1234" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "pass1234" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Email already registered")).toBeDefined();
    });
  });

  test("shows generic error when server provides none", async () => {
    mockSignUp.mockResolvedValue({ success: false });
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "pass1234" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "pass1234" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Failed to sign up")).toBeDefined();
    });
  });

  test("clears password mismatch error on resubmit with matching passwords", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    render(<SignUpForm />);
    const form = screen.getByLabelText("Email").closest("form")!;

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "aaa" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "bbb" },
    });
    fireEvent.submit(form);
    await waitFor(() => screen.getByText("Passwords do not match"));

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "matched" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "matched" },
    });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.queryByText("Passwords do not match")).toBeNull();
    });
  });
});
