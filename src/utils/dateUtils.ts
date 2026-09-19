const defaultDateFormat: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "long",
  year: "numeric",
};

export function formatDateLabel(
  date: Date,
  fmt = defaultDateFormat,
  locale = "en-US",
) {
  return date.toLocaleDateString(locale, fmt);
}

export function formatDateRange(from: Date, to: Date): string {
  const fromLabel = formatDateLabel(from);
  const toLabel = formatDateLabel(to);

  if (fromLabel === toLabel) return fromLabel;
  return `${fromLabel} - ${toLabel}`;
}
