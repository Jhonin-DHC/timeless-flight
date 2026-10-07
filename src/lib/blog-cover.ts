const IMAGE_MARKDOWN = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;

export function extractCoverImage(body: string) {
  const match = body.match(IMAGE_MARKDOWN);
  if (!match) return { alt: "", url: "" };
  return { alt: match[1]?.trim() || "", url: match[2]?.trim() || "" };
}
