import { describe, test, expect, vi, beforeEach } from "vitest";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";

const mockFileSystem = {
  viewFile: vi.fn(),
  createFileWithParents: vi.fn(),
  replaceInFile: vi.fn(),
  insertInFile: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildStrReplaceTool", () => {
  test("returns tool with correct id", () => {
    const tool = buildStrReplaceTool(mockFileSystem as any);
    expect(tool.id).toBe("str_replace_editor");
  });

  test("returns tool with parameters schema", () => {
    const tool = buildStrReplaceTool(mockFileSystem as any);
    expect(tool.parameters).toBeDefined();
  });
});

describe("str_replace_editor execute — view", () => {
  test("calls viewFile with path and no range", async () => {
    mockFileSystem.viewFile.mockReturnValue("line content");
    const tool = buildStrReplaceTool(mockFileSystem as any);

    await tool.execute({ command: "view", path: "/App.jsx" });

    expect(mockFileSystem.viewFile).toHaveBeenCalledWith("/App.jsx", undefined);
  });

  test("calls viewFile with path and view_range", async () => {
    mockFileSystem.viewFile.mockReturnValue("partial content");
    const tool = buildStrReplaceTool(mockFileSystem as any);

    const result = await tool.execute({
      command: "view",
      path: "/App.jsx",
      view_range: [1, 10],
    });

    expect(mockFileSystem.viewFile).toHaveBeenCalledWith("/App.jsx", [1, 10]);
    expect(result).toBe("partial content");
  });

  test("returns viewFile result", async () => {
    mockFileSystem.viewFile.mockReturnValue("1: const x = 1;");
    const tool = buildStrReplaceTool(mockFileSystem as any);

    const result = await tool.execute({ command: "view", path: "/index.ts" });

    expect(result).toBe("1: const x = 1;");
  });
});

describe("str_replace_editor execute — create", () => {
  test("calls createFileWithParents with path and content", async () => {
    mockFileSystem.createFileWithParents.mockReturnValue("created");
    const tool = buildStrReplaceTool(mockFileSystem as any);

    await tool.execute({
      command: "create",
      path: "/components/Button.tsx",
      file_text: "export const Button = () => <button />;",
    });

    expect(mockFileSystem.createFileWithParents).toHaveBeenCalledWith(
      "/components/Button.tsx",
      "export const Button = () => <button />;"
    );
  });

  test("defaults to empty string when file_text is omitted", async () => {
    const tool = buildStrReplaceTool(mockFileSystem as any);

    await tool.execute({ command: "create", path: "/empty.ts" });

    expect(mockFileSystem.createFileWithParents).toHaveBeenCalledWith(
      "/empty.ts",
      ""
    );
  });
});

describe("str_replace_editor execute — str_replace", () => {
  test("calls replaceInFile with path, old_str, and new_str", async () => {
    mockFileSystem.replaceInFile.mockReturnValue("replaced");
    const tool = buildStrReplaceTool(mockFileSystem as any);

    await tool.execute({
      command: "str_replace",
      path: "/App.jsx",
      old_str: "const x = 1;",
      new_str: "const x = 2;",
    });

    expect(mockFileSystem.replaceInFile).toHaveBeenCalledWith(
      "/App.jsx",
      "const x = 1;",
      "const x = 2;"
    );
  });

  test("defaults old_str and new_str to empty strings when omitted", async () => {
    const tool = buildStrReplaceTool(mockFileSystem as any);

    await tool.execute({ command: "str_replace", path: "/App.jsx" });

    expect(mockFileSystem.replaceInFile).toHaveBeenCalledWith("/App.jsx", "", "");
  });
});

describe("str_replace_editor execute — insert", () => {
  test("calls insertInFile with path, line, and content", async () => {
    mockFileSystem.insertInFile.mockReturnValue("inserted");
    const tool = buildStrReplaceTool(mockFileSystem as any);

    await tool.execute({
      command: "insert",
      path: "/App.jsx",
      insert_line: 5,
      new_str: "const added = true;",
    });

    expect(mockFileSystem.insertInFile).toHaveBeenCalledWith(
      "/App.jsx",
      5,
      "const added = true;"
    );
  });

  test("defaults insert_line to 0 and new_str to empty when omitted", async () => {
    const tool = buildStrReplaceTool(mockFileSystem as any);

    await tool.execute({ command: "insert", path: "/App.jsx" });

    expect(mockFileSystem.insertInFile).toHaveBeenCalledWith("/App.jsx", 0, "");
  });
});

describe("str_replace_editor execute — undo_edit", () => {
  test("returns an error message indicating undo is unsupported", async () => {
    const tool = buildStrReplaceTool(mockFileSystem as any);

    const result = await tool.execute({ command: "undo_edit", path: "/App.jsx" });

    expect(result).toContain("undo_edit command is not supported");
    expect(result).toContain("str_replace");
  });
});
