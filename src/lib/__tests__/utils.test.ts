import { describe, test, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  test("returns a single class unchanged", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  test("merges multiple classes", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });

  test("resolves tailwind conflicts — last class wins", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  test("resolves padding conflicts", () => {
    expect(cn("p-4", "px-2")).toBe("p-4 px-2");
    expect(cn("px-2", "p-4")).toBe("p-4");
  });

  test("handles conditional classes with objects", () => {
    expect(cn({ "text-bold": true, hidden: false })).toBe("text-bold");
  });

  test("handles conditional classes — false values are omitted", () => {
    expect(cn("base", { "text-red-500": false, "text-green-500": true })).toBe(
      "base text-green-500"
    );
  });

  test("handles array of classes", () => {
    expect(cn(["px-2", "py-4"])).toBe("px-2 py-4");
  });

  test("handles mixed arrays and strings", () => {
    expect(cn("base", ["px-2", "py-4"])).toBe("base px-2 py-4");
  });

  test("ignores undefined and null values", () => {
    expect(cn("base", undefined, null)).toBe("base");
  });

  test("returns empty string when no args are provided", () => {
    expect(cn()).toBe("");
  });

  test("deduplicates conflicting font-size utilities", () => {
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  test("handles complex real-world merge", () => {
    const result = cn(
      "flex items-center gap-2",
      { "opacity-50 cursor-not-allowed": true },
      "text-sm"
    );
    expect(result).toBe("flex items-center gap-2 opacity-50 cursor-not-allowed text-sm");
  });
});
