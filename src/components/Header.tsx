import {
  Newspaper,
  Menu,
  Clock,
  RefreshCw,
  Mail,
  SlidersHorizontal,
  Sparkles,
  Smartphone,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { BriefingTone, ThemeMode, UserPreferences } from '../types/news';
import { getCurrentKoreanDateString } from '../utils/dateUtils';
import { ThemeSelector } from './ThemeSelector';

interface HeaderProps {
  preferences: UserPreferences;
  briefingDate?: string;
  briefingTime?: string;
  onResetHome?: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenPressModal: () => void;
  onOpenToneModal: () => void;
  currentTone: BriefingTone;
  onOpenDashboard: () => void;
  onOpenEmailModal: () => void;
  onOpenWeeklyModal: () => void;
  onToggleMobilePreview: () => void;
  isMobilePreview: boolean;
  onRefreshLive: () => void;
  isLoading: boolean;
  selectedOutletsCount: number;
  frontPageCount?: number;
  overlappingCount?: number;
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  onChangeTheme: (mode: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  preferences,
  briefingDate,
  briefingTime,
  onResetHome,
  onToggleSidebar,
  isSidebarOpen,
  onOpenPressModal,
  onOpenToneModal,
  currentTone,
  onOpenDashboard,
  onOpenEmailModal,
  onOpenWeeklyModal,
  onToggleMobilePreview,
  isMobilePreview,
  onRefreshLive,
  isLoading,
  selectedOutletsCount,
  frontPageCount,
  overlappingCount,
  themeMode,
  resolvedTheme,
  onChangeTheme,
}) => {
  const getToneShortLabel = (tone: BriefingTone) => {
    switch (tone) {
      case 'bullet':
        return '개조식';
      case 'friendly':
        return '설명체';
      case 'formal':
        return '격식체';
      case 'insight':
      default:
        return '인사이트';
    }
  };

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 shadow-xs backdrop-blur-md transition-colors duration-200">
      {/* Top Thin Notification Strip (Bright, Ultra-Compact & Zero Line Wrap on Mobile) */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border-b border-blue-100/80 dark:border-slate-800 px-3 sm:px-4 py-0.5 sm:py-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
              실시간 자동 갱신 {briefingTime ? `(${briefingTime})` : 'LIVE'}
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span className="hidden sm:inline text-slate-600 dark:text-slate-300 font-medium truncate">
              각 언론사 홈페이지 첫화면 중앙 1면 톱기사 실시간 연동 요약
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-xs shrink-0">
            <span className="text-slate-500 dark:text-slate-400 hidden md:inline">
              수신 예약: <strong className="text-slate-800 dark:text-slate-200">{preferences.deliveryTime}</strong> ({preferences.recipientEmail})
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300 font-semibold text-[10px] sm:text-[11px] bg-emerald-50 dark:bg-emerald-950/60 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/70 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>발송 대기</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar: Sleek, Single-line, No Awkward Wraps */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Left: Sidebar Toggle + Brand Logo + Inline Date (Single Line) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Vertical Menu Button (Sidebar Toggle) */}
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 sm:p-2 rounded-xl transition flex items-center gap-1 font-bold text-xs cursor-pointer border shrink-0 ${
              isSidebarOpen
                ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title="설정 & 메뉴 열기/닫기"
          >
            <Menu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">설정</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold">
              {selectedOutletsCount}
            </span>
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
                  모닝브리프 <span className="text-blue-600 dark:text-blue-400">AI</span>
                </h1>
                {/* Desktop Full Date Badge */}
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 shadow-2xs">
                  <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>{briefingDate || getCurrentKoreanDateString()}</span>
                </span>
                {/* Mobile Date Badge (Clean, without year prefix, fully visible without crowding) */}
                <span className="inline-flex sm:hidden items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 shrink-0">
                  <Calendar className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                  <span>{(briefingDate || getCurrentKoreanDateString()).replace(/^\d{4}[년\.\-]\s*/, '')}</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  LIVE
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Right: Streamlined Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Desktop Outlet Quick Indicator Button (Mobile uses left sidebar menu) */}
          <button
            onClick={onOpenPressModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
            title="언론사 맞춤 개별 설정 (1면 핵심 & 공통이슈)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>수집 언론사</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold">
              1면 {frontPageCount ?? selectedOutletsCount}사
            </span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold">
              공통 {overlappingCount ?? selectedOutletsCount}사
            </span>
          </button>

          {/* Tone Quick Indicator Button (Desktop) */}
          <button
            onClick={onOpenToneModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
            title="요약본 어조 변경"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{getToneShortLabel(currentTone)}</span>
          </button>

          {/* Theme Selector Dropdown (라이트 모드 / 다크 모드 / 시스템 설정) */}
          <ThemeSelector
            themeMode={themeMode}
            resolvedTheme={resolvedTheme}
            onChangeTheme={onChangeTheme}
            variant="header"
          />

          {/* Refresh Live Button */}
          <button
            onClick={onRefreshLive}
            disabled={isLoading}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            title="실시간 AI 기사 재수집 및 분석"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-1.5">실시간 갱신</span>
          </button>

          {/* Email Send CTA */}
          <button
            onClick={onOpenEmailModal}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95 cursor-pointer shrink-0"
            title="이메일 즉시 발송"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">이메일</span>
            <span className="xs:hidden">발송</span>
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
    </header>
  );
};
