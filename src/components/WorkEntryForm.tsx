'use client';

import { useState, useEffect } from 'react';
import { WorkEntry, LeaveType } from '../types';
import { calculateMinutes, formatMinutes, generateId, isWeekend } from '../utils/calculate';

interface WorkEntryFormProps {
  onAddEntry: (entry: WorkEntry, isEdit: boolean) => void;
  selectedDate?: string;
  selectedEntry?: WorkEntry | null;
  setSelectedEntry?: (entry: WorkEntry | null) => void;
}

const LEAVE_OPTIONS: { value: LeaveType; label: string; breakTime: number; defaultStart: string; defaultEnd: string }[] = [
  { value: null, label: '일반 근무', breakTime: 1, defaultStart: '09:00', defaultEnd: '18:00' },
  { value: '연차', label: '연차 (8시간)', breakTime: 1, defaultStart: '09:00', defaultEnd: '18:00' },
  { value: '반차', label: '반차 (4시간)', breakTime: 0.5, defaultStart: '09:00', defaultEnd: '13:30' },
  { value: '반반차', label: '반반차 (2시간)', breakTime: 0, defaultStart: '09:00', defaultEnd: '11:00' },
  { value: '공휴일', label: '공휴일', breakTime: 0, defaultStart: '09:00', defaultEnd: '18:00' },
];

export function WorkEntryForm({ onAddEntry, selectedDate, selectedEntry, setSelectedEntry }: WorkEntryFormProps) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [leaveType, setLeaveType] = useState<LeaveType>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    if (selectedEntry) {
      setStartTime(selectedEntry.startTime);
      setEndTime(selectedEntry.endTime);
      setLeaveType(selectedEntry.leaveType);
      setNotes(selectedEntry.notes || '');
    } else if (selectedDate) {
      setStartTime('09:00');
      setEndTime('18:00');
      setLeaveType(null);
      setNotes('');
    }
  }, [selectedDate, selectedEntry]);
  
  const handleLeaveTypeChange = (value: LeaveType) => {
    setLeaveType(value);
    const option = LEAVE_OPTIONS.find(o => o.value === value);
    if (option) {
      setStartTime(option.defaultStart);
      setEndTime(option.defaultEnd);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!date) {
      setError('날짜를 선택해주세요');
      return;
    }
    
    const selectedDateObj = new Date(date);
    if (isWeekend(selectedDateObj)) {
      setError('주말에는 근무 기록을 입력할 수 없습니다');
      return;
    }
    
    if (!startTime || !endTime) {
      setError('출근시간과 퇴근시간을 모두 입력해주세요');
      return;
    }

    const option = LEAVE_OPTIONS.find(o => o.value === leaveType);
    const currentBreakTime = option?.breakTime || 0;
    const workedMinutes = calculateMinutes(startTime, endTime, currentBreakTime);
    if (workedMinutes < 0) {
      setError('퇴근시간이 출근시간보다 빨라야 합니다');
      return;
    }

    const entry: WorkEntry = {
      id: selectedEntry?.id || generateId(),
      date,
      startTime,
      endTime,
      breakTime: currentBreakTime,
      leaveType,
      notes: notes || undefined
    };

    onAddEntry(entry, !!selectedEntry);
    setSelectedEntry?.(entry);
  };
  
  const getWorkedHoursDisplay = () => {
    const option = LEAVE_OPTIONS.find(o => o.value === leaveType);
    const breakTime = option?.breakTime || 0;
    const minutes = calculateMinutes(startTime, endTime, breakTime);
    return formatMinutes(minutes);
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border-2 border-[#FFD93D]">
      <h2 className="text-xl font-semibold mb-4 text-[#FF6B00]">✏️ 근무/휴가 입력</h2>
      
      {error && (
        <div className="bg-[#FFF3E0] border-2 border-[#FF9F1C] text-[#FF9F1C] px-4 py-2 rounded-lg mb-4 font-medium">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-bold text-[#FF6B00] mb-1">
            📅 날짜
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border-2 border-[#FFD93D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-[#FF6B00] mb-1">
            🏷️ 유형
          </label>
          <select
            value={leaveType || ''}
            onChange={(e) => handleLeaveTypeChange(e.target.value as LeaveType)}
            className="w-full px-3 py-2 border-2 border-[#FFD93D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
          >
            {LEAVE_OPTIONS.map(option => (
              <option key={option.label} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-[#FF6B00] mb-1">
            ⏰ 출근
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={leaveType === '공휴일'}
            className="w-full px-3 py-2 border-2 border-[#FFD93D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] disabled:bg-[#FFF8DC] disabled:cursor-not-allowed disabled:text-[#CCC]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#FF6B00] mb-1">
            🏁 퇴근
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={leaveType === '공휴일'}
            className="w-full px-3 py-2 border-2 border-[#FFD93D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] disabled:bg-[#FFF8DC] disabled:cursor-not-allowed disabled:text-[#CCC]"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-[#FF6B00] mb-1">
            📝 메모
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="특이사항"
            className="w-full px-3 py-2 border-2 border-[#FFD93D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
          />
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-4">
        <span className="text-sm text-[#666] font-bold">
          ⏱️ 예상 근무시간: <strong className="text-[#FF9F1C]">{getWorkedHoursDisplay()}</strong>
        </span>
        {leaveType === '공휴일' && <span className="text-sm text-[#FF9F1C] font-bold">→ 8시간 적립 🎄</span>}
        {leaveType === '연차' && <span className="text-sm text-[#FF6B00]">☕ + 1시간 휴게</span>}
        {leaveType === '반차' && <span className="text-sm text-[#FF6B00]">☕ + 30분 휴게</span>}
        {leaveType && leaveType !== '공휴일' && (
          <span className="text-sm text-[#FF6B00] font-bold">→ {leaveType}로 {leaveType === '연차' ? '8시간' : leaveType === '반차' ? '8시간' : '2시간'} 적립</span>
        )}
      </div>
      
      <button
        type="submit"
        className="mt-4 w-full bg-gradient-to-r from-[#FFD93D] to-[#FF9F1C] text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity font-bold"
      >
        ➕ 추가
      </button>
    </form>
  );
}
