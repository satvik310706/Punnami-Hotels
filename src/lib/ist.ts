export const IST_OFFSET = 5.5 * 60 * 60 * 1000; // ms

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
  return nowIST().getHours() >= 6;
}

export function isTodayOrPastIST(checkIn: Date): boolean {
  const todayIST = getTodayIST();
  const checkInDay = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
  return checkInDay <= todayIST;
}

/**
 * Returns a Date object representing the start of today in IST (Asia/Kolkata).
 * Uses Intl.DateTimeFormat to correctly extract IST date parts regardless of
 * the environment's local timezone (browser or server).
 */
export function getTodayIST(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value ?? '0');
  const month = parseInt(parts.find((p) => p.type === 'month')?.value ?? '1');
  const day = parseInt(parts.find((p) => p.type === 'day')?.value ?? '1');
  return new Date(year, month - 1, day);
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

