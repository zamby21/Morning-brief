import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Building,
  Coins,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Sparkles,
  ArrowUp,
  BadgeAlert,
  SlidersHorizontal,
  X,
  FileText,
  Save,
  RotateCcw,
  Star,
  Plus,
  ShieldCheck,
  Tag,
  CheckCircle2,
  BookmarkCheck,
} from 'lucide-react';
import {
  SectorHeadlineItem,
  RealEstateFinanceSector,
  NewsStory,
  SectorPreferences,
  DEFAULT_SECTOR_PREFERENCES,
} from '../types/news';

const STORAGE_KEY_SECTOR_PREFS = 'morning_brief_sector_preferences_v1';

const PRESET_KEYWORDS = [
  'GTX',
  '토목수주',
  '해외원전수주',
  '공사비현실화',
  '책임준공',
  '분상제·로또청약',
  '1기신도시·선도지구',
  '재건축·정비사업',
  '주택공급대책',
  '기준금리인하',
  '부동산PF·정상화',
  '스트레스DSR',
  '리츠·배당',
];

interface RealEstateFinanceSectionProps {
  headlines: SectorHeadlineItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onScrollToTop: () => void;
  onOpenArticleModal: (story: NewsStory) => void;
  onOpenShareModal: (story: NewsStory) => void;
  isMobileView?: boolean;
  sectorPreferences?: SectorPreferences;
  onSaveSectorPreferences?: (prefs: SectorPreferences) => void;
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
  isCollapsed,
  onToggleCollapse,
  onScrollToTop,
  onOpenArticleModal,
  onOpenShareModal,
  isMobileView = false,
  sectorPreferences,
  onSaveSectorPreferences,
}) => {
  // Personalized Sector Preferences
  const [prefs, setPrefs] = useState<SectorPreferences>(() =>
    loadLocalSectorPrefs(sectorPreferences)
  );

  // Sync with prop when prop changes from outside
  useEffect(() => {
    if (sectorPreferences && sectorPreferences.enabledSectors?.length) {
      setPrefs(sectorPreferences);
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      finance: headlines.filter((h) => h.sector === 'finance').length,
      myFavoritesCount: headlines.filter((h) =>
        doesItemMatchFavorites(h, prefs.favoriteKeywords)
      ).length,
    };
  }, [headlines, prefs.favoriteKeywords]);

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

      // 4. Free-text Search Query
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
  }, [headlines, selectedSector, prefs, onlyMyKeywordsActive, searchQuery, sortBy]);

  // Save Settings handler
  const handleSavePreferences = (newPrefs: SectorPreferences) => {
    setPrefs(newPrefs);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SECTOR_PREFS, JSON.stringify(newPrefs));
      } catch (e) {
        console.warn('Failed to save sector prefs to localStorage', e);
      }
    }
    if (onSaveSectorPreferences) {
      onSaveSectorPreferences(newPrefs);
    }
    setSaveSuccessBadge(true);
    setTimeout(() => setSaveSuccessBadge(false), 2600);
  };

  // Toggle Sector in preferences
  const handleToggleSector = (sector: 'construction' | 'realestate' | 'finance') => {
    const current = prefs.enabledSectors || ['construction', 'realestate', 'finance'];
    let next: ('construction' | 'realestate' | 'finance')[];
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
  };

  // Copy article link helper
  const handleCopyLink = async (item: SectorHeadlineItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(item.originalUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = item.originalUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  // Adapter to convert SectorHeadlineItem to NewsStory for modals
  const adaptToNewsStory = (item: SectorHeadlineItem): NewsStory => {
    return {
      id: item.id,
      outletId: item.outletId,
      outletName: item.outletName,
      category: 'exclusive',
      title: item.title,
      leadSummary: [
        `1. ${item.summary}`,
        `2. 관련 핵심 동향 및 정책: ${item.tags.join(', ')}`,
        `3. 시장 지표/핵심 수치: ${item.keyFigure || item.highlightBadge || '관련 보도 확인'}`,
      ],
      originalUrl: item.originalUrl,
      publishedAt: item.publishedAt,
      keywords: item.tags,
      topic: item.sectorLabel,
      exclusiveBadge: item.highlightBadge || item.sectorLabel,
      importanceRating: item.impactRating || 'High',
      fullContent:
        item.fullContent ||
        `[${item.outletName}] ${item.title}\n\n${item.summary}\n\n[주요 관련 키워드 및 시장 분석]\n- 세부 지표: ${
          item.keyFigure || item.highlightBadge || '정상 집계'
        }\n- 관련 정책 및 기업: ${item.tags.join(
          ', '
        )}\n\n본 보도는 대한민국 주요 언론사의 ${
          item.sectorLabel
        } 실시간 취재 기사 요약본입니다.`,
      reactions: { insightful: 32, important: 75, surprising: 12 },
    };
  };

  const isCustomized =
    prefs.enabledSectors.length < 3 ||
    prefs.favoriteKeywords.length > 0 ||
    prefs.onlyCrucialOrHigh ||
    prefs.defaultSector !== 'all';

  return (
    <section id="section-realestate-finance" className="space-y-4 pt-2">
      {/* Section Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20 shrink-0">
              <Building className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  4번째 특화 브리핑
                </span>
                <span className="text-xs font-bold text-slate-400">
                  경제 5대지 및 주요 종합지 집중 취재
                </span>
                {isCustomized && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    <span>개인 관심설정 적용 중</span>
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                <span>4. 건설 · 부동산 · 금융 실시간 헤드라인 모아보기</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                  총 {headlines.length}건 집계
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                건설 수주 및 SOC 국책사업, 수도권 청약/부동산 대책, 기준금리 및 부동산 PF 구조조정 헤드라인을 섹터별로 한눈에 정리합니다.
              </p>
            </div>
          </div>

          {/* Section Action Controls */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
            {/* Personalization Setting Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs ${
                isSettingsOpen
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : isCustomized
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
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
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title={isCollapsed ? '섹션 펼치기' : '섹션 접기'}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-4 h-4 text-amber-600" />
                  <span>펼치기</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4 text-amber-600" />
                  <span>접기</span>
                </>
              )}
            </button>

            {/* Scroll to Top */}
            <button
              onClick={onScrollToTop}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="맨 위로 바로가기"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">맨위로</span>
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="mt-5 space-y-4 pt-4 border-t border-slate-100">
            {/* Personalized Sector Settings Control Panel */}
            {isSettingsOpen && (
              <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white border border-amber-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        건설 · 부동산 · 금융 관심분야 개인 맞춤 설정 (영구 저장)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
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
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition cursor-pointer flex items-center gap-1 active:scale-95"
                      title="기본값 (모든 섹터 활성화)으로 복원"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>기본값 복원</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="설정 패널 닫기"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 1. Sector Checkboxes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4 text-amber-600" />
                      <span>① 활성화할 관심 섹터 (원하는 섹터만 선택 가능)</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      선택된 섹터: {prefs.enabledSectors.length}개 / 3개
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Construction */}
                    <label
                      onClick={() => handleToggleSector('construction')}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                        prefs.enabledSectors.includes('construction')
                          ? 'bg-white border-amber-400 shadow-xs ring-1 ring-amber-300'
                          : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={prefs.enabledSectors.includes('construction')}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 text-amber-600 rounded cursor-pointer pointer-events-none"
                      />
                      <div className="text-left text-xs">
                        <div className="font-bold text-amber-900 flex items-center gap-1">
                          <span>🏗️ 건설·시공·SOC</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          GTX 민자사업, 토목 수주, K-원전·플랜트 해외수주, 공사비 현실화 등
                        </p>
                      </div>
                    </label>

                    {/* Real Estate */}
                    <label
                      onClick={() => handleToggleSector('realestate')}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                        prefs.enabledSectors.includes('realestate')
                          ? 'bg-white border-emerald-400 shadow-xs ring-1 ring-emerald-300'
                          : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={prefs.enabledSectors.includes('realestate')}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 text-emerald-600 rounded cursor-pointer pointer-events-none"
                      />
                      <div className="text-left text-xs">
                        <div className="font-bold text-emerald-900 flex items-center gap-1">
                          <span>🏢 부동산·청약·정비</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          강남 분상제 로또청약, 1기 신도시 선도지구, 3기 신도시, 재건축·재개발 등
                        </p>
                      </div>
                    </label>

                    {/* Finance */}
                    <label
                      onClick={() => handleToggleSector('finance')}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                        prefs.enabledSectors.includes('finance')
                          ? 'bg-white border-indigo-400 shadow-xs ring-1 ring-indigo-300'
                          : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={prefs.enabledSectors.includes('finance')}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 text-indigo-600 rounded cursor-pointer pointer-events-none"
                      />
                      <div className="text-left text-xs">
                        <div className="font-bold text-indigo-900 flex items-center gap-1">
                          <span>📈 금융·금리·부동산PF</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          한은 기준금리 피벗, 20조 PF 정상화펀드, 스트레스 DSR, 리츠 배당 등
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 2. Favorite Keywords & Custom Keyword Adding */}
                <div className="space-y-2 pt-2 border-t border-amber-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>② 세부 관심 키워드 (클릭하여 켜고 끄기 및 직접 추가)</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
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
                              : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
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
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
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
                      <span className="text-[11px] font-bold text-slate-500 mr-1">
                        내 관심 키워드:
                      </span>
                      {prefs.favoriteKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1"
                        >
                          <span>#{kw}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleKeyword(kw)}
                            className="text-amber-700 hover:text-amber-950 p-0.5 cursor-pointer"
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
                <div className="pt-2 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-700">기본 선택 탭:</span>
                    {(
                      [
                        { id: 'all', label: '전체' },
                        { id: 'construction', label: '건설' },
                        { id: 'realestate', label: '부동산' },
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
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-semibold">
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

                {/* Panel Footer Notice */}
                <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-semibold text-slate-700">설정 보관 상태:</span>
                    <span>
                      활성 섹터 {prefs.enabledSectors.length}개 · 관심 키워드{' '}
                      {prefs.favoriteKeywords.length}개 설정이 브라우저에 저장되어 재실행 시 유지됩니다.
                    </span>
                  </div>
                  {saveSuccessBadge && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded animate-in fade-in flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>설정이 브라우저에 저장되었습니다</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Top 3-Sector Key Takeaway Cards */}
            <div
              className={
                isMobileView
                  ? 'grid grid-cols-1 gap-2.5'
                  : 'grid grid-cols-1 md:grid-cols-3 gap-3'
              }
            >
              {/* Construction Card */}
              {prefs.enabledSectors.includes('construction') && (
                <div className="bg-gradient-to-br from-amber-50/80 to-white border border-amber-200/80 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="text-base">🏗️</span> 건설·SOC 인프라 동향
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                      {sectorCounts.construction}건
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    수도권 <strong>GTX 복선전철 민자 수주</strong>와{' '}
                    <strong>K-원전·플랜트 해외 200억 달러</strong> 파이프라인 가동으로 하반기 수주 반등 조짐이 나타나고 있습니다.
                  </p>
                </div>
              )}

              {/* Real Estate Card */}
              {prefs.enabledSectors.includes('realestate') && (
                <div className="bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-200/80 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <span className="text-base">🏢</span> 부동산·청약 동향
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      {sectorCounts.realestate}건
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    서울 강남권 <strong>분상제 로또 청약 쏠림(최고 380:1)</strong>과{' '}
                    <strong>1기 신도시 선도지구 특별정비계획(용적률 450%)</strong> 심의가 핵심 쟁점입니다.
                  </p>
                </div>
              )}

              {/* Finance Card */}
              {prefs.enabledSectors.includes('finance') && (
                <div className="bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-200/80 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <span className="text-base">📈</span> 금융·금리·PF 동향
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900">
                      {sectorCounts.finance}건
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    한국은행 <strong>추가 기준금리 인하 검토</strong>와{' '}
                    <strong>20조 원 부동산 PF 정상화 펀드</strong> 가동으로 부실 사업장 구조조정이 속도를 내고 있습니다.
                  </p>
                </div>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              {/* Sector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedSector('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedSector === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🌟 전체</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedSector === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-200 text-slate-700'
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
                        : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>🏗️ 건설·시공</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedSector === 'construction'
                          ? 'bg-amber-800 text-white'
                          : 'bg-amber-100 text-amber-800'
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
                        : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <span>🏢 부동산·청약</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedSector === 'realestate'
                          ? 'bg-emerald-800 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sectorCounts.realestate}
                    </span>
                  </button>
                )}

                {prefs.enabledSectors.includes('finance') && (
                  <button
                    onClick={() => setSelectedSector('finance')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedSector === 'finance'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-indigo-800 border border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <span>📈 금융·금리·PF</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedSector === 'finance'
                          ? 'bg-indigo-800 text-white'
                          : 'bg-indigo-100 text-indigo-800'
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
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
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
                          : 'bg-amber-200 text-amber-900'
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
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="헤드라인 검색 (예: GTX, 청약, PF...)"
                    className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
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
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="정렬 기준 변경"
                >
                  <SlidersHorizontal className="w-3 h-3 text-amber-600" />
                  <span>{sortBy === 'latest' ? '최신순' : '파급도순'}</span>
                </button>
              </div>
            </div>

            {/* Active Preferences Indicator Banner */}
            {isCustomized && !isSettingsOpen && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl px-4 py-2 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>개인 관심설정 적용:</span>
                  </span>
                  <span className="text-slate-600">
                    섹터 ({prefs.enabledSectors.map((s) => s === 'construction' ? '건설' : s === 'realestate' ? '부동산' : '금융').join(', ')})
                  </span>
                  {prefs.favoriteKeywords.length > 0 && (
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-medium text-[11px]">
                      관심 키워드 {prefs.favoriteKeywords.length}개
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer text-[11px] shrink-0"
                >
                  설정 변경
                </button>
              </div>
            )}

            {/* Headlines Grid / List */}
            {filteredHeadlines.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <Building className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">
                  선택된 조건에 부합하는 기사가 없습니다.
                </p>
                <p className="text-[11px] text-slate-400">
                  {onlyMyKeywordsActive
                    ? '내 관심 키워드 필터를 해제하거나 [관심분야 개인설정]에서 키워드를 추가해보세요.'
                    : '다른 섹터 탭을 클릭하거나 검색어를 비워보세요.'}
                </p>
                {onlyMyKeywordsActive && (
                  <button
                    onClick={() => setOnlyMyKeywordsActive(false)}
                    className="mt-1 px-3 py-1 rounded-xl bg-amber-600 text-white font-bold text-xs transition cursor-pointer"
                  >
                    전체 기사 보기로 전환
                  </button>
                )}
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
                  const isFinance = item.sector === 'finance';

                  const borderColor = isConstruction
                    ? 'border-l-amber-500'
                    : isRealEstate
                    ? 'border-l-emerald-500'
                    : 'border-l-indigo-500';

                  const badgeBg = isConstruction
                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                    : isRealEstate
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                    : 'bg-indigo-100 text-indigo-900 border-indigo-200';

                  const isCopied = copiedId === item.id;
                  const isFavoriteMatch = doesItemMatchFavorites(
                    item,
                    prefs.favoriteKeywords
                  );

                  return (
                    <article
                      key={item.id}
                      onClick={() => onOpenArticleModal(adaptToNewsStory(item))}
                      className={`bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-4.5 border-l-4 ${borderColor} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer group hover:border-slate-300 ${
                        isFavoriteMatch ? 'ring-1 ring-amber-300/80 bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Card Top: Badges and metadata */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}
                            >
                              {item.sectorLabel}
                            </span>
                            <span className="text-[11px] font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {item.outletName}
                            </span>
                            {item.highlightBadge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-rose-500" />
                                <span>{item.highlightBadge}</span>
                              </span>
                            )}
                            {isFavoriteMatch && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                <span>관심 매칭</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">
                            {item.publishedAt.split(' ').pop()}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug tracking-tight line-clamp-2">
                          {item.title}
                        </h3>

                        {/* Summary */}
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-1 mt-2.5">
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
                                className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                                  isKwMatched
                                    ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                                    : 'text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50'
                                }`}
                              >
                                #{tag}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Card Bottom: Action buttons */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenArticleModal(adaptToNewsStory(item));
                          }}
                          className="text-[11px] font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
                          <span>상세 브리핑 전문 보기</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleCopyLink(item, e)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                            title="기사 검색 링크 복사"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>복사됨</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>링크 복사</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenShareModal(adaptToNewsStory(item));
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="친구에게 공유하기"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
