// Structured JSON logs for Workers Logs (02-TRD §13). Keys that could hold personal data are dropped at any
// depth (05-SCHEMA §7.3 rule 3), so a careless `log.info("x", { merchant })` still can't leak a phone number.

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const PRIVATE_KEY = /phone|whatsapp|telegram|full_?name|email|contact|ip$/i;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return { name: value.name, message: value.message };
  const out: Fields = {};
  for (const [k, v] of Object.entries(value)) {
    if (!PRIVATE_KEY.test(k)) out[k] = redact(v, depth + 1);
  }
  return out;
}

function write(level: Level, msg: string, fields: Fields = {}) {
  const line = JSON.stringify({ level, msg, ...(redact(fields) as Fields) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  // eslint-disable-next-line no-console -- the logger is the one place that writes to stdout
  else console.info(line);
}

export const log = {
  debug: (msg: string, fields?: Fields) => write("debug", msg, fields),
  info: (msg: string, fields?: Fields) => write("info", msg, fields),
  warn: (msg: string, fields?: Fields) => write("warn", msg, fields),
  error: (msg: string, fields?: Fields) => write("error", msg, fields),
};
