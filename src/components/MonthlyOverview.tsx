'use client';

import { MonthlyStats } from '../types';
import { formatMinutes } from '../utils/calculate';

interface MonthlyOverviewProps {
  stats: MonthlyStats;
}

export function MonthlyOverview({ stats }: MonthlyOverviewProps) {
  const deficitMinutes = stats.deficitHours * 60;
  const isOver = deficitMinutes < 0;
  const excessMinutes = Math.abs(deficitMinutes);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#FFD93D] mb-6">
      <h2 className="text-xl font-bold mb-4 text-[#FF6B00]">📊 {stats.month} 통계</h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#FFF8DC] p-4 rounded-lg text-center">
          <div className="text-sm font-bold text-[#FF9F1C]">📅 예상 근무시간</div>
          <div className="text-2xl font-bold text-[#FF6B00]">{formatMinutes(stats.expectedHours * 60)}</div>
          <div className="text-xs font-medium text-[#FF9F1C] mt-1">{stats.businessDays}일 × 8시간</div>
        </div>

        <div className="bg-[#FFF8DC] p-4 rounded-lg text-center">
          <div className="text-sm font-bold text-[#FF9F1C]">✅ 현재 적립</div>
          <div className="text-2xl font-bold text-[#FF6B00]">{formatMinutes(stats.totalHours * 60)}</div>
        </div>

        {isOver && (
          <div className="bg-[#FFF8DC] p-4 rounded-lg text-center">
            <div className="text-sm font-bold text-[#FF9F1C]">🎉 초과 시간</div>
            <div className="text-2xl font-bold text-[#FF6B00]">{formatMinutes(excessMinutes)}</div>
            <div className="text-xs font-medium text-[#FF9F1C] mt-1">초과 근무</div>
          </div>
        )}

        {!isOver && deficitMinutes > 0 && (
          <div className="bg-[#FFF8DC] p-4 rounded-lg text-center">
            <div className="text-sm font-bold text-[#FF9F1C]">⚠️ 부족 시간</div>
            <div className="text-2xl font-bold text-[#FF6B00]">{formatMinutes(deficitMinutes)}</div>
            <div className="text-xs font-medium text-[#FF9F1C] mt-1">부족 근무</div>
          </div>
        )}

        {!isOver && deficitMinutes === 0 && (
          <div className="bg-[#FFF8DC] p-4 rounded-lg text-center">
            <div className="text-sm font-bold text-[#FF9F1C]">📍 초과/부족</div>
            <div className="text-2xl font-bold text-[#FF6B00]">-</div>
            <div className="text-xs font-medium text-[#FF9F1C] mt-1">정상 근무</div>
          </div>
        )}

        <div className="bg-[#FFF8DC] p-4 rounded-lg text-center">
          <div className="text-sm font-bold text-[#FF9F1C]">🏖️ 휴가 사용</div>
          <div className="text-xl font-bold text-[#FF6B00]">
            연차 {stats.leaveSummary.연차}일 / 반차 {stats.leaveSummary.반차}일
          </div>
          <div className="text-xs font-medium text-[#FF9F1C] mt-1">
            반반차 {stats.leaveSummary.반반차}회
          </div>
        </div>
      </div>

      {deficitMinutes > 0 && (
        <div className="mt-4 bg-[#FFF3E0] px-4 py-2 rounded-lg text-sm font-bold text-[#FF9F1C]">
          ⚠️ 예상 대비 {formatMinutes(deficitMinutes)} 부족합니다.
        </div>
      )}
      {deficitMinutes < 0 && (
        <div className="mt-4 bg-[#FFF8DC] px-4 py-2 rounded-lg text-sm font-bold text-[#FF6B00]">
          🎉 예상 대비 {formatMinutes(Math.abs(deficitMinutes))} 초과 근무했습니다!
        </div>
      )}
    </div>
  );
}
