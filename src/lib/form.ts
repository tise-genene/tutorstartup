export function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function upsertCsv(existing: string, nextValue: string): string {
  const values = new Set(parseCsv(existing));
  values.add(nextValue);
  return Array.from(values).join(", ");
}

export function parseNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
