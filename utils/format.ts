export function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function maskPolicyId(value: string) {
  return `${value.slice(0, 4)}-${value.slice(-4)}`;
}
