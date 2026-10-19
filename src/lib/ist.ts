export const IST_OFFSET = 5.5 * 60 * 60 * 1000; // ms

/**
 * Returns the date and time parts in the Asia/Kolkata (IST) timezone.
 * Immune to server host timezone settings.
 */
// Globally cached Intl formatter for performance, avoiding overhead on repeated rendering
const istFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
});

export function getISTParts(): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const now = new Date();
  const parts = istFormatter.formatToParts(now);
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

/**
 * Parses any time string ("20:00", "20:00:00", "8:00 PM", "08:00 PM", "12:00")
 * into total minutes from midnight (0 - 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 12 * 60; // fallback to 12:00 PM (720 min)

  const trimmed = timeStr.trim();

  // Check for 12-hour format with AM/PM (e.g. "8:00 PM", "10:30 AM")
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Check for 24-hour format (e.g. "20:00", "20:00:00", "08:00")
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return 12 * 60;
}

/**
 * Returns true if the slot's check-in start time has already arrived or passed in Asia/Kolkata (IST) today.
 * For example:
 * - An 8:00 PM (20:00) slot is bookable until 7:59 PM (19:59).
 * - At 7:59 PM (1199 min), 1199 < 1200 => returns false (bookable).
 * - At 8:00 PM (1200 min), 1200 >= 1200 => returns true (passed / closed).
 */
export function isSlotPassedToday(slotStart: string): boolean {
  const { hour, minute } = getISTParts();
  const currentMinutes = hour * 60 + minute;
  const slotMinutes = parseTimeToMinutes(slotStart);
  return currentMinutes >= slotMinutes;
}

/**
 * Returns true if at least one slot in the room has NOT passed today in IST.
 */
export function hasBookableSlotToday(slots?: Array<{ slotStart?: string; slot_start?: string }>): boolean {
  if (!slots || slots.length === 0) {
    return !isSlotPassedToday('12:00:00');
  }
  return slots.some((s) => !isSlotPassedToday(s.slotStart || s.slot_start || '12:00:00'));
}

/**
 * Checks if a specific date & slot is in the past in IST.
 * - If date is strictly before today in IST, returns true.
 * - If date is strictly after today in IST, returns false.
 * - If date is today in IST, returns isSlotPassedToday(slotStart).
 */
export function isDateTimePassedIST(date: Date, slotStart?: string): boolean {
  const today = getTodayIST();
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (checkDate.getTime() < today.getTime()) {
    return true;
  }
  if (checkDate.getTime() > today.getTime()) {
    return false;
  }
  return isSlotPassedToday(slotStart || '12:00:00');
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

