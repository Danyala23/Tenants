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
 * Compute per-occupancy allocations when collecting bulk (all floors).
 * If amountPaid >= totalDue, each occupancy gets its full due.
 * Otherwise allocates proportionally by due amount, with remainder to first.
 */
export function computeBulkAllocations(
  occupancies: { id: number; rent: number; startDate: string }[],
  paymentsByOccupancy: Record<number, { year: number; month: number; amountPaid: number }[]>,
  year: number,
  month: number,
  amountPaid: number
): { occupancyId: number; amountPaid: number }[] {
  const duesByOcc = occupancies.map((occ) => ({
    id: occ.id,
    due: occ.rent + computeDues(occ.rent, paymentsByOccupancy[occ.id] ?? [], occ.startDate, year, month),
  }));
  const totalDue = duesByOcc.reduce((s, x) => s + x.due, 0);
  if (totalDue <= 0) return occupancies.map((o) => ({ occupancyId: o.id, amountPaid: 0 }));

  if (amountPaid >= totalDue) {
    return duesByOcc.map(({ id, due }) => ({ occupancyId: id, amountPaid: Math.round(due * 100) / 100 }));
  }

  const result: { occupancyId: number; amountPaid: number }[] = [];
  let allocated = 0;
  for (let i = 0; i < duesByOcc.length; i++) {
    const { id, due } = duesByOcc[i];
    const ratio = due / totalDue;
    const raw = amountPaid * ratio;
    const amt =
      i < duesByOcc.length - 1
        ? Math.round(raw * 100) / 100
        : Math.round((amountPaid - allocated) * 100) / 100;
    allocated += amt;
    result.push({ occupancyId: id, amountPaid: amt });
  }
  return result;
}

/** Union of unpaid months across multiple occupancies, sorted by (year, month). */
export function getUnpaidMonthsBulk(
  occupancies: { id: number; rent: number; startDate: string }[],
  paymentsByOccupancy: Record<number, { year: number; month: number; amountPaid: number }[]>,
  currentYear: number,
  currentMonth: number
): MonthKey[] {
  const seen = new Set<string>();
  for (const occ of occupancies) {
    const months = getUnpaidMonths(
      occ.rent,
      paymentsByOccupancy[occ.id] ?? [],
      occ.startDate,
      currentYear,
      currentMonth
    );
    for (const { year, month } of months) {
      seen.add(`${year}-${month}`);
    }
  }
  const arr = Array.from(seen)
    .map((s) => {
      const [y, m] = s.split("-").map(Number);
      return { year: y, month: m };
    })
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
  return arr;
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
