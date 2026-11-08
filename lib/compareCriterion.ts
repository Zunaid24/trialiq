// Turns the protocol rule and the record value (free text from the AI) into measures that can be compared:
// "ANC 1.5 or more" against "ANC 1.1" becomes { label: "ANC", need: ">= 1.5", has: 1.1, gap: 0.4 }.
// When the text cannot be parsed, callers fall back to showing both texts side by side.

export type Dir = "min" | "max";
export type Measure = { label: string; dir: Dir; limit: number; unit: string; has: number | null; ok: boolean | null; gap: number | null };

const NUM = /(\d+(?:\.\d+)?)/;
const MIN_WORDS = /(≥|>=|>|at least|minimum|min\.?|or more|or higher|or greater|or older|or above|and above|over)/i;
const MAX_WORDS = /(≤|<=|<|at most|no more than|maximum|max\.?|up to|or less|or lower|or below|or under|under|below)/i;
const FILLER = /\b(at least|no more than|at most|up to|minimum|maximum|min|max|must be|should be|of|is|be|or more|or less|or higher|or lower|or older|or above|or below|and above|years?|aged?|level)\b/gi;

function clean(label: string) {
  return label.replace(FILLER, " ").replace(/[≥≤<>=:()]/g, " ").replace(/\s+/g, " ").trim();
}
function tokens(s: string) {
  return clean(s).toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1 || /^[a-z]$/.test(t));
}
const segments = (s: string) => s.split(/[,;]|\band\b|\n/i).map((x) => x.trim()).filter(Boolean);

function parseRule(seg: string) {
  const n = seg.match(NUM);
  // Relative limits (times the upper limit of normal) cannot be compared with a raw value, so leave them as text.
  if (!n || n.index === undefined || /\bULN\b|\bLLN\b|×|\bx\s*(?:the\s*)?upper/i.test(seg)) return null;
  const before = seg.slice(0, n.index);
  const after = seg.slice(n.index + n[0].length);
  const unit = (after.match(/^\s*([a-zA-Zµ%\/⁹x0-9^.]+)/)?.[1] || "").replace(/^(or|and)$/i, "");
  const dir: Dir | null = MAX_WORDS.test(before) || MAX_WORDS.test(after) ? "max" : MIN_WORDS.test(before) || MIN_WORDS.test(after) ? "min" : null;
  if (!dir) return null;
  return { label: clean(before) || clean(after.replace(unit, "")), dir, limit: Number(n[1]), unit: /^(or|and)$/i.test(unit) ? "" : unit };
}
function parseValues(text: string) {
  return segments(text).map((seg) => {
    const n = seg.match(NUM);
    if (!n || n.index === undefined) return null;
    const unit = seg.slice(n.index + n[0].length).match(/^\s*([a-zA-Zµ%\/⁹x0-9^.]+)/)?.[1] || "";
    return { label: clean(seg.slice(0, n.index)), value: Number(n[1]), unit };
  }).filter((x): x is { label: string; value: number; unit: string } => !!x);
}

export function compareCriterion(expected = "", actual = "", name = "Value"): Measure[] {
  const rules = segments(expected).map(parseRule).filter((x): x is NonNullable<ReturnType<typeof parseRule>> => !!x);
  if (!rules.length) return [];
  // A rule that names no measurable value in the record (for example a date range) is better shown as text.
  const values = /not documented|not found|missing|unknown|not available/i.test(actual) ? [] : parseValues(actual);
  return rules.map((r) => {
    const rt = tokens(r.label);
    let v = values.find((x) => tokens(x.label).some((t) => rt.includes(t)));
    if (!v && rules.length === 1 && values.length === 1) v = values[0];
    // Different units mean the numbers are not comparable; drop the match rather than show a wrong gap.
    if (v && r.unit && v.unit && r.unit.toLowerCase() !== v.unit.toLowerCase()) v = undefined;
    const has = v ? v.value : null;
    const ok = has === null ? null : r.dir === "min" ? has >= r.limit : has <= r.limit;
    const gap = has === null || ok ? null : Math.round(Math.abs(has - r.limit) * 100) / 100;
    return { label: r.label || name, dir: r.dir, limit: r.limit, unit: r.unit, has, ok, gap };
  });
}

// "x10^9/L" reads better as "×10⁹/L".
const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
export const prettyUnit = (u: string) => u.replace(/^x(?=10)/i, "×").replace(/\^(\d+)/g, (_, d: string) => d.split("").map((c) => SUP[c]).join(""));

export const needText = (m: Measure) => `${m.dir === "min" ? "≥" : "≤"} ${m.limit}${m.unit ? ` ${m.unit}` : ""}`;
export function gapSentence(m: Measure) {
  if (m.has === null) return `${m.label} is not in the record yet.`;
  if (m.ok) return `${m.label} is within the limit.`;
  return `${m.label} is ${m.gap}${m.unit ? ` ${prettyUnit(m.unit)}` : ""} ${m.dir === "min" ? "below the minimum" : "above the maximum"}.`;
}
