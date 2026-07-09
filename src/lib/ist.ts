export const IST_OFFSET = 5.5 * 60 * 60 * 1000; // ms

/**
 * Returns the date and time parts in the Asia/Kolkata (IST) timezone.
 * Immune to server host timezone settings.
 */
export function getISTParts(): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value ?? '0', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value ?? '1', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value ?? '1', 10);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const second = parseInt(parts.find((p) => p.type === 'second')?.value ?? '0', 10);

  return {
    year,
    month,
    day,
    hour: hour === 24 ? 0 : hour,
    minute,
    second,
  };
}

export function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET);
}

export function toIST(utcDate: Date): Date {
  return new Date(utcDate.getTime() + IST_OFFSET);
}

export function formatIST(date: Date, options?: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...options,
  });
}

export function isAfter6amIST(): boolean {
  return getISTParts().hour >= 6;
}

/** Adds `days` calendar days to a date and returns a new Date. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns today in IST (Asia/Kolkata) as a local Date object.
 * Perfect for client-side state, date picker, and local date-fns comparisons.
 */
export function getTodayIST(): Date {
  const { year, month, day } = getISTParts();
  return new Date(year, month - 1, day);
}

/**
 * Returns today in IST (Asia/Kolkata) as a UTC Date object (at midnight UTC).
 * Perfect for server-side Prisma database queries.
 */
export function getTodayISTUTC(): Date {
  const { year, month, day } = getISTParts();
  return new Date(Date.UTC(year, month - 1, day));
}

export function isTodayOrPastIST(checkIn: Date): boolean {
  const todayIST = getTodayIST();
  const checkInLocal = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
  return checkInLocal.getTime() <= todayIST.getTime();
}

/**
 * Returns true if the given Date's calendar date matches today in IST timezone.
 */
export function isISTToday(date: Date): boolean {
  const today = getTodayIST();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

