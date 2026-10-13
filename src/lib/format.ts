const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function pluralize(count: number, word: string, plural = `${word}s`): string {
  return `${count} ${count === 1 ? word : plural}`;
}

/** Compact countdown such as "2d 4h", "5h 12m" or "8m". */
export function formatDuration(ms: number): string {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / DAY);
  const hours = Math.floor((safe % DAY) / HOUR);
  const minutes = Math.floor((safe % HOUR) / MINUTE);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

export function timeUntil(date: Date, now: Date = new Date()): string {
  return formatDuration(date.getTime() - now.getTime());
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "Mar 5–8, 2026", "Feb 28 – Mar 2, 2026" or "Mar 5, 2026" for a single day. */
export function formatDateRange(start: Date, end: Date): string {
  const year = end.getFullYear();
  const month = (d: Date) => d.toLocaleDateString(undefined, { month: 'short' });
  if (start.toDateString() === end.toDateString()) {
    return `${month(end)} ${end.getDate()}, ${year}`;
  }
  if (start.getMonth() === end.getMonth() && start.getFullYear() === year) {
    return `${month(start)} ${start.getDate()}–${end.getDate()}, ${year}`;
  }
  return `${month(start)} ${start.getDate()} – ${month(end)} ${end.getDate()}, ${year}`;
}
