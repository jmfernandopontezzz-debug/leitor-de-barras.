export const MAX_ROWS = 2000;

const ROWS_KEY = "leitor-barras.rows.v1";
const SKIP_KEY = "leitor-barras.skip-dupes.v1";

export type ScanRow = {
  id: string;
  code: string;
  format: string;
  scannedAt: number;
};

const LABELS: Record<string, string> = {
  AZTEC: "Aztec",
  CODABAR: "Codabar",
  CODE_39: "Code 39",
  CODE_93: "Code 93",
  CODE_128: "Code 128",
  DATA_MATRIX: "Data Matrix",
  EAN_8: "EAN-8",
  EAN_13: "EAN-13",
  ITF: "ITF",
  MAXICODE: "MaxiCode",
  PDF_417: "PDF417",
  QR_CODE: "QR",
  RSS_14: "RSS-14",
  RSS_EXPANDED: "RSS Expanded",
  UPC_A: "UPC-A",
  UPC_E: "UPC-E",
  UPC_EAN_EXTENSION: "Extensão",
  MICRO_QR_CODE: "Micro QR",
  MANUAL: "Digitado",
  CODIGO: "Código",
};

export function formatLabel(raw: string): string {
  const key = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return LABELS[key] ?? titleCase(raw.replaceAll("_", " "));
}

function titleCase(value: string): string {
  if (!value) return "Código";
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function cleanCode(raw: string): string {
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

export function makeRow(code: string, format: string): ScanRow {
  return {
    id: crypto.randomUUID(),
    code,
    format: formatLabel(format),
    scannedAt: Date.now(),
  };
}

function isRow(value: unknown): value is ScanRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<ScanRow>;
  return (
    typeof row.id === "string" &&
    typeof row.code === "string" &&
    typeof row.format === "string" &&
    typeof row.scannedAt === "number"
  );
}

export function loadRows(): ScanRow[] {
  try {
    const raw = localStorage.getItem(ROWS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRow).slice(0, MAX_ROWS);
  } catch {
    return [];
  }
}

export function saveRows(rows: ScanRow[]) {
  localStorage.setItem(ROWS_KEY, JSON.stringify(rows.slice(0, MAX_ROWS)));
}

export function loadSkipDupes(): boolean {
  return localStorage.getItem(SKIP_KEY) === "1";
}

export function saveSkipDupes(skip: boolean) {
  localStorage.setItem(SKIP_KEY, skip ? "1" : "0");
}

export function formatClock(ts: number, now = Date.now()): string {
  const date = new Date(ts);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
  if (new Date(now).toDateString() === date.toDateString()) return time;
  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  return `${day} ${time}`;
}

export function formatFull(ts: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(ts));
}

export function fileStamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}
