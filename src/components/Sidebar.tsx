import React from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  Clock,
  Mail,
  CalendarDays,
  RefreshCw,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Building2,
  Filter,
  Newspaper,
  Layers,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { BriefingTone, ThemeMode, UserPreferences } from '../types/news';
import { AVAILABLE_TOPICS } from '../data/mockNewsData';
import { ThemeSelector } from './ThemeSelector';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  preferences: UserPreferences;
  currentTone: BriefingTone;
  onOpenPressModal: () => void;
  onOpenToneModal: () => void;
  onOpenDashboard: () => void;
  onOpenEmailModal: () => void;
  onOpenWeeklyModal: () => void;
  onRefreshLive: () => void;
  isLoading: boolean;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  subscribedTopics: string[];
  frontPageCount?: number;
  overlappingCount?: number;
  onScrollToSection?: (id: string) => void;
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  onChangeTheme: (mode: ThemeMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  preferences,
  currentTone,
  onOpenPressModal,
  onOpenToneModal,
  onOpenDashboard,
  onOpenEmailModal,
  onOpenWeeklyModal,
  onRefreshLive,
  isLoading,
  isMobilePreview,
  onToggleMobilePreview,
  selectedTopic,
  onSelectTopic,
  subscribedTopics,
  frontPageCount,
  overlappingCount,
  onScrollToSection,
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

  const frontTotal = frontPageCount ?? (preferences.frontPageOutlets?.length || preferences.selectedOutlets?.length || 10);
  const overlapTotal = overlappingCount ?? (preferences.overlappingOutlets?.length || preferences.selectedOutlets?.length || 10);

  return (
    <>
      {/* Mobile Backdrop Overlay when sidebar is open on small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 shadow-xl lg:shadow-xs flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
      >
        {/* Top Header of Sidebar */}
        <div className="h-16 border-b border-slate-200/90 dark:border-slate-800 px-3.5 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/90">
          {isOpen ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <Newspaper className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>설정 & 옵션 메뉴</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  모닝브리프 개인화 설정
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div
                className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shadow-xs cursor-pointer hover:bg-blue-700 transition"
                onClick={onToggle}
                title="메뉴 펼치기"
              >
                <Newspaper className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
            title={isOpen ? '메뉴 접기' : '메뉴 펼치기'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 hidden lg:block" />}
          </button>
        </div>

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {/* Group 1: 브리핑 맞춤 설정 */}
          <div>
            {isOpen && (
              <div className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                브리핑 맞춤 설정
              </div>
            )}

            <div className="space-y-1">
              {/* Outlet Selection */}
              <button
                onClick={onOpenPressModal}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition group cursor-pointer ${
                  isOpen
                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                    : 'justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title={`언론사 선택 (1면 ${frontTotal}사 · 공통 ${overlapTotal}사)`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
                      <span>수집 언론사</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        1면 {frontTotal} · 공통 {overlapTotal}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                      1면 핵심 & 공통이슈 개별 설정
                    </div>
                  </div>
                )}
              </button>

              {/* Tone Selection */}
              <button
                onClick={onOpenToneModal}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition group cursor-pointer ${
                  isOpen
                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                    : 'justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title={`요약본 어조 설정: ${getToneShortLabel(currentTone)}`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Sparkles className="w-4 h-4" />
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
                      <span>요약 어조</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {getToneShortLabel(currentTone)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      인사이트(2+1) / 격식 / 개조식 / 설명식
                    </div>
                  </div>
                )}
              </button>

              {/* Delivery Dashboard */}
              <button
                onClick={onOpenDashboard}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition group cursor-pointer ${
                  isOpen
                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                    : 'justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title={`수신 대시보드 (매일 ${preferences.deliveryTime})`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
                      <span>수신 대시보드</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        {preferences.deliveryTime}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      발송 시각·웹푸시·테마 관리
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Group 2: 발송 & 리포트 액션 */}
          <div>
            {isOpen && (
              <div className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                발송 및 심층 리포트
              </div>
            )}

            <div className="space-y-1">
              {/* Send Email */}
              <button
                onClick={onOpenEmailModal}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition group cursor-pointer ${
                  isOpen
                    ? 'hover:bg-blue-50/70 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300'
                    : 'justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title="이메일 즉시 발송"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      이메일 발송
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {preferences.recipientEmail}
                    </div>
                  </div>
                )}
              </button>

              {/* Weekly Report */}
              <button
                onClick={onOpenWeeklyModal}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition group cursor-pointer ${
                  isOpen
                    ? 'hover:bg-purple-50/70 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-300'
                    : 'justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title="주간 심층 분석 리포트"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <CalendarDays className="w-4 h-4" />
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      주간 분석 리포트
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      7일간의 경제·정치 트렌드
                    </div>
                  </div>
                )}
              </button>

              {/* Real-time Refresh */}
              <button
                onClick={onRefreshLive}
                disabled={isLoading}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition group cursor-pointer disabled:opacity-50 ${
                  isOpen
                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                    : 'justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title="실시간 AI 기사 갱신"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      실시간 AI 갱신
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {isLoading ? '최신 기사 분석 중...' : '최신 기사 재수집'}
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Group 3: 보기 방식 & 화면 테마 옵션 */}
          <div>
            {isOpen && (
              <div className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                보기 모드 & 화면 테마
              </div>
            )}

            <div className="space-y-1.5">
              {/* Theme Selector (라이트 모드 / 다크 모드 / 시스템 설정) */}
              <ThemeSelector
                themeMode={themeMode}
                resolvedTheme={resolvedTheme}
                onChangeTheme={onChangeTheme}
                variant="sidebar"
                isSidebarOpen={isOpen}
              />

              {/* Mobile Preview Toggle */}
              <button
                onClick={onToggleMobilePreview}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition group cursor-pointer ${
                  isMobilePreview
                    ? 'bg-blue-50/80 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                } ${!isOpen && 'justify-center'}`}
                title={isMobilePreview ? '모바일 프레임 활성' : '모바일 뷰 프레임'}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isMobilePreview
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white'
                }`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>모바일 뷰</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isMobilePreview ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {isMobilePreview ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      스마트폰 실물 뷰 시뮬레이터
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Group 4: 관심 주제 빠른 필터 (Only when open) */}
          {isOpen && (
            <div className="pt-2 border-t border-slate-200/90 dark:border-slate-800">
              <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>관심 주제 빠른 필터</span>
                <Filter className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="space-y-1">
                {AVAILABLE_TOPICS.map((topic) => {
                  const isSelected = selectedTopic === topic;
                  const isSubscribed = subscribedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => onSelectTopic(topic)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="truncate">{topic}</span>
                      {isSubscribed && topic !== '전체' && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Info */}
        {isOpen && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/90 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200">
              <span>발행 상태</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                정상 가동 중
              </span>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
              실시간 홈페이지 1면 자동 갱신 시스템
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
