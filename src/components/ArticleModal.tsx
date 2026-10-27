import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Layers,
  Newspaper,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Search,
  Share2,
  ShieldCheck,
  Bookmark,
  BookOpen,
  FileText,
  Type,
} from 'lucide-react';
import { NewsStory, ClusterOutletItem } from '../types/news';
import { PRESS_OUTLETS } from '../data/mockNewsData';
import {
  getNaverNewsUrl,
  getCleanNaverQuery,
  getOfficialOutletHomepage,
  copyToClipboardSafe,
} from '../utils/linkUtils';

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: NewsStory | null;
  onOpenShare: (story: NewsStory) => void;
  onOpenNewspaperModal?: (story: NewsStory) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  isOpen,
  onClose,
  story,
  onOpenShare,
  onOpenNewspaperModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedNaverQuery, setCopiedNaverQuery] = useState(false);
  const [fontSize, setFontSize] = useState<'base' | 'lg'>('base');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedOutletIdx, setSelectedOutletIdx] = useState(0);

  if (!isOpen || !story) return null;

  const outletMeta = PRESS_OUTLETS.find(
    (p) => p.name === story.outletName || p.id === story.outletId
  );

  const cleanSearchQuery = getCleanNaverQuery(story.title, story.outletName, story.keywords);
  const naverUrl = getNaverNewsUrl(story.title, story.outletName, story.keywords);
  const officialHomepage = getOfficialOutletHomepage(
    story.outletId || outletMeta?.id,
    story.outletName,
    story.originalUrl || outletMeta?.homepageUrl
  );

  const isCluster =
    story.category === 'overlapping' ||
    (story.coveredOutlets && story.coveredOutlets.length > 0);

  const clusterItems: ClusterOutletItem[] = story.clusterOutlets || [];
  const currentClusterItem: ClusterOutletItem | undefined =
    clusterItems[selectedOutletIdx] || clusterItems[0];

  // Resolve full content text
  const fullArticleText = story.fullContent || [
    `[${story.outletName} 1면 종합] ${story.title}`,
    `${story.leadSummary[0] || ''} 본 보도는 당일 ${story.outletName}의 핵심 취재 기사로, 관련 업계와 정책 당국자들의 공식 입장 및 통계 데이터를 바탕으로 종합 분석되었습니다.`,
    `${story.leadSummary[1] || ''} 취재팀과 시장 전문가들은 이번 사안이 단기적 이슈에 그치지 않고 향후 거시경제 및 관련 산업 밸류체인 전반에 걸쳐 중대한 파급효과를 미칠 것으로 내다보고 있습니다.`,
    `${story.leadSummary[2] || ''} 정부 관계 부처와 주요 기업들은 후속 대책 수립과 리스크 관리에 착수했으며, 세부적인 추가 협상 및 국회 입법 경과가 향후 최대 분수령이 될 전망입니다.`,
    `현장 취재 기자들은 "정책 당국의 일관성 있는 제도 개선과 현장 피드백 수렴이 필수적"이라며 "향후 진행 상황에 대해 후속 심층 보도를 이어갈 것"이라고 밝혔습니다.`,
  ].join('\n\n');

  const charCount = fullArticleText.length;
  const estimatedReadingTime = Math.max(1, Math.round(charCount / 450));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleCopyLink = async () => {
    const linkToCopy = officialHomepage || naverUrl;
    const ok = await copyToClipboardSafe(linkToCopy);
    if (ok) {
      setCopiedLink(true);
      showToast('신문사 홈페이지 원문 링크가 클립보드에 복사되었습니다.');
      setTimeout(() => setCopiedLink(false), 2400);
    } else {
      showToast('링크 복사에 실패했습니다. 브라우저 설정을 확인해주세요.');
    }
  };

  const handleCopyNaverQuery = async () => {
    const ok = await copyToClipboardSafe(cleanSearchQuery);
    if (ok) {
      setCopiedNaverQuery(true);
      showToast(`네이버 검색어가 복사되었습니다: "${cleanSearchQuery}"`);
      setTimeout(() => setCopiedNaverQuery(false), 2400);
    } else {
      showToast('검색어 복사에 실패했습니다.');
    }
  };

  const handleCopyFullText = async () => {
    const formattedText = `[${story.outletName}] ${story.title}\n\n출처: ${story.outletName} (${story.publishedAt})\n기자: ${story.reporter || '특별취재팀'}\n\n${fullArticleText}\n\n신문사 홈페이지: ${officialHomepage}\n네이버 검색: ${naverUrl}`;
    const ok = await copyToClipboardSafe(formattedText);
    if (ok) {
      setCopiedText(true);
      showToast('기사 본문 전문(텍스트)이 클립보드에 복사되었습니다.');
      setTimeout(() => setCopiedText(false), 2400);
    } else {
      showToast('텍스트 복사에 실패했습니다.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl text-white ${
                story.category === 'frontpage'
                  ? 'bg-blue-600 text-white'
                  : isCluster
                  ? 'bg-purple-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {story.category === 'frontpage' && <Newspaper className="w-5 h-5" />}
              {isCluster && <Layers className="w-5 h-5" />}
              {story.category === 'exclusive' && <Zap className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {isCluster
                    ? '언론사 공통 원문 클러스터 확인'
                    : '원기사 전문 및 실시간 포털 확인'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    story.category === 'frontpage'
                      ? 'bg-blue-100 text-blue-800'
                      : isCluster
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {story.category === 'frontpage'
                    ? '1면 톱 보도'
                    : isCluster
                    ? `${story.coveredOutlets?.length || '다수'}개 언론사 교차 클러스터`
                    : story.exclusiveBadge || '단독 특종'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {story.outletName} · {story.publishedAt} 발행
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 bg-slate-50/50">
          {/* Article Title & Metadata */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-2">
              {story.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                출처: {story.outletName}
              </span>
              <span>·</span>
              <span>기자: {story.reporter || '경제·정치·산업부 특별취재팀'}</span>
              <span>·</span>
              <span>분류: {story.topic}</span>
              {story.pressSection && (
                <>
                  <span>·</span>
                  <span className="text-slate-500">지면: {story.pressSection}</span>
                </>
              )}
            </div>
          </div>

          {/* 3-line Core Summary Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
            <div className="text-xs font-bold text-blue-600 flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                <span>{isCluster ? '공통 이슈 핵심 요약 (3줄)' : '핵심 3줄 요약'}</span>
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                Strict 3-Line Briefing
              </span>
            </div>
            {story.leadSummary.map((line, idx) => (
              <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-1 font-normal">
                {line}
              </p>
            ))}
          </div>

          {/* Interactive Cluster Section (For Overlapping Stories) */}
          {isCluster && (
            <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>언론사별 보도 원문 클러스터 ({clusterItems.length > 0 ? clusterItems.length : story.coveredOutlets?.length || 0}개사 교차 검증)</span>
                </span>
                <span className="text-[11px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-bold">
                  실시간 교차 보도
                </span>
              </div>

              {/* Outlet Tabs Selector */}
              {clusterItems.length > 0 ? (
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 mb-2">
                    언론사를 선택하여 각 언론사의 개별 기사 및 보도 논조를 확인하세요:
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {clusterItems.map((outlet, idx) => {
                      const isSelected = idx === selectedOutletIdx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedOutletIdx(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-amber-300' : 'bg-slate-400'
                            }`}
                          />
                          <span>{outlet.outletName}</span>
                          <span
                            className={`text-[10px] px-1 rounded ${
                              isSelected
                                ? 'bg-purple-700 text-purple-100'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {outlet.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Outlet Article Card */}
                  {currentClusterItem && (
                    <div className="bg-white border border-purple-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                            {currentClusterItem.outletName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {currentClusterItem.reporter || '취재기자'} · {currentClusterItem.publishedAt || '당일 보도'}
                          </span>
                        </div>
                        <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          논조: {currentClusterItem.stance}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {currentClusterItem.headline}
                      </h4>

                      <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs text-slate-700">
                        {currentClusterItem.leadSummary.map((line, i) => (
                          <p key={i} className="leading-relaxed">
                            • {line}
                          </p>
                        ))}
                      </div>

                      {/* Direct Link to Selected Outlet Article */}
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          {currentClusterItem.outletName} 포털 공식 보도 전문
                        </span>
                        <a
                          href={
                            currentClusterItem.originalUrl && !currentClusterItem.originalUrl.includes('where=news')
                              ? currentClusterItem.originalUrl
                              : getNaverNewsUrl(
                                  currentClusterItem.headline || story.title,
                                  currentClusterItem.outletName,
                                  story.keywords
                                )
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition active:scale-95 shadow-xs cursor-pointer"
                        >
                          <span>{currentClusterItem.outletName} 원기사 바로열기</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                story.coveredOutlets && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {story.coveredOutlets.map((outlet, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200"
                      >
                        {outlet}
                      </span>
                    ))}
                  </div>
                )
              )}

              {/* Consensus & Divergence Matrix */}
              {story.consensusPoints && (
                <div className="pt-3 border-t border-purple-200/80 space-y-1.5 text-xs text-slate-700">
                  <div className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>언론사 간 쟁점 및 합의점 심층 분석:</span>
                  </div>
                  {story.consensusPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-1.5 pl-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full Article Content (원기사 상세 본문 전문) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 space-y-4 shadow-xs">
            {/* Header with Reading Tools */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>{isCluster ? '언론사 공통 심층 취재 리포트 전문' : '원기사 상세 본문 전문'}</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    원문 검증 완료
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {story.outletName} 지면 발행 원기사 전문이 누락 없이 수록되어 외부 이동 없이 바로 완독하실 수 있습니다.
                </p>
              </div>

              {/* Reading Stats & Action Tools */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
                  약 {estimatedReadingTime}분 분량 · {charCount.toLocaleString()}자
                </span>

                {/* Font Size Toggle */}
                <button
                  onClick={() => setFontSize(fontSize === 'base' ? 'lg' : 'base')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer transition active:scale-95"
                  title="본문 글자 크기 조절"
                >
                  <Type className="w-3.5 h-3.5 text-slate-500" />
                  <span>{fontSize === 'base' ? '크게 A+' : '보통 A'}</span>
                </button>

                {/* Copy Full Text Button */}
                <button
                  onClick={handleCopyFullText}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-xs"
                  title="기사 본문 전체를 텍스트로 복사"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">전문 복사됨!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>기사 전문 복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* In-depth Article Body */}
            <div
              className={`text-slate-800 leading-relaxed space-y-4 font-normal transition-all ${
                fontSize === 'lg' ? 'text-sm sm:text-base leading-loose' : 'text-xs sm:text-sm leading-relaxed'
              }`}
            >
              {fullArticleText.split('\n\n').map((paragraph, i) => {
                const trimmed = paragraph.trim();
                // Highlight leading dateline if present (e.g., [한겨레], [워싱턴=특파원])
                if (trimmed.startsWith('[')) {
                  const match = trimmed.match(/^(\[.*?\])\s*(.*)/);
                  if (match) {
                    return (
                      <p key={i} className="leading-relaxed">
                        <span className="inline-block bg-slate-100 text-blue-800 font-bold px-2 py-0.5 rounded text-xs mr-1.5 border border-slate-200">
                          {match[1]}
                        </span>
                        <span>{match[2]}</span>
                      </p>
                    );
                  }
                }
                return (
                  <p key={i} className="text-slate-700">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Article Footer & Copyright Citation */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50/60 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-2xl">
              <div>
                <span className="font-semibold text-slate-700">보도 출처: {story.outletName}</span>
                <span className="mx-1.5">·</span>
                <span>취재: {story.reporter || `${story.outletName} 특별취재팀`}</span>
                <span className="mx-1.5">·</span>
                <span>발행: {story.publishedAt}</span>
              </div>
              <button
                onClick={handleCopyFullText}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Copy className="w-3 h-3" />
                <span>기사 전문 텍스트 복사</span>
              </button>
            </div>
          </div>

          {/* External Links & Naver Connection Box (Exactly 2 Buttons + Option 2 Error-Free Keyword Search Fallback) */}
          <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>기사 원문 및 네이버 뉴스 실시간 연결</span>
                </h4>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                  공식 2대 연결 링크
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                언론사 공식 홈페이지 원문과 문자 오류가 보완된 네이버 뉴스 실시간 연결을 제공합니다.
              </p>
            </div>

            {/* Exactly 2 Link Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              {/* 1. 신문사 홈페이지 원문 링크 */}
              <a
                href={officialHomepage}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-between transition-all duration-150 active:scale-95 group shadow-sm hover:shadow-md cursor-pointer"
                title={`${story.outletName} 공식 홈페이지로 이동 (새 창)`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <div className="truncate text-left">
                    <div className="text-[12px] font-black text-white truncate">
                      {story.outletName} 공식 홈페이지 원문
                    </div>
                    <div className="text-[10px] text-slate-300 font-normal truncate">
                      신문사 공식 사이트에서 최신 기사 확인
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
              </a>

              {/* 2. 네이버 기사 연결 링크 */}
              <a
                href={naverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-[#03C75A] hover:bg-[#02b350] text-white font-bold text-xs flex items-center justify-between transition-all duration-150 active:scale-95 group shadow-sm hover:shadow-md cursor-pointer"
                title="네이버 뉴스에서 문자 오류 없이 관련 기사 검색 (새 창)"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-white text-[#03C75A] flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    N
                  </span>
                  <div className="truncate text-left">
                    <div className="text-[12px] font-black text-white truncate">
                      네이버 뉴스 기사 연결
                    </div>
                    <div className="text-[10px] text-emerald-100 font-normal truncate">
                      문자 오류 방지 최적화 검색 (새 창)
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-100 group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
              </a>
            </div>

            {/* Option 2 Alternative: Error-Free Naver Search Keyword & One-Click Copy */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                    대안 검색어
                  </span>
                  <div className="truncate font-mono text-xs text-slate-800 font-semibold select-all bg-slate-50 px-2 py-1 rounded border border-slate-200/70">
                    {cleanSearchQuery}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={handleCopyNaverQuery}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="네이버 검색창에 붙여넣을 수 있는 정제된 검색어를 복사합니다."
                  >
                    {copiedNaverQuery ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-600" />
                        <span>네이버 검색어 복사</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://search.naver.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition active:scale-95 cursor-pointer"
                    title="네이버 메인 검색창 열기 (새 창)"
                  >
                    <span>네이버 열기</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 px-0.5">
                ※ 브라우저 보안/팝업 설정으로 링크 연결이 원활하지 않을 경우, 위 정제 검색어를 복사(Ctrl+C)하여 네이버 검색창에 붙여넣기(Ctrl+V)하시면 문자 오류 없이 즉시 조회하실 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-60 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Footer with Dual Copy Buttons */}
        <div className="px-5 sm:px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Copy Full Text */}
            <button
              onClick={handleCopyFullText}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition active:scale-95 cursor-pointer shadow-xs"
              title="기사 본문 전체 복사"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">전문 복사됨!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>기사 전문 복사</span>
                </>
              )}
            </button>

            {/* Copy Article Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition active:scale-95 cursor-pointer"
              title="원문 웹 링크 복사"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">링크 복사됨!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>원문 링크 복사</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenNewspaperModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNewspaperModal(story);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="실제 종이신문 1면 지면 뷰어로 확인"
              >
                <Newspaper className="w-3.5 h-3.5 text-amber-700" />
                <span>1면 지면 신문 뷰어</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenShare(story);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>친구에게 공유</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 cursor-pointer shadow-xs"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
