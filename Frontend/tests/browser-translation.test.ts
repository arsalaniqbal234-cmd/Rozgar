import { afterEach, describe, expect, it, vi } from "vitest";
import { translateDescriptionToEnglish } from "../lib/browser-translation";

afterEach(() => vi.unstubAllGlobals());

describe("on-device description translation", () => {
  it("translates German text while retaining safe paragraphs and emphasis", async () => {
    const translate = vi.fn(async (text: string) => ({ Hallo: "Hello", Welt: "world" }[text] || text));
    vi.stubGlobal("LanguageDetector", { create: vi.fn(async () => ({
      detect: async () => [{ detectedLanguage: "de", confidence: 0.99 }],
    })) });
    vi.stubGlobal("Translator", { availability: async () => "available", create: async () => ({ translate }) });
    const progress = vi.fn();
    const result = await translateDescriptionToEnglish("<p>Hallo <strong>Welt</strong></p>", progress);
    expect(result.sourceLanguage).toBe("de");
    expect(result.html).toBe("<p>Hello <strong>world</strong></p>");
    expect(progress).toHaveBeenLastCalledWith(2, 2);
  });

  it("does not translate a description detected as English", async () => {
    vi.stubGlobal("LanguageDetector", { create: async () => ({
      detect: async () => [{ detectedLanguage: "en", confidence: 0.99 }],
    }) });
    const create = vi.fn();
    vi.stubGlobal("Translator", { availability: async () => "available", create });
    const result = await translateDescriptionToEnglish("<p>Already English</p>");
    expect(result.html).toBe("<p>Already English</p>");
    expect(create).not.toHaveBeenCalled();
  });
});
