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
import { BriefingTone, UserPreferences } from '../types/news';
import { getCurrentKoreanDateString } from '../utils/dateUtils';

interface HeaderProps {
  preferences: UserPreferences;
  briefingDate?: string;
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
}

export const Header: React.FC<HeaderProps> = ({
  preferences,
  briefingDate,
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
}) => {
  const getToneShortLabel = (tone: BriefingTone) => {
    switch (tone) {
      case 'bullet':
        return '개조식';
      case 'friendly':
        return '친근체';
      case 'insight':
        return '인사이트';
      case 'formal':
      default:
        return '격식체';
    }
  };

  return (
    <header className="bg-white/95 text-slate-800 border-b border-slate-200/90 sticky top-0 z-30 shadow-xs backdrop-blur-md">
      {/* Top Thin Notification Strip (Bright & Compact) */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-50 border-b border-blue-100/80 px-4 py-1 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
              매일 09:00 AM 정각 자동 브리핑
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-slate-600 font-medium">
              국내 주요 언론사 지면 1면 톱기사 · 공통 이슈 · 단독 보도 3줄 요약
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 hidden md:inline">
              수신 예약: <strong className="text-slate-800">{preferences.deliveryTime}</strong> ({preferences.recipientEmail})
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              발송 대기중
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Left: Sidebar Toggle + Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Vertical Menu Button (Sidebar Toggle) */}
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-xl transition flex items-center gap-1.5 font-bold text-xs cursor-pointer border ${
              isSidebarOpen
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
            }`}
            title="좌측 옵션 & 설정 메뉴 열기/닫기"
          >
            <Menu className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">설정 메뉴</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold ml-0.5">
              {selectedOutletsCount}
            </span>
          </button>

          {/* Logo & Headline */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                  모닝브리프 <span className="text-blue-600">AI</span>
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/90 shadow-2xs flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>{briefingDate || getCurrentKoreanDateString()}</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-2xs">
                    9:00 AM
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                대한민국 주요 언론사 1면 헤드라인 3줄 심층 요약
              </p>
            </div>
          </div>
        </div>

        {/* Right: Streamlined Quick Controls */}
        <div className="flex items-center gap-2">
          {/* Outlet Quick Indicator Button */}
          <button
            onClick={onOpenPressModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition cursor-pointer"
            title="언론사 맞춤 선택"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>수집 언론사</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-bold">
              {selectedOutletsCount}개
            </span>
          </button>

          {/* Tone Quick Indicator Button */}
          <button
            onClick={onOpenToneModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition cursor-pointer"
            title="요약본 어조 변경"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{getToneShortLabel(currentTone)}</span>
          </button>

          {/* Refresh Live Button */}
          <button
            onClick={onRefreshLive}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="실시간 AI 기사 재수집 및 분석"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">실시간 갱신</span>
          </button>

          {/* Email Send CTA */}
          <button
            onClick={onOpenEmailModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
            title="이메일 즉시 발송"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>이메일 발송</span>
          </button>

          {/* Mobile Preview Toggle */}
          <button
            onClick={onToggleMobilePreview}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isMobilePreview
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
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
