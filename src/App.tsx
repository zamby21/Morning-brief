import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { KeywordTags } from './components/KeywordTags';
import { ToneModal } from './components/ToneModal';
import { TopicFilter, SUBSCRIBED_ONLY_TOPIC } from './components/TopicFilter';
import { FrontPageSection } from './components/FrontPageSection';
import { OverlappingStoriesSection } from './components/OverlappingStoriesSection';
import { ExclusiveStoriesSection } from './components/ExclusiveStoriesSection';
import { RealEstateFinanceSection } from './components/RealEstateFinanceSection';
import { PressSelectorModal } from './components/PressSelectorModal';
import { EmailModal } from './components/EmailModal';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { SocialShareModal } from './components/SocialShareModal';
import { ArticleModal } from './components/ArticleModal';
import { PushNotificationBanner } from './components/PushNotificationBanner';
import { ThemeModal } from './components/ThemeModal';
import { EmailScheduleValues } from './components/EmailSchedulerPanel';
import { FallbackNoticeBanner, FallbackBadge } from './components/FallbackNotice';

import {
  INITIAL_DAILY_BRIEFING,
  INITIAL_USER_PREFERENCES,
  MOCK_WEEKLY_REPORT,
  DEFAULT_10_OUTLETS,
  PRESS_OUTLETS,
  SAMPLE_DATA_SNAPSHOT_DATE,
  AVAILABLE_TOPICS,
} from './data/mockNewsData';
import { getCurrentKoreanDateString, getCurrentYMD } from './utils/dateUtils';
import {
  DailyBriefing,
  UserPreferences,
  WeeklyReport,
  EmailDispatchLog,
  NewsStory,
  BriefingTone,
  SectorPreferences,
  SectorHeadlineItem,
  ThemeMode,
  DEFAULT_SECTOR_PREFERENCES,
} from './types/news';
import { getRegionByCode, matchesRegionFilter } from './utils/koreanRegions';
import {
  applyThemeToDocument,
  formatTimeHHMM,
  getStoredThemeMode,
  getSunSchedule,
  getThemeLabel,
  isValidThemeMode,
  persistThemeMode,
  resolveTheme,
} from './utils/theme';
import {
  fetchSummary,
  rewriteTone,
  sendEmailBriefing,
  saveEmailSchedule,
} from './services/apiService';
import { transformBriefingTone } from './utils/toneTransformer';
import {
  addReadArticleKeys,
  isArticleRead,
  loadReadArticleKeys,
  ReadableArticleRef,
  removeReadArticleKeys,
  saveReadArticleKeys,
} from './utils/readArticles';
import {
  Smartphone,
  Sparkles,
  Layers,
  Newspaper,
  Zap,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Building,
  Info,
  RefreshCw,
} from 'lucide-react';

const STORAGE_KEY_PREFERENCES = 'morning_brief_user_preferences_v2';
const LEGACY_DEFAULT_EMAIL_CLEARED_KEY = 'morning_brief_default_email_cleared_v1';

const loadSavedPreferences = (): UserPreferences => {
  if (typeof window === 'undefined') return INITIAL_USER_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFERENCES);
    const alreadyClearedLegacy = localStorage.getItem(LEGACY_DEFAULT_EMAIL_CLEARED_KEY) === '1';
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const validFront = Array.isArray(parsed.frontPageOutlets) && parsed.frontPageOutlets.length > 0
          ? parsed.frontPageOutlets
          : (Array.isArray(parsed.selectedOutlets) && parsed.selectedOutlets.length > 0 ? parsed.selectedOutlets : DEFAULT_10_OUTLETS);
        const validOverlap = Array.isArray(parsed.overlappingOutlets) && parsed.overlappingOutlets.length > 0
          ? parsed.overlappingOutlets
          : (Array.isArray(parsed.selectedOutlets) && parsed.selectedOutlets.length > 0 ? parsed.selectedOutlets : DEFAULT_10_OUTLETS);
        const combined = Array.from(new Set([...validFront, ...validOverlap]));

        let targetEmail = typeof parsed.recipientEmail === 'string' && parsed.recipientEmail.includes('@')
          ? parsed.recipientEmail.trim()
          : '';

        let rawSavedEmails: string[] = Array.isArray(parsed.savedRecipientEmails)
          ? parsed.savedRecipientEmails.filter((e: unknown): e is string => typeof e === 'string' && e.includes('@'))
          : [];

        if (!alreadyClearedLegacy) {
          if (targetEmail === 'sr.JI78@gmail.com') {
            targetEmail = '';
          }
          rawSavedEmails = rawSavedEmails.filter((e) => e !== 'sr.JI78@gmail.com');
          try {
            localStorage.setItem(LEGACY_DEFAULT_EMAIL_CLEARED_KEY, '1');
          } catch {
            // Ignore storage restriction
          }
        }

        const savedEmails = targetEmail
          ? Array.from(new Set([targetEmail, ...rawSavedEmails]))
          : Array.from(new Set(rawSavedEmails));

        const rawEnabledSectors =
          parsed.sectorPreferences &&
          Array.isArray(parsed.sectorPreferences.enabledSectors) &&
          parsed.sectorPreferences.enabledSectors.length > 0
            ? parsed.sectorPreferences.enabledSectors
            : DEFAULT_SECTOR_PREFERENCES.enabledSectors;

        const upgradedEnabledSectors =
          rawEnabledSectors.length === 3 &&
          rawEnabledSectors.includes('construction') &&
          rawEnabledSectors.includes('realestate') &&
          rawEnabledSectors.includes('finance') &&
          !rawEnabledSectors.includes('urban')
            ? [...rawEnabledSectors, 'urban']
            : rawEnabledSectors;

        const savedSectorPrefs = parsed.sectorPreferences && typeof parsed.sectorPreferences === 'object'
          ? {
              ...DEFAULT_SECTOR_PREFERENCES,
              ...parsed.sectorPreferences,
              enabledSectors: upgradedEnabledSectors,
              favoriteKeywords: Array.isArray(parsed.sectorPreferences.favoriteKeywords)
                ? parsed.sectorPreferences.favoriteKeywords
                : [],
              defaultSector: parsed.sectorPreferences.defaultSector || 'all',
              onlyCrucialOrHigh: !!parsed.sectorPreferences.onlyCrucialOrHigh,
              localNewsAlertEnabled: !!parsed.sectorPreferences.localNewsAlertEnabled,
              selectedRegionSido:
                typeof parsed.sectorPreferences.selectedRegionSido === 'string'
                  ? parsed.sectorPreferences.selectedRegionSido
                  : 'all',
              selectedRegionSigungu:
                typeof parsed.sectorPreferences.selectedRegionSigungu === 'string'
                  ? parsed.sectorPreferences.selectedRegionSigungu
                  : 'all',
            }
          : DEFAULT_SECTOR_PREFERENCES;

        const storedDirectTheme = getStoredThemeMode();
        const resolvedPrefTheme: ThemeMode = isValidThemeMode(parsed.theme)
          ? parsed.theme
          : storedDirectTheme;

        const validCustomTopics = Array.isArray(parsed.customTopics)
          ? parsed.customTopics.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0 && t !== '전체')
          : AVAILABLE_TOPICS.filter((t) => t !== '전체');

        return {
          ...INITIAL_USER_PREFERENCES,
          ...parsed,
          preferredTone: parsed.toneExplicitlySelected && parsed.preferredTone ? parsed.preferredTone : 'insight',
          toneExplicitlySelected: Boolean(parsed.toneExplicitlySelected),
          theme: resolvedPrefTheme,
          customTopics: validCustomTopics,
          recipientEmail: targetEmail,
          savedRecipientEmails: savedEmails,
          deliveryTimezone:
            typeof parsed.deliveryTimezone === 'string' && parsed.deliveryTimezone
              ? parsed.deliveryTimezone
              : 'Asia/Seoul',
          selectedOutlets: combined,
          frontPageOutlets: validFront,
          overlappingOutlets: validOverlap,
          minOutletCoverageRatio: typeof parsed.minOutletCoverageRatio === 'number' && parsed.minOutletCoverageRatio > 0 ? parsed.minOutletCoverageRatio : 20,
          minSimilarityScore: typeof parsed.minSimilarityScore === 'number' && parsed.minSimilarityScore > 0 ? parsed.minSimilarityScore : 35,
          sectorPreferences: savedSectorPrefs,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load preferences from localStorage', err);
  }
  return {
    ...INITIAL_USER_PREFERENCES,
    theme: getStoredThemeMode(),
  };
};

