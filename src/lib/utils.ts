import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nowIST } from './ist';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function generatePublicId(): string {
  const now = nowIST();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `HTL-${date}-${random}`;
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function calculateStayTotal(
  checkIn: Date,
  checkOut: Date,
  weekdayPrice: number,
  weekendPrice: number,
  rooms: number = 1
): { subtotal: number; nights: number; breakdown: { date: string; price: number; isWeekend: boolean }[] } {
  const breakdown = [];
  let subtotal = 0;
  
  // Create a UTC copy of the checkIn/checkOut dates to avoid any host system local time shifts
  const current = new Date(Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate()));
  const end = new Date(Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate()));

  while (current.getTime() < end.getTime()) {
    const day = current.getUTCDay();
    const weekend = day === 0 || day === 6; // Sunday or Saturday
    const price = weekend ? weekendPrice : weekdayPrice;
    breakdown.push({
      date: current.toISOString().slice(0, 10),
      price: price * rooms,
      isWeekend: weekend,
    });
    subtotal += price * rooms;
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { subtotal, nights: breakdown.length, breakdown };
}

export function calculateGST(subtotal: number): number {
  return Math.round(subtotal * 0.05);
}

export function calculateGatewayFee(taxableAmount: number, gstAmount: number): number {
  return Math.round((taxableAmount + gstAmount) * 0.01);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function parseIST(dateStr: string): Date {
  // Parse a YYYY-MM-DD string as IST midnight
  const [year, month, day] = dateStr.split('-').map(Number);
  // IST = UTC+5:30. To get IST midnight in UTC: subtract 5h30m
  return new Date(Date.UTC(year, month - 1, day) - 5.5 * 60 * 60 * 1000);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}
