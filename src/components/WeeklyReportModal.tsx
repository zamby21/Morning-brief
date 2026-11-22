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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50/60 to-slate-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  주간 종합 분석 리포트
                </h3>
                {report.sourceType === 'live' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300">
                    주간 분석
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                    샘플 리포트
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                집계 기간: <strong className="text-slate-700 dark:text-slate-200">{report.weekRange}</strong>
                {report.sourceType === 'live' ? ' (주요 언론사 이슈 요약)' : ' (예시 샘플 데이터)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/40">
          {report.sourceType !== 'live' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong className="font-bold">샘플 데이터 안내:</strong> 현재 주간 리포트는 7일 아카이브 데이터베이스가 연결되지 않아 참고용 예시 데이터로 표시되고 있습니다.
            </div>
          )}

          {/* Executive Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>주간 핵심 총평 (Executive Summary)</span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {report.sourceType === 'live' ? '주간 종합 분석' : '예시 요약'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {report.overallDiagnosis}
            </p>
          </div>

          {/* Top Issue Trends */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>주간 언론사 집중 보도 핵심 키워드 Top Trends</span>
              </h4>
              <span className="text-xs text-slate-400 dark:text-slate-500">보도 빈도 및 지면 점유율</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {report.topTrendKeywords.map((trend, idx) => (
                <div
                  key={trend.keyword}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1.5 hover:border-purple-300 dark:hover:border-purple-600 transition shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-[11px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded">
                      {trend.count}건
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {trend.keyword}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily 7-Day Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-semibold">{day.day}</span>
                  <span className="text-[10px] opacity-80">{day.date}</span>
                </button>
              ))}
            </div>

            {/* Selected Day Content */}
            {currentTimelineDay && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-xs font-bold">
                        {currentTimelineDay.day}
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {currentTimelineDay.keySectors.map((sector) => (
                          <span
                            key={sector}
                            className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium"
                          >
                            #{sector}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h5 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                      {currentTimelineDay.mainHeadline}
                    </h5>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {currentTimelineDay.summary}
                </div>

                {/* Tone Comparison */}
                {currentTimelineDay.toneComparison && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>언론사 성향별 논조 비교:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 text-blue-950 dark:text-blue-100 space-y-1">
                        <span className="font-bold text-[11px] text-blue-800 dark:text-blue-300 block">보수 성향지:</span>
                        <p className="leading-relaxed text-[11px]">
                          {currentTimelineDay.toneComparison.conservative}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-950 dark:text-rose-100 space-y-1">
                        <span className="font-bold text-[11px] text-rose-800 dark:text-rose-300 block">진보 성향지:</span>
                        <p className="leading-relaxed text-[11px]">
                          {currentTimelineDay.toneComparison.progressive}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-100 space-y-1">
                        <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 block">경제 전문지:</span>
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
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>주요 산업 섹터별 진단</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.sectorAnalysis.map((sector) => (
                  <div
                    key={sector.sector}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {sector.sector}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {sector.summary}
                    </p>
                    <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      {sector.keyPoints.map((pt, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
            <div className="bg-gradient-to-r from-indigo-50/60 to-purple-50/60 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/70 rounded-2xl p-5 space-y-2.5 shadow-xs">
              <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>차주 주요 전망 및 관전 포인트 (Next Week Outlook)</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-indigo-950 dark:text-indigo-100 font-medium">
                {report.outlookNextWeek.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
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
