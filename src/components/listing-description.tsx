type DescriptionBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function prepareDescriptionText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .trim()
    .replace(/\s*(Condition\s*(?:&|and)\s*Disclosure:)\s*/gi, "\n\n$1\n\n")
    .replace(/\s+[*•]\s+/g, "\n* ");
}

function isDisclosureHeading(line: string): boolean {
  return /^(condition\s*(?:&|and)\s*disclosure)\s*:?\s*$/i.test(line);
}

function parseListingDescription(raw: string): DescriptionBlock[] {
  const chunks = prepareDescriptionText(raw)
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const blocks: DescriptionBlock[] = [];

  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 1 && isDisclosureHeading(lines[0])) {
      blocks.push({ type: "heading", text: "Condition & Disclosure" });
      continue;
    }

    const items: string[] = [];
    const paragraphs: string[] = [];

    const flushParagraphs = () => {
      if (paragraphs.length) {
        blocks.push({ type: "paragraph", text: paragraphs.join("\n") });
        paragraphs.length = 0;
      }
    };
    const flushList = () => {
      if (items.length) {
        blocks.push({ type: "list", items: [...items] });
        items.length = 0;
      }
    };

    for (const line of lines) {
      if (isDisclosureHeading(line)) {
        flushParagraphs();
        flushList();
        blocks.push({ type: "heading", text: "Condition & Disclosure" });
        continue;
      }

      const bullet = line.match(/^[*•\-]\s+(.*)$/);
      if (bullet) {
        flushParagraphs();
        items.push(bullet[1]);
        continue;
      }

      flushList();
      paragraphs.push(line);
    }

    flushParagraphs();
    flushList();
  }

  return blocks.length ? blocks : [{ type: "paragraph", text: raw.trim() }];
}

export function ListingDescription({ text }: { text: string }) {
  const blocks = parseListingDescription(text);

  return (
    <div className="section-copy max-w-3xl space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2 key={index} className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              {block.text}
            </h2>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5 marker:text-[var(--brand-a)]">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
