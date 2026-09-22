import { formatJobDescription } from "./job-description";

type Detector = {
  detect(text: string): Promise<Array<{ detectedLanguage: string; confidence: number }>>;
  destroy?(): void;
};
type Translator = { translate(text: string): Promise<string>; destroy?(): void };
type BrowserTranslationApi = {
  LanguageDetector?: { create(): Promise<Detector> };
  Translator?: {
    availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
    create(options: { sourceLanguage: string; targetLanguage: string }): Promise<Translator>;
  };
};

export function supportsBrowserTranslation(): boolean {
  if (typeof window === "undefined") return false;
  const api = window as unknown as BrowserTranslationApi;
  return Boolean(api.LanguageDetector && api.Translator);
}

function splitText(text: string, maxLength = 3000): string[] {
  if (text.length <= maxLength) return [text];
  const result: string[] = [];
  let remaining = text;
  while (remaining.length > maxLength) {
    const boundary = remaining.lastIndexOf(" ", maxLength);
    const end = boundary > maxLength / 2 ? boundary + 1 : maxLength;
    result.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }
  if (remaining) result.push(remaining);
  return result;
}

export async function translateDescriptionToEnglish(
  sanitizedHtml: string,
  onProgress?: (completed: number, total: number) => void,
): Promise<{ html: string; sourceLanguage: string }> {
  const api = window as unknown as BrowserTranslationApi;
  if (!api.LanguageDetector || !api.Translator) throw new Error("On-device translation is not available in this browser.");
  const document = new DOMParser().parseFromString(sanitizedHtml, "text/html");
  const sample = (document.body.textContent || "").replace(/\s+/g, " ").trim().slice(0, 1500);
  if (!sample) return { html: sanitizedHtml, sourceLanguage: "en" };

  const detector = await api.LanguageDetector.create();
  let sourceLanguage: string;
  try {
    const candidate = (await detector.detect(sample))[0];
    if (!candidate || candidate.confidence < 0.4 || candidate.detectedLanguage === "und")
      throw new Error("The description language could not be identified confidently.");
    sourceLanguage = candidate.detectedLanguage;
  } finally { detector.destroy?.(); }
  if (sourceLanguage === "en") return { html: sanitizedHtml, sourceLanguage };

  const status = await api.Translator.availability({ sourceLanguage, targetLanguage: "en" });
  if (status === "unavailable") throw new Error("This language pair is not available on this device.");
  const translator = await api.Translator.create({ sourceLanguage, targetLanguage: "en" });
  try {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node as Text;
      if (text.textContent?.trim() && !text.parentElement?.closest("code, pre")) nodes.push(text);
    }
    onProgress?.(0, nodes.length);
    for (const [index, node] of nodes.entries()) {
      const original = node.textContent || "";
      const leading = original.match(/^\s*/)?.[0] || "";
      const trailing = original.match(/\s*$/)?.[0] || "";
      const translated: string[] = [];
      for (const chunk of splitText(original.trim())) translated.push(await translator.translate(chunk));
      node.textContent = leading + translated.join("") + trailing;
      onProgress?.(index + 1, nodes.length);
    }
    return { html: formatJobDescription(document.body.innerHTML), sourceLanguage };
  } finally { translator.destroy?.(); }
}
