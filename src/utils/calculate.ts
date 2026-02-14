import { WorkEntry, WeeklyStats, MonthlyStats, LeaveType } from '../types';

const LEAVE_CREDITS: Record<string, number> = {
  '연차': 8,
  '반차': 4,
  '반반차': 2
};

export function getWeekStartEnd(date: Date): { start: Date; end: Date } {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

export function formatMonthYear(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getBusinessDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (!isWeekend(d)) {
      days.push(new Date(d));
    }
  }
  
  return days;
}

export function isHoliday(date: Date, holidays: string[]): boolean {
  const dateStr = formatDate(date);
  return holidays.includes(dateStr);
}

export function calculateMinutes(startTime: string, endTime: string, breakTime: number = 0): number {
  if (!startTime || !endTime) return 0;
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const workedMinutes = endMinutes - startMinutes - (breakTime * 60);
  return Math.max(0, workedMinutes);
}

export function getLeaveCredit(leaveType: LeaveType): number {
  if (!leaveType) return 0;
  return LEAVE_CREDITS[leaveType] || 0;
}

export function getMinutesWithLeave(entry: WorkEntry): number {
  if (entry.leaveType === '연차') return 8 * 60;
  if (entry.leaveType === '반차') return calculateMinutes(entry.startTime, entry.endTime, entry.breakTime) + (4 * 60);
  if (entry.leaveType === '반반차') return 2 * 60;
  if (entry.leaveType === '공휴일') return 8 * 60;
  return calculateMinutes(entry.startTime, entry.endTime, entry.breakTime);
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간${mins}분`;
}

export function groupEntriesByWeek(entries: WorkEntry[]): WeeklyStats[] {
  const weekMap = new Map<string, WorkEntry[]>();
  
  entries.forEach(entry => {
    const date = new Date(entry.date);
    if (isWeekend(date)) return;
    
    const { start } = getWeekStartEnd(date);
    const weekKey = formatDate(start);
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(entry);
  });
  
  const weeks: WeeklyStats[] = [];
  
  weekMap.forEach((weekEntries, weekStart) => {
    const weekStartDate = new Date(weekStart);
    const { end } = getWeekStartEnd(weekStartDate);
    
    const totalMinutes = weekEntries.reduce((sum, entry) => sum + getMinutesWithLeave(entry), 0);
    const entriesWithHours = weekEntries.filter(e => !e.leaveType || ['공휴일', '연차', '반차', '반반차'].includes(e.leaveType));
    const averageDailyMinutes = entriesWithHours.length > 0 ? totalMinutes / entriesWithHours.length : 0;
    
    weeks.push({
      weekStart: weekStart,
      weekEnd: formatDate(end),
      totalHours: totalMinutes / 60,
      averageDailyHours: averageDailyMinutes / 60,
      entries: weekEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    });
  });
  
  return weeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function calculateMonthlyStats(
  entries: WorkEntry[], 
  year: number, 
  month: number,
  holidays: string[] = []
): MonthlyStats {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  
  const allBusinessDays = getBusinessDays(year, month);
  const businessDaysSet = new Set(allBusinessDays.map(d => formatDate(d)));
  const holidaysSet = new Set(holidays);
  
  const isCurrentMonth = year === currentYear && month === currentMonth;
  const pastDays = isCurrentMonth 
    ? allBusinessDays.filter(d => d.getDate() < currentDay)
    : allBusinessDays;
  const futureDays = allBusinessDays.filter(d => d.getDate() >= currentDay);
  
  const monthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getFullYear() === year && entryDate.getMonth() + 1 === month;
  });
  
  const filledDates = new Set(monthEntries.map(e => e.date));
  const filledPastDays = pastDays.filter(d => filledDates.has(formatDate(d)));
  const unfilledPastDays = pastDays.filter(d => !filledDates.has(formatDate(d)));
  const unfilledFutureDays = futureDays.filter(d => !filledDates.has(formatDate(d)));
  
  const weeks = groupEntriesByWeek(monthEntries);
  
  let totalMinutes = 0;
  const leaveSummary = { 연차: 0, 반차: 0, 반반차: 0 };
  
  monthEntries.forEach(entry => {
    const credit = getMinutesWithLeave(entry);
    totalMinutes += credit;
    
    if (entry.leaveType && entry.leaveType !== '공휴일') {
      leaveSummary[entry.leaveType as keyof typeof leaveSummary]++;
    }
  });
  
  const expectedMinutes = allBusinessDays.length * 8 * 60;
  const filledMinutes = isCurrentMonth 
    ? totalMinutes + unfilledFutureDays.length * 8 * 60
    : totalMinutes;
  const deficitMinutes = expectedMinutes - filledMinutes;
  const averageWeeklyMinutes = weeks.length > 0 ? totalMinutes / weeks.length : 0;
  
  return {
    month: formatMonthYear(year, month),
    year,
    monthNum: month,
    weeks,
    averageWeeklyHours: averageWeeklyMinutes / 60,
    totalHours: totalMinutes / 60,
    expectedHours: expectedMinutes / 60,
    deficitHours: deficitMinutes / 60,
    businessDays: allBusinessDays.length,
    filledDays: filledPastDays.length,
    unfilledWeekdays: unfilledPastDays.length,
    leaveSummary
  };
}

export function getStatusColor(hours: number, expected: number = 40): string {
  if (expected === 0) return 'text-[#CCC]';
  const ratio = hours / expected;
  if (ratio >= 0.95 && ratio <= 1.05) return 'text-[#D4A017]';
  if (ratio < 0.9) return 'text-[#FF9F1C]';
  if (ratio > 1.1) return 'text-[#FFD93D]';
  return 'text-[#E6A817]';
}

export function getStatusMessage(hours: number, expected: number = 40): string {
  if (expected === 0) return '데이터 없음';
  const ratio = hours / expected;
  if (ratio >= 0.95 && ratio <= 1.05) return '정상';
  if (ratio < 0.9) return '부족';
  if (ratio > 1.1) return '초과';
  return '주의';
}

export function getWeeklyStatusColor(averageDailyHours: number): string {
  if (averageDailyHours === 0) return 'text-[#CCC]';
  if (averageDailyHours === 8) return 'text-[#D4A017]';
  if (averageDailyHours < 8) return 'text-[#FF9F1C]';
  return 'text-[#FFD93D]';
}

export function getWeeklyStatusMessage(averageDailyHours: number): string {
  if (averageDailyHours === 0) return '데이터 없음';
  if (averageDailyHours === 8) return '✅ 정상 근무';
  if (averageDailyHours < 8) return '⚠️ 부족 근무';
  return '🔥 과다 근무';
}

export function isValidHours(hours: number): boolean {
  return hours >= 0 && hours <= 24;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getMonthDays(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
