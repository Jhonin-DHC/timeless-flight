import { createElement, type ReactNode } from "react";
import { bodyLooksLikeHtml } from "@/lib/blog-cover";
import { toDisplayImageUrl } from "@/lib/r2-display";

const VOID_TAGS = new Set(["br", "img", "hr", "wbr"]);
const SKIP_TAGS = new Set(["script", "style", "iframe", "object", "embed", "link", "meta", "form"]);
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "blockquote",
  "figure",
  "figcaption",
  "hr",
  "span",
  "div",
  "section"
]);

type HtmlToken =
  | { type: "text"; value: string }
  | { type: "open"; name: string; attrs: Record<string, string> }
  | { type: "close"; name: string };

function isSafeHref(href: string) {
  return /^(https?:\/\/|\/|#|mailto:)/i.test(href.trim()) && !/^javascript:/i.test(href.trim());
}

function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

function parseAttrs(raw: string) {
  const attrs: Record<string, string> = {};
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw))) {
    const name = match[1].toLowerCase();
    if (name.startsWith("on")) continue;
    attrs[name] = decodeEntities(match[3] ?? match[4] ?? match[5] ?? "");
  }
  return attrs;
}

function tokenizeHtml(html: string): HtmlToken[] {
  const tokens: HtmlToken[] = [];
  const pattern = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html))) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: html.slice(lastIndex, match.index) });
    }
    if (match[0].startsWith("<!--")) {
      lastIndex = match.index + match[0].length;
      continue;
    }
    const name = match[1].toLowerCase();
    const closing = match[0].startsWith("</");
    const selfClosing = VOID_TAGS.has(name) || /\/\s*>$/.test(match[0]);
    if (closing) tokens.push({ type: "close", name });
    else tokens.push({ type: "open", name, attrs: parseAttrs(match[2] || "") });
    if (selfClosing && !closing) tokens.push({ type: "close", name });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) tokens.push({ type: "text", value: html.slice(lastIndex) });
  return tokens;
}

function classForTag(name: string) {
  switch (name) {
    case "p":
      return "text-base leading-relaxed text-[var(--muted)] md:text-lg";
    case "h1":
    case "h2":
      return "pt-4 text-2xl font-semibold tracking-tight text-[var(--foreground)] md:text-3xl";
    case "h3":
    case "h4":
      return "pt-3 text-xl font-semibold tracking-tight text-[var(--foreground)] md:text-2xl";
    case "ul":
      return "list-disc space-y-2 pl-6 text-base text-[var(--muted)] md:text-lg";
    case "ol":
      return "list-decimal space-y-2 pl-6 text-base text-[var(--muted)] md:text-lg";
    case "li":
      return "leading-relaxed";
    case "blockquote":
      return "border-l-2 border-[var(--brand-a)]/50 pl-4 text-base italic text-[var(--muted)] md:text-lg";
    case "figure":
      return "my-6 space-y-2";
    case "figcaption":
      return "text-center text-sm text-[var(--muted)]";
    case "a":
      return "font-medium text-[var(--brand-a)] underline-offset-2 hover:underline";
    case "strong":
    case "b":
      return "font-semibold text-[var(--foreground)]";
    default:
      return undefined;
  }
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[0].startsWith("![")) {
      nodes.push(
        <img
          key={`md-img-${key++}`}
          src={toDisplayImageUrl(match[3] || "")}
          alt={match[2] || ""}
          className="my-6 h-auto w-full max-h-[min(80vh,720px)] rounded-2xl object-contain"
        />
      );
    } else {
      const href = (match[5] || "").trim();
      const label = match[4] || href;
      nodes.push(
        isSafeHref(href) ? (
          <a key={`md-a-${key++}`} href={href} className="font-medium text-[var(--brand-a)]">
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

function renderVoid(name: string, attrs: Record<string, string>, key: number): ReactNode {
  if (name === "br") return <br key={`br-${key}`} />;
  if (name === "hr") return <hr key={`hr-${key}`} className="my-8 border-white/10" />;
  if (name === "img") {
    const src = attrs.src ? toDisplayImageUrl(attrs.src) : "";
    if (!src || (!isSafeHref(src) && !src.startsWith("/"))) return null;
    return (
      <img
        key={`img-${key}`}
        src={src}
        alt={attrs.alt || ""}
        className="my-6 h-auto w-full max-h-[min(80vh,720px)] rounded-2xl object-contain"
      />
    );
  }
  return null;
}

function htmlToReact(html: string): ReactNode[] {
  const tokens = tokenizeHtml(html);
  let index = 0;
  let key = 0;

  function parseUntil(endName?: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    while (index < tokens.length) {
      const token = tokens[index];
      if (token.type === "close") {
        index += 1;
        if (!endName || token.name === endName) return nodes;
        continue;
      }
      if (token.type === "text") {
        index += 1;
        const value = decodeEntities(token.value);
        if (!value.trim()) continue;
        if (!endName) {
          for (const part of value.split(/\n{2,}/)) {
            const trimmed = part.replace(/\n/g, " ").trim();
            if (!trimmed) continue;
            nodes.push(
              <p key={`text-${key++}`} className={classForTag("p")}>
                {renderInlineMarkdown(trimmed)}
              </p>
            );
          }
          continue;
        }
        nodes.push(...renderInlineMarkdown(value));
        continue;
      }

      const { name, attrs } = token;
      index += 1;
      if (SKIP_TAGS.has(name)) {
        parseUntil(name);
        continue;
      }

      if (VOID_TAGS.has(name)) {
        const node = renderVoid(name, attrs, key++);
        if (node) nodes.push(node);
        const next = tokens[index];
        if (next?.type === "close" && next.name === name) index += 1;
        continue;
      }

      const children = parseUntil(name);
      if (!ALLOWED_TAGS.has(name)) {
        nodes.push(...children);
        continue;
      }

      const className = classForTag(name);
      if (name === "a") {
        const href = attrs.href || "";
        nodes.push(
          isSafeHref(href) ? (
            <a key={`el-${key++}`} href={href} className={className}>
              {children}
            </a>
          ) : (
            <span key={`el-${key++}`}>{children}</span>
          )
        );
        continue;
      }

      nodes.push(createElement(name, { key: `el-${key++}`, className }, children));
    }
    return nodes;
  }

  return parseUntil();
}

function MarkdownBody({ body }: { body: string }) {
  const blocks = body.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className="space-y-5 text-base leading-relaxed md:text-lg">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          const Tag = heading[1].length === 1 ? "h2" : "h3";
          return (
            <Tag key={index} className="pt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {renderInlineMarkdown(heading[2])}
            </Tag>
          );
        }
        return (
          <p key={index} className="text-[var(--muted)]">
            {renderInlineMarkdown(trimmed.replace(/\n/g, " "))}
          </p>
        );
      })}
    </div>
  );
}

export function BlogBody({ body }: { body: string }) {
  if (!body.trim()) return null;

  if (bodyLooksLikeHtml(body)) {
    return <div className="space-y-5">{htmlToReact(body)}</div>;
  }

  return <MarkdownBody body={body} />;
}
