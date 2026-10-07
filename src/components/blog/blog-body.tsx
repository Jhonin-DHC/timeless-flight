import type { ReactNode } from "react";
import { toDisplayImageUrl } from "@/lib/r2-display";

function isSafeHref(href: string) {
  return /^(https?:\/\/|\/|#|mailto:)/i.test(href.trim()) && !/^javascript:/i.test(href.trim());
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[0].startsWith("![")) {
      const src = toDisplayImageUrl(match[3] || "");
      nodes.push(
        <img
          key={`img-${key++}`}
          src={src}
          alt={match[2] || ""}
          className="my-4 w-full rounded-2xl border border-white/10 object-contain"
        />
      );
    } else {
      const href = (match[5] || "").trim();
      const label = match[4] || href;
      nodes.push(
        isSafeHref(href) ? (
          <a key={`a-${key++}`} href={href} className="font-medium text-[var(--brand-a)]">
            {label}
          </a>
        ) : (
          label
        )
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function BlogBody({ body }: { body: string }) {
  const blocks = body.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);

  if (!body.trim()) return null;

  return (
    <div className="space-y-4 text-base leading-relaxed text-[var(--foreground)]">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          const Tag = heading[1].length === 1 ? "h2" : "h3";
          return (
            <Tag key={index} className="pt-2 text-2xl font-semibold tracking-tight">
              {renderInline(heading[2])}
            </Tag>
          );
        }
        return (
          <p key={index} className="text-[var(--muted)]">
            {renderInline(trimmed.replace(/\n/g, " "))}
          </p>
        );
      })}
    </div>
  );
}
