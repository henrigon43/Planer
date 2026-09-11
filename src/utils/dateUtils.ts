/**
 * Date utilities for Caderno & Planner Inteligente
 * Default reference date is 2026-09-11 (Friday) to align with sample timeline,
 * but dynamically adapts to navigation.
 */

export const REFERENCE_TODAY = '2026-09-11';

export function getTodayDateStr(): string {
  // Use reference date if current year matches, or default
  return REFERENCE_TODAY;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatPtDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getWeekdayName(dateStr: string, short = false): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = short
    ? ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
    : ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return weekdays[date.getDay()];
}

export function getWeekDays(referenceDateStr: string): Array<{ dateStr: string; dayName: string; shortDay: string; dayNum: number; isToday: boolean }> {
  const [y, m, d] = referenceDateStr.split('-').map(Number);
  const ref = new Date(y, m - 1, d);
  const dayOfWeek = ref.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  
  // Calculate Monday of the week (assuming week starts on Monday, or Sunday)
  // Brazilian work planner standard: starts on Monday
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - distanceToMonday);

  const days = [];
  const weekdaysShort = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
  const weekdaysFull = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const dateStr = formatDateStr(current);
    days.push({
      dateStr,
      dayName: weekdaysFull[i],
      shortDay: weekdaysShort[i],
      dayNum: current.getDate(),
      isToday: dateStr === getTodayDateStr(),
    });
  }

  return days;
}

export function getWeekLabel(referenceDateStr: string): string {
  const days = getWeekDays(referenceDateStr);
  const first = days[0];
  const last = days[6];
  const firstDate = parseDate(first.dateStr);
  const lastDate = parseDate(last.dateStr);
  
  const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const monthStr = monthNames[lastDate.getMonth()];
  
  return `SEMANA ${String(firstDate.getDate()).padStart(2, '0')} — ${String(lastDate.getDate()).padStart(2, '0')} ${monthStr}`;
}

export function shiftWeek(currentDateStr: string, weeks: number): string {
  const d = parseDate(currentDateStr);
  d.setDate(d.getDate() + weeks * 7);
  return formatDateStr(d);
}

export function isDateOverdue(targetDateStr: string, todayStr: string = getTodayDateStr()): boolean {
  return targetDateStr < todayStr;
}

export function getRelativeDayOffset(targetDateStr: string, todayStr: string = getTodayDateStr()): string {
  if (targetDateStr === todayStr) return 'Hoje';
  const target = parseDate(targetDateStr);
  const today = parseDate(todayStr);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  if (diffDays === 1) return 'Amanhã';
  if (diffDays === -1) return 'Ontem';
  if (diffDays < -1) return `${Math.abs(diffDays)} dias atrás`;
  if (diffDays <= 7) return getWeekdayName(targetDateStr);
  return formatPtDate(targetDateStr);
}
