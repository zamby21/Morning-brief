import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Building,
  Coins,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Sparkles,
  ArrowUp,
  BadgeAlert,
  SlidersHorizontal,
  X,
  Save,
  RotateCcw,
  Star,
  Plus,
  ShieldCheck,
  Tag,
  CheckCircle2,
  BookmarkCheck,
  Volume2,
  MapPin,
  Clock,
  Bell,
} from 'lucide-react';
import {
  SectorHeadlineItem,
  RealEstateFinanceSector,
  SectorCategoryKey,
  NewsStory,
  SectorPreferences,
  BriefingTone,
  DEFAULT_SECTOR_PREFERENCES,
} from '../types/news';
import { PRESS_OUTLETS } from '../data/pressMetadata';
import { getNaverNewsUrl } from '../utils/linkUtils';
import { formatLeadSummaryByTone } from '../utils/toneTransformer';
import { isArticleRead, ReadableArticleRef } from '../utils/readArticles';
import { SectionAudioButton, useActiveSectionSpeechItemId } from './SectionAudioButton';
import type { SpeechBriefingItem } from '../utils/sectionSpeechPlayer';
import { FallbackBadge, FallbackNoticeBanner } from './FallbackNotice';
import { KOREAN_REGIONS, getRegionByCode, matchesRegionFilter } from '../utils/koreanRegions';

const STORAGE_KEY_SECTOR_PREFS = 'morning_brief_sector_preferences_v1';
const STORAGE_KEY_RECENT_REGIONS = 'morning_brief_recent_regions_v1';
const MAX_RECENT_REGIONS = 3;

interface RecentRegionItem {
  sidoCode: string;
  sigungu: string; // 'all' or specific 시/군/구 name
  label: string;
}

const formatRegionLabel = (sidoCode: string, sigungu: string): string => {
  const region = getRegionByCode(sidoCode);
  if (!region) return '';
  if (!sigungu || sigungu === 'all') return region.name;
  return `${region.shortName} · ${sigungu}`;
};

const loadRecentRegions = (): RecentRegionItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT_REGIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const valid: RecentRegionItem[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;
      const sidoCode = typeof entry.sidoCode === 'string' ? entry.sidoCode : '';
      const sigungu = typeof entry.sigungu === 'string' && entry.sigungu ? entry.sigungu : 'all';
      const region = getRegionByCode(sidoCode);
      if (!region) continue;
      if (sigungu !== 'all' && !region.sigungu.includes(sigungu)) continue;
      const key = `${sidoCode}:${sigungu}`;
      if (seen.has(key)) continue;
      seen.add(key);
      valid.push({
        sidoCode,
        sigungu,
        label: formatRegionLabel(sidoCode, sigungu),
      });
      if (valid.length >= MAX_RECENT_REGIONS) break;
    }
    return valid;
  } catch (e) {
    console.warn('Failed to load recent regions from localStorage', e);
    return [];
  }
};

const PRESET_KEYWORDS = [
  'GTX',
  '토목수주',
  '해외원전수주',
  '공사비현실화',
  '책임준공',
  '분상제·로또청약',
  '1기신도시·선도지구',
  '재건축·정비사업',
  '도시개발·복합개발',
  '모아타운·신속통합',
  '주택공급대책',
  '기준금리인하',
  '부동산PF·정상화',
  '스트레스DSR',
  '리츠·배당',
];

interface RealEstateFinanceSectionProps {
  headlines: SectorHeadlineItem[];
  tone?: BriefingTone;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onScrollToTop: () => void;
  onOpenArticleModal: (story: NewsStory) => void;
  onOpenShareModal: (story: NewsStory) => void;
  isMobileView?: boolean;
  sectorPreferences?: SectorPreferences;
  onSaveSectorPreferences?: (
    prefs: SectorPreferences,
    options?: { silent?: boolean; notifyMessage?: string }
  ) => void;
  onTestLocalNewsAlert?: (sidoCode: string, sigungu: string) => void;
  readArticleKeys?: ReadonlySet<string>;
  onMarkArticleRead?: (article: ReadableArticleRef) => void;
  isFallback?: boolean;
  onRetryLive?: () => void;
  isLoading?: boolean;
}

const loadLocalSectorPrefs = (propPrefs?: SectorPreferences): SectorPreferences => {
  if (propPrefs && propPrefs.enabledSectors && propPrefs.enabledSectors.length > 0) {
    return propPrefs;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SECTOR_PREFS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_SECTOR_PREFERENCES,
            ...parsed,
            enabledSectors:
              Array.isArray(parsed.enabledSectors) && parsed.enabledSectors.length > 0
                ? parsed.enabledSectors
                : DEFAULT_SECTOR_PREFERENCES.enabledSectors,
            favoriteKeywords: Array.isArray(parsed.favoriteKeywords)
              ? parsed.favoriteKeywords
              : [],
            defaultSector: parsed.defaultSector || 'all',
            onlyCrucialOrHigh: !!parsed.onlyCrucialOrHigh,
            localNewsAlertEnabled: !!parsed.localNewsAlertEnabled,
            selectedRegionSido:
              typeof parsed.selectedRegionSido === 'string'
                ? parsed.selectedRegionSido
                : 'all',
            selectedRegionSigungu:
              typeof parsed.selectedRegionSigungu === 'string'
                ? parsed.selectedRegionSigungu
                : 'all',
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load sector preferences from localStorage', e);
    }
  }
  return propPrefs || DEFAULT_SECTOR_PREFERENCES;
};