export default function App() {
  const [preferences, setPreferences] = useState<UserPreferences>(loadSavedPreferences);
  const [briefing, setBriefing] = useState<DailyBriefing>(() => {
    const saved = loadSavedPreferences();
    const frontOutlets = saved.frontPageOutlets || DEFAULT_10_OUTLETS;
    const overlapOutlets = saved.overlappingOutlets || DEFAULT_10_OUTLETS;
    const combined = saved.selectedOutlets || DEFAULT_10_OUTLETS;
    const initialWithStories: DailyBriefing = {
      ...INITIAL_DAILY_BRIEFING,
      sourceType: 'mock',
      isFallback: true,
      sampleSnapshotDate: INITIAL_DAILY_BRIEFING.sampleSnapshotDate || SAMPLE_DATA_SNAPSHOT_DATE,
      selectedOutletIds: combined,
      frontPageOutletIds: frontOutlets,
      overlappingOutletIds: overlapOutlets,
      frontPageStories: INITIAL_DAILY_BRIEFING.frontPageStories.filter(
        (s) => !s.outletId || frontOutlets.includes(s.outletId)
      ),
    };
    return transformBriefingTone(initialWithStories, saved.preferredTone || 'insight');
  });
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport>({
    ...MOCK_WEEKLY_REPORT,
    sourceType: 'mock',
    isFallback: true,
  });
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);

  // Filters
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('전체');

  // Sidebar Open/Close State (세로 접이식 메뉴)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Section Collapse State (1.첫페이지, 2.공통이슈, 3.단독보도, 4.건설부동산금융)
  const [collapsedSections, setCollapsedSections] = useState({
    frontPage: false,
    overlapping: false,
    exclusive: false,
    realEstateFinance: false,
  });

  // Scroll to Top visibility state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Modals
  const [isPressModalOpen, setIsPressModalOpen] = useState(false);
  const [pressModalInitialSection, setPressModalInitialSection] = useState<'frontPage' | 'overlapping'>('frontPage');
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [shareStory, setShareStory] = useState<NewsStory | null>(null);
  const [articleModalStory, setArticleModalStory] = useState<NewsStory | null>(null);
  const [readArticleKeys, setReadArticleKeys] = useState<Set<string>>(() => loadReadArticleKeys());

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [pushBannerVisible, setPushBannerVisible] = useState(true);
  const [pushToast, setPushToast] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(getStoredThemeMode())
  );
  const [sunLocationVersion, setSunLocationVersion] = useState(0);

  // Scroll to top listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply theme to <html>, persist in localStorage, subscribe to OS changes & sunrise/sunset transitions
  useEffect(() => {
    let lastApplied = applyThemeToDocument(themeMode);
    setResolvedTheme(lastApplied);
    persistThemeMode(themeMode);

    if (typeof window === 'undefined') return;

    if (themeMode === 'sun') {
      let transitionTimer: ReturnType<typeof setTimeout> | null = null;

      const syncSunTheme = (notifyOnFlip: boolean) => {
        const schedule = getSunSchedule();
        const nextResolved = applyThemeToDocument('sun');
        if (nextResolved !== lastApplied) {
          lastApplied = nextResolved;
          setResolvedTheme(nextResolved);
          if (notifyOnFlip) {
            const eventLabel = nextResolved === 'dark' ? `일몰(${schedule.sunsetText})` : `일출(${schedule.sunriseText})`;
            const targetLabel = nextResolved === 'dark' ? '다크 모드' : '라이트 모드';
            setStatusNotification(`${eventLabel} 시간에 맞춰 ${targetLabel}로 자동 전환되었습니다.`);
            setTimeout(() => setStatusNotification(null), 3600);
          }
        }
        return schedule;
      };

      const scheduleNextBoundary = () => {
        if (transitionTimer) clearTimeout(transitionTimer);
        const schedule = getSunSchedule();
        const delayMs = Math.max(
          1000,
          Math.min(24 * 60 * 60 * 1000, schedule.nextTransitionTime.getTime() - Date.now() + 1000)
        );
        transitionTimer = setTimeout(() => {
          syncSunTheme(true);
          scheduleNextBoundary();
        }, delayMs);
      };

      scheduleNextBoundary();

      // Safety heartbeat every 60s + visibility sync for sleeping tabs/devices
      const intervalId = window.setInterval(() => {
        syncSunTheme(true);
      }, 60 * 1000);

      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          syncSunTheme(false);
          scheduleNextBoundary();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        if (transitionTimer) clearTimeout(transitionTimer);
        window.clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }

    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (themeMode === 'system') {
        const nextResolved = applyThemeToDocument('system');
        lastApplied = nextResolved;
        setResolvedTheme(nextResolved);
      }
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
      return () => mediaQuery.removeEventListener('change', handleMediaChange);
    }
    mediaQuery.addListener(handleMediaChange);
    return () => mediaQuery.removeListener(handleMediaChange);
  }, [themeMode, sunLocationVersion]);

  // Save preferences to localStorage automatically whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(preferences));
    } catch (err) {
      console.warn('Failed to save preferences to localStorage', err);
    }
  }, [preferences]);

  // Persist read article status to localStorage automatically
  useEffect(() => {
    saveReadArticleKeys(readArticleKeys);
  }, [readArticleKeys]);

  const handleMarkArticleRead = (article: ReadableArticleRef) => {
    setReadArticleKeys((prev) => addReadArticleKeys(prev, article));
  };

  const handleToggleArticleRead = (story: NewsStory) => {
    setReadArticleKeys((prev) => {
      if (isArticleRead(prev, story)) {
        return removeReadArticleKeys(prev, story);
      }
      return addReadArticleKeys(prev, story);
    });
  };

  const handleOpenArticleModal = (story: NewsStory) => {
    handleMarkArticleRead(story);
    setArticleModalStory(story);
  };

  // Track last live sync time and seen sector headlines for local region push alerts
  const lastLiveSyncRef = React.useRef<number>(0);
  const sectorPrefsRef = React.useRef<SectorPreferences>(
    preferences.sectorPreferences || DEFAULT_SECTOR_PREFERENCES
  );
  useEffect(() => {
    sectorPrefsRef.current = preferences.sectorPreferences || DEFAULT_SECTOR_PREFERENCES;
  }, [preferences.sectorPreferences]);

  const seenSectorKeysRef = React.useRef<Set<string>>(
    new Set((INITIAL_DAILY_BRIEFING.sectorHeadlines || []).map((h) => h.title.trim()))
  );
  const hasInitializedLiveSectorBaselineRef = React.useRef<boolean>(false);

  const dispatchLocalRegionPush = React.useCallback(
    (headline: SectorHeadlineItem, regionLabel: string, extraCount = 0) => {
      const suffix = extraCount > 0 ? ` 외 ${extraCount}건` : '';
      const pushText = `[내 지역 뉴스 알림 · ${regionLabel}] [${headline.outletName}] ${headline.title}${suffix}`;
      setPushToast(pushText);

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`모닝브리프 · ${regionLabel} 새 주요 기사`, {
            body: `[${headline.outletName}] ${headline.title}${suffix}`,
            icon: '/favicon.ico',
          });
        } catch {
          // Ignore browser Notification construction errors
        }
      }

      setTimeout(() => {
        setPushToast((prev) => (prev === pushText ? null : prev));
      }, 6500);
    },
    []
  );

  // Core live sync helper (fetches actual center homepage stories in real time)
  const syncLiveNews = React.useCallback(
    async (
      forceRefresh = false,
      outletIdsOverride?: string[],
      toneOverride?: BriefingTone,
      silent = false
    ) => {
      if (!silent) setIsLoading(true);
      try {
        const activeOutlets =
          outletIdsOverride && outletIdsOverride.length > 0
            ? outletIdsOverride
            : preferences.selectedOutlets && preferences.selectedOutlets.length > 0
            ? preferences.selectedOutlets
            : DEFAULT_10_OUTLETS;

        const targetTone = toneOverride || preferences.preferredTone;
        const result = await fetchSummary(
          activeOutlets,
          targetTone,
          preferences.subscribedTopics,
          forceRefresh
        );

        if (result && result.data) {
          const todayFormatted = getCurrentKoreanDateString();
          const liveFront = result.data.frontPageStories || [];
          const isFallbackResponse =
            Boolean(result.data.isFallback) ||
            result.data.sourceType === 'mock' ||
            result.source === 'client_sample_fallback' ||
            result.source === 'collection-empty' ||
            result.source === 'fallback';
          const resolvedSampleDate = result.data.sampleSnapshotDate || SAMPLE_DATA_SNAPSHOT_DATE;
          const updatedBriefing: DailyBriefing = {
            ...result.data,
            briefingDate: isFallbackResponse
              ? `샘플 시점 (${resolvedSampleDate})`
              : (result.data.briefingDate || todayFormatted),
            frontPageStories: liveFront,
            isFallback: isFallbackResponse,
            sourceType: isFallbackResponse ? 'mock' : (result.data.sourceType || 'live'),
            ...(isFallbackResponse ? { sampleSnapshotDate: resolvedSampleDate } : {}),
          };

          // Detect newly arrived major regional headlines when '내 지역 뉴스 알림' is enabled
          const incomingSector = updatedBriefing.sectorHeadlines || [];
          const activeSectorPrefs = sectorPrefsRef.current;
          const alertSido = activeSectorPrefs.selectedRegionSido || 'all';
          const alertSigungu = activeSectorPrefs.selectedRegionSigungu || 'all';

          if (!isFallbackResponse && incomingSector.length > 0) {
            if (!hasInitializedLiveSectorBaselineRef.current) {
              incomingSector.forEach((h) => {
                if (h.id) seenSectorKeysRef.current.add(h.id);
                if (h.title) seenSectorKeysRef.current.add(h.title.trim());
              });
              hasInitializedLiveSectorBaselineRef.current = true;
            } else {
              const newlyAdded = incomingSector.filter((h) => {
                if (h.isFallback || h.sourceType === 'mock') return false;
                const seenById = h.id && seenSectorKeysRef.current.has(h.id);
                const seenByTitle = h.title && seenSectorKeysRef.current.has(h.title.trim());
                return !seenById && !seenByTitle;
              });

              incomingSector.forEach((h) => {
                if (h.id) seenSectorKeysRef.current.add(h.id);
                if (h.title) seenSectorKeysRef.current.add(h.title.trim());
              });

              if (activeSectorPrefs.localNewsAlertEnabled && alertSido !== 'all' && newlyAdded.length > 0) {
                const regionMatches = newlyAdded.filter((h) =>
                  matchesRegionFilter(h, alertSido, alertSigungu)
                );
                const majorMatches = regionMatches.filter(
                  (h) => h.impactRating === 'Crucial' || h.impactRating === 'High'
                );
                const candidates =
                  majorMatches.length > 0
                    ? majorMatches
                    : activeSectorPrefs.onlyCrucialOrHigh
                    ? []
                    : regionMatches;

                if (candidates.length > 0) {
                  const regionMeta = getRegionByCode(alertSido);
                  const regionLabel = regionMeta
                    ? alertSigungu !== 'all'
                      ? `${regionMeta.shortName} · ${alertSigungu}`
                      : regionMeta.name
                    : alertSido;
                  dispatchLocalRegionPush(candidates[0], regionLabel, candidates.length - 1);
                }
              }
            }
          }

          setBriefing(updatedBriefing);
          lastLiveSyncRef.current = Date.now();
          if (!silent && result.source !== 'client_cache') {
            if (isFallbackResponse) {
              triggerNotification('실시간 기사 수집에 실패하여 샘플 데이터를 표시 중입니다.');
            } else {
              triggerNotification('각 언론사 홈페이지 첫화면 중앙 1면 기사가 실시간 갱신되었습니다.');
            }
          }
        }
      } catch (err) {
        console.warn('Live sync failed:', err);
        if (!silent) {
          triggerNotification('실시간 갱신 중 일시적인 오류가 발생했습니다.');
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [
      preferences.selectedOutlets,
      preferences.preferredTone,
      preferences.subscribedTopics,
      dispatchLocalRegionPush,
    ]
  );

  // Immediate real-time homepage fetch on mount + Continuous 60s live auto-refresh
  useEffect(() => {
    // Immediately pull real-time center homepage stories on load
    syncLiveNews(true, undefined, undefined, true);

    // Continuously poll every 60 seconds so dashboard stays synchronized in real time (not pinned to notification time)
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncLiveNews(true, undefined, undefined, true);
      }
    }, 60 * 1000);

    // Also refresh when user returns to browser tab after > 30 seconds
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastLiveSyncRef.current > 30 * 1000) {
        syncLiveNews(true, undefined, undefined, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncLiveNews]);

  const triggerNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => {
      setStatusNotification(null);
    }, 3200);
  };

  const handleChangeTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    persistThemeMode(mode);
    const resolved = applyThemeToDocument(mode);
    setResolvedTheme(resolved);
    setPreferences((prev) => ({ ...prev, theme: mode }));
    if (mode === 'sun') {
      const s = getSunSchedule();
      triggerNotification(
        `일출(${s.sunriseText})·일몰(${s.sunsetText}) 자동 테마 적용 · 현재 ${
          resolved === 'dark' ? '다크' : '라이트'
        } 모드 (다음 전환 ${formatTimeHHMM(s.nextTransitionTime)})`
      );
    } else {
      triggerNotification(`화면 테마가 '${getThemeLabel(mode)}'으로 변경되었습니다.`);
    }
  };

  const handleOpenPressModal = (section: 'frontPage' | 'overlapping' = 'frontPage') => {
    setPressModalInitialSection(section);
    setIsPressModalOpen(true);
    setIsSidebarOpen(false);
  };

  // Section Toggle Helpers
  const toggleSection = (section: 'frontPage' | 'overlapping' | 'exclusive' | 'realEstateFinance') => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleAllSections = () => {
    const allCollapsed =
      collapsedSections.frontPage &&
      collapsedSections.overlapping &&
      collapsedSections.exclusive &&
      collapsedSections.realEstateFinance;
    setCollapsedSections({
      frontPage: !allCollapsed,
      overlapping: !allCollapsed,
      exclusive: !allCollapsed,
      realEstateFinance: !allCollapsed,
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerEl = document.querySelector('header');
      const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 136;
      const targetTop = Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerHeight - 12);
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Fetch & Refresh (manual force refresh)
  const handleRefreshLive = async () => {
    triggerNotification('각 언론사 공식 홈페이지 첫화면 중앙 1면 기사를 실시간 수집 중...');
    await syncLiveNews(true, undefined, undefined, false);
  };

  // 2. Change Tone
  const handleSelectTone = async (newTone: BriefingTone) => {
    if (newTone === briefing.tone) return;
    setIsLoading(true);
    setPreferences((prev) => ({ ...prev, preferredTone: newTone, toneExplicitlySelected: true }));
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
      case 'formal':
        return '격식 브리핑체';
      case 'insight':
      default:
        return '인사이트 (요약3+시사점1 · 개조식)';
    }
  };

  // 3. Update Press Outlets (1면 핵심 & 공통이슈 개별 지정)
  const handleApplyOutlets = (frontPageOutlets: string[], overlappingOutlets: string[]) => {
    const validFront = frontPageOutlets && frontPageOutlets.length > 0 ? frontPageOutlets : DEFAULT_10_OUTLETS;
    const validOverlap = overlappingOutlets && overlappingOutlets.length > 0 ? overlappingOutlets : DEFAULT_10_OUTLETS;
    const combined = Array.from(new Set([...validFront, ...validOverlap]));

    const updated = {
      ...preferences,
      selectedOutlets: combined,
      frontPageOutlets: validFront,
      overlappingOutlets: validOverlap,
    };

    setPreferences(updated);
    try {
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save outlet preferences to localStorage', e);
    }

    setBriefing((prev) => ({
      ...prev,
      selectedOutletIds: combined,
      frontPageOutletIds: validFront,
      overlappingOutletIds: validOverlap,
      frontPageStories: prev.frontPageStories.filter((s) => !s.outletId || validFront.includes(s.outletId)),
    }));

    triggerNotification(
      `수집 언론사(1면: ${validFront.length}개사, 공통: ${validOverlap.length}개사) 설정이 저장되었습니다. 실시간 기사를 동기화합니다.`
    );
    syncLiveNews(true, combined, undefined, false);
  };

  // 3-1. 공통 이슈 기준 비율(언론사 보도율 & 유사도) 실시간 조정 및 브라우저 영구 저장
  const handleChangeOverlapThresholds = (coverageRatio: number, similarityScore: number, notify = false) => {
    const updated: UserPreferences = {
      ...preferences,
      minOutletCoverageRatio: coverageRatio,
      minSimilarityScore: similarityScore,
    };
    setPreferences(updated);
    try {
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save threshold preferences', e);
    }
    if (notify) {
      triggerNotification(
        `공통 이슈 기준 비율(언론사 ${coverageRatio}% 이상, 유사도 ${similarityScore}% 이상)이 브라우저에 저장되었습니다.`
      );
    }
  };

  // 3-2. 수신 이메일 주소 설정 및 영구 저장 핸들러
  const handleSaveRecipientEmail = (email: string, alsoAddToList = true) => {
    const clean = email.trim();
    if (!clean || !clean.includes('@')) {
      triggerNotification('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    const currentList = preferences.savedRecipientEmails && preferences.savedRecipientEmails.length > 0
      ? preferences.savedRecipientEmails
      : (preferences.recipientEmail ? [preferences.recipientEmail] : []);

    const updatedList = alsoAddToList
      ? Array.from(new Set([clean, ...currentList]))
      : currentList;

    const updated: UserPreferences = {
      ...preferences,
      recipientEmail: clean,
      savedRecipientEmails: updatedList,
    };
    setPreferences(updated);
    try {
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save email to localStorage', e);
    }
    triggerNotification(`수신 이메일 '${clean}'(이)가 브라우저에 저장되었습니다. (다시 열어도 유지)`);
  };

  const handleDeleteSavedEmail = (emailToDelete: string) => {
    const currentList = preferences.savedRecipientEmails || (preferences.recipientEmail ? [preferences.recipientEmail] : []);
    const filtered = currentList.filter((e) => e !== emailToDelete);
    const nextRecipient =
      preferences.recipientEmail === emailToDelete ? (filtered[0] || '') : preferences.recipientEmail;
    const updated: UserPreferences = {
      ...preferences,
      recipientEmail: nextRecipient,
      savedRecipientEmails: filtered,
    };
    setPreferences(updated);
    try {
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete email from localStorage', e);
    }
    triggerNotification(`수신 이메일 '${emailToDelete}'이(가) 목록에서 삭제되었습니다.`);
  };

  // 3-3. 건설·부동산·도시개발·금융 관심분야 설정 영구 저장 핸들러
  const handleSaveSectorPreferences = (
    newSectorPrefs: SectorPreferences,
    options?: { silent?: boolean; notifyMessage?: string }
  ) => {
    setPreferences((prev) => {
      const updated: UserPreferences = {
        ...prev,
        sectorPreferences: newSectorPrefs,
      };
      try {
        localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
        localStorage.setItem('morning_brief_sector_preferences_v1', JSON.stringify(newSectorPrefs));
      } catch (e) {
        console.warn('Failed to save sector preferences to localStorage', e);
      }
      return updated;
    });
    if (!options?.silent) {
      triggerNotification(
        options?.notifyMessage ||
          '건설·부동산·도시개발·금융 관심분야 맞춤 설정이 브라우저에 저장되었습니다.'
      );
    }
  };

  const handleToggleLocalNewsAlert = (
    enabled: boolean,
    sidoOverride?: string,
    sigunguOverride?: string
  ) => {
    if (
      enabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }
    const currentSector = preferences.sectorPreferences || DEFAULT_SECTOR_PREFERENCES;
    const nextSido = sidoOverride ?? currentSector.selectedRegionSido ?? 'all';
    const nextSigungu = sigunguOverride ?? currentSector.selectedRegionSigungu ?? 'all';
    const regionMeta = getRegionByCode(nextSido);
    const regionLabel = regionMeta
      ? nextSigungu !== 'all'
        ? `${regionMeta.shortName} · ${nextSigungu}`
        : regionMeta.name
      : '';

    handleSaveSectorPreferences(
      {
        ...currentSector,
        localNewsAlertEnabled: enabled,
        selectedRegionSido: nextSido,
        selectedRegionSigungu: nextSigungu,
      },
      {
        notifyMessage: enabled
          ? regionLabel
            ? `'${regionLabel}' 내 지역 뉴스 실시간 푸시 알림이 활성화되었습니다.`
            : "'내 지역 뉴스 알림'이 활성화되었습니다. 알림을 받을 지자체를 선택해주세요."
          : "'내 지역 뉴스 알림'이 비활성화되었습니다.",
      }
    );
  };

  const handleChangeAlertRegion = (sidoCode: string, sigungu: string) => {
    const currentSector = preferences.sectorPreferences || DEFAULT_SECTOR_PREFERENCES;
    handleSaveSectorPreferences(
      {
        ...currentSector,
        selectedRegionSido: sidoCode,
        selectedRegionSigungu: sigungu,
      },
      { silent: true }
    );
  };

  const handleTestLocalNewsAlert = (sidoCode: string, sigungu: string) => {
    if (!sidoCode || sidoCode === 'all') {
      triggerNotification('먼저 알림을 받을 지자체를 선택해주세요.');
      return;
    }
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }
    const regionMeta = getRegionByCode(sidoCode);
    const regionLabel = regionMeta
      ? sigungu && sigungu !== 'all'
        ? `${regionMeta.shortName} · ${sigungu}`
        : regionMeta.name
      : sidoCode;
    const matching = (briefing.sectorHeadlines || []).find((h) =>
      matchesRegionFilter(h, sidoCode, sigungu)
    );
    const sampleItem: SectorHeadlineItem = matching || {
      id: `local-alert-test-${Date.now()}`,
      sector: 'urban',
      sectorLabel: '도시개발',
      outletId: 'hankyung',
      outletName: '한국경제',
      title: `${regionLabel} 주요 도시개발·부동산 핵심 브리핑이 업데이트되었습니다.`,
      summary: `${regionLabel} 내 지역 뉴스 실시간 푸시 알림 테스트 메시지입니다.`,
      publishedAt: '방금 전',
      originalUrl: '',
      tags: [regionLabel, '내지역뉴스알림'],
      impactRating: 'High',
    };
    dispatchLocalRegionPush(sampleItem, regionLabel, 0);
  };

  const handleSaveTopicPersonalization = (
    nextTopics: string[],
    nextSubscribed: string[],
    silent = false
  ) => {
    setPreferences((prev) => {
      const updated: UserPreferences = {
        ...prev,
        customTopics: nextTopics,
        subscribedTopics: nextSubscribed,
      };
      try {
        localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save topic personalization to localStorage', e);
      }
      return updated;
    });
    if (!silent) {
      triggerNotification(
        `관심 주제 필터(${nextTopics.length}개 · 구독 ${nextSubscribed.length}개)가 로컬 스토리지에 저장되었습니다.`
      );
    }
  };

  const handleResetTopicPersonalization = () => {
    const defaultTopics = AVAILABLE_TOPICS.filter((t) => t !== '전체');
    const defaultSubscribed = INITIAL_USER_PREFERENCES.subscribedTopics;
    const updated: UserPreferences = {
      ...preferences,
      customTopics: defaultTopics,
      subscribedTopics: defaultSubscribed,
    };
    setPreferences(updated);
    setSelectedTopic('전체');
    try {
      localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to reset topic personalization in localStorage', e);
    }
    triggerNotification('관심 주제 필터가 기본값으로 복원되었습니다.');
  };

  // 5. Generate Email Newsletter Preview (Preview-only unless mail provider is configured)
  const handleSendEmail = React.useCallback(async (email: string): Promise<string> => {
    const res = await sendEmailBriefing(email, briefing, preferences.deliveryTime);
    if (res.log) {
      setEmailLogs((prev) => [res.log, ...prev]);
    }
    triggerNotification(`${email} 대상 뉴스레터 미리보기가 생성되었습니다. (실제 발송 미연동)`);
    return res.message;
  }, [briefing, preferences.deliveryTime]);

  // 5-1. Update Email Scheduler Settings (time, timezone, per-day toggles, ON/OFF)
  const handleUpdateSchedule = React.useCallback(
    (updatedSchedule: EmailScheduleValues, notifyMessage?: string) => {
      setPreferences((prev) => {
        const next: UserPreferences = {
          ...prev,
          autoEmailEnabled: updatedSchedule.autoEmailEnabled,
          deliveryTime: updatedSchedule.deliveryTime,
          deliveryTimezone: updatedSchedule.deliveryTimezone,
          deliveryDays: updatedSchedule.deliveryDays,
        };
        try {
          localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(next));
        } catch (err) {
          console.warn('Failed to save email schedule to localStorage', err);
        }
        saveEmailSchedule({
          recipientEmail: next.recipientEmail,
          deliveryTime: next.deliveryTime,
          deliveryTimezone: next.deliveryTimezone || 'Asia/Seoul',
          deliveryDays: next.deliveryDays,
          autoEmailEnabled: next.autoEmailEnabled,
        });
        return next;
      });
      if (notifyMessage) {
        triggerNotification(notifyMessage);
      }
    },
    []
  );

  // 6. Test Web Push Notification
  const handleTestPush = () => {
    const topHeadline =
      briefing.overlappingStories[0]?.title ||
      briefing.frontPageStories[0]?.title ||
      '주요 언론사 실시간 브리핑이 준비되었습니다.';
    const pushText = `[모닝브리프] ${topHeadline}`;
    setPushToast(pushText);

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('모닝브리프 알림', {
          body: pushText,
          icon: '/favicon.ico',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('모닝브리프 알림', {
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

  const matchesSingleTopic = (
    targetTopic: string,
    title: string,
    summaryArr: string[],
    keywords: string[],
    articleTopic: string
  ): boolean => {
    const TOPIC_SYNONYMS: Record<string, string[]> = {
      '반도체·AI': ['반도체', 'ai', '인공지능', '엔비디아', 'hbm', '하이닉스', '삼성전자', '칩'],
      '금융·거시경제': ['금융', '거시', '금리', '기준금리', '한국은행', '은행', '대출', '가계부채', '환율', '경제'],
      '증시·투자': ['증시', '투자', '코스피', '코스닥', '주식', '증권', 'etf', '외국인', '밸류업'],
      '정치·정책': ['정치', '정책', '국회', '정부', '대통령', '여야', '법안', '특검', '총리'],
      '부동산·건설': ['부동산', '건설', '도시개발', '주택', '아파트', '분양', '청약', '재건축', '재개발', '신도시', 'gtx', '시공'],
      '글로벌·외교': ['글로벌', '외교', '미국', '중국', 'apec', '아세안', '순방', '정상', '수출', '통상'],
      '사회·노동': ['사회', '노동', '노사', '근로', '이주노동', '날씨', '교육', '의료', '복지'],
      '에너지·원전': ['에너지', '원전', '원자력', '전력', '신재생', '태양광', '가스', '석유', '배터리'],
      '도시개발·정비': ['도시개발', '정비', '재건축', '재개발', '신도시', '모아타운', '역세권', '복합개발', '선도지구'],
      '바이오·헬스케어': ['바이오', '헬스케어', '제약', '신약', '의료', '임상', '셀트리온', '삼성바이오'],
      '로봇·모빌리티': ['로봇', '모빌리티', '자율주행', '전기차', '현대차', '기아', 'uam', '휴머노이드'],
      '방산·우주': ['방산', 'k방산', '우주', '항공', '무기', '수주', '한화에어로', 'lig넥스원', '현대로템'],
      '이차전지·소재': ['이차전지', '배터리', '양극재', '음극재', '리튬', '소재', '에코프로', 'lg에너지솔루션'],
      '가상자산·핀테크': ['가상자산', '비트코인', '코인', '암호화폐', '블록체인', '핀테크', '스테이블코인', '토큰증권'],
      '유통·소비': ['유통', '소비', '백화점', '이커머스', '쿠팡', '내수', '소매', '면세점'],
      '환율·수출': ['환율', '원달러', '수출', '무역', '관세', '경상수지', '달러'],
    };

    const rawTrimmed = targetTopic.trim().toLowerCase();
    if (!rawTrimmed) return true;

    const splitTokens = rawTrimmed
      .split(/[·,/|\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    const tokens = TOPIC_SYNONYMS[targetTopic] || (splitTokens.length > 0 ? splitTokens : [rawTrimmed]);

    const haystack = [
      articleTopic,
      title,
      ...(keywords || []),
      ...summaryArr,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return tokens.some((tok) => haystack.includes(tok));
  };

  // 8. Filter Logic: Separate rules for 1면 핵심 vs 공통이슈
  const matchesKeywordAndTopic = (title: string, summary: string[] | string, keywords: string[] = [], topic = '') => {
    const summaryArr = Array.isArray(summary) ? summary : [summary];

    // Keyword filter
    if (selectedKeyword) {
      const cleanKw = selectedKeyword.replace('#', '');
      const matchInKeywords = keywords?.some((k) => k && k.includes(cleanKw));
      const matchInTitle = title && title.includes(cleanKw);
      const matchInSummary = summaryArr.some((l) => l && l.includes(cleanKw));
      if (!matchInKeywords && !matchInTitle && !matchInSummary) return false;
    }

    // Topic filter
    if (selectedTopic === SUBSCRIBED_ONLY_TOPIC) {
      if (preferences.subscribedTopics.length === 0) return true;
      return preferences.subscribedTopics.some((sub) =>
        matchesSingleTopic(sub, title, summaryArr, keywords, topic)
      );
    }

    if (selectedTopic !== '전체') {
      return matchesSingleTopic(selectedTopic, title, summaryArr, keywords, topic);
    }

    return true;
  };

  // 1면 핵심 기사 필터링: preferences.frontPageOutlets 기준
  const activeFrontOutlets = preferences.frontPageOutlets && preferences.frontPageOutlets.length > 0
    ? preferences.frontPageOutlets
    : (preferences.selectedOutlets && preferences.selectedOutlets.length > 0 ? preferences.selectedOutlets : DEFAULT_10_OUTLETS);

  const filteredFrontPage = briefing.frontPageStories.filter((s) => {
    if (s.outletId && !activeFrontOutlets.includes(s.outletId)) {
      return false;
    }
    return matchesKeywordAndTopic(s.title, s.leadSummary, s.keywords, s.topic);
  });

  // 공통 이슈 기사 필터링: 수집 언론사 중 minCoverageRatio% 이상 언론사가 유사도 minSimilarityScore% 이상으로 보도한 기사
  const activeOverlapOutlets = preferences.overlappingOutlets && preferences.overlappingOutlets.length > 0
    ? preferences.overlappingOutlets
    : (preferences.selectedOutlets && preferences.selectedOutlets.length > 0 ? preferences.selectedOutlets : DEFAULT_10_OUTLETS);

  const minCoverageRatio = preferences.minOutletCoverageRatio ?? 20;
  const minSimilarityScore = preferences.minSimilarityScore ?? 35;

  const filteredOverlapping = briefing.overlappingStories.filter((s) => {
    // 1. 기사 유사도 기준 검증 (동적 설정값 적용)
    const similarity = s.similarityScore ?? 0;
    if (similarity < minSimilarityScore) return false;

    // 2. 선택된 수집 언론사 중 설정 비율(%) 이상 (최소 3개사) 언론사 보도 검증
    if (s.coveredOutlets && s.coveredOutlets.length > 0) {
      const matchingCount = s.coveredOutlets.filter((outletName) => {
        return activeOverlapOutlets.some((id) => {
          const outletMeta = PRESS_OUTLETS.find((p) => p.id === id);
          return outletMeta && (outletName.includes(outletMeta.name) || outletMeta.name.includes(outletName));
        });
      }).length;

      // 선택된 언론사 수 대비 최소 필요 언론사 수 계산 (최소 3개사 기준)
      const minRequired = Math.max(3, Math.ceil(activeOverlapOutlets.length * (minCoverageRatio / 100)));
      if (matchingCount < minRequired) {
        return false;
      }
    } else {
      return false;
    }

    return matchesKeywordAndTopic(s.title, s.leadSummary, s.keywords, s.topic);
  });

  // 단독·특별 기사 필터링
  const filteredExclusive = briefing.exclusiveStories.filter((s) => {
    return matchesKeywordAndTopic(s.title, s.leadSummary, s.keywords, s.topic);
  });

  // 4번째 기능: 건설·부동산·도시개발·금융 헤드라인 필터링
  const rawSectorHeadlines = briefing.sectorHeadlines ?? [];
  const filteredSectorHeadlines = rawSectorHeadlines.filter((h) => {
    const combinedSummary = [h.summary, ...(h.leadSummary || [])].filter(Boolean);
    return matchesKeywordAndTopic(h.title, combinedSummary, h.tags, h.sectorLabel);
  });

  const isBriefingFallback = Boolean(briefing.isFallback) || briefing.sourceType === 'mock';
  const isSectorFallback =
    isBriefingFallback ||
    briefing.sectorSourceType === 'mock' ||
    rawSectorHeadlines.some((h) => Boolean(h.isFallback) || h.sourceType === 'mock');
  const sampleSnapshotDate = briefing.sampleSnapshotDate || SAMPLE_DATA_SNAPSHOT_DATE;
  const todayYmd = getCurrentYMD();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Toast Alert */}
      {statusNotification && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
        onOpenPressModal={() => handleOpenPressModal('frontPage')}
        onOpenToneModal={() => setIsToneModalOpen(true)}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenWeeklyModal={() => setIsWeeklyModalOpen(true)}
        onOpenThemeModal={() => {
          setIsThemeModalOpen(true);
          setIsSidebarOpen(false);
        }}
        onRefreshLive={handleRefreshLive}
        isLoading={isLoading}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        selectedTopic={selectedTopic}
        onSelectTopic={(t) => setSelectedTopic(t)}
        availableTopics={preferences.customTopics}
        subscribedTopics={preferences.subscribedTopics}
        frontPageCount={preferences.frontPageOutlets?.length || preferences.selectedOutlets?.length || 10}
        overlappingCount={preferences.overlappingOutlets?.length || preferences.selectedOutlets?.length || 10}
        onScrollToSection={scrollToSection}
        themeMode={themeMode}
        resolvedTheme={resolvedTheme}
      />

      {/* Main Content Layout with Sidebar offset on Desktop */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:pl-72' : 'lg:pl-16'}`}>
        {/* Header */}
        <Header
          preferences={preferences}
          briefingDate={briefing.briefingDate}
          briefingTime={briefing.briefingTime}
          sourceType={briefing.sourceType}
          isFallback={isBriefingFallback}
          sampleSnapshotDate={sampleSnapshotDate}
          onResetHome={() => {
            setSelectedKeyword(null);
            setSelectedTopic('전체');
            setIsSidebarOpen(false);
            setCollapsedSections({
              frontPage: false,
              overlapping: false,
              exclusive: false,
              realEstateFinance: false,
            });
            setArticleModalStory(null);
            setShareStory(null);
            window.scrollTo({ top: 0, behavior: 'auto' });
            window.location.reload();
          }}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onOpenDashboard={() => setIsEmailModalOpen(true)}
          onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
          isMobilePreview={isMobilePreview}
          onRefreshLive={handleRefreshLive}
          isLoading={isLoading}
          subNav={
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
              <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden lg:inline mr-1 shrink-0">
                  섹션 바로가기:
                </span>
                <button
                  type="button"
                  onClick={() => scrollToSection('section-frontpage')}
                  className="px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs gap-1 sm:gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold transition flex items-center active:scale-95 cursor-pointer shrink-0"
                >
                  <Newspaper className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">1. 1면 핵심</span>
                  <span className="sm:hidden">1. 1면</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-bold">
                    {filteredFrontPage.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('section-overlapping')}
                  className="px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs gap-1 sm:gap-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold transition flex items-center active:scale-95 cursor-pointer shrink-0"
                >
                  <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="hidden sm:inline">2. 공통 이슈</span>
                  <span className="sm:hidden">2. 공통</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-600 text-white font-bold">
                    {filteredOverlapping.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('section-exclusive')}
                  className="px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs gap-1 sm:gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold transition flex items-center active:scale-95 cursor-pointer shrink-0"
                >
                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="hidden sm:inline">3. 단독·특별</span>
                  <span className="sm:hidden">3. 단독</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                    {filteredExclusive.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('section-realestate-finance')}
                  className="px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs gap-1 sm:gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 dark:hover:bg-amber-900/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold transition flex items-center active:scale-95 cursor-pointer shrink-0"
                >
                  <Building className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">4. 건설·부동산·도시개발·금융</span>
                  <span className="sm:hidden">4. 건설·도시·금융</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-600 text-white font-bold">
                    {filteredSectorHeadlines.length}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={toggleAllSections}
                  className="px-2 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                  title="모든 섹션 일괄 접기 / 펼치기"
                >
                  {collapsedSections.frontPage &&
                  collapsedSections.overlapping &&
                  collapsedSections.exclusive &&
                  collapsedSections.realEstateFinance ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="hidden sm:inline">전체 펼치기</span>
                      <span className="sm:hidden">펼치기</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="hidden sm:inline">전체 접기</span>
                      <span className="sm:hidden">접기</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={scrollToTop}
                  className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-bold transition shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                  title="페이지 맨 위로 스크롤"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">맨위로</span>
                </button>
              </div>
            </div>
          }
        />

        {/* Outer Container (with optional Mobile Frame simulator) */}
        <div className={`mx-auto transition-all duration-300 ${isMobilePreview ? 'max-w-md my-6 p-4 bg-white dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-700 rounded-[40px] shadow-2xl' : 'max-w-7xl px-4 py-4 sm:py-6'}`}>
          {isMobilePreview && (
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                모바일 앱 실시간 뷰 모드
              </span>
              <button
                onClick={() => setIsMobilePreview(false)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                PC 전체화면 보기
              </button>
            </div>
          )}

          <main className="space-y-4 sm:space-y-5">
            {isBriefingFallback && (
              <FallbackNoticeBanner
                sampleSnapshotDate={sampleSnapshotDate}
                onRetry={handleRefreshLive}
                isLoading={isLoading}
              />
            )}

            {/* 1. Keyword Tags + Weekly Report Shortcut (태그 필터링 + 24h 트렌드 + 주간 종합 리포트) */}
            <KeywordTags
              keywords={briefing.topKeywords}
              selectedKeyword={selectedKeyword}
              onSelectKeyword={(kw) => setSelectedKeyword(kw)}
              briefing={briefing}
              onOpenWeeklyReport={() => setIsWeeklyModalOpen(true)}
              isMobileView={isMobilePreview}
            />

            {/* 2. Topic Subscription Filtering (Personalized) */}
            <TopicFilter
              selectedTopic={selectedTopic}
              onSelectTopic={(t) => setSelectedTopic(t)}
              topics={preferences.customTopics}
              subscribedTopics={preferences.subscribedTopics}
              onSavePersonalization={handleSaveTopicPersonalization}
              onResetPersonalization={handleResetTopicPersonalization}
            />

            {/* 3. Section 1: 각 언론사 신문 첫페이지 (1면) 핵심 내용 먼저 제시 */}
            <FrontPageSection
              stories={filteredFrontPage}
              onOpenShareModal={(s) => setShareStory(s)}
              onOpenArticleModal={handleOpenArticleModal}
              onReact={handleReaction}
              isCollapsed={collapsedSections.frontPage}
              onToggleCollapse={() => toggleSection('frontPage')}
              onScrollToTop={scrollToTop}
              onOpenOutletSettings={() => handleOpenPressModal('frontPage')}
              isMobileView={isMobilePreview}
              lastSyncedTime={briefing.briefingTime}
              readArticleKeys={readArticleKeys}
              isFallback={isBriefingFallback}
            />

            {/* 4. Section 2: 언론사들에서 중복적으로 낸 공통 핵심 기사 */}
            <OverlappingStoriesSection
              stories={filteredOverlapping}
              onOpenShareModal={(s) => setShareStory(s)}
              onOpenArticleModal={handleOpenArticleModal}
              onReact={handleReaction}
              isCollapsed={collapsedSections.overlapping}
              onToggleCollapse={() => toggleSection('overlapping')}
              onScrollToTop={scrollToTop}
              onOpenOutletSettings={() => handleOpenPressModal('overlapping')}
              isMobileView={isMobilePreview}
              minCoverageRatio={minCoverageRatio}
              minSimilarityScore={minSimilarityScore}
              onChangeThresholds={(ratio, score) => handleChangeOverlapThresholds(ratio, score, false)}
              onSaveThresholds={(ratio, score) => handleChangeOverlapThresholds(ratio, score, true)}
              totalSelectedOutletsCount={activeOverlapOutlets.length}
              totalAvailableStoriesCount={briefing.overlappingStories.length}
              readArticleKeys={readArticleKeys}
              isFallback={isBriefingFallback}
            />

            {/* 5. Section 3: 각 언론사만의 단독 및 특별 기사 */}
            <ExclusiveStoriesSection
              stories={filteredExclusive}
              onOpenShareModal={(s) => setShareStory(s)}
              onOpenArticleModal={handleOpenArticleModal}
              onReact={handleReaction}
              isCollapsed={collapsedSections.exclusive}
              onToggleCollapse={() => toggleSection('exclusive')}
              onScrollToTop={scrollToTop}
              isMobileView={isMobilePreview}
              readArticleKeys={readArticleKeys}
              isFallback={isBriefingFallback}
            />

            {/* 6. Section 4: 건설, 부동산, 도시개발, 금융 관련 주제 기사들 제목 모아보기 및 핵심 정리 */}
            <RealEstateFinanceSection
              headlines={filteredSectorHeadlines}
              tone={briefing.tone}
              isCollapsed={collapsedSections.realEstateFinance}
              onToggleCollapse={() => toggleSection('realEstateFinance')}
              onScrollToTop={scrollToTop}
              onOpenArticleModal={handleOpenArticleModal}
              onOpenShareModal={(s) => setShareStory(s)}
              isMobileView={isMobilePreview}
              sectorPreferences={preferences.sectorPreferences || DEFAULT_SECTOR_PREFERENCES}
              onSaveSectorPreferences={handleSaveSectorPreferences}
              onTestLocalNewsAlert={handleTestLocalNewsAlert}
              readArticleKeys={readArticleKeys}
              onMarkArticleRead={handleMarkArticleRead}
              isFallback={isSectorFallback}
              onRetryLive={handleRefreshLive}
              isLoading={isLoading}
            />

          </main>

          {/* Explicit Bottom Footnote Annotation when Fallback Sample Data is Loaded */}
          {(isBriefingFallback || isSectorFallback) && (
            <aside
              role="note"
              aria-label="폴백 샘플 데이터 기준 시점 주석"
              className="mt-8 rounded-2xl border border-amber-300/90 dark:border-amber-700/75 bg-amber-50/90 dark:bg-amber-950/45 px-4 py-3.5 sm:px-5 sm:py-4 text-left shadow-2xs transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 dark:text-amber-200 tracking-tight">
                      <Info className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
                      <span>※ 주석 · 데이터 기준 시점 안내</span>
                    </span>
                    <FallbackBadge label="수집 실패 · 샘플 데이터" size="xs" variant="outline" />
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono tabular-nums bg-amber-200/80 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700/80">
                      샘플 데이터 시점: {sampleSnapshotDate}
                    </span>
                  </div>
                  <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
                    {isBriefingFallback ? (
                      <>
                        현재 표시된 폴백 브리핑 데이터는 오늘 날짜(
                        <span className="font-mono tabular-nums font-semibold">{todayYmd}</span>
                        ) 기준의 실시간 기사가 아니며,{' '}
                        <strong className="font-extrabold underline decoration-amber-500/70 underline-offset-2">
                          샘플 데이터 시점(
                          <span className="font-mono tabular-nums">{sampleSnapshotDate}</span>)
                        </strong>
                        에 저장된 참고용 예시 데이터입니다.
                      </>
                    ) : (
                      <>
                        일부 섹터 영역에 표시된 폴백 데이터는 오늘 날짜(
                        <span className="font-mono tabular-nums font-semibold">{todayYmd}</span>
                        ) 기준의 실시간 기사가 아니며,{' '}
                        <strong className="font-extrabold underline decoration-amber-500/70 underline-offset-2">
                          샘플 데이터 시점(
                          <span className="font-mono tabular-nums">{sampleSnapshotDate}</span>)
                        </strong>
                        에 저장된 참고용 예시 데이터입니다.
                      </>
                    )}
                  </p>
                  <p className="text-[11px] text-amber-900/85 dark:text-amber-200/85">
                    * 실시간 보도로 오해하지 않도록 하단 주석으로 고지합니다. 최신 당일 기사를 불러오려면 [실시간 다시 시도]를 눌러 주세요.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshLive}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs shrink-0 self-start sm:self-center cursor-pointer transition active:scale-95 disabled:opacity-60 shadow-2xs whitespace-nowrap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>{isLoading ? '다시 수집 중...' : '실시간 다시 시도'}</span>
                </button>
              </div>
            </aside>
          )}

          {/* Footer */}
          <footer className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <p>
              <strong className="text-slate-800 dark:text-slate-200">모닝브리프</strong> | 대한민국 주요 언론사 1면 톱기사·공통 핵심이슈·단독 보도 및 건설·부동산·도시개발·금융 실시간 헤드라인 요약 브리핑 플랫폼
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              모든 보도의 지적재산권은 해당 언론사에 있으며, 공식 원문 링크를 통해 전문을 확인하실 수 있습니다. 맞춤형 언론사 실시간 수집 · 핵심 인사이트 요약 · 뉴스레터 HTML 미리보기 지원.
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
          frontPageOutletIds={preferences.frontPageOutlets || preferences.selectedOutlets || []}
          overlappingOutletIds={preferences.overlappingOutlets || preferences.selectedOutlets || []}
          initialSection={pressModalInitialSection}
          onApplyOutlets={handleApplyOutlets}
        />
      )}

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        briefing={briefing}
        recipientEmail={preferences.recipientEmail}
        savedRecipientEmails={preferences.savedRecipientEmails || []}
        deliveryTime={preferences.deliveryTime}
        deliveryTimezone={preferences.deliveryTimezone || 'Asia/Seoul'}
        deliveryDays={preferences.deliveryDays}
        autoEmailEnabled={preferences.autoEmailEnabled}
        pushNotificationEnabled={preferences.pushNotificationEnabled}
        onTogglePush={(enabled) => {
          setPreferences((prev) => ({ ...prev, pushNotificationEnabled: enabled }));
          triggerNotification(
            enabled ? '웹 & 모바일 푸시 알림이 활성화되었습니다.' : '푸시 알림이 비활성화되었습니다.'
          );
        }}
        onTestPush={handleTestPush}
        localNewsAlertEnabled={Boolean(preferences.sectorPreferences?.localNewsAlertEnabled)}
        selectedRegionSido={preferences.sectorPreferences?.selectedRegionSido || 'all'}
        selectedRegionSigungu={preferences.sectorPreferences?.selectedRegionSigungu || 'all'}
        onToggleLocalNewsAlert={handleToggleLocalNewsAlert}
        onChangeAlertRegion={handleChangeAlertRegion}
        onTestLocalNewsAlert={handleTestLocalNewsAlert}
        emailLogs={emailLogs}
        onSendEmail={handleSendEmail}
        onSaveRecipientEmail={handleSaveRecipientEmail}
        onDeleteSavedEmail={handleDeleteSavedEmail}
        onUpdateSchedule={handleUpdateSchedule}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        themeMode={themeMode}
        resolvedTheme={resolvedTheme}
        onChangeTheme={handleChangeTheme}
        onRefreshSunTheme={() => setSunLocationVersion((v) => v + 1)}
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

      {/* Verified Article Excerpt & Cluster Viewer Modal */}
      <ArticleModal
        isOpen={!!articleModalStory}
        onClose={() => setArticleModalStory(null)}
        story={articleModalStory}
        onOpenShare={(s) => setShareStory(s)}
        isRead={articleModalStory ? isArticleRead(readArticleKeys, articleModalStory) : false}
        onToggleReadStatus={handleToggleArticleRead}
        isFallback={isBriefingFallback}
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
