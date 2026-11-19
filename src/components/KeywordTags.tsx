import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Flame,
  Minus,
  TrendingDown,
  TrendingUp,
  X,
  BarChart3,
  Filter,
  Sparkles,
} from 'lucide-react';
import type { DailyBriefing, KeywordTrendData } from '../types/news';
import { getKeywordTrendForBriefing } from '../utils/keywordTrend';

interface KeywordTagsProps {
  keywords: string[];
  selectedKeyword: string | null;
  onSelectKeyword: (kw: string | null) => void;
  briefing?: DailyBriefing;
  onOpenWeeklyReport?: () => void;
  isMobileView?: boolean;
}

export const KeywordTags: React.FC<KeywordTagsProps> = ({
  keywords,
  selectedKeyword,
  onSelectKeyword,
  briefing,
  onOpenWeeklyReport,
  isMobileView = false,
}) => {
  const [openTrendKeyword, setOpenTrendKeyword] = useState<string | null>(null);
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [popoverAlign, setPopoverAlign] = useState<'left' | 'center' | 'right'>('left');
  const [anchorLeftPx, setAnchorLeftPx] = useState<number>(0);
  const [rankSortBy, setRankSortBy] = useState<'surge' | 'coverage'>('surge');

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const trendMap = useMemo<Record<string, KeywordTrendData>>(() => {
    const map: Record<string, KeywordTrendData> = {};
    for (const kw of keywords) {
      map[kw] = getKeywordTrendForBriefing(kw, briefing);
    }
    return map;
  }, [keywords, briefing]);

  const rankedKeywords = useMemo(() => {
    const items = keywords.map((kw) => ({
      keyword: kw,
      label: kw.replace(/^#/, ''),
      trend: trendMap[kw],
    }));

    return items.sort((a, b) => {
      if (rankSortBy === 'coverage') {
        if (b.trend.currentOutletCount !== a.trend.currentOutletCount) {
          return b.trend.currentOutletCount - a.trend.currentOutletCount;
        }
        return b.trend.dailyChangePercent - a.trend.dailyChangePercent;
      }
      if (b.trend.dailyChangePercent !== a.trend.dailyChangePercent) {
        return b.trend.dailyChangePercent - a.trend.dailyChangePercent;
      }
      if (b.trend.currentOutletCount !== a.trend.currentOutletCount) {
        return b.trend.currentOutletCount - a.trend.currentOutletCount;
      }
      return b.trend.peakOutletCount - a.trend.peakOutletCount;
    });
  }, [keywords, trendMap, rankSortBy]);

  const buildMiniSparklinePath = (trend: KeywordTrendData): string => {
    const series = trend.hourlySeries || [];
    if (series.length < 2) return '';
    const w = 28;
    const h = 12;
    const padY = 1.5;
    const vals = series.map((p) => p.outletCount);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const span = Math.max(1, maxV - minV);
    return series
      .map((pt, idx) => {
        const x = (idx / (series.length - 1)) * w;
        const y = h - padY - ((pt.outletCount - minV) / span) * (h - padY * 2);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  useEffect(() => {
    if (openTrendKeyword && !keywords.includes(openTrendKeyword)) {
      setOpenTrendKeyword(null);
    }
  }, [keywords, openTrendKeyword]);

  useEffect(() => {
    if (!openTrendKeyword) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        popoverRef.current?.contains(target) ||
        target.closest('[data-keyword-trend-trigger="true"]')
      ) {
        return;
      }
      setOpenTrendKeyword(null);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenTrendKeyword(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openTrendKeyword]);

  const handleTogglePopover = (kw: string, triggerEl: HTMLElement) => {
    if (openTrendKeyword === kw) {
      setOpenTrendKeyword(null);
      return;
    }

    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const triggerRect = triggerEl.getBoundingClientRect();
      const relativeCenter = triggerRect.left - containerRect.left + triggerRect.width / 2;
      const containerWidth = containerRect.width || 600;
      const popoverWidth = 360;

      if (relativeCenter + popoverWidth / 2 > containerWidth - 12) {
        setPopoverAlign('right');
      } else if (relativeCenter - popoverWidth / 2 < 12) {
        setPopoverAlign('left');
      } else {
        setPopoverAlign('center');
      }
      setAnchorLeftPx(
        Math.max(
          0,
          Math.min(containerWidth - popoverWidth, relativeCenter - popoverWidth / 2)
        )
      );
    }

    setHoveredPointIdx(null);
    setOpenTrendKeyword(kw);
  };

  const activeTrend = openTrendKeyword ? trendMap[openTrendKeyword] : null;

  // Compute SVG chart geometry for activeTrend
  const chartModel = useMemo(() => {
    if (!activeTrend) return null;
    const series = activeTrend.hourlySeries;
    const width = 320;
    const height = 128;
    const padLeft = 28;
    const padRight = 14;
    const padTop = 14;
    const padBottom = 24;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const maxVal = Math.max(
      4,
      ...series.map((p) => p.outletCount)
    );
    const yMax = Math.ceil(maxVal / 2) * 2;
    const yMid = Math.round(yMax / 2);

    const points = series.map((pt, idx) => {
      const x =
        series.length > 1
          ? padLeft + (idx / (series.length - 1)) * plotW
          : padLeft + plotW / 2;
      const y = padTop + plotH - (pt.outletCount / yMax) * plotH;
      return { ...pt, idx, x, y };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
        : '';

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotH,
      yMax,
      yMid,
      points,
      linePath,
      areaPath,
    };
  }, [activeTrend]);

  const formatChangeText = (pct: number) => {
    if (pct > 0) return `+${pct}%`;
    if (pct < 0) return `${pct}%`;
    return '0%';
  };

  const getTrendVisual = (direction: 'up' | 'down' | 'flat') => {
    if (direction === 'up') {
      return {
        Icon: TrendingUp,
        badgeClass:
          'text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70',
        activeBtnClass:
          'text-white bg-blue-700/80 hover:bg-blue-800',
        strokeColor: '#10b981',
        fillColorStart: 'rgba(16, 185, 129, 0.28)',
        fillColorEnd: 'rgba(16, 185, 129, 0.02)',
        statusLabel: '상승',
      };
    }
    if (direction === 'down') {
      return {
        Icon: TrendingDown,
        badgeClass:
          'text-rose-700 dark:text-rose-300 bg-rose-50/90 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/70',
        activeBtnClass:
          'text-white bg-blue-700/80 hover:bg-blue-800',
        strokeColor: '#f43f5e',
        fillColorStart: 'rgba(244, 63, 94, 0.25)',
        fillColorEnd: 'rgba(244, 63, 94, 0.02)',
        statusLabel: '하락',
      };
    }
    return {
      Icon: Minus,
      badgeClass:
        'text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700',
      activeBtnClass:
        'text-white bg-blue-700/80 hover:bg-blue-800',
      strokeColor: '#3b82f6',
      fillColorStart: 'rgba(59, 130, 246, 0.24)',
      fillColorEnd: 'rgba(59, 130, 246, 0.02)',
      statusLabel: '보합',
    };
  };

  const activePoint =
    activeTrend && chartModel
      ? chartModel.points[
          hoveredPointIdx !== null && chartModel.points[hoveredPointIdx]
            ? hoveredPointIdx
            : chartModel.points.length - 1
        ]
      : null;

  return (
    <div
      ref={containerRef}
      className="relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-xs transition-colors"
    >
      <div
        className={`flex gap-3 ${
          isMobileView
            ? 'flex-col'
            : 'flex-col lg:flex-row lg:items-center lg:justify-between'
        }`}
      >
        {/* Left: Unified Core + Real-Time Rising Keyword Ranking */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-lg bg-orange-50 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/70 shrink-0">
                <Flame className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 min-w-0">
                <span className="whitespace-nowrap shrink-0">오늘의 급상승 핵심 키워드</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 truncate hidden xl:inline">
                  · 클릭 시 기사 필터 · 수치 클릭 시 24시간 추이
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Segmented Sort Control */}
              <div
                role="group"
                aria-label="키워드 순위 정렬 기준"
                className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                <button
                  type="button"
                  onClick={() => setRankSortBy('surge')}
                  aria-pressed={rankSortBy === 'surge'}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    rankSortBy === 'surge'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  상승률순
                </button>
                <button
                  type="button"
                  onClick={() => setRankSortBy('coverage')}
                  aria-pressed={rankSortBy === 'coverage'}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    rankSortBy === 'coverage'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  보도량순
                </button>
              </div>

              {selectedKeyword && (
                <button
                  type="button"
                  onClick={() => onSelectKeyword(null)}
                  className="inline-flex items-center gap-0.5 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>전체 보기</span>
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Unified Ranked Interactive Keyword List */}
          {rankedKeywords.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-1">
              집계된 핵심 키워드가 없습니다.
            </p>
          ) : (
            <ol
              aria-label="오늘의 급상승 핵심 키워드 랭킹"
              className="flex flex-wrap items-center gap-1.5"
            >
              {rankedKeywords.map((item, idx) => {
                const rank = idx + 1;
                const isSelected = selectedKeyword === item.keyword;
                const isPopoverOpen = openTrendKeyword === item.keyword;
                const visual = getTrendVisual(item.trend.direction);
                const TrendIcon = visual.Icon;
                const changeText = formatChangeText(item.trend.dailyChangePercent);
                const sparkPath = buildMiniSparklinePath(item.trend);

                const rankTextClass = isSelected
                  ? 'text-amber-200'
                  : rank === 1
                  ? 'text-orange-600 dark:text-orange-400'
                  : rank <= 3
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500';

                return (
                  <li
                    key={item.keyword}
                    className={`inline-flex items-stretch rounded-xl border transition-all duration-150 overflow-hidden ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-300/70 dark:ring-blue-500/40 shadow-xs'
                        : isPopoverOpen
                        ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-500/30 shadow-xs'
                        : 'border-slate-200/90 dark:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectKeyword(isSelected ? null : item.keyword)}
                      aria-pressed={isSelected}
                      title={`${rank}위 ${item.keyword} — 클릭하여 관련 기사 필터링`}
                      className={`text-xs px-2.5 py-1.5 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                      }`}
                    >
                      <span className={`text-[11px] font-black font-mono tabular-nums leading-none ${rankTextClass}`}>
                        {rank}
                      </span>
                      <span>
                        <span className="opacity-45 font-normal mr-0.5">#</span>
                        {item.label}
                      </span>
                    </button>

                    <button
                      type="button"
                      data-keyword-trend-trigger="true"
                      onClick={(e) => handleTogglePopover(item.keyword, e.currentTarget)}
                      aria-expanded={isPopoverOpen}
                      aria-haspopup="dialog"
                      aria-label={`${rank}위 ${item.label}, ${item.trend.currentOutletCount}개사 보도, 전일 대비 ${changeText} (${visual.statusLabel}), 24시간 추이 보기`}
                      title={`${rank}위 ${item.keyword} · ${item.trend.currentOutletCount}개사 보도 · 전일 대비 ${changeText} · 최고 ${item.trend.peakHourLabel} (클릭: 24시간 추이 그래프)`}
                      className={`px-2 py-1.5 text-[11px] font-mono tabular-nums font-bold border-l flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isSelected
                          ? `border-blue-500 ${visual.activeBtnClass}`
                          : `border-slate-200/80 dark:border-slate-700 ${visual.badgeClass}`
                      }`}
                    >
                      {sparkPath && !isMobileView && (
                        <svg
                          viewBox="0 0 28 12"
                          className="w-6 h-3 overflow-visible shrink-0 hidden sm:block"
                          aria-hidden="true"
                        >
                          <path
                            d={sparkPath}
                            fill="none"
                            stroke={isSelected ? '#ffffff' : visual.strokeColor}
                            strokeWidth={1.6}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      <span className="inline-flex items-center gap-0.5">
                        <TrendIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>{changeText}</span>
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          isSelected
                            ? 'text-blue-100'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        · {item.trend.currentOutletCount}사
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Right: Compact Weekly Comprehensive Report Card */}
        {onOpenWeeklyReport && (
          <div
            className={`shrink-0 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50/60 to-white dark:from-purple-950/50 dark:via-indigo-950/40 dark:to-slate-900/90 border border-purple-200/90 dark:border-purple-800/70 px-3 py-2.5 flex items-center justify-between gap-2.5 ${
              isMobileView
                ? 'w-full'
                : 'w-full lg:w-[260px] xl:w-[300px]'
            }`}
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] whitespace-nowrap">
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  주간 종합 리포트
                </span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  7일간 분석
                </span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug truncate">
                주간 주요 이슈 &amp; 논조 비교
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                타임라인·시각 차이를 한눈에
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenWeeklyReport}
              className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition active:scale-95 whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
              <span>열기</span>
            </button>
          </div>
        )}
      </div>

      {/* 24-Hour Outlet Coverage Trend Popover */}
      {activeTrend && chartModel && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="false"
          aria-label={`${activeTrend.keyword} 지난 24시간 언론사 보도 트렌드`}
          style={
            popoverAlign === 'center'
              ? { left: `${anchorLeftPx}px` }
              : undefined
          }
          className={`mt-2.5 sm:mt-0 sm:absolute sm:top-full sm:mt-2 z-40 w-full sm:w-[360px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-4 text-slate-800 dark:text-slate-100 ${
            popoverAlign === 'right'
              ? 'sm:right-4'
              : popoverAlign === 'left'
              ? 'sm:left-4'
              : ''
          }`}
        >
          {/* Popover Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {activeTrend.keyword}
                </span>
                {(() => {
                  const visual = getTrendVisual(activeTrend.direction);
                  const Icon = visual.Icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-md ${
                        activeTrend.direction === 'up'
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                          : activeTrend.direction === 'down'
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>
                        전일 대비 {formatChangeText(activeTrend.dailyChangePercent)}
                      </span>
                    </span>
                  );
                })()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                지난 24시간 동안 해당 키워드를 다룬 언론사 수 추이
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenTrendKeyword(null)}
              aria-label="트렌드 팝오버 닫기"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3-Column Metrics Strip (clean hairline dividers, tabular numbers) */}
          <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-800 py-2.5 text-center">
            <div className="px-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                현재 보도
              </div>
              <div className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                {activeTrend.currentOutletCount}개사
              </div>
            </div>
            <div className="px-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                24h 최고
              </div>
              <div className="text-sm font-black font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-0.5">
                {activeTrend.peakOutletCount}개사
                <span className="text-[10px] font-sans font-medium text-slate-400 dark:text-slate-500 ml-1">
                  ({activeTrend.peakHourLabel})
                </span>
              </div>
            </div>
            <div className="px-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                전일 기준
              </div>
              <div className="text-sm font-black font-mono tabular-nums text-slate-700 dark:text-slate-200 mt-0.5">
                {activeTrend.previousOutletCount} → {activeTrend.currentOutletCount}사
              </div>
            </div>
          </div>

          {/* Interactive 24-Hour Trend Chart */}
          <div className="pt-2 pb-1 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                24시간 언론사 보도 수 그래프
              </span>
              {activePoint && (
                <span className="font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">
                  {activePoint.timeLabel} ({activePoint.hourLabel}) · {activePoint.outletCount}개사
                </span>
              )}
            </div>

            {(() => {
              const visual = getTrendVisual(activeTrend.direction);
              const gradientId = `kw-trend-grad-${encodeURIComponent(activeTrend.keyword).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
              return (
                <svg
                  viewBox={`0 0 ${chartModel.width} ${chartModel.height}`}
                  className="w-full h-32 overflow-visible select-none"
                  role="img"
                  aria-label={`${activeTrend.keyword} 24시간 언론사 보도 수 선 그래프`}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={visual.fillColorStart} />
                      <stop offset="100%" stopColor={visual.fillColorEnd} />
                    </linearGradient>
                  </defs>

                  {/* Horizontal reference gridlines & Y-axis labels */}
                  {[0, chartModel.yMid, chartModel.yMax].map((tickVal) => {
                    const yPos =
                      chartModel.padTop +
                      chartModel.plotH -
                      (tickVal / chartModel.yMax) * chartModel.plotH;
                    return (
                      <g key={tickVal}>
                        <line
                          x1={chartModel.padLeft}
                          y1={yPos}
                          x2={chartModel.width - chartModel.padRight}
                          y2={yPos}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800"
                          strokeDasharray={tickVal === 0 ? undefined : '3 3'}
                          strokeWidth={1}
                        />
                        <text
                          x={chartModel.padLeft - 6}
                          y={yPos + 3}
                          textAnchor="end"
                          className="fill-slate-400 dark:fill-slate-500 text-[9px] font-mono"
                        >
                          {tickVal}사
                        </text>
                      </g>
                    );
                  })}

                  {/* Active point vertical guide line */}
                  {activePoint && (
                    <line
                      x1={activePoint.x}
                      y1={chartModel.padTop}
                      x2={activePoint.x}
                      y2={chartModel.padTop + chartModel.plotH}
                      stroke={visual.strokeColor}
                      strokeOpacity={0.35}
                      strokeDasharray="2 2"
                      strokeWidth={1}
                    />
                  )}

                  {/* Gradient Area & Trend Line */}
                  {chartModel.areaPath && (
                    <path d={chartModel.areaPath} fill={`url(#${gradientId})`} />
                  )}
                  {chartModel.linePath && (
                    <path
                      d={chartModel.linePath}
                      fill="none"
                      stroke={visual.strokeColor}
                      strokeWidth={2.25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Interactive Data Points + X-axis Labels */}
                  {chartModel.points.map((pt) => {
                    const isActive = activePoint?.idx === pt.idx;
                    const showXLabel = pt.idx % 2 === 0 || pt.idx === chartModel.points.length - 1;
                    return (
                      <g key={pt.idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isActive ? 4.5 : 2.75}
                          fill={isActive ? visual.strokeColor : '#ffffff'}
                          stroke={visual.strokeColor}
                          strokeWidth={isActive ? 2 : 1.75}
                          className="dark:fill-slate-900 transition-all"
                        />
                        {/* Larger invisible hit target for easy hover/tap */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={12}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPointIdx(pt.idx)}
                          onClick={() => setHoveredPointIdx(pt.idx)}
                        />
                        {showXLabel && (
                          <text
                            x={pt.x}
                            y={chartModel.height - 6}
                            textAnchor="middle"
                            className={`text-[9px] font-mono ${
                              isActive
                                ? 'fill-slate-900 dark:fill-white font-bold'
                                : 'fill-slate-400 dark:fill-slate-500'
                            }`}
                          >
                            {pt.timeLabel}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          {/* Covered Outlets (Clean typographic metadata) & Filter Action */}
          <div className="pt-2.5 mt-1 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-800 dark:text-slate-100 mr-1.5">
                주요 보도 언론사:
              </span>
              <span>{activeTrend.coveredOutlets.join(' · ')}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                3시간 간격 누적 집계 기준
              </span>
              <button
                type="button"
                onClick={() => {
                  const isAlreadySelected = selectedKeyword === activeTrend.keyword;
                  onSelectKeyword(isAlreadySelected ? null : activeTrend.keyword);
                  setOpenTrendKeyword(null);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Filter className="w-3 h-3" />
                <span>
                  {selectedKeyword === activeTrend.keyword
                    ? '키워드 필터 해제'
                    : '이 키워드 기사 필터링'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
