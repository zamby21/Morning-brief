import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { SectorHeadlineItem, RealEstateFinanceSector, NewsStory } from '../types/news';

interface RealEstateFinanceSectionProps {
  headlines: SectorHeadlineItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onScrollToTop: () => void;
  onOpenArticleModal: (story: NewsStory) => void;
  onOpenShareModal: (story: NewsStory) => void;
  isMobileView?: boolean;
}

export const RealEstateFinanceSection: React.FC<RealEstateFinanceSectionProps> = ({
  headlines,
  isCollapsed,
  onToggleCollapse,
  onScrollToTop,
  onOpenArticleModal,
  onOpenShareModal,
  isMobileView = false,
}) => {
  const [selectedSector, setSelectedSector] = useState<RealEstateFinanceSector>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'impact'>('latest');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sector counts
  const sectorCounts = useMemo(() => {
    return {
      all: headlines.length,
      construction: headlines.filter((h) => h.sector === 'construction').length,
      realestate: headlines.filter((h) => h.sector === 'realestate').length,
      finance: headlines.filter((h) => h.sector === 'finance').length,
    };
  }, [headlines]);

  // Filtered and sorted headlines
  const filteredHeadlines = useMemo(() => {
    let result = headlines.filter((item) => {
      // Sector filter
      if (selectedSector !== 'all' && item.sector !== selectedSector) {
        return false;
      }

      // Search query filter
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
      result = [...result].sort((a, b) => (priority[b.impactRating || 'Medium'] || 1) - (priority[a.impactRating || 'Medium'] || 1));
    }

    return result;
  }, [headlines, selectedSector, searchQuery, sortBy]);

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
      fullContent: item.fullContent || `[${item.outletName}] ${item.title}\n\n${item.summary}\n\n[주요 관련 키워드 및 시장 분석]\n- 세부 지표: ${item.keyFigure || item.highlightBadge || '정상 집계'}\n- 관련 정책 및 기업: ${item.tags.join(', ')}\n\n본 보도는 대한민국 주요 언론사의 ${item.sectorLabel} 실시간 취재 기사 요약본입니다.`,
      reactions: { insightful: 32, important: 75, surprising: 12 },
    };
  };

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
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
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
            {/* Top 3-Sector Key Takeaway Cards */}
            <div className={isMobileView ? "grid grid-cols-1 gap-2.5" : "grid grid-cols-1 md:grid-cols-3 gap-3"}>
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
                  수도권 <strong>GTX 복선전철 민자 수주</strong>와 <strong>K-원전·플랜트 해외 200억 달러</strong> 파이프라인 가동으로 하반기 수주 반등 조짐이 나타나고 있습니다.
                </p>
              </div>

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
                  서울 강남권 <strong>분상제 로또 청약 쏠림(최고 380:1)</strong>과 <strong>1기 신도시 선도지구 특별정비계획(용적률 450%)</strong> 심의가 핵심 쟁점입니다.
                </p>
              </div>

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
                  한국은행 <strong>추가 기준금리 인하 검토</strong>와 <strong>20조 원 부동산 PF 정상화 펀드</strong> 가동으로 부실 사업장 구조조정이 속도를 내고 있습니다.
                </p>
              </div>
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
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedSector === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {sectorCounts.all}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedSector('construction')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedSector === 'construction'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <span>🏗️ 건설·시공</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedSector === 'construction' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    {sectorCounts.construction}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedSector('realestate')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedSector === 'realestate'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <span>🏢 부동산·청약</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedSector === 'realestate' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {sectorCounts.realestate}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedSector('finance')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedSector === 'finance'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-indigo-800 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <span>📈 금융·금리·PF</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedSector === 'finance' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                    {sectorCounts.finance}
                  </span>
                </button>
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
                  onClick={() => setSortBy((prev) => (prev === 'latest' ? 'impact' : 'latest'))}
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

            {/* Headlines Grid / List */}
            {filteredHeadlines.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300 space-y-1.5">
                <Building className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">선택된 조건에 부합하는 기사가 없습니다.</p>
                <p className="text-[11px] text-slate-400">다른 섹터 탭을 클릭하거나 검색어를 비워보세요.</p>
              </div>
            ) : (
              <div className={isMobileView ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5"}>
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

                  return (
                    <article
                      key={item.id}
                      onClick={() => onOpenArticleModal(adaptToNewsStory(item))}
                      className={`bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-4.5 border-l-4 ${borderColor} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer group hover:border-slate-300`}
                    >
                      {/* Card Top: Badges and metadata */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
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
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery(tag);
                              }}
                              className="text-[10px] text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-1.5 py-0.5 rounded transition"
                            >
                              #{tag}
                            </span>
                          ))}
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
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
                            title="기사 공유하기"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={item.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition flex items-center gap-1 cursor-pointer"
                            title="네이버 뉴스 검색 원문 바로가기"
                          >
                            <span>원문</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
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
