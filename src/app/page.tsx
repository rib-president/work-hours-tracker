'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { WorkEntry, MonthlyStats } from '../types';
import { calculateMonthlyStats, groupEntriesByWeek, formatDate, formatDisplayDate, isWeekend, generateId, getMinutesWithLeave, formatMinutes } from '../utils/calculate';
import { WorkEntryForm, WeeklySummary, EntryList, MonthlyOverview } from '../components';

export default function Home() {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<WorkEntry | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('work-entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch {
        console.error('Failed to parse saved entries');
      }
    }
    const savedHolidays = localStorage.getItem('work-holidays');
    if (savedHolidays) {
      try {
        setHolidays(JSON.parse(savedHolidays));
      } catch {
        console.error('Failed to parse holidays');
      }
    }
  }, []);
  
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('work-entries', JSON.stringify(entries));
      localStorage.setItem('work-holidays', JSON.stringify(holidays));
    }
  }, [entries, holidays, mounted]);
  
  const handleAddEntry = (entry: WorkEntry, isEdit: boolean) => {
    if (isEdit) {
      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
      setSelectedEntry(entry);
    } else {
      setEntries(prev => {
        const existing = prev.find(e => e.date === entry.date);
        if (existing) {
          return prev.map(e => e.date === entry.date ? { ...e, ...entry } : e);
        }
        return [...prev, entry];
      });
      setSelectedEntry(null);
    }
  };
  
  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setSelectedEntry(null);
  };
  
  const toggleHoliday = (date: string) => {
    setHolidays(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      }
      return [...prev, date];
    });
  };
  
  const handleDateClick = (date: string, isWknd: boolean, isHol: boolean) => {
    if (isWknd) return;
    
    if (isHol) {
      toggleHoliday(date);
    } else {
      const entry = entries.find(e => e.date === date);
      setSelectedDate(date);
      setSelectedEntry(entry || null);
    }
  };
  
  const monthlyStats = useMemo(() => 
    calculateMonthlyStats(entries, selectedYear, selectedMonth, holidays),
    [entries, selectedYear, selectedMonth, holidays]
  );
  
  const weeks = useMemo(() => 
    groupEntriesByWeek(entries.filter(e => {
      const date = new Date(e.date);
      return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
    }), selectedYear, selectedMonth),
    [entries, selectedYear, selectedMonth]
  );
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const renderCalendar = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const cells: React.ReactNode[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2 border bg-white"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dateStr = formatDate(date);
      const isWknd = isWeekend(date);
      const isHol = holidays.includes(dateStr);
      const entry = entries.find(e => e.date === dateStr);
      
      cells.push(
        <div 
          key={day}
          onClick={() => handleDateClick(dateStr, isWknd, isHol)}
          className={`p-1 sm:p-2 border text-sm min-h-[48px] sm:min-h-[60px] transition-colors rounded-lg overflow-hidden
            ${isHol ? 'bg-[#FFF3E0] border-[#FF9F1C] border-dashed' : ''}
            ${isWknd && !isHol ? 'bg-[#E8E8E8] cursor-not-allowed' : 'bg-white hover:bg-[#FFF8E7] cursor-pointer'}
            ${entry && !isWknd ? 'bg-[#FFF8DC]' : ''}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`font-bold text-xs sm:text-sm ${isWknd && !isHol ? 'text-[#666]' : 'text-[#FF6B00]'}`}>
              {day}
            </span>
            {isHol && <span className="text-[10px] sm:text-xs font-bold text-[#FF6B00]">공휴일</span>}
          </div>
          {entry && (
            <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 text-[#FF9F1C] leading-tight font-bold">
              {entry.leaveType && <div>{entry.leaveType}</div>}
              <div>{formatMinutes(getMinutesWithLeave(entry))}</div>
            </div>
          )}
        </div>
      );
    }
    
    return cells;
  };
  
  if (!mounted) return null;
  
  return (
    <div className="min-h-screen bg-[#FFF8E7] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-[#FF8C00] mb-8">
          📊 주 평균 근무시간 체크
        </h1>
        
        <MonthlyOverview stats={monthlyStats} />
        
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-[#FFD93D]">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-[#FFD93D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] font-medium"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-[#FFD93D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] font-medium"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-[#FFD93D]">
          <h2 className="text-xl font-extrabold mb-4 text-[#FF6B00]">📅 {selectedYear}년 {selectedMonth}월</h2>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} className="p-1 sm:p-2 text-center font-bold text-[#FF9F1C] text-xs sm:text-sm">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>
        
        <WorkEntryForm onAddEntry={handleAddEntry} selectedDate={selectedDate} selectedEntry={selectedEntry} setSelectedEntry={setSelectedEntry} />
        
        {weeks.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-extrabold text-[#FF6B00]">📈 주간별 통계</h2>
            {weeks.map((week) => (
              <div key={week.weekStart}>
                <WeeklySummary stats={week} />
                <EntryList entries={week.entries} onDelete={handleDeleteEntry} />
              </div>
            ))}
          </div>
        )}
        
        {weeks.length === 0 && entries.length > 0 && (
          <div className="mt-6 bg-white p-6 rounded-xl shadow-sm text-center text-[#FF9F1C] border border-[#FFD93D] font-medium">
            🤷‍♂️ 선택한 월의 데이터가 없습니다. 다른 월을 선택하거나 새 근무 기록을 추가해주세요.
          </div>
        )}
        
        <div className="mt-8 bg-[#FFFEF0] p-6 rounded-xl border border-[#FFD93D]">
          <h3 className="font-extrabold text-[#FF6B00] mb-2">ℹ️ 참고사항</h3>
          <ul className="text-sm text-[#FF9F1C] space-y-1 font-medium">
            <li>- 📅 월~금요일 × 8시간 = 월별 예상 근무시간</li>
            <li>- ⏰ 미입력 일반인은 8시간으로 계산하여 부족/초과 시간 예상치 계산</li>
            <li>- 🏠 주말은 근무일수에서 제외</li>
            <li>- 🎄 연차: 8시간 적립, 반차: 4시간 적립</li>
            <li>- 💾 데이터는 브라우저에 저장됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
