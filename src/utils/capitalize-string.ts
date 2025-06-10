export function capitalizeString(value?: string): string | undefined {
  const trimmed = value?.toString().trim();
  return trimmed
    ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
    : undefined;
}
