import DOMPurify from "isomorphic-dompurify";

const markupTag = /<\/?(?:article|section|div|p|br|ul|ol|li|h[1-6]|strong|em|b|i|a|blockquote|pre|code|table|thead|tbody|tr|th|td)(?=\s|\/?>)/i;
const escapedTag = /&(?:amp;)?(?:lt|#0*60|#x0*3c);\/?(?:article|section|div|p|br|ul|ol|li|h[1-6]|strong|em|b|i|a|blockquote|pre|code|table|thead|tbody|tr|th|td)(?=\s|&|\/)/i;
const escapedTags = new RegExp(escapedTag.source, "gi");
const allowedTags = ["article", "section", "div", "p", "br", "ul", "ol", "li", "h2", "h3", "h4", "strong", "em", "b", "i", "a", "blockquote", "pre", "code", "table", "thead", "tbody", "tr", "th", "td", "hr", "span"];

function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity: string) => {
    const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
    const key = entity.toLowerCase();
    if (key in named) return named[key];
    const code = key.startsWith("#x") ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
      ? String.fromCodePoint(code) : match;
  });
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function formatJobDescription(description: string | null | undefined): string {
  let content = description?.trim() || "";
  if (!content) return "<p>No description provided.</p>";

  // Some providers escape the description but append a raw HTML attribution.
  // A single escaped tag inside otherwise normal HTML may be an intentional
  // code example; repeated escaped tags indicate the content itself is encoded.
  const encodedTagCount = [...content.matchAll(escapedTags)].length;
  if (encodedTagCount > 1 || (encodedTagCount === 1 && !markupTag.test(content))) {
    for (let pass = 0; pass < 3 && escapedTag.test(content); pass++) {
      const decoded = decodeEntities(content);
      if (decoded === content) break;
      content = decoded;
    }
  }

  if (!markupTag.test(content)) {
    const text = escapeText(decodeEntities(content)).replace(/\r\n?/g, "\n");
    content = text.split(/\n\s*\n/).map(paragraph => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`).join("");
  }

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ["href", "title"],
    ALLOW_DATA_ATTR: false,
  });
}
