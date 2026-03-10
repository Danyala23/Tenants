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

export type MonthKey = { year: number; month: number };

/** Iterate months from start to end (inclusive). */
export function* monthsFromTo(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): Generator<MonthKey> {
  let y = startYear;
  let m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    yield { year: y, month: m };
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
}

/** Get payment amount for a month (0 if no record). */
function getAmountForMonth(
  payments: { year: number; month: number; amountPaid: number }[],
  year: number,
  month: number
): number {
  const p = payments.find((x) => x.year === year && x.month === month);
  return p?.amountPaid ?? 0;
}

/**
 * Compute accumulated dues up to (and including) the previous month.
 * Uses rent + carried shortfall per month.
 */
export function computeDues(
  rent: number,
  payments: { year: number; month: number; amountPaid: number }[],
  startDate: string,
  currentYear: number,
  currentMonth: number
): number {
  const prev = getPreviousMonth(currentYear, currentMonth);
  const start = new Date(startDate);
  const startY = start.getFullYear();
  const startM = start.getMonth() + 1;

  let carriedDues = 0;
  for (const { year, month } of monthsFromTo(startY, startM, prev.year, prev.month)) {
    const amountPaid = getAmountForMonth(payments, year, month);
    const totalDue = rent + carriedDues;
    const shortfall = totalDue - amountPaid;
    carriedDues = shortfall > 0 ? shortfall : 0;
  }
  return carriedDues;
}

/**
 * Get months with unpaid shortfall (amountPaid < totalDue).
 * Used for period picker when collecting rent.
 */
export function getUnpaidMonths(
  rent: number,
  payments: { year: number; month: number; amountPaid: number }[],
  startDate: string,
  currentYear: number,
  currentMonth: number
): MonthKey[] {
  const result: MonthKey[] = [];
  const start = new Date(startDate);
  const startY = start.getFullYear();
  const startM = start.getMonth() + 1;

  let carriedDues = 0;
  for (const { year, month } of monthsFromTo(startY, startM, currentYear, currentMonth)) {
    const amountPaid = getAmountForMonth(payments, year, month);
    const totalDue = rent + carriedDues;
    const shortfall = totalDue - amountPaid;
    if (shortfall > 0) result.push({ year, month });
    carriedDues = shortfall > 0 ? shortfall : 0;
  }
  return result;
}
