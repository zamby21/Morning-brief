import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { KeywordTags } from './components/KeywordTags';
import { ToneModal } from './components/ToneModal';
import { TopicFilter } from './components/TopicFilter';
import { FrontPageSection } from './components/FrontPageSection';
import { OverlappingStoriesSection } from './components/OverlappingStoriesSection';
import { ExclusiveStoriesSection } from './components/ExclusiveStoriesSection';
import { PressSelectorModal } from './components/PressSelectorModal';
import { DashboardModal } from './components/DashboardModal';
import { EmailModal } from './components/EmailModal';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { SocialShareModal } from './components/SocialShareModal';
import { ArticleModal } from './components/ArticleModal';
import { NewspaperViewerModal } from './components/NewspaperViewerModal';
import { PushNotificationBanner } from './components/PushNotificationBanner';

import {
  INITIAL_DAILY_BRIEFING,
  INITIAL_USER_PREFERENCES,
  MOCK_WEEKLY_REPORT,
  INITIAL_EMAIL_LOGS,
  DEFAULT_10_OUTLETS,
} from './data/mockNewsData';
import { ensureFrontPageStories } from './utils/outletStories';
import { getCurrentKoreanDateString, getCurrentYMD } from './utils/dateUtils';
import {
  DailyBriefing,
  UserPreferences,
  WeeklyReport,
  EmailDispatchLog,
  NewsStory,
  BriefingTone,
} from './types/news';
import {
  fetchSummary,
  rewriteTone,
  sendEmailBriefing,
} from './services/apiService';
import {
  Clock,
  Mail,
  Smartphone,
  Sparkles,
  Layers,
  Newspaper,
  Zap,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';

export default function App() {
  const [briefing, setBriefing] = useState<DailyBriefing>(INITIAL_DAILY_BRIEFING);
  const [preferences, setPreferences] = useState<UserPreferences>(INITIAL_USER_PREFERENCES);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport>(MOCK_WEEKLY_REPORT);
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>(INITIAL_EMAIL_LOGS);

  // Filters
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('전체');

  // Sidebar Open/Close State (세로 접이식 메뉴)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Newspaper View Mode (신문 지면 스타일 토글)
  const [newspaperViewMode, setNewspaperViewMode] = useState(false);

  // Section Collapse State (1.첫페이지, 2.공통이슈, 3.단독보도)
  const [collapsedSections, setCollapsedSections] = useState({
    frontPage: false,
    overlapping: false,
    exclusive: false,
  });

  // Scroll to Top visibility state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Modals
  const [isPressModalOpen, setIsPressModalOpen] = useState(false);
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [shareStory, setShareStory] = useState<NewsStory | null>(null);
  const [articleModalStory, setArticleModalStory] = useState<NewsStory | null>(null);
  const [newspaperModalStory, setNewspaperModalStory] = useState<NewsStory | null>(null);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [pushBannerVisible, setPushBannerVisible] = useState(true);
  const [pushToast, setPushToast] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Scroll to top listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic date synchronization: guarantees today's date (KST) on mount and prevents stale dates
  useEffect(() => {
    const todayFormatted = getCurrentKoreanDateString();
    const todayYMD = getCurrentYMD();
    setBriefing((prev) => ({
      ...prev,
      briefingDate: todayFormatted,
      frontPageStories: (prev.frontPageStories || []).map((s) => ({
        ...s,
        publishedAt: s.publishedAt ? s.publishedAt.replace(/^\d{4}-\d{2}-\d{2}/, todayYMD) : `${todayYMD} 06:00`,
      })),
      overlappingStories: (prev.overlappingStories || []).map((s) => ({
        ...s,
        publishedAt: s.publishedAt ? s.publishedAt.replace(/^\d{4}-\d{2}-\d{2}/, todayYMD) : `${todayYMD} 06:30`,
      })),
      exclusiveStories: (prev.exclusiveStories || []).map((s) => ({
        ...s,
        publishedAt: s.publishedAt ? s.publishedAt.replace(/^\d{4}-\d{2}-\d{2}/, todayYMD) : `${todayYMD} 07:00`,
      })),
    }));
  }, []);

  const triggerNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => {
      setStatusNotification(null);
    }, 3200);
  };

  // Section Toggle Helpers
  const toggleSection = (section: 'frontPage' | 'overlapping' | 'exclusive') => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleAllSections = () => {
    const allCollapsed =
      collapsedSections.frontPage &&
      collapsedSections.overlapping &&
      collapsedSections.exclusive;
    setCollapsedSections({
      frontPage: !allCollapsed,
      overlapping: !allCollapsed,
      exclusive: !allCollapsed,
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Fetch & Refresh
  const handleRefreshLive = async () => {
    setIsLoading(true);
    triggerNotification('대한민국 주요 언론사 실시간 기사 수집 및 요약 중...');
    try {
      const activeOutlets =
        preferences.selectedOutlets && preferences.selectedOutlets.length > 0
          ? preferences.selectedOutlets
          : DEFAULT_10_OUTLETS;

      const result = await fetchSummary(
        activeOutlets,
        preferences.preferredTone,
        preferences.subscribedTopics
      );

      const todayFormatted = getCurrentKoreanDateString();
      const updatedBriefing: DailyBriefing = {
        ...result.data,
        briefingDate: result.data.briefingDate || todayFormatted,
        frontPageStories: ensureFrontPageStories(result.data.frontPageStories || [], activeOutlets),
      };

      setBriefing(updatedBriefing);
      triggerNotification('최신 기사 요약 분석이 완료되었습니다.');
    } catch (e) {
      console.error(e);
      triggerNotification('실시간 갱신 중 오류가 발생하여 캐시된 데이터를 표시합니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Change Tone
  const handleSelectTone = async (newTone: BriefingTone) => {
    if (newTone === briefing.tone) return;
    setIsLoading(true);
    setPreferences((prev) => ({ ...prev, preferredTone: newTone }));
    try {
      const updated = await rewriteTone(briefing, newTone);
      setBriefing(updated);
      triggerNotification(`요약본 어조가 '${getToneLabel(newTone)}'으로 변경되었습니다.`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getToneLabel = (t: BriefingTone) => {
    switch (t) {
      case 'bullet':
        return '개조식 드라이톤';
      case 'friendly':
        return '친근한 설명체';
      case 'insight':
        return '투자·비즈니스 인사이트';
      case 'formal':
      default:
        return '격식 브리핑체';
    }
  };

  // 3. Update Press Outlets
  const handleApplyOutlets = (outlets: string[]) => {
    const validOutlets = outlets && outlets.length > 0 ? outlets : DEFAULT_10_OUTLETS;
    setPreferences((prev) => ({ ...prev, selectedOutlets: validOutlets }));
    setBriefing((prev) => ({
      ...prev,
      selectedOutletIds: validOutlets,
      frontPageStories: ensureFrontPageStories(prev.frontPageStories, validOutlets),
    }));
    triggerNotification(`수집 언론사(${validOutlets.length}개사) 설정이 업데이트되었습니다.`);
  };

  // 4. Update Topic subscriptions
  const handleToggleSubscribedTopic = (topic: string) => {
    setPreferences((prev) => {
      const exists = prev.subscribedTopics.includes(topic);
      const next = exists
        ? prev.subscribedTopics.filter((t) => t !== topic)
        : [...prev.subscribedTopics, topic];
      return { ...prev, subscribedTopics: next };
    });
  };

  // 5. Send Email Briefing
  const handleSendEmail = async (email: string): Promise<string> => {
    const res = await sendEmailBriefing(email, briefing, preferences.deliveryTime);
    if (res.log) {
      setEmailLogs((prev) => [res.log, ...prev]);
    }
    triggerNotification(`${email} 주소로 요약본이 정상 발송되었습니다.`);
    return res.message;
  };

  // 6. Test Web Push Notification
  const handleTestPush = () => {
    const pushText = `[09:00 모닝브리프] 오늘의 핵심 3줄: 韓·美 AI반도체 공급망 협정 합의 및 기준금리 추가 인하 전망!`;
    setPushToast(pushText);

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('모닝브리프 AI 09:00 알림', {
          body: pushText,
          icon: '/favicon.ico',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('모닝브리프 AI 09:00 알림', {
              body: pushText,
              icon: '/favicon.ico',
            });
          }
        });
      }
    }

    setTimeout(() => {
      setPushToast(null);
    }, 6000);
  };

  const handleEnablePushFromBanner = () => {
    setPreferences((prev) => ({ ...prev, pushNotificationEnabled: true }));
    setPushBannerVisible(false);
    handleTestPush();
    triggerNotification('모바일 푸시 알림이 활성화되었습니다.');
  };

  // 7. Reactions
  const handleReaction = (storyId: string, reactionType: 'insightful' | 'important' | 'surprising') => {
    const updateList = (stories: NewsStory[]) =>
      stories.map((s) => {
        if (s.id === storyId) {
          const reactions = s.reactions || { insightful: 0, important: 0, surprising: 0 };
          return {
            ...s,
            reactions: {
              ...reactions,
              [reactionType]: (reactions[reactionType] || 0) + 1,
            },
          };
        }
        return s;
      });

    setBriefing((prev) => ({
      ...prev,
      frontPageStories: updateList(prev.frontPageStories),
      overlappingStories: updateList(prev.overlappingStories),
      exclusiveStories: updateList(prev.exclusiveStories),
    }));
    triggerNotification('공감 반응이 등록되었습니다.');
  };

  // 8. Filter Logic
  const filterStory = (s: NewsStory) => {
    // Outlet filter
    if (
      s.outletId !== 'multiple' &&
      s.outletId !== 'exclusive' &&
      preferences.selectedOutlets &&
      preferences.selectedOutlets.length > 0 &&
      !preferences.selectedOutlets.includes(s.outletId)
    ) {
      return false;
    }

    // Keyword filter
    if (selectedKeyword) {
      const cleanKw = selectedKeyword.replace('#', '');
      const matchInKeywords = s.keywords?.some((k) => k && k.includes(cleanKw));
      const matchInTitle = s.title && s.title.includes(cleanKw);
      const matchInSummary = s.leadSummary && s.leadSummary.some((l) => l && l.includes(cleanKw));
      if (!matchInKeywords && !matchInTitle && !matchInSummary) return false;
    }

    // Topic filter
    if (selectedTopic !== '전체') {
      if (s.topic && !s.topic.includes(selectedTopic.split('·')[0])) {
        return false;
      }
    }

    return true;
  };

  const filteredFrontPage = briefing.frontPageStories.filter(filterStory);
  const filteredOverlapping = briefing.overlappingStories.filter(filterStory);
  const filteredExclusive = briefing.exclusiveStories.filter(filterStory);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Alert */}
      {statusNotification && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Push Banner */}
      <PushNotificationBanner
        isVisible={pushBannerVisible}
        onClose={() => setPushBannerVisible(false)}
        onEnablePush={handleEnablePushFromBanner}
        isPushEnabled={preferences.pushNotificationEnabled}
        pushMessage={pushToast}
      />

      {/* Collapsible Left Vertical Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        preferences={preferences}
        currentTone={briefing.tone}
        onOpenPressModal={() => setIsPressModalOpen(true)}
        onOpenToneModal={() => setIsToneModalOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenWeeklyModal={() => setIsWeeklyModalOpen(true)}
        onRefreshLive={handleRefreshLive}
        isLoading={isLoading}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        newspaperViewMode={newspaperViewMode}
        onToggleNewspaperViewMode={() => setNewspaperViewMode(!newspaperViewMode)}
        selectedTopic={selectedTopic}
        onSelectTopic={(t) => setSelectedTopic(t)}
        subscribedTopics={preferences.subscribedTopics}
      />

      {/* Main Content Layout with Sidebar offset on Desktop */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:pl-72' : 'lg:pl-16'}`}>
        {/* Header */}
        <Header
          preferences={preferences}
          briefingDate={briefing.briefingDate}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onOpenPressModal={() => setIsPressModalOpen(true)}
          onOpenToneModal={() => setIsToneModalOpen(true)}
          currentTone={briefing.tone}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onOpenEmailModal={() => setIsEmailModalOpen(true)}
          onOpenWeeklyModal={() => setIsWeeklyModalOpen(true)}
          onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
          isMobilePreview={isMobilePreview}
          onRefreshLive={handleRefreshLive}
          isLoading={isLoading}
          selectedOutletsCount={preferences.selectedOutlets?.length || 0}
        />

        {/* Outer Container (with optional Mobile Frame simulator) */}
        <div className={`mx-auto transition-all duration-300 ${isMobilePreview ? 'max-w-md my-6 p-4 bg-white border-4 border-slate-300 rounded-[40px] shadow-2xl' : 'max-w-7xl px-4 py-4 sm:py-6'}`}>
          {isMobilePreview && (
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 text-xs text-slate-500">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                모바일 앱 실시간 뷰 모드
              </span>
              <button
                onClick={() => setIsMobilePreview(false)}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                PC 전체화면 보기
              </button>
            </div>
          )}

          <main className="space-y-4 sm:space-y-5">
            {/* 1. Keyword Tags (태그 형태로 상단 표시 & 클릭 필터링) */}
            <KeywordTags
              keywords={briefing.topKeywords}
              selectedKeyword={selectedKeyword}
              onSelectKeyword={(kw) => setSelectedKeyword(kw)}
            />

            {/* 2. Topic Subscription Filtering */}
            <TopicFilter
              selectedTopic={selectedTopic}
              onSelectTopic={(t) => setSelectedTopic(t)}
              subscribedTopics={preferences.subscribedTopics}
              onToggleSubscribedTopic={handleToggleSubscribedTopic}
            />

            {/* Active Filter State Notice */}
            {(selectedKeyword || selectedTopic !== '전체') && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-blue-900 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">현재 필터 적용 중:</span>
                  {selectedKeyword && (
                    <span className="font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                      키워드: {selectedKeyword}
                    </span>
                  )}
                  {selectedTopic !== '전체' && (
                    <span className="font-bold bg-cyan-600 text-white px-2 py-0.5 rounded">
                      주제: {selectedTopic}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedKeyword(null);
                    setSelectedTopic('전체');
                  }}
                  className="text-xs text-blue-700 hover:text-blue-900 underline font-bold cursor-pointer"
                >
                  필터 초기화
                </button>
              </div>
            )}

            {/* Quick Section Jump Navigation Bar & Global Collapse Controls */}
            <div className="bg-white/95 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-xs backdrop-blur-md sticky top-[57px] z-20">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
                  섹션 바로가기:
                </span>
                <button
                  onClick={() => scrollToSection('section-frontpage')}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Newspaper className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. 1면 핵심</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-bold">
                    {filteredFrontPage.length}
                  </span>
                </button>

                <button
                  onClick={() => scrollToSection('section-overlapping')}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>2. 공통 이슈</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-600 text-white font-bold">
                    {filteredOverlapping.length}
                  </span>
                </button>

                <button
                  onClick={() => scrollToSection('section-exclusive')}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-rose-600" />
                  <span>3. 단독·특별</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                    {filteredExclusive.length}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAllSections}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="모든 섹션 일괄 접기 / 펼치기"
                >
                  {collapsedSections.frontPage && collapsedSections.overlapping && collapsedSections.exclusive ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                      <span>전체 펼치기</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>전체 접기</span>
                    </>
                  )}
                </button>

                <button
                  onClick={scrollToTop}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="페이지 맨 위로 바로가기"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">맨위로</span>
                </button>
              </div>
            </div>

            {/* 3. Section 1: 각 언론사 신문 첫페이지 (1면) 핵심 내용 먼저 제시 */}
            <FrontPageSection
              stories={filteredFrontPage}
              onOpenShareModal={(s) => setShareStory(s)}
              onOpenArticleModal={(s) => setArticleModalStory(s)}
              onOpenNewspaperModal={(s) => setNewspaperModalStory(s)}
              onReact={handleReaction}
              isCollapsed={collapsedSections.frontPage}
              onToggleCollapse={() => toggleSection('frontPage')}
              onScrollToTop={scrollToTop}
              newspaperViewMode={newspaperViewMode}
              onToggleNewspaperViewMode={() => setNewspaperViewMode(!newspaperViewMode)}
            />

            {/* 4. Section 2: 언론사들에서 중복적으로 낸 공통 핵심 기사 */}
            <OverlappingStoriesSection
              stories={filteredOverlapping}
              onOpenShareModal={(s) => setShareStory(s)}
              onOpenArticleModal={(s) => setArticleModalStory(s)}
              onReact={handleReaction}
              isCollapsed={collapsedSections.overlapping}
              onToggleCollapse={() => toggleSection('overlapping')}
              onScrollToTop={scrollToTop}
            />

            {/* 5. Section 3: 각 언론사만의 단독 및 특별 기사 */}
            <ExclusiveStoriesSection
              stories={filteredExclusive}
              onOpenShareModal={(s) => setShareStory(s)}
              onOpenArticleModal={(s) => setArticleModalStory(s)}
              onReact={handleReaction}
              isCollapsed={collapsedSections.exclusive}
              onToggleCollapse={() => toggleSection('exclusive')}
              onScrollToTop={scrollToTop}
            />

            {/* Weekly Report Promotion Banner (Light Theme) */}
            <section className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border border-purple-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    주간 종합 리포트
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    7일간 뉴스 데이터베이스 분석
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  일주일간 주요 이슈 분석 리포트 & 언론사 논조 비교
                </h3>
                <p className="text-xs text-slate-600">
                  1주일간 누적된 주요 언론사의 이슈 전개 타임라인과 시각 차이를 한눈에 확인하세요.
                </p>
              </div>
              <button
                onClick={() => setIsWeeklyModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition active:scale-95 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>주간 리포트 열기</span>
              </button>
            </section>
          </main>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-slate-200 text-center text-xs text-slate-500 space-y-2">
            <p>
              <strong className="text-slate-800">모닝브리프 AI</strong> | 대한민국 주요 10대 언론사(종합 5개사, 경제 5개사) 당일 신문 1면 및 공통이슈 3줄 요약 플랫폼
            </p>
            <p className="text-[11px] text-slate-400">
              모든 보도의 지적재산권은 해당 언론사에 있으며, 원기사 링크를 통해 전문을 확인하실 수 있습니다. 매일 오전 09:00 자동 집계 및 이메일 발송.
            </p>
          </footer>
        </div>
      </div>

      {/* Modals */}
      {isPressModalOpen && (
        <PressSelectorModal
          isOpen={isPressModalOpen}
          onClose={() => setIsPressModalOpen(false)}
          selectedOutletIds={preferences.selectedOutlets || []}
          onApplyOutlets={handleApplyOutlets}
        />
      )}

      <DashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        preferences={preferences}
        onUpdatePreferences={(updated) => {
          setPreferences(updated);
          triggerNotification('수신 시간 및 알림 대시보드 설정이 저장되었습니다.');
        }}
        onTestPush={handleTestPush}
      />

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        briefing={briefing}
        recipientEmail={preferences.recipientEmail}
        deliveryTime={preferences.deliveryTime}
        emailLogs={emailLogs}
        onSendEmail={handleSendEmail}
      />

      <WeeklyReportModal
        isOpen={isWeeklyModalOpen}
        onClose={() => setIsWeeklyModalOpen(false)}
        report={weeklyReport}
      />

      <SocialShareModal
        isOpen={!!shareStory}
        onClose={() => setShareStory(null)}
        story={shareStory}
        onSendFriendEmail={(friendEmail, storyTitle) => {
          triggerNotification(`${friendEmail}님께 '${storyTitle}' 3줄 요약 브리핑이 전달되었습니다.`);
        }}
      />

      {/* Verified Full Article & Cluster Viewer Modal */}
      <ArticleModal
        isOpen={!!articleModalStory}
        onClose={() => setArticleModalStory(null)}
        story={articleModalStory}
        onOpenShare={(s) => setShareStory(s)}
        onOpenNewspaperModal={(s) => setNewspaperModalStory(s)}
      />

      {/* Realistic 1-Page Newspaper Facsimile Viewer Modal */}
      <NewspaperViewerModal
        isOpen={!!newspaperModalStory}
        onClose={() => setNewspaperModalStory(null)}
        story={newspaperModalStory}
        onOpenShare={(s) => setShareStory(s)}
      />

      {/* Tone Personalization Modal */}
      <ToneModal
        isOpen={isToneModalOpen}
        onClose={() => setIsToneModalOpen(false)}
        currentTone={briefing.tone}
        onSelectTone={(tone) => {
          handleSelectTone(tone);
          setIsToneModalOpen(false);
        }}
        isLoading={isLoading}
      />

      {/* Floating Action Button: Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 sm:px-4 sm:py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 border border-blue-400/40 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 group font-bold text-xs cursor-pointer backdrop-blur-md"
          title="페이지 맨 위로 바로가기"
        >
          <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          <span className="hidden sm:inline">맨위로</span>
        </button>
      )}
    </div>
  );
}
