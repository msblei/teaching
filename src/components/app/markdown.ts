// Minimal, safe markdown for model replies: everything is HTML-escaped first,
// then a small subset is rendered (headings, bold, italics, inline code,
// links, lists, tables, paragraphs). Fenced code blocks are returned as
// separate parts so the UI can give them a Copy button.

export type Part = { kind: "html"; html: string } | { kind: "code"; text: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">link</a>');
}

const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

const listRe = /^\s*(?:[-*•]|\d+[.)])\s+/;
const indent = (l: string) => l.match(/^\s*/)![0].length;

/**
 * A list starting at lines[i]. Items indented deeper than the first one
 * become a nested list inside the previous item; other indented lines
 * (e.g. a link under an item) join that item. Returns [html, next index].
 */
function list(lines: string[], i: number): [string, number] {
  const base = indent(lines[i]);
  const start = lines[i].match(/^\s*(\d+)/)?.[1];
  const items: string[] = [];
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) {
      // Blank line: the list goes on only if another item (or nested line) follows.
      if (i + 1 < lines.length && (listRe.test(lines[i + 1]) || indent(lines[i + 1]) > base) && indent(lines[i + 1]) >= base) {
        i++;
        continue;
      }
      break;
    }
    const d = indent(l);
    if (d < base) break;
    if (listRe.test(l) && d <= base + 1) {
      items.push(inline(l.replace(listRe, "")));
      i++;
    } else if (listRe.test(l) && items.length) {
      const [sub, next] = list(lines, i);
      items[items.length - 1] += sub;
      i = next;
    } else if (d > base && items.length) {
      items[items.length - 1] += `<br>${inline(l.trim())}`;
      i++;
    } else break;
  }
  const lis = items.map((it) => `<li>${it}</li>`).join("");
  return [start ? `<ol start="${start}">${lis}</ol>` : `<ul>${lis}</ul>`, i];
}

function block(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      out.push(`<h4>${inline(h[2])}</h4>`);
      i++;
      continue;
    }
    if (isRow(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isRow(lines[i])) rows.push(cells(lines[i++]));
      out.push(
        `<div class="tbl"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
      continue;
    }
    if (listRe.test(line)) {
      const [html, next] = list(lines, i);
      out.push(html);
      i = next;
      continue;
    }
    // The first line is always taken: a table row without its separator line
    // (as happens while a table is still streaming in) is not a table yet and
    // would otherwise never be consumed.
    const para: string[] = [inline(lines[i++])];
    while (i < lines.length && lines[i].trim() && !listRe.test(lines[i]) && !/^#{1,4}\s/.test(lines[i]) && !isRow(lines[i])) para.push(inline(lines[i++]));
    out.push(`<p>${para.join("<br>")}</p>`);
  }
  return out.join("");
}

export function renderMarkdown(md: string): Part[] {
  const parts: Part[] = [];
  const re = /```[^\n]*\n([\s\S]*?)(?:```|$)/g;
  let last = 0;
  for (const m of md.matchAll(re)) {
    const before = md.slice(last, m.index);
    if (before.trim()) parts.push({ kind: "html", html: block(before) });
    parts.push({ kind: "code", text: m[1].replace(/\n$/, "") });
    last = m.index! + m[0].length;
  }
  const rest = md.slice(last);
  if (rest.trim()) parts.push({ kind: "html", html: block(rest) });
  return parts;
}
