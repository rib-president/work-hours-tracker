'use client';

import { WeeklyStats, WorkEntry } from '../types';
import { formatDisplayDate, formatMinutes, getWeeklyStatusColor, getWeeklyStatusMessage, getMinutesWithLeave } from '../utils/calculate';

interface WeeklySummaryProps {
  stats: WeeklyStats;
}

export function WeeklySummary({ stats }: WeeklySummaryProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#FFD93D]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[#FF6B00]">
          📈 {formatDisplayDate(stats.weekStart)} ~ {formatDisplayDate(stats.weekEnd)}
        </h3>
        <span className={`text-sm font-bold ${getWeeklyStatusColor(stats.averageDailyHours)}`}>
          {getWeeklyStatusMessage(stats.averageDailyHours)}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#FFF8DC] p-4 rounded-lg">
          <div className="text-sm text-[#FF9F1C]">📊 주간 총 근무시간</div>
          <div className="text-2xl font-bold text-[#FF6B00]">{stats.totalHours.toFixed(1)}시간</div>
        </div>
        <div className="bg-[#FFF8DC] p-4 rounded-lg">
          <div className="text-sm text-[#FF9F1C]">📍 일 평균</div>
          <div className="text-2xl font-bold text-[#FF9F1C]">{stats.averageDailyHours.toFixed(1)}시간</div>
        </div>
      </div>
    </div>
  );
}

interface EntryListProps {
  entries: WorkEntry[];
  onDelete: (id: string) => void;
}

export function EntryList({ entries, onDelete }: EntryListProps) {
  if (entries.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mt-6 border border-[#FFD93D]">
      <h3 className="text-lg font-bold mb-4 text-[#FF6B00]">📋 근무 기록 상세</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#FFD93D]">
              <th className="text-left py-2 px-3 text-sm font-bold text-[#FF9F1C]">📅 날짜</th>
              <th className="text-left py-2 px-3 text-sm font-bold text-[#FF9F1C]">🏷️ 유형</th>
              <th className="text-left py-2 px-3 text-sm font-bold text-[#FF9F1C]">⏰ 출근</th>
              <th className="text-left py-2 px-3 text-sm font-bold text-[#FF9F1C]">🏁 퇴근</th>
              <th className="text-left py-2 px-3 text-sm font-bold text-[#FF9F1C]">💰 적립</th>
              <th className="text-left py-2 px-3 text-sm font-bold text-[#FF9F1C]">📝 메모</th>
              <th className="text-left py-2 px-3 text-sm font-bold text-[#FF9F1C]"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-[#FFF3E0] last:border-0 hover:bg-[#FFF8DC]">
                <td className="py-3 px-3 text-[#FF9F1C]">{formatDisplayDate(entry.date)}</td>
                <td className="py-3 px-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    entry.leaveType === '연차' ? 'bg-[#FFD93D] text-[#FF6B00]' :
                    entry.leaveType === '반차' ? 'bg-[#FFE4B5] text-[#FF9F1C]' :
                    entry.leaveType === '반반차' ? 'bg-[#FFE4B5] text-[#FF9F1C]' :
                    entry.leaveType === '공휴일' ? 'bg-[#FFE4B5] text-[#FF9F1C]' :
                    'bg-[#FFF8DC] text-[#FF6B00]'
                  }`}>
                    {entry.leaveType === '연차' ? '🏖️ 연차' : 
                     entry.leaveType === '반차' ? '🌤️ 반차' : 
                     entry.leaveType === '반반차' ? '⏰ 반반차' : 
                     entry.leaveType === '공휴일' ? '🎄 공휴일' : 
                     '💼 일반'}
                  </span>
                </td>
                <td className="py-3 px-3 text-[#FF9F1C] font-medium">{entry.startTime}</td>
                <td className="py-3 px-3 text-[#FF9F1C] font-medium">{entry.endTime}</td>
                <td className="py-3 px-3 font-bold text-[#FF6B00]">{formatMinutes(getMinutesWithLeave(entry))}</td>
                <td className="py-3 px-3 text-[#CCC]">{entry.notes || '-'}</td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="text-[#FF9F1C] hover:text-[#FF6B00] text-lg"
                    title="삭제"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
