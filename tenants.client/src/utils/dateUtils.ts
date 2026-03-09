export function monthLabel(month: number, year?: number) {
  const s = new Date(year ?? 2000, month - 1).toLocaleString("default", {
    month: "short",
  });
  return year != null ? `${s} ${year}` : s;
}

export function getPreviousMonth(year: number, month: number) {
  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 };
}
