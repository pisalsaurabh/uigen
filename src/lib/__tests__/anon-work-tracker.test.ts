import { describe, test, expect, beforeEach } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

const STORAGE_KEY = "uigen_has_anon_work";
const DATA_KEY = "uigen_anon_data";

beforeEach(() => {
  sessionStorage.clear();
});

describe("setHasAnonWork", () => {
  test("stores flag and data when messages exist", () => {
    const messages = [{ role: "user", content: "Hello" }];
    const fsData = { "/": { type: "directory" } };

    setHasAnonWork(messages, fsData);

    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("true");
    expect(JSON.parse(sessionStorage.getItem(DATA_KEY)!)).toEqual({
      messages,
      fileSystemData: fsData,
    });
  });

  test("stores flag and data when filesystem has more than root entry", () => {
    const messages: any[] = [];
    const fsData = {
      "/": { type: "directory" },
      "/App.jsx": { type: "file", content: "export default () => <div />" },
    };

    setHasAnonWork(messages, fsData);

    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  test("does not store when messages are empty and only root exists", () => {
    const messages: any[] = [];
    const fsData = { "/": { type: "directory" } };

    setHasAnonWork(messages, fsData);

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(DATA_KEY)).toBeNull();
  });

  test("does not store when both messages and fsData are empty", () => {
    setHasAnonWork([], {});

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("overwrites existing data on subsequent calls", () => {
    setHasAnonWork([{ role: "user", content: "first" }], {});
    setHasAnonWork([{ role: "user", content: "second" }], {});

    const data = JSON.parse(sessionStorage.getItem(DATA_KEY)!);
    expect(data.messages[0].content).toBe("second");
  });
});

describe("getHasAnonWork", () => {
  test("returns false when nothing is stored", () => {
    expect(getHasAnonWork()).toBe(false);
  });

  test("returns true after setHasAnonWork with content", () => {
    setHasAnonWork([{ role: "user", content: "Hello" }], {});
    expect(getHasAnonWork()).toBe(true);
  });

  test("returns false when flag is set to a value other than 'true'", () => {
    sessionStorage.setItem(STORAGE_KEY, "yes");
    expect(getHasAnonWork()).toBe(false);
  });
});

describe("getAnonWorkData", () => {
  test("returns null when nothing is stored", () => {
    expect(getAnonWorkData()).toBeNull();
  });

  test("returns parsed data when available", () => {
    const messages = [{ role: "user", content: "Hello" }];
    const fileSystemData = { "/App.jsx": { type: "file", content: "code" } };
    setHasAnonWork(messages, fileSystemData);

    const result = getAnonWorkData();
    expect(result).toEqual({ messages, fileSystemData });
  });

  test("returns null when stored data is malformed JSON", () => {
    sessionStorage.setItem(DATA_KEY, "not-json{{{");
    expect(getAnonWorkData()).toBeNull();
  });

  test("preserves complex message structures", () => {
    const messages = [
      { role: "user", content: "build me a button" },
      { role: "assistant", content: "Sure!", toolCalls: [{ id: "t1" }] },
    ];
    setHasAnonWork(messages, {});

    const result = getAnonWorkData();
    expect(result?.messages).toEqual(messages);
  });
});

describe("clearAnonWork", () => {
  test("removes both storage keys", () => {
    setHasAnonWork([{ role: "user", content: "Hello" }], {});
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("true");

    clearAnonWork();

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(DATA_KEY)).toBeNull();
  });

  test("is a no-op when storage is already empty", () => {
    expect(() => clearAnonWork()).not.toThrow();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("getHasAnonWork returns false after clearing", () => {
    setHasAnonWork([{ role: "user", content: "Hello" }], {});
    clearAnonWork();
    expect(getHasAnonWork()).toBe(false);
  });

  test("getAnonWorkData returns null after clearing", () => {
    setHasAnonWork([{ role: "user", content: "Hello" }], {});
    clearAnonWork();
    expect(getAnonWorkData()).toBeNull();
  });
});
