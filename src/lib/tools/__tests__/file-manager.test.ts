import { describe, test, expect, vi, beforeEach } from "vitest";
import { buildFileManagerTool } from "@/lib/tools/file-manager";

vi.mock("ai", () => ({
  tool: vi.fn((config) => config),
}));

const mockFileSystem = {
  rename: vi.fn(),
  deleteFile: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildFileManagerTool", () => {
  test("returns a tool with description and parameters", () => {
    const t = buildFileManagerTool(mockFileSystem as any);
    expect(t.description).toBeDefined();
    expect(t.parameters).toBeDefined();
  });
});

describe("file_manager execute — rename", () => {
  test("renames a file successfully", async () => {
    mockFileSystem.rename.mockReturnValue(true);
    const t = buildFileManagerTool(mockFileSystem as any);

    const result = await t.execute({
      command: "rename",
      path: "/old.tsx",
      new_path: "/new.tsx",
    });

    expect(mockFileSystem.rename).toHaveBeenCalledWith("/old.tsx", "/new.tsx");
    expect(result).toEqual({
      success: true,
      message: "Successfully renamed /old.tsx to /new.tsx",
    });
  });

  test("returns failure when rename returns false", async () => {
    mockFileSystem.rename.mockReturnValue(false);
    const t = buildFileManagerTool(mockFileSystem as any);

    const result = await t.execute({
      command: "rename",
      path: "/missing.tsx",
      new_path: "/dest.tsx",
    });

    expect(result).toEqual({
      success: false,
      error: "Failed to rename /missing.tsx to /dest.tsx",
    });
  });

  test("returns error when new_path is missing", async () => {
    const t = buildFileManagerTool(mockFileSystem as any);

    const result = await t.execute({ command: "rename", path: "/App.jsx" });

    expect(mockFileSystem.rename).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "new_path is required for rename command",
    });
  });

  test("renames a directory", async () => {
    mockFileSystem.rename.mockReturnValue(true);
    const t = buildFileManagerTool(mockFileSystem as any);

    const result = await t.execute({
      command: "rename",
      path: "/components",
      new_path: "/ui",
    });

    expect(mockFileSystem.rename).toHaveBeenCalledWith("/components", "/ui");
    expect(result.success).toBe(true);
  });
});

describe("file_manager execute — delete", () => {
  test("deletes a file successfully", async () => {
    mockFileSystem.deleteFile.mockReturnValue(true);
    const t = buildFileManagerTool(mockFileSystem as any);

    const result = await t.execute({ command: "delete", path: "/App.jsx" });

    expect(mockFileSystem.deleteFile).toHaveBeenCalledWith("/App.jsx");
    expect(result).toEqual({
      success: true,
      message: "Successfully deleted /App.jsx",
    });
  });

  test("returns failure when delete returns false", async () => {
    mockFileSystem.deleteFile.mockReturnValue(false);
    const t = buildFileManagerTool(mockFileSystem as any);

    const result = await t.execute({ command: "delete", path: "/ghost.tsx" });

    expect(result).toEqual({
      success: false,
      error: "Failed to delete /ghost.tsx",
    });
  });

  test("does not call rename when deleting", async () => {
    mockFileSystem.deleteFile.mockReturnValue(true);
    const t = buildFileManagerTool(mockFileSystem as any);

    await t.execute({ command: "delete", path: "/App.jsx" });

    expect(mockFileSystem.rename).not.toHaveBeenCalled();
  });
});
