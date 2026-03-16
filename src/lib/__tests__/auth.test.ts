// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ set: mockCookieSet, get: mockCookieGet })),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => {
    mockCookieSet.mockClear();
    mockCookieGet.mockClear();
  });

  test("sets an httpOnly cookie", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    expect(mockCookieSet).toHaveBeenCalledOnce();
    const [name, , options] = mockCookieSet.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    expect(options.sameSite).toBe("lax");
  });

  test("cookie expires in ~7 days", async () => {
    const before = Date.now();
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const [, , options] = mockCookieSet.mock.calls[0];
    const expiresMs = options.expires.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs);
  });

  test("token encodes userId and email", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-42", "hello@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("user-42");
    expect(payload.email).toBe("hello@example.com");
  });

  test("token is signed with HS256", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    const header = JSON.parse(atob(token.split(".")[0]));
    expect(header.alg).toBe("HS256");
  });
});

describe("getSession", () => {
  beforeEach(() => {
    mockCookieGet.mockClear();
    mockCookieSet.mockClear();
  });

  test("returns null when no cookie is present", async () => {
    mockCookieGet.mockReturnValue(undefined);
    const { getSession } = await import("@/lib/auth");

    expect(await getSession()).toBeNull();
  });

  test("returns null for an invalid token", async () => {
    mockCookieGet.mockReturnValue({ value: "not.a.valid.token" });
    const { getSession } = await import("@/lib/auth");

    expect(await getSession()).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const { SignJWT } = await import("jose");
    const expiredToken = await new SignJWT({ userId: "u1", email: "a@b.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("-1s")
      .sign(JWT_SECRET);

    mockCookieGet.mockReturnValue({ value: expiredToken });
    const { getSession } = await import("@/lib/auth");

    expect(await getSession()).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const { createSession, getSession } = await import("@/lib/auth");
    await createSession("user-7", "valid@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    mockCookieGet.mockReturnValue({ value: token });

    const session = await getSession();
    expect(session?.userId).toBe("user-7");
    expect(session?.email).toBe("valid@example.com");
  });
});
