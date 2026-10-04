export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type PeriodType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'halfYearly'
  | 'annual';

/**
 * Formats a Date object, ISO string, or timestamp to strict "DD-MMM-YYYY" format.
 * Example: 20-Sep-2026
 */
export function formatDate(input?: Date | string | number | null): string {
  if (!input) {
    input = new Date();
  }
  const date = typeof input === 'object' && input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

export const VERNACULAR_MONTHS: Record<'ta' | 'ml', string[]> = {
  ta: ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'],
  ml: ['ജനു', 'ഫെബ്രു', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റം', 'ഒക്ടോ', 'നവം', 'ഡിസം'],
};

/**
 * Formats a Date object with vernacular month name when applicable.
 */
export function formatDateLocalized(
  input?: Date | string | number | null,
  lang: 'en' | 'ta' | 'ml' = 'en'
): string {
  if (!input) input = new Date();
  const date = typeof input === 'object' && input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return 'Invalid Date';

  const day = String(date.getDate()).padStart(2, '0');
  const monthIdx = date.getMonth();
  const year = date.getFullYear();

  if (lang === 'ta' || lang === 'ml') {
    const month = VERNACULAR_MONTHS[lang][monthIdx];
    return `${day}-${month}-${year}`;
  }
  return `${day}-${MONTH_NAMES[monthIdx]}-${year}`;
}

export const FULL_DAY_KEYS: (
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function getDayOfWeekKey(
  input?: Date | string | number | null
): 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' {
  if (!input) input = new Date();
  const date = typeof input === 'object' && input instanceof Date ? input : new Date(input);
  return FULL_DAY_KEYS[date.getDay()] || 'monday';
}

/**
 * Formats date with full day of the week.
 * Example: "Tuesday, 22-Sep-2026"
 */
export function formatDateWithFullDay(input?: Date | string | number | null): string {
  if (!input) input = new Date();
  const date = typeof input === 'object' && input instanceof Date ? input : new Date(input);
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${fullDays[date.getDay()]}, ${formatDate(date)}`;
}

/**
 * Formats date with day of the week (alias for formatDateWithFullDay).
 */
export function formatDateWithDay(input?: Date | string | number | null): string {
  return formatDateWithFullDay(input);
}

/**
 * Parses "DD-MMM-YYYY" or ISO string into a JavaScript Date object.
 */
export function parseEstateDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const mIdx = MONTH_NAMES.findIndex(
        (m) => m.toLowerCase() === parts[1].slice(0, 3).toLowerCase()
      );
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && mIdx !== -1 && !isNaN(year)) {
        return new Date(year, mIdx, day, 12, 0, 0);
      }
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Returns the starting Sunday for the week of the given date.
 */
export function getStartOfWeekSunday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Generates an array of 7 consecutive dates for a week, starting on Sunday.
 */
export function getWeekDaysStartingSunday(referenceDate: Date = new Date()): Date[] {
  const start = getStartOfWeekSunday(referenceDate);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(start);
    nextDay.setDate(start.getDate() + i);
    days.push(nextDay);
  }
  return days;
}

/**
 * Returns start and end Date for a given period and reference date.
 */
export function getPeriodDateBounds(period: PeriodType, refDate: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(refDate);

  if (period === 'daily') {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    return { start, end };
  }

  if (period === 'weekly') {
    const start = getStartOfWeekSunday(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59);
    return { start, end };
  }

  if (period === 'monthly') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }

  if (period === 'quarterly') {
    // Indian FY Quarters: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)
    const month = d.getMonth(); // 0-11
    let qStartMonth = 0;
    let year = d.getFullYear();
    if (month >= 3 && month <= 5) {
      qStartMonth = 3; // Apr-Jun (Q1)
    } else if (month >= 6 && month <= 8) {
      qStartMonth = 6; // Jul-Sep (Q2)
    } else if (month >= 9 && month <= 11) {
      qStartMonth = 9; // Oct-Dec (Q3)
    } else {
      qStartMonth = 0; // Jan-Mar (Q4)
    }
    const start = new Date(year, qStartMonth, 1, 0, 0, 0);
    const end = new Date(year, qStartMonth + 3, 0, 23, 59, 59);
    return { start, end };
  }

  if (period === 'halfYearly') {
    // Indian FY Half Years: H1 (Apr-Sep), H2 (Oct-Mar)
    const month = d.getMonth();
    let hStartMonth = 3;
    let year = d.getFullYear();
    if (month >= 3 && month <= 8) {
      // Apr - Sep
      hStartMonth = 3;
      const start = new Date(year, hStartMonth, 1, 0, 0, 0);
      const end = new Date(year, 9, 0, 23, 59, 59);
      return { start, end };
    } else {
      // Oct - Mar
      const hYear = month <= 2 ? year - 1 : year;
      const start = new Date(hYear, 9, 1, 0, 0, 0); // Oct 1
      const end = new Date(hYear + 1, 3, 0, 23, 59, 59); // Mar 31
      return { start, end };
    }
  }

  // Annual (Financial Year: Apr 1 to Mar 31)
  const month = d.getMonth();
  const fyStartYear = month >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  const start = new Date(fyStartYear, 3, 1, 0, 0, 0); // Apr 1
  const end = new Date(fyStartYear + 1, 3, 0, 23, 59, 59); // Mar 31
  return { start, end };
}

/**
 * Checks if a given date string falls within the bounds of a period.
 */
export function isDateInPeriod(dateStr: string, period: PeriodType, refDate: Date = new Date()): boolean {
  const target = parseEstateDate(dateStr);
  if (!target) return false;
  const { start, end } = getPeriodDateBounds(period, refDate);
  const time = target.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

/**
 * Formats a user-facing label for the active period.
 */
export function getPeriodDisplayRange(period: PeriodType, refDate: Date = new Date()): string {
  const { start, end } = getPeriodDateBounds(period, refDate);

  if (period === 'daily') {
    return formatDateWithDay(start);
  }

  if (period === 'weekly') {
    return `${formatDate(start)} to ${formatDate(end)}`;
  }

  if (period === 'monthly') {
    return `${FULL_MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
  }

  if (period === 'quarterly') {
    const month = start.getMonth();
    let qLabel = 'Q1 (Apr - Jun)';
    if (month === 6) qLabel = 'Q2 (Jul - Sep)';
    if (month === 9) qLabel = 'Q3 (Oct - Dec)';
    if (month === 0) qLabel = 'Q4 (Jan - Mar)';
    return `${qLabel} ${start.getFullYear()}`;
  }

  if (period === 'halfYearly') {
    const month = start.getMonth();
    if (month === 3) {
      return `H1 (Apr - Sep) ${start.getFullYear()}`;
    }
    return `H2 (Oct - Mar) ${start.getFullYear()}-${(end.getFullYear() % 100)}`;
  }

  // annual
  const fyStart = start.getFullYear();
  const fyEnd = (end.getFullYear() % 100);
  return `FY ${fyStart}-${fyEnd}`;
}

/**
 * Shifts reference date by 1 step in the given direction (-1 or +1).
 */
export function shiftPeriod(period: PeriodType, refDate: Date = new Date(), direction: -1 | 1): Date {
  const next = new Date(refDate);

  if (period === 'daily') {
    next.setDate(next.getDate() + direction);
    return next;
  }

  if (period === 'weekly') {
    next.setDate(next.getDate() + direction * 7);
    return next;
  }

  if (period === 'monthly') {
    next.setMonth(next.getMonth() + direction);
    return next;
  }

  if (period === 'quarterly') {
    next.setMonth(next.getMonth() + direction * 3);
    return next;
  }

  if (period === 'halfYearly') {
    next.setMonth(next.getMonth() + direction * 6);
    return next;
  }

  // annual
  next.setFullYear(next.getFullYear() + direction);
  return next;
}