export const RealEstateFinanceSection: React.FC<RealEstateFinanceSectionProps> = ({
  headlines,
  tone = 'insight',
  isCollapsed,
  onToggleCollapse,
  onScrollToTop,
  onOpenArticleModal,
  onOpenShareModal,
  isMobileView = false,
  sectorPreferences,
  onSaveSectorPreferences,
  onTestLocalNewsAlert,
  readArticleKeys,
  onMarkArticleRead,
  isFallback = false,
  onRetryLive,
  isLoading = false,
}) => {
  // Personalized Sector Preferences
  const [prefs, setPrefs] = useState<SectorPreferences>(() =>
    loadLocalSectorPrefs(sectorPreferences)
  );

  // Sync with prop when prop changes from outside
  useEffect(() => {
    if (sectorPreferences && sectorPreferences.enabledSectors?.length) {
      setPrefs(sectorPreferences);
      if (typeof sectorPreferences.selectedRegionSido === 'string') {
        setSelectedSido(sectorPreferences.selectedRegionSido);
      }
      if (typeof sectorPreferences.selectedRegionSigungu === 'string') {
        setSelectedSigungu(sectorPreferences.selectedRegionSigungu);
      }
    }
  }, [sectorPreferences]);

  // UI States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<RealEstateFinanceSector>(
    () => prefs.defaultSector || 'all'
  );
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [onlyMyKeywordsActive, setOnlyMyKeywordsActive] = useState(false);
  const [saveSuccessBadge, setSaveSuccessBadge] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'impact'>('latest');
  const [selectedSido, setSelectedSido] = useState<string>(
    () => prefs.selectedRegionSido || 'all'
  );
  const [selectedSigungu, setSelectedSigungu] = useState<string>(
    () => prefs.selectedRegionSigungu || 'all'
  );
  const [recentRegions, setRecentRegions] = useState<RecentRegionItem[]>(() =>
    loadRecentRegions()
  );

  const activeSidoRegion = useMemo(() => getRegionByCode(selectedSido), [selectedSido]);
  const sigunguOptions = activeSidoRegion?.sigungu || [];

  const alertTargetSido = selectedSido !== 'all' ? selectedSido : (prefs.selectedRegionSido || 'all');
  const alertTargetSigungu =
    selectedSido !== 'all' ? selectedSigungu : (prefs.selectedRegionSigungu || 'all');
  const alertTargetLabel = formatRegionLabel(alertTargetSido, alertTargetSigungu);

  const recordRecentRegion = (sidoCode: string, sigungu: string = 'all') => {
    if (!sidoCode || sidoCode === 'all') return;
    const label = formatRegionLabel(sidoCode, sigungu);
    if (!label) return;
    setRecentRegions((prev) => {
      const next: RecentRegionItem[] = [
        { sidoCode, sigungu, label },
        ...prev.filter(
          (item) => !(item.sidoCode === sidoCode && item.sigungu === sigungu)
        ),
      ].slice(0, MAX_RECENT_REGIONS);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_RECENT_REGIONS, JSON.stringify(next));
        } catch (e) {
          console.warn('Failed to save recent regions to localStorage', e);
        }
      }
      return next;
    });
  };

  const handleSelectRegion = (sidoCode: string, sigungu: string = 'all') => {
    setSelectedSido(sidoCode);
    setSelectedSigungu(sigungu);
    if (sidoCode !== 'all') {
      recordRecentRegion(sidoCode, sigungu);
      handleSavePreferences(
        {
          ...prefs,
          selectedRegionSido: sidoCode,
          selectedRegionSigungu: sigungu,
        },
        { silent: true }
      );
    } else if (!prefs.localNewsAlertEnabled) {
      handleSavePreferences(
        {
          ...prefs,
          selectedRegionSido: 'all',
          selectedRegionSigungu: 'all',
        },
        { silent: true }
      );
    }
  };

  const handleClearRecentRegions = () => {
    setRecentRegions([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_RECENT_REGIONS);
      } catch (e) {
        console.warn('Failed to clear recent regions from localStorage', e);
      }
    }
  };

  // Helper: check if an item matches user's favorite keywords
  const doesItemMatchFavorites = (
    item: SectorHeadlineItem,
    favoriteKeywords: string[]
  ): boolean => {
    if (!favoriteKeywords || favoriteKeywords.length === 0) return false;
    return favoriteKeywords.some((kw) => {
      const clean = kw.toLowerCase().replace(/[^a-zA-Z0-9가-힣]/g, '');
      if (!clean) return false;
      const matchTag = item.tags.some((t) => t.toLowerCase().includes(clean));
      const matchTitle = item.title.toLowerCase().includes(clean);
      const matchSummary = item.summary.toLowerCase().includes(clean);
      return matchTag || matchTitle || matchSummary;
    });
  };

  // Sector counts (calculated over all available headlines)
  const sectorCounts = useMemo(() => {
    return {
      all: headlines.length,
      construction: headlines.filter((h) => h.sector === 'construction').length,
      realestate: headlines.filter((h) => h.sector === 'realestate').length,
      urban: headlines.filter((h) => h.sector === 'urban').length,
      finance: headlines.filter((h) => h.sector === 'finance').length,
      myFavoritesCount: headlines.filter((h) =>
        doesItemMatchFavorites(h, prefs.favoriteKeywords)
      ).length,
    };
  }, [headlines, prefs.favoriteKeywords]);

  const latestBySector = useMemo(() => {
    return {
      construction: headlines.find((h) => h.sector === 'construction'),
      realestate: headlines.find((h) => h.sector === 'realestate'),
      urban: headlines.find((h) => h.sector === 'urban'),
      finance: headlines.find((h) => h.sector === 'finance'),
    };
  }, [headlines]);

  // Filtered and sorted headlines based on sector tab, preferences, keywords, search
  const filteredHeadlines = useMemo(() => {
    let result = headlines.filter((item) => {
      // 1. Sector Tab Filter
      if (selectedSector !== 'all') {
        if (item.sector !== selectedSector) return false;
      } else {
        // In "all" mode, respect user's enabledSectors setting
        if (
          prefs.enabledSectors &&
          prefs.enabledSectors.length > 0 &&
          !prefs.enabledSectors.includes(item.sector)
        ) {
          return false;
        }
      }

      // 2. Only My Favorite Keywords Toggle
      if (
        onlyMyKeywordsActive &&
        prefs.favoriteKeywords &&
        prefs.favoriteKeywords.length > 0
      ) {
        if (!doesItemMatchFavorites(item, prefs.favoriteKeywords)) {
          return false;
        }
      }

      // 3. Crucial / High Impact only option
      if (prefs.onlyCrucialOrHigh) {
        if (item.impactRating !== 'Crucial' && item.impactRating !== 'High') {
          return false;
        }
      }

      // 4. Local Government (Si/Do, Si/Gun/Gu) Region Filter
      if (selectedSido !== 'all') {
        if (!matchesRegionFilter(item, selectedSido, selectedSigungu)) {
          return false;
        }
      }

      // 5. Free-text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesOutlet = item.outletName.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesOutlet && !matchesTags) {
          return false;
        }
      }

      return true;
    });

    if (sortBy === 'impact') {
      const priority: Record<string, number> = { Crucial: 3, High: 2, Medium: 1 };
      result = [...result].sort(
        (a, b) =>
          (priority[b.impactRating || 'Medium'] || 1) -
          (priority[a.impactRating || 'Medium'] || 1)
      );
    }

    return result;
  }, [headlines, selectedSector, prefs, onlyMyKeywordsActive, selectedSido, selectedSigungu, searchQuery, sortBy]);

  // Save Settings handler
  const handleSavePreferences = (
    newPrefs: SectorPreferences,
    options?: { silent?: boolean; notifyMessage?: string }
  ) => {
    setPrefs(newPrefs);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SECTOR_PREFS, JSON.stringify(newPrefs));
      } catch (e) {
        console.warn('Failed to save sector prefs to localStorage', e);
      }
    }
    if (onSaveSectorPreferences) {
      onSaveSectorPreferences(newPrefs, options);
    }
    if (!options?.silent) {
      setSaveSuccessBadge(true);
      setTimeout(() => setSaveSuccessBadge(false), 2600);
    }
  };

  const handleToggleLocalNewsAlert = (enabled: boolean) => {
    if (
      enabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }

    const nextSido = alertTargetSido;
    const nextSigungu = alertTargetSigungu;
    const regionText = formatRegionLabel(nextSido, nextSigungu);

    const updated: SectorPreferences = {
      ...prefs,
      localNewsAlertEnabled: enabled,
      selectedRegionSido: nextSido,
      selectedRegionSigungu: nextSigungu,
    };

    const notifyMessage = enabled
      ? regionText
        ? `'${regionText}' 내 지역 뉴스 실시간 푸시 알림이 활성화되었습니다.`
        : "'내 지역 뉴스 알림'이 활성화되었습니다. 알림을 받을 지자체를 선택해주세요."
      : "'내 지역 뉴스 알림'이 비활성화되었습니다.";

    handleSavePreferences(updated, { notifyMessage });
  };

  // Toggle Sector in preferences
  const handleToggleSector = (sector: SectorCategoryKey) => {
    const current = prefs.enabledSectors || ['construction', 'realestate', 'urban', 'finance'];
    let next: SectorCategoryKey[];
    if (current.includes(sector)) {
      if (current.length === 1) {
        // Prevent deselecting all
        return;
      }
      next = current.filter((s) => s !== sector);
    } else {
      next = [...current, sector];
    }
    const updated: SectorPreferences = { ...prefs, enabledSectors: next };
    handleSavePreferences(updated);
  };

  // Toggle Favorite Keyword tag in preferences
  const handleToggleKeyword = (kw: string) => {
    const current = prefs.favoriteKeywords || [];
    const exists = current.includes(kw);
    const next = exists ? current.filter((k) => k !== kw) : [...current, kw];
    const updated: SectorPreferences = { ...prefs, favoriteKeywords: next };
    handleSavePreferences(updated);
  };

  // Add Custom Keyword
  const handleAddCustomKeyword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customKeywordInput.trim().replace(/^#/, '');
    if (!clean) return;
    const current = prefs.favoriteKeywords || [];
    if (!current.includes(clean)) {
      const next = [clean, ...current];
      handleSavePreferences({ ...prefs, favoriteKeywords: next });
    }
    setCustomKeywordInput('');
  };

  // Reset to default
  const handleResetPreferences = () => {
    handleSavePreferences(DEFAULT_SECTOR_PREFERENCES);
    setSelectedSector('all');
    setOnlyMyKeywordsActive(false);
    setSelectedSido('all');
    setSelectedSigungu('all');
  };

  const getSectorLeadLines = (item: SectorHeadlineItem): string[] => {
    const existing = item.leadSummary;
    const expectedCount = tone === 'insight' ? 4 : 3;
    if (existing && existing.length >= expectedCount) {
      const matchesTone =
        tone === 'insight'
          ? existing.length >= 4 && existing.some((l) => l.trim().startsWith('[시사점]'))
          : tone === 'bullet'
          ? existing[0]?.trim().startsWith('▪')
          : !existing.some((l) => l.trim().startsWith('[시사점]'));
      if (matchesTone) {
        return existing.slice(0, expectedCount);
      }
    }

    const bodyParas = (item.fullContent || '')
      .split(/\n\n+/)
      .map((p) => p.replace(/^\[[^\]]+\]\s*/g, '').trim())
      .filter((p) => p.length >= 20);
    const candidateLines =
      item.baseSummary && item.baseSummary.length >= 2
        ? item.baseSummary
        : [
            item.summary,
            ...bodyParas.slice(1, 3),
            ...(item.keyFigure
              ? [`관련 시장 핵심 지표 및 규모는 ${item.keyFigure}로 집계되었습니다.`]
              : []),
          ].filter(Boolean);

    return formatLeadSummaryByTone(
      item.title,
      candidateLines,
      tone,
      item.sectorLabel,
      item.outletName,
      item.aiInsight
    ).leadSummary;
  };

  const getSectorFullContent = (item: SectorHeadlineItem): string => {
    if (item.fullContent && item.fullContent.trim().length > 60) {
      return item.fullContent.trim();
    }
    const leadLines = getSectorLeadLines(item).map((l) =>
      l.replace(/^\[시사점\]\s*/, '').replace(/^▪\s*/, '')
    );
    const sectorContext =
      item.sector === 'construction'
        ? '건설·SOC 인프라 시장에서는 대형 수주 물량과 공사비 정상화 여부가 업계 수익성을 좌우할 핵심 변수로 꼽힌다.'
        : item.sector === 'realestate'
        ? '주택·부동산 시장에서는 입지별 수급 불균형과 대출·세제 정책 변화가 실수요자의 매수 심리에 직접적인 영향을 미치고 있다.'
        : item.sector === 'urban'
        ? '도시개발·정비 시장에서는 재건축·재개발 인허가 속도와 신도시·역세권 복합개발 계획이 향후 도심 공급의 핵심 축으로 작용하고 있다.'
        : '금융·자본시장에서는 기준금리 경로와 가계부채·부동산 PF 건전성 관리 속도가 향후 투자 흐름의 분수령이 될 전망이다.';

    return [
      `[${item.outletName}] ${item.summary}`,
      leadLines[1] || `${item.title} 사안과 관련해 관계 당국과 주요 업계의 후속 대응 및 세부 지표 점검이 이어지고 있다.`,
      `${sectorContext}${item.keyFigure ? ` 이번 사안에서 확인된 핵심 지표는 '${item.keyFigure}' 수준이다.` : ''}`,
      `전문가들은 "${item.tags.slice(0, 3).join(', ')} 등 관련 키워드를 중심으로 시장 파급 효과가 확대되는 만큼 향후 후속 발표와 지표 변화를 면밀히 주시해야 한다"고 밝혔다.`,
    ].join('\n\n');
  };

  // Adapter to convert SectorHeadlineItem to NewsStory for modals (matching Section 1 structure)
  const adaptToNewsStory = (item: SectorHeadlineItem): NewsStory => {
    const leadLines = getSectorLeadLines(item);
    const defaultDept =
      item.sector === 'construction'
        ? '건설·산업부'
        : item.sector === 'realestate'
        ? '부동산부'
        : item.sector === 'urban'
        ? '도시개발·정비부'
        : '금융부';

    return {
      id: item.id,
      outletId: item.outletId,
      outletName: item.outletName,
      category: 'frontpage',
      title: item.title,
      leadSummary: leadLines,
      baseSummary: item.baseSummary,
      aiInsight: item.aiInsight,
      originalUrl: item.originalUrl || '',
      naverUrl: item.naverUrl || getNaverNewsUrl(item.title, item.outletName, item.tags),
      publishedAt: item.publishedAt,
      keywords: item.tags,
      topic: item.sectorLabel,
      reporter: item.reporter || `${item.outletName} ${defaultDept}`,
      pressSection: item.pressSection || `${item.sectorLabel} 주요 보도`,
      exclusiveBadge: item.sectorLabel,
      importanceRating: item.impactRating || 'High',
      fullContent: getSectorFullContent(item),
      articleBlocks: item.articleBlocks,
      leadImage: item.leadImage,
      leadImageCaption: item.leadImageCaption,
      reactions: { insightful: 0, important: 0, surprising: 0 },
    };
  };

  const isCustomized =
    prefs.enabledSectors.length < 4 ||
    prefs.favoriteKeywords.length > 0 ||
    prefs.onlyCrucialOrHigh ||
    prefs.defaultSector !== 'all';

  const readCount = headlines.filter((item) => isArticleRead(readArticleKeys, item)).length;
  const activeSpeechItemId = useActiveSectionSpeechItemId('realestate-finance');

  const speechItems = useMemo<SpeechBriefingItem[]>(
    () =>
      filteredHeadlines.map((item) => ({
        id: item.id,
        outletLabel: `${item.outletName} ${item.sectorLabel}`,
        title: item.title,
        summaryLines: getSectorLeadLines(item).slice(0, 4),
        aiInsight: item.aiInsight,
      })),
    [filteredHeadlines, tone]
  );

  const hasFallbackItems = useMemo(
    () => isFallback || headlines.some((h) => Boolean(h.isFallback) || h.sourceType === 'mock'),
    [isFallback, headlines]
  );

  return (
    <section id="section-realestate-finance" className="space-y-4 pt-2">
      {/* Section Header Card */}
      <div
        className={`rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden transition-all duration-300 border ${
          hasFallbackItems
            ? 'bg-gradient-to-b from-amber-50/55 via-white to-white dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900 border-amber-300/90 dark:border-amber-700/70'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20 shrink-0">
              <Building className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  4번째 특화 브리핑
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-400">
                  경제 5대지 및 주요 종합지 집중 취재
                </span>
                {hasFallbackItems && (
                  <FallbackBadge label="수집 실패 · 샘플 데이터" size="xs" variant="solid" />
                )}
                {isCustomized && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>개인 관심설정 적용 중</span>
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
                <span>4. 건설 · 부동산 · 도시개발 · 금융 실시간 헤드라인 모아보기</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                  총 {headlines.length}건 집계
                </span>
                {readCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    <Check className="w-3 h-3" />
                    <span>읽음 {readCount}</span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {hasFallbackItems
                  ? '실시간 섹터 기사 수집에 실패하여 참고용 샘플 헤드라인이 포함되어 있습니다.'
                  : '건설 수주 및 SOC 사업, 부동산·청약 대책, 도시개발·재건축·신도시 정비, 기준금리 및 부동산 PF 헤드라인을 섹터별로 한눈에 정리합니다.'}
              </p>
            </div>
          </div>

          {/* Section Action Controls */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
            <SectionAudioButton
              sectionId="realestate-finance"
              sectionLabel="건설·부동산·도시개발·금융 헤드라인"
              items={speechItems}
              accent="amber"
            />

            {/* Personalization Setting Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs ${
                isSettingsOpen
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : isCustomized
                  ? 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="관심 섹터와 세부 키워드를 개인 맞춤으로 설정 및 저장합니다."
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>관심분야 개인설정</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  isSettingsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title={isCollapsed ? '섹션 펼치기' : '섹션 접기'}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>펼치기</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>접기</span>
                </>
              )}
            </button>

            {/* Scroll to Top */}
            <button
              onClick={onScrollToTop}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="맨 위로 바로가기"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">맨위로</span>
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="mt-5 space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {hasFallbackItems && !isFallback && (
              <FallbackNoticeBanner
                compact
                title="건설·부동산·도시개발·금융 일부 섹터 수집에 실패하여 샘플 헤드라인이 포함되어 있습니다."
                onRetry={onRetryLive}
                isLoading={isLoading}
              />
            )}
            {/* Personalized Sector Settings Control Panel */}
            {isSettingsOpen && (
              <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-800/70 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/80 dark:border-amber-800/60">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        건설 · 부동산 · 도시개발 · 금융 관심분야 개인 맞춤 설정 (영구 저장)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        원하시는 섹터와 키워드를 지정하면 브라우저에 자동 저장되어 다음 방문 시에도 동일하게 유지됩니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={() => handleSavePreferences(prefs)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                    >
                      {saveSuccessBadge ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>설정 저장됨! ✓</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>설정 저장하기</span>
                        </>
                      )}
                    </button>

                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={handleResetPreferences}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1 active:scale-95"
                      title="기본값 (모든 섹터 활성화)으로 복원"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      <span>기본값 복원</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="설정 패널 닫기"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 1. Sector Checkboxes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>① 활성화할 관심 섹터 (원하는 섹터만 선택 가능)</span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      선택된 섹터: {prefs.enabledSectors.length}개 / 4개
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Construction */}
                    <label
                      onClick={() => handleToggleSector('construction')}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                        prefs.enabledSectors.includes('construction')
                          ? 'bg-white dark:bg-slate-800 border-amber-400 dark:border-amber-500 shadow-xs ring-1 ring-amber-300 dark:ring-amber-500/40'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={prefs.enabledSectors.includes('construction')}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 text-amber-600 rounded cursor-pointer pointer-events-none"
                      />
                      <div className="text-left text-xs">
                        <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                          <span>🏗️ 건설·시공·SOC</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          GTX·SOC 민자사업, 토목·해외 플랜트 수주, 공사비 현실화 등
                        </p>
                      </div>
                    </label>

                    {/* Real Estate */}
                    <label
                      onClick={() => handleToggleSector('realestate')}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                        prefs.enabledSectors.includes('realestate')
                          ? 'bg-white dark:bg-slate-800 border-emerald-400 dark:border-emerald-500 shadow-xs ring-1 ring-emerald-300 dark:ring-emerald-500/40'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={prefs.enabledSectors.includes('realestate')}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 text-emerald-600 rounded cursor-pointer pointer-events-none"
                      />
                      <div className="text-left text-xs">
                        <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                          <span>🏢 부동산·청약·주택</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          수도권 분양·청약, 전월세·주택 공급 대책, 대출·세제 정책 등
                        </p>
                      </div>
                    </label>

                    {/* Urban Development */}
                    <label
                      onClick={() => handleToggleSector('urban')}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                        prefs.enabledSectors.includes('urban')
                          ? 'bg-white dark:bg-slate-800 border-cyan-400 dark:border-cyan-500 shadow-xs ring-1 ring-cyan-300 dark:ring-cyan-500/40'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={prefs.enabledSectors.includes('urban')}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 text-cyan-600 rounded cursor-pointer pointer-events-none"
                      />
                      <div className="text-left text-xs">
                        <div className="font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1">
                          <span>🏙️ 도시개발·정비·신도시</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          재건축·재개발 정비구역, 1·3기 신도시, 역세권 복합개발·모아타운 등
                        </p>
                      </div>
                    </label>

                    {/* Finance */}
                    <label
                      onClick={() => handleToggleSector('finance')}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                        prefs.enabledSectors.includes('finance')
                          ? 'bg-white dark:bg-slate-800 border-indigo-400 dark:border-indigo-500 shadow-xs ring-1 ring-indigo-300 dark:ring-indigo-500/40'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={prefs.enabledSectors.includes('finance')}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 text-indigo-600 rounded cursor-pointer pointer-events-none"
                      />
                      <div className="text-left text-xs">
                        <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                          <span>📈 금융·금리·부동산PF</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          기준금리·통화정책, 부동산 PF 정상화, 스트레스 DSR, 금융시장 동향 등
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 2. Favorite Keywords & Custom Keyword Adding */}
                <div className="space-y-2 pt-2 border-t border-amber-100 dark:border-amber-900/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>② 세부 관심 키워드 (클릭하여 켜고 끄기 및 직접 추가)</span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      등록된 관심 키워드: {prefs.favoriteKeywords.length}개
                    </span>
                  </div>

                  {/* Preset Keyword Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRESET_KEYWORDS.map((kw) => {
                      const isSelected = prefs.favoriteKeywords.includes(kw);
                      return (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => handleToggleKeyword(kw)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 border active:scale-95 ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                          <span>#{kw}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Keyword Input Form */}
                  <form
                    onSubmit={handleAddCustomKeyword}
                    className="flex items-center gap-2 pt-1 max-w-md"
                  >
                    <input
                      type="text"
                      value={customKeywordInput}
                      onChange={(e) => setCustomKeywordInput(e.target.value)}
                      placeholder="내 관심 키워드 직접 입력 (예: 한남3구역, 현대건설)"
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                    <button
                      type="submit"
                      disabled={!customKeywordInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>추가</span>
                    </button>
                  </form>

                  {/* Active Custom Registered Keywords */}
                  {prefs.favoriteKeywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                        내 관심 키워드:
                      </span>
                      {prefs.favoriteKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1"
                        >
                          <span>#{kw}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleKeyword(kw)}
                            className="text-amber-700 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white p-0.5 cursor-pointer"
                            title="삭제"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Additional Preferences (Default Tab & Impact Filter) */}
                <div className="pt-2 border-t border-amber-100 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-700 dark:text-slate-200">기본 선택 탭:</span>
                    {(
                      [
                        { id: 'all', label: '전체' },
                        { id: 'construction', label: '건설' },
                        { id: 'realestate', label: '부동산' },
                        { id: 'urban', label: '도시개발' },
                        { id: 'finance', label: '금융' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          handleSavePreferences({ ...prefs, defaultSector: tab.id })
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          prefs.defaultSector === tab.id
                            ? 'bg-slate-900 dark:bg-blue-600 text-white font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-200 font-semibold">
                    <input
                      type="checkbox"
                      checked={!!prefs.onlyCrucialOrHigh}
                      onChange={(e) =>
                        handleSavePreferences({
                          ...prefs,
                          onlyCrucialOrHigh: e.target.checked,
                        })
                      }
                      className="w-3.5 h-3.5 text-amber-600 rounded cursor-pointer"
                    />
                    <span>중요도 높은 핵심 기사(Crucial / High) 우선 필터링</span>
                  </label>
                </div>

                {/* 4. Local Region News Real-time Push Alert Toggle */}
                <div className="pt-2 border-t border-amber-100 dark:border-amber-900/50">
                  <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-200/80 dark:border-amber-800/70 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 shrink-0">
                        <Bell className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            내 지역 뉴스 알림
                          </span>
                          {alertTargetLabel ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                              <MapPin className="w-2.5 h-2.5" aria-hidden="true" />
                              <span>{alertTargetLabel}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              지자체 미선택
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {alertTargetLabel
                            ? `선택한 '${alertTargetLabel}' 지역에서 새로운 주요 기사가 업데이트되면 실시간 푸시 알림을 받습니다.`
                            : '아래 지자체 드롭다운에서 시/도 또는 시/군/구를 선택하면 해당 지역 신규 주요 기사 알림을 받을 수 있습니다.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                      {onTestLocalNewsAlert && alertTargetSido !== 'all' && (
                        <button
                          type="button"
                          onClick={() => onTestLocalNewsAlert(alertTargetSido, alertTargetSigungu)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 transition cursor-pointer whitespace-nowrap"
                        >
                          알림 테스트
                        </button>
                      )}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!prefs.localNewsAlertEnabled}
                        aria-label="내 지역 뉴스 알림"
                        onClick={() => handleToggleLocalNewsAlert(!prefs.localNewsAlertEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                          prefs.localNewsAlertEnabled
                            ? 'bg-amber-600 dark:bg-amber-500'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                            prefs.localNewsAlertEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Panel Footer Notice */}
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">설정 보관 상태:</span>
                    <span>
                      활성 섹터 {prefs.enabledSectors.length}개 · 관심 키워드{' '}
                      {prefs.favoriteKeywords.length}개 설정이 브라우저에 저장되어 재실행 시 유지됩니다.
                    </span>
                  </div>
                  {saveSuccessBadge && (
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded animate-in fade-in flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>설정이 브라우저에 저장되었습니다</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Top 4-Sector Live Key Takeaway Cards (Dynamic from collected headlines) */}
            <div
              className={
                isMobileView
                  ? 'grid grid-cols-1 gap-2.5'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'
              }
            >
              {/* Construction Card */}
              {prefs.enabledSectors.includes('construction') && (
                <div className="bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/35 dark:to-slate-900 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <span className="text-base">🏗️</span> 건설·SOC 동향
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                      {sectorCounts.construction}건
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {latestBySector.construction
                      ? `[${latestBySector.construction.outletName}] ${latestBySector.construction.title}`
                      : '수집된 최신 건설·SOC 기사가 없습니다.'}
                  </p>
                </div>
              )}

              {/* Real Estate Card */}
              {prefs.enabledSectors.includes('realestate') && (
                <div className="bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/35 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <span className="text-base">🏢</span> 부동산·청약 동향
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200">
                      {sectorCounts.realestate}건
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {latestBySector.realestate
                      ? `[${latestBySector.realestate.outletName}] ${latestBySector.realestate.title}`
                      : '수집된 최신 부동산·주택 기사가 없습니다.'}
                  </p>
                </div>
              )}

              {/* Urban Development Card */}
              {prefs.enabledSectors.includes('urban') && (
                <div className="bg-gradient-to-br from-cyan-50/80 to-white dark:from-cyan-950/35 dark:to-slate-900 border border-cyan-200/80 dark:border-cyan-800/60 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                      <span className="text-base">🏙️</span> 도시개발·정비 동향
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-200 dark:bg-cyan-900/80 text-cyan-900 dark:text-cyan-200">
                      {sectorCounts.urban}건
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {latestBySector.urban
                      ? `[${latestBySector.urban.outletName}] ${latestBySector.urban.title}`
                      : '수집된 최신 도시개발·정비 기사가 없습니다.'}
                  </p>
                </div>
              )}

              {/* Finance Card */}
              {prefs.enabledSectors.includes('finance') && (
                <div className="bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-950/35 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <span className="text-base">📈</span> 금융·금리·PF 동향
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200">
                      {sectorCounts.finance}건
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {latestBySector.finance
                      ? `[${latestBySector.finance.outletName}] ${latestBySector.finance.title}`
                      : '수집된 최신 금융·금리·PF 기사가 없습니다.'}
                  </p>
                </div>
              )}
            </div>

            {/* Filter, Local Government Dropdown & Search Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 sm:p-3 space-y-2.5 text-xs">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Sector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedSector('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedSector === 'all'
                      ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>🌟 전체</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedSector === 'all'
                        ? 'bg-slate-700 dark:bg-blue-800 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {sectorCounts.all}
                  </span>
                </button>

                {prefs.enabledSectors.includes('construction') && (
                  <button
                    onClick={() => setSelectedSector('construction')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedSector === 'construction'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 hover:bg-amber-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>🏗️ 건설·시공</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedSector === 'construction'
                          ? 'bg-amber-800 text-white'
                          : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {sectorCounts.construction}
                    </span>
                  </button>
                )}

                {prefs.enabledSectors.includes('realestate') && (
                  <button
                    onClick={() => setSelectedSector('realestate')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedSector === 'realestate'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>🏢 부동산·청약</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedSector === 'realestate'
                          ? 'bg-emerald-800 text-white'
                          : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {sectorCounts.realestate}
                    </span>
                  </button>
                )}

                {prefs.enabledSectors.includes('urban') && (
                  <button
                    onClick={() => setSelectedSector('urban')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedSector === 'urban'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/70 hover:bg-cyan-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>🏙️ 도시개발·정비</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedSector === 'urban'
                          ? 'bg-cyan-800 text-white'
                          : 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300'
                      }`}
                    >
                      {sectorCounts.urban}
                    </span>
                  </button>
                )}

                {prefs.enabledSectors.includes('finance') && (
                  <button
                    onClick={() => setSelectedSector('finance')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedSector === 'finance'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70 hover:bg-indigo-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>📈 금융·금리·PF</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedSector === 'finance'
                          ? 'bg-indigo-800 text-white'
                          : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300'
                      }`}
                    >
                      {sectorCounts.finance}
                    </span>
                  </button>
                )}

                {/* Quick Toggle: Show Only My Favorite Keywords */}
                {prefs.favoriteKeywords.length > 0 && (
                  <button
                    onClick={() => setOnlyMyKeywordsActive((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ml-1 ${
                      onlyMyKeywordsActive
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                    }`}
                    title="등록하신 관심 키워드와 일치하는 기사만 모아봅니다."
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        onlyMyKeywordsActive ? 'fill-white text-white' : 'fill-amber-500 text-amber-500'
                      }`}
                    />
                    <span>내 관심 키워드만</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        onlyMyKeywordsActive
                          ? 'bg-amber-800 text-white'
                          : 'bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {sectorCounts.myFavoritesCount}
                    </span>
                  </button>
                )}
              </div>

              {/* Search & Sort Controls */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="헤드라인 검색 (예: GTX, 청약, PF...)"
                    className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() =>
                    setSortBy((prev) => (prev === 'latest' ? 'impact' : 'latest'))
                  }
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    sortBy === 'impact'
                      ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title="정렬 기준 변경"
                >
                  <SlidersHorizontal className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>{sortBy === 'latest' ? '최신순' : '파급도순'}</span>
                </button>
              </div>
              </div>

              {/* Local Government (지자체: 시/도 · 시/군/구) Dropdown Filter Row */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                {/* Recent 3 Looked-up Regions (Quick Re-select Bar above dropdowns) */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap mr-0.5">
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                      <span>최근 조회</span>
                    </span>

                    {recentRegions.length > 0 ? (
                      recentRegions.map((item) => {
                        const isActive =
                          selectedSido === item.sidoCode && selectedSigungu === item.sigungu;
                        return (
                          <button
                            key={`${item.sidoCode}:${item.sigungu}`}
                            type="button"
                            onClick={() => handleSelectRegion(item.sidoCode, item.sigungu)}
                            aria-pressed={isActive}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer whitespace-nowrap ${
                              isActive
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-bold'
                                : 'bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/60 text-slate-700 dark:text-slate-200 border-slate-300/90 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700'
                            }`}
                            title={`${item.label} 지역 기사 빠르게 다시 보기`}
                          >
                            <MapPin
                              className={`w-3 h-3 shrink-0 ${
                                isActive ? 'text-white' : 'text-amber-600 dark:text-amber-400'
                              }`}
                              aria-hidden="true"
                            />
                            <span>{item.label}</span>
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        아래에서 지자체를 선택하면 최근 3개 지역이 자동 기록됩니다.
                      </span>
                    )}
                  </div>

                  {recentRegions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearRecentRegions}
                      className="text-[11px] font-medium text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition cursor-pointer whitespace-nowrap"
                      title="최근 조회 지자체 기록 비우기"
                    >
                      기록 비우기
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                    <span>지자체별 모아보기</span>
                  </span>

                  {/* Si/Do Dropdown */}
                  <select
                    value={selectedSido}
                    onChange={(e) => {
                      const nextSido = e.target.value;
                      handleSelectRegion(nextSido, 'all');
                    }}
                    aria-label="시/도 지자체 선택"
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer focus:outline-none focus:border-amber-500 ${
                      selectedSido !== 'all'
                        ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <option value="all">시/도 전체 (전국)</option>
                    {KOREAN_REGIONS.map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.name}
                      </option>
                    ))}
                  </select>

                  {/* Si/Gun/Gu Dropdown */}
                  <select
                    value={selectedSigungu}
                    onChange={(e) => {
                      const nextSigungu = e.target.value;
                      handleSelectRegion(selectedSido, nextSigungu);
                    }}
                    disabled={selectedSido === 'all' || sigunguOptions.length === 0}
                    aria-label="시/군/구 지자체 선택"
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition focus:outline-none focus:border-amber-500 ${
                      selectedSido === 'all'
                        ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        : selectedSigungu !== 'all'
                        ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 cursor-pointer'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
                    }`}
                  >
                    <option value="all">
                      {selectedSido === 'all'
                        ? '시/도 먼저 선택'
                        : `${activeSidoRegion?.shortName || ''} 시/군/구 전체`}
                    </option>
                    {sigunguOptions.map((sg) => (
                      <option key={sg} value={sg}>
                        {sg}
                      </option>
                    ))}
                  </select>

                  {selectedSido !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleSelectRegion('all', 'all')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                      <span>지역 초기화</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedSido !== 'all' ? (
                    <span className="font-semibold text-amber-800 dark:text-amber-300 font-mono tabular-nums">
                      선택 지역: {activeSidoRegion?.name}
                      {selectedSigungu !== 'all' ? ` · ${selectedSigungu}` : ''} ({filteredHeadlines.length}건)
                    </span>
                  ) : (
                    <span>시/도 및 시/군/구 단위로 관련 기사를 필터링할 수 있습니다.</span>
                  )}
                </div>
                </div>
              </div>
            </div>

            {/* Active Preferences Indicator Banner */}
            {isCustomized && !isSettingsOpen && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl px-4 py-2 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
                    <span>개인 관심설정 적용:</span>
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    섹터 ({prefs.enabledSectors.map((s) => s === 'construction' ? '건설' : s === 'realestate' ? '부동산' : s === 'urban' ? '도시개발' : '금융').join(', ')})
                  </span>
                  {prefs.favoriteKeywords.length > 0 && (
                    <span className="text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/70 px-2 py-0.5 rounded-full font-medium text-[11px]">
                      관심 키워드 {prefs.favoriteKeywords.length}개
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white font-bold underline cursor-pointer text-[11px] shrink-0"
                >
                  설정 변경
                </button>
              </div>
            )}

            {/* Headlines Grid / List */}
            {filteredHeadlines.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2 px-4">
                <Building className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {selectedSido !== 'all'
                    ? `${activeSidoRegion?.name || ''}${selectedSigungu !== 'all' ? ` ${selectedSigungu}` : ''} 관련 조건에 부합하는 기사가 없습니다.`
                    : '선택된 조건에 부합하는 기사가 없습니다.'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {selectedSido !== 'all'
                    ? '상위 광역 시/도 전체를 보거나 지역 필터를 초기화하면 모든 기사를 확인할 수 있습니다.'
                    : onlyMyKeywordsActive
                    ? '내 관심 키워드 필터를 해제하거나 [관심분야 개인설정]에서 키워드를 추가해보세요.'
                    : '다른 섹터 탭을 클릭하거나 검색어를 비워보세요.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {selectedSido !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSido('all');
                        setSelectedSigungu('all');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      지역 필터 초기화
                    </button>
                  )}
                  {onlyMyKeywordsActive && (
                    <button
                      type="button"
                      onClick={() => setOnlyMyKeywordsActive(false)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      전체 기사 보기로 전환
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={
                  isMobileView
                    ? 'grid grid-cols-1 gap-3'
                    : 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5'
                }
              >
                {filteredHeadlines.map((item) => {
                  const isConstruction = item.sector === 'construction';
                  const isRealEstate = item.sector === 'realestate';
                  const isUrban = item.sector === 'urban';
                  const outletMeta = PRESS_OUTLETS.find(
                    (p) => p.id === item.outletId || p.name === item.outletName
                  );
                  const leadLines = getSectorLeadLines(item);

                  const borderColor = isConstruction
                    ? 'border-l-amber-500'
                    : isRealEstate
                    ? 'border-l-emerald-500'
                    : isUrban
                    ? 'border-l-cyan-500'
                    : 'border-l-indigo-500';

                  const badgeBg = isConstruction
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : isRealEstate
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : isUrban
                    ? 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-900 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                    : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';

                  const isRead = isArticleRead(readArticleKeys, item);
                  const isSpeaking = activeSpeechItemId === item.id;
                  const isFavoriteMatch = doesItemMatchFavorites(
                    item,
                    prefs.favoriteKeywords
                  );
                  const isItemFallback = isFallback || Boolean(item.isFallback) || item.sourceType === 'mock';
                  const publishedTimeLabel =
                    item.publishedAt && item.publishedAt.includes(' ')
                      ? item.publishedAt.split(' ').slice(1).join(' ')
                      : item.publishedAt || '실시간';

                  return (
                    <article
                      key={item.id}
                      onClick={() => onOpenArticleModal(adaptToNewsStory(item))}
                      className={`border rounded-2xl p-4 sm:p-5 border-l-4 ${borderColor} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer group ${
                        isSpeaking
                          ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500 ring-2 ring-amber-300/70 dark:ring-amber-500/40'
                          : isRead
                          ? 'bg-slate-50/75 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                          : 'bg-white dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600'
                      } ${
                        !isSpeaking && isFavoriteMatch && !isRead ? 'ring-1 ring-amber-300/80 dark:ring-amber-600/60 bg-amber-50/20 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Card Top: Outlet & Meta info (Section 1 parity) */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-md shadow-xs ${
                                outletMeta?.badgeColor || 'bg-slate-800 text-white'
                              }`}
                            >
                              {outletMeta?.logoText || item.outletName}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${badgeBg}`}
                            >
                              {item.sectorLabel}
                            </span>
                            {item.highlightBadge && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {item.highlightBadge}
                              </span>
                            )}
                            {isSpeaking && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-600 text-white">
                                <Volume2 className="w-2.5 h-2.5" aria-hidden="true" />
                                <span>읽는 중</span>
                              </span>
                            )}
                            {isFavoriteMatch && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                <span>관심 매칭</span>
                              </span>
                            )}
                            {isRead && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/70 dark:border-slate-700">
                                <Check className="w-2.5 h-2.5" />
                                <span>읽은 기사</span>
                              </span>
                            )}
                          </div>
                          {isItemFallback ? (
                            <FallbackBadge label="샘플 데이터" size="xs" variant="outline" />
                          ) : (
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded font-semibold border border-emerald-200/70 dark:border-emerald-800/70 shrink-0">
                              {publishedTimeLabel}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          className={`text-base font-bold transition-colors leading-snug mb-3 ${
                            isRead
                              ? 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                              : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                          }`}
                          title={isRead ? '읽은 기사 · 클릭하여 다시 확인' : '원기사 발췌 및 포털 확인'}
                        >
                          {item.title}
                        </h3>

                        {/* 3+1 / 3-line Core Summary Box (Exact Section 1 Style) */}
                        <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1.5 mb-3">
                          {leadLines.slice(0, 4).map((line, idx) => {
                            const cleanLine = line.replace(/^[0-9]+[.)]\s*/, '').trim();
                            const isInsightLine = cleanLine.startsWith('[시사점]');
                            if (isInsightLine) {
                              const insightText = cleanLine.replace(/^\[시사점\]\s*/, '');
                              return (
                                <p
                                  key={idx}
                                  className="text-xs sm:text-[13px] text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium pt-1.5 border-t border-slate-200/70 dark:border-slate-800"
                                >
                                  <span className="inline-block text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded mr-1.5 align-middle">
                                    시사점
                                  </span>
                                  <span className="align-middle">{insightText}</span>
                                </p>
                              );
                            }
                            return (
                              <p
                                key={idx}
                                className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal"
                              >
                                {cleanLine}
                              </p>
                            );
                          })}
                        </div>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {item.tags.map((tag) => {
                              const isKwMatched = prefs.favoriteKeywords.some((fk) =>
                                tag.toLowerCase().includes(fk.toLowerCase())
                              );
                              return (
                                <span
                                  key={tag}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchQuery(tag);
                                  }}
                                  className={`text-[11px] px-2 py-0.5 rounded font-medium border transition ${
                                    isKwMatched
                                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-bold border-amber-300 dark:border-amber-700'
                                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 border-slate-200/60 dark:border-slate-700'
                                  }`}
                                >
                                  #{tag}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
