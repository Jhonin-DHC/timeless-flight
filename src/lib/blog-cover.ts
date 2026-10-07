const IMAGE_MARKDOWN = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const IMAGE_HTML = /<img\b[^>]*>/i;

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return (match?.[2] ?? match?.[3] ?? match?.[4] ?? "").trim();
}

export function extractCoverImage(body: string) {
  const markdown = body.match(IMAGE_MARKDOWN);
  if (markdown) return { alt: markdown[1]?.trim() || "", url: markdown[2]?.trim() || "" };

  const tag = body.match(IMAGE_HTML)?.[0];
  if (tag) {
    return { alt: attr(tag, "alt"), url: attr(tag, "src") };
  }

  return { alt: "", url: "" };
}

export function bodyLooksLikeHtml(body: string) {
  return /<\/?(p|h[1-6]|strong|em|ul|ol|li|img|br|div|span|blockquote|figure|a)\b/i.test(body);
}
