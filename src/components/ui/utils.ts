export type ClassNameValue = string | false | null | undefined;

export function cx(...values: ClassNameValue[]): string | undefined {
  const className = values.filter(Boolean).join(" ");
  return className || undefined;
}

export function mergeIds(
  ...ids: Array<string | undefined>
): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}
