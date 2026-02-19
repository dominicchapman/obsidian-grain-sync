const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;
const MAX_SLUG_LENGTH = 180;

export function toKebab(text: string): string {
  return text
    .replace(ILLEGAL_CHARS, "")
    .replace(/[.\s—–_]+/g, "-")  // dots, whitespace, dashes, underscores → single hyphen
    .replace(/-{2,}/g, "-")       // collapse multiple hyphens
    .replace(/^-|-$/g, "")        // trim leading/trailing hyphens
    .toLowerCase()
    || "untitled";
}

export function toFilename(title: string, startDatetime: string): string {
  const datePrefix = formatDatePrefix(startDatetime);
  const slug = toKebab(title);
  const truncated = slug.length > MAX_SLUG_LENGTH
    ? slug.slice(0, MAX_SLUG_LENGTH).replace(/-$/, "")
    : slug;
  return `${datePrefix}-${truncated}.md`;
}

function formatDatePrefix(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "00000000T0000";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${mins}`;
}
