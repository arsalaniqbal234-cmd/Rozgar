export function formatCount(value: number): string {
  const count = Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0));
  if (count < 1_000) return new Intl.NumberFormat("en-US").format(count);
  const unit = count >= 1_000_000 ? 1_000_000 : 1_000;
  const suffix = unit === 1_000_000 ? "M" : "k";
  const rounded = Math.round(count / unit * 10) / 10;
  if (rounded >= 1_000 && unit === 1_000) return "1M";
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}${suffix}`;
}
