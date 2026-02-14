export type LeaveType = '연차' | '반차' | '반반차' | '공휴일' | null;

export interface WorkEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  breakTime: number;
  leaveType: LeaveType;
  notes?: string;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  averageDailyHours: number;
  entries: WorkEntry[];
}

export interface MonthlyStats {
  month: string;
  year: number;
  monthNum: number;
  weeks: WeeklyStats[];
  averageWeeklyHours: number;
  totalHours: number;
  expectedHours: number;
  deficitHours: number;
  businessDays: number;
  filledDays: number;
  unfilledWeekdays: number;
  leaveSummary: {
    연차: number;
    반차: number;
    반반차: number;
  };
}

export interface WorkHoursInput {
  date: string;
  startTime: string;
  endTime: string;
  leaveType?: LeaveType;
  notes?: string;
}
