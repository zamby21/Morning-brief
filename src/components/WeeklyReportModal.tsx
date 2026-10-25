import React, { useState } from 'react';
import {
  X,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Sparkles,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  PieChart,
  Compass,
} from 'lucide-react';
import { WeeklyReport } from '../types/news';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: WeeklyReport;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  if (!isOpen) return null;

  const currentTimelineDay = report.timeline[selectedDayIndex] || report.timeline[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50/60 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  뉴스 요약 DB 기반 주간 종합 분석 리포트
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  7-Day AI Deep Analysis
                </span>
              </div>
              <p className="text-xs text-slate-500">
                집계 기간: <strong>{report.weekRange}</strong> (주요 언론사 지면·온라인 전수 분석)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800 bg-slate-50/50">
          {/* Executive Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>주간 핵심 총평 (Executive Summary)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">데이터마이닝 종합</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {report.overallDiagnosis}
            </p>
          </div>

          {/* Top Issue Trends */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>주간 언론사 집중 보도 핵심 키워드 Top Trends</span>
              </h4>
              <span className="text-xs text-slate-400">보도 빈도 및 지면 점유율</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {report.topTrendKeywords.map((trend, idx) => (
                <div
                  key={trend.keyword}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 hover:border-purple-300 transition shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {trend.count}건
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {trend.keyword}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily 7-Day Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>일자별 주요 이슈 전개 타임라인 & 언론사별 시각 비교</span>
            </h4>

            {/* Day Selector Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {report.timeline.map((day, idx) => (
                <button
                  key={day.date}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex flex-col items-center min-w-[76px] cursor-pointer ${
                    selectedDayIndex === idx
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-semibold">{day.day}</span>
                  <span className="text-[10px] opacity-80">{day.date}</span>
                </button>
              ))}
            </div>

            {/* Selected Day Content */}
            {currentTimelineDay && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                        {currentTimelineDay.day}
                      </span>
                      <div className="flex gap-1">
                        {currentTimelineDay.keySectors.map((sector) => (
                          <span
                            key={sector}
                            className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                          >
                            #{sector}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h5 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                      {currentTimelineDay.mainHeadline}
                    </h5>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
                  {currentTimelineDay.summary}
                </div>

                {/* Tone Comparison */}
                {currentTimelineDay.toneComparison && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>언론사 성향별 논조 비교:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-1">
                        <span className="font-bold text-[11px] text-blue-800 block">보수 성향지:</span>
                        <p className="leading-relaxed text-[11px]">
                          {currentTimelineDay.toneComparison.conservative}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950 space-y-1">
                        <span className="font-bold text-[11px] text-rose-800 block">진보 성향지:</span>
                        <p className="leading-relaxed text-[11px]">
                          {currentTimelineDay.toneComparison.progressive}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
                        <span className="font-bold text-[11px] text-emerald-800 block">경제 전문지:</span>
                        <p className="leading-relaxed text-[11px]">
                          {currentTimelineDay.toneComparison.economic}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sector Analysis */}
          {report.sectorAnalysis && report.sectorAnalysis.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>주요 산업 섹터별 진단</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.sectorAnalysis.map((sector) => (
                  <div
                    key={sector.sector}
                    className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {sector.sector}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {sector.summary}
                    </p>
                    <ul className="text-[11px] text-slate-500 space-y-1">
                      {sector.keyPoints.map((pt, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Week Outlook */}
          {report.outlookNextWeek && report.outlookNextWeek.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50/60 to-purple-50/60 border border-indigo-200 rounded-2xl p-5 space-y-2.5 shadow-xs">
              <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>차주 주요 전망 및 관전 포인트 (Next Week Outlook)</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-indigo-950 font-medium">
                {report.outlookNextWeek.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition active:scale-95 cursor-pointer shadow-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
