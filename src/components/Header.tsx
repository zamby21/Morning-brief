import React from 'react';
import {
  Newspaper,
  Menu,
  RefreshCw,
  Smartphone,
  Calendar,
  Settings,
} from 'lucide-react';
import { UserPreferences, DataSourceType } from '../types/news';
import { getCurrentKoreanDateString } from '../utils/dateUtils';
import { FallbackBadge } from './FallbackNotice';

interface HeaderProps {
  preferences: UserPreferences;
  briefingDate?: string;
  briefingTime?: string;
  sourceType?: DataSourceType;
  isFallback?: boolean;
  sampleSnapshotDate?: string;
  onResetHome?: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenDashboard: () => void;
  onToggleMobilePreview: () => void;
  isMobilePreview: boolean;
  onRefreshLive: () => void;
  isLoading: boolean;
  subNav?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  preferences: _preferences,
  briefingDate,
  briefingTime,
  sourceType,
  isFallback,
  sampleSnapshotDate,
  onResetHome,
  onToggleSidebar,
  isSidebarOpen,
  onOpenDashboard,
  onToggleMobilePreview,
  isMobilePreview,
  onRefreshLive,
  isLoading,
  subNav,
}) => {
  const isMockOrFallback = Boolean(isFallback) || sourceType === 'mock';
  const fallbackDateLabel = sampleSnapshotDate ? `샘플 ${sampleSnapshotDate}` : (briefingDate || '샘플 데이터');
  const liveDateLabel = briefingDate || getCurrentKoreanDateString();

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 shadow-xs backdrop-blur-md transition-colors duration-200">
      {/* Top Thin Notification Strip (Bright, Ultra-Compact & Zero Line Wrap on Mobile) */}
      <div
        className={`border-b px-3 sm:px-4 py-1 text-[11px] sm:text-xs transition-colors ${
          isMockOrFallback
            ? 'bg-amber-100/95 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-100'
            : 'bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border-blue-100/80 dark:border-slate-800 text-slate-600 dark:text-slate-300'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            {isMockOrFallback ? (
              <FallbackBadge label="수집 실패 · 샘플 데이터" size="xs" variant="solid" />
            ) : (
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shrink-0">
                실시간 연동 ({briefingTime || 'LIVE'})
              </span>
            )}
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span
              className={`hidden sm:inline font-semibold truncate ${
                isMockOrFallback
                  ? 'text-amber-950 dark:text-amber-200'
                  : 'text-slate-600 dark:text-slate-300 font-medium'
              }`}
            >
              {isMockOrFallback
                ? '실시간 기사 수집에 실패하여 참고용 샘플 데이터를 표시하고 있습니다'
                : '각 언론사 홈페이지 첫화면 중앙 1면 톱기사 실시간 연동 요약'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-xs shrink-0">
            <button
              type="button"
              onClick={onOpenDashboard}
              title="이메일 뉴스레터 HTML 미리보기 열기 (실제 자동 발송 미연동)"
              className="inline-flex items-center gap-1 font-semibold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full border shrink-0 cursor-pointer transition text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <span>뉴스레터 미리보기</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar: Sleek, Single-line, No Awkward Wraps */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Left: Mobile Drawer Toggle (< lg only) + Brand Logo + Inline Date (Single Line) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Mobile-only Sidebar Drawer Button (Hidden on Desktop lg+ where left sidebar is shown) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`lg:hidden p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center cursor-pointer border shrink-0 ${
              isSidebarOpen
                ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title="설정 & 메뉴 열기/닫기"
            aria-label="설정 및 메뉴 열기"
          >
            <Menu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Logo & Headline (Click to reload to initial home screen) */}
          <button
            type="button"
            onClick={() => {
              if (onResetHome) {
                onResetHome();
              } else {
                window.location.reload();
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2 min-w-0 cursor-pointer hover:opacity-85 active:scale-[0.98] transition text-left focus:outline-none rounded-xl py-0.5 pr-1"
            title="첫화면으로 새로고침 (홈 리로드)"
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
              <Newspaper className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap whitespace-nowrap">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5">
                  모닝브리프
                </h1>
                {/* Desktop Full Date Badge */}
                {isMockOrFallback ? (
                  <span
                    title="오늘 날짜가 아닌 참고용 샘플 데이터 기준 시점입니다"
                    className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold font-mono tabular-nums px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 shadow-2xs"
                  >
                    <Calendar className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                    <span>{fallbackDateLabel}</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 shadow-2xs">
                    <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>{liveDateLabel}</span>
                  </span>
                )}
                {/* Mobile Date Badge */}
                {isMockOrFallback ? (
                  <span className="inline-flex sm:hidden items-center gap-1 text-[10px] font-bold font-mono tabular-nums px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 shrink-0">
                    <Calendar className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
                    <span>{sampleSnapshotDate || '샘플'}</span>
                  </span>
                ) : (
                  <span className="inline-flex sm:hidden items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 shrink-0">
                    <Calendar className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                    <span>{liveDateLabel.replace(/^\d{4}[년\.\-]\s*/, '')}</span>
                  </span>
                )}
                {isMockOrFallback ? (
                  <FallbackBadge label="샘플 데이터" size="xs" variant="solid" className="hidden sm:inline-flex" />
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-2xs">
                    LIVE
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Right: Streamlined Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Right Settings Button (Opens/Toggles Left Settings Sidebar) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer shrink-0 ${
              isSidebarOpen
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 border-blue-200/90 dark:border-blue-800'
            }`}
            title="설정 메뉴 열기/닫기"
            aria-label="설정 메뉴 열기"
            aria-expanded={isSidebarOpen}
          >
            <Settings className={`w-3.5 h-3.5 ${isSidebarOpen ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
            <span>설정</span>
          </button>

          {/* Refresh Live Button */}
          <button
            onClick={onRefreshLive}
            disabled={isLoading}
            className="flex items-center p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            title="실시간 AI 기사 재수집 및 분석"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-1.5">실시간 갱신</span>
          </button>

          {/* Mobile Preview Toggle (Desktop Only) */}
          <button
            onClick={onToggleMobilePreview}
            className={`hidden sm:flex p-2 rounded-xl border transition cursor-pointer ${
              isMobilePreview
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="모바일 앱 화면 뷰어 토글"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fixed Quick Section Navigation Bar directly below Main Header */}
      {subNav && (
        <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/85 dark:bg-slate-900/95">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2">
            {subNav}
          </div>
        </div>
      )}
    </header>
  );
};
