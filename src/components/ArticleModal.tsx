import React, { useState, useEffect } from 'react';
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
  Type,
  Camera,
} from 'lucide-react';
import { NewsStory, ClusterOutletItem, ArticleContentBlock } from '../types/news';
import { PRESS_OUTLETS } from '../data/mockNewsData';
import {
  getNaverNewsUrl,
  getCleanNaverQuery,
  getOfficialOutletHomepage,
  getArticleOrOutletUrl,
  copyToClipboardSafe,
  openExternalSafe,
} from '../utils/linkUtils';

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: NewsStory | null;
  onOpenShare: (story: NewsStory) => void;
  isRead?: boolean;
  onToggleReadStatus?: (story: NewsStory) => void;
}

const ArticlePhoto: React.FC<{ url: string; caption?: string; alt: string }> = ({
  url,
  caption,
  alt,
}) => {
  const [stage, setStage] = useState<'proxy' | 'direct' | 'failed'>('proxy');

  useEffect(() => {
    setStage('proxy');
  }, [url]);

  if (!url || stage === 'failed') return null;

  const src =
    stage === 'proxy' ? `/api/image-proxy?url=${encodeURIComponent(url)}` : url;

  return (
    <figure className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
      <div className="bg-slate-100/70 dark:bg-slate-950 flex items-center justify-center">
        <img
          src={src}
          alt={caption || alt}
          loading="lazy"
          referrerPolicy={stage === 'direct' ? 'no-referrer' : undefined}
          onError={() => {
            setStage((prev) => (prev === 'proxy' ? 'direct' : 'failed'));
          }}
          className="w-full max-h-[480px] object-contain mx-auto block"
        />
      </div>
      {caption && (
        <figcaption className="px-3.5 py-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/70 dark:border-slate-800 flex items-start gap-1.5 leading-relaxed">
          <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{caption}</span>
        </figcaption>
      )}
    </figure>
  );
};

export const ArticleModal: React.FC<ArticleModalProps> = ({
  isOpen,
  onClose,
  story,
  onOpenShare,
  isRead = true,
  onToggleReadStatus,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedNaverQuery, setCopiedNaverQuery] = useState(false);
  const [fontSize, setFontSize] = useState<'base' | 'lg'>('base');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedOutletIdx, setSelectedOutletIdx] = useState(0);

  useEffect(() => {
    setSelectedOutletIdx(0);
  }, [story?.id]);

  if (!isOpen || !story) return null;

  const outletMeta = PRESS_OUTLETS.find(
    (p) => p.name === story.outletName || p.id === story.outletId
  );

  const isCluster =
    story.category === 'overlapping' ||
    (story.coveredOutlets && story.coveredOutlets.length > 0);

  const clusterItems: ClusterOutletItem[] =
    story.clusterOutlets && story.clusterOutlets.length > 0
      ? story.clusterOutlets
      : isCluster && story.coveredOutlets && story.coveredOutlets.length > 0
      ? story.coveredOutlets.map((outletName) => {
          const meta = PRESS_OUTLETS.find(
            (p) =>
              p.name === outletName ||
              p.logoText === outletName ||
              outletName.includes(p.name) ||
              p.name.includes(outletName)
          );
          const matchedPoint = story.consensusPoints?.find((pt) => pt.includes(`[${outletName}]`));
          const extractedHeadline = matchedPoint
            ? matchedPoint.replace(/^\[[^\]]+\]\s*/, '').trim()
            : story.title.replace(/^\[[^\]]+\]\s*/, '').trim();
          return {
            outletId: meta?.id || outletName,
            outletName: meta?.name || outletName,
            category: meta?.category === 'economy' ? '경제지' : '종합지',
            headline: extractedHeadline,
            leadSummary: story.leadSummary,
            stance: '주요 집중 보도',
            originalUrl: meta?.homepageUrl || getOfficialOutletHomepage(meta?.id, outletName),
            publishedAt: story.publishedAt,
            reporter: `${meta?.name || outletName} 편집국`,
          };
        })
      : [];

  const currentClusterItem: ClusterOutletItem | undefined =
    clusterItems[selectedOutletIdx] || clusterItems[0];

  // Dynamically adapt active outlet and title based on selected tab for clusters
  const activeOutletName =
    isCluster && currentClusterItem ? currentClusterItem.outletName : story.outletName;
  const activeOutletMeta = PRESS_OUTLETS.find(
    (p) => p.name === activeOutletName || p.id === (isCluster && currentClusterItem ? currentClusterItem.outletId : story.outletId)
  );
  const activeOutletId =
    isCluster && currentClusterItem
      ? currentClusterItem.outletId || activeOutletMeta?.id
      : story.outletId || activeOutletMeta?.id || outletMeta?.id;
  const activeTitle =
    isCluster && currentClusterItem ? currentClusterItem.headline || story.title : story.title;
  const activeOriginalUrl =
    isCluster && currentClusterItem ? currentClusterItem.originalUrl : story.originalUrl;

  const cleanSearchQuery = getCleanNaverQuery(activeTitle, activeOutletName, story.keywords);
  const naverUrl =
    !isCluster && story.naverUrl
      ? story.naverUrl
      : getNaverNewsUrl(activeTitle, activeOutletName, story.keywords);
  const isPortalOrAggregatorUrl =
    !!activeOriginalUrl &&
    (activeOriginalUrl.includes('naver.com') ||
      activeOriginalUrl.includes('news.google.com') ||
      activeOriginalUrl.includes('google.com') ||
      activeOriginalUrl.includes('daum.net'));
  const candidateOriginUrl =
    !isPortalOrAggregatorUrl && activeOriginalUrl
      ? activeOriginalUrl
      : activeOutletMeta?.homepageUrl || outletMeta?.homepageUrl;
  const officialArticleUrl = getArticleOrOutletUrl(
    activeOutletId,
    activeOutletName,
    activeTitle,
    story.keywords,
    candidateOriginUrl
  );
  const officialHomepage = getOfficialOutletHomepage(
    activeOutletId,
    activeOutletName,
    candidateOriginUrl
  );

  // Resolve ordered blocks, lead photo, and full verbatim text (synced with cluster tab if active)
  const activeBlocks: ArticleContentBlock[] =
    isCluster && currentClusterItem?.articleBlocks && currentClusterItem.articleBlocks.length > 0
      ? currentClusterItem.articleBlocks
      : story.articleBlocks && story.articleBlocks.length > 0
      ? story.articleBlocks
      : [];

  const activeLeadImage =
    (isCluster && currentClusterItem?.leadImage) || story.leadImage;
  const activeLeadImageCaption =
    (isCluster && currentClusterItem?.leadImageCaption) || story.leadImageCaption;
  const activeReporter =
    (isCluster && currentClusterItem?.reporter) || story.reporter || `${activeOutletName} 편집국`;
  const activePublishedAt =
    (isCluster && currentClusterItem?.publishedAt) || story.publishedAt;

  const textFromBlocks = activeBlocks
    .filter((b) => (b.type === 'text' || b.type === 'subheading') && b.text)
    .map((b) => b.text!.trim())
    .join('\n\n');

  const fullArticleText =
    (isCluster && currentClusterItem?.fullContent && currentClusterItem.fullContent.trim()) ||
    (story.fullContent && story.fullContent.trim()) ||
    textFromBlocks ||
    story.leadSummary.join('\n\n');

  const inlineImageCount = activeBlocks.filter((b) => b.type === 'image' && !!b.url).length;
  const photoCount = inlineImageCount > 0 ? inlineImageCount : activeLeadImage ? 1 : 0;

  const charCount = fullArticleText.length;
  const estimatedReadingTime = Math.max(1, Math.round(charCount / 450));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleCopyNaverQuery = async () => {
    const ok = await copyToClipboardSafe(cleanSearchQuery);
    if (ok) {
      setCopiedNaverQuery(true);
      showToast(`네이버 정제 검색어 복사 완료: "${cleanSearchQuery}"`);
      setTimeout(() => setCopiedNaverQuery(false), 2400);
    } else {
      showToast('검색어 복사에 실패했습니다.');
    }
  };

  const handleCopyFullText = async () => {
    const formattedText = `[${activeOutletName}] ${activeTitle}\n\n출처: ${activeOutletName} (${activePublishedAt})\n기자: ${activeReporter}\n\n${fullArticleText}\n\n신문사 홈페이지: ${officialHomepage}\n네이버 검색: ${naverUrl}`;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/70">
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
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isCluster
                    ? '언론사 공통 원문 클러스터 확인'
                    : '원기사 전문 및 실시간 포털 확인'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    story.category === 'frontpage'
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                      : isCluster
                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {story.category === 'frontpage'
                    ? story.pressSection && story.pressSection !== '첫화면 중앙 톱'
                      ? story.exclusiveBadge || story.pressSection
                      : '첫화면 중앙 1면 톱'
                    : isCluster
                    ? `${story.coveredOutlets?.length || '다수'}개 언론사 교차 클러스터`
                    : story.exclusiveBadge || '단독 특종'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {story.outletName} · {story.publishedAt} 발행
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onToggleReadStatus && (
              <button
                type="button"
                onClick={() => onToggleReadStatus(story)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer active:scale-95 ${
                  isRead
                    ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-300/70 dark:hover:bg-slate-700'
                    : 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/70'
                }`}
                title={isRead ? '클릭하여 안 읽은 기사로 변경' : '클릭하여 읽은 기사로 표시'}
              >
                <Check className="w-3 h-3" />
                <span>{isRead ? '읽은 기사' : '읽음 표시'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/40">
          {/* Article Title & Metadata */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2">
              {story.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                출처: {story.outletName}
              </span>
              <span>·</span>
              <span>기자: {story.reporter || '경제·정치·산업부 특별취재팀'}</span>
              <span>·</span>
              <span>분류: {story.topic}</span>
              {story.pressSection && (
                <>
                  <span>·</span>
                  <span className="text-slate-500 dark:text-slate-400">지면: {story.pressSection}</span>
                </>
              )}
            </div>
          </div>

          {/* 3-line Core Summary Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-xs">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  {story.leadSummary.some((l) => l.trim().startsWith('[시사점]'))
                    ? '인사이트 핵심 요약 (요약 3줄 + 시사점 1줄 · 개조식)'
                    : isCluster
                    ? '공통 이슈 핵심 요약 (3줄)'
                    : '핵심 3줄 요약'}
                </span>
              </span>
              <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                {story.leadSummary.some((l) => l.trim().startsWith('[시사점]'))
                  ? '3+1 Deep Insight'
                  : 'Strict 3-Line Briefing'}
              </span>
            </div>
            {story.leadSummary.map((line, idx) => {
              const cleanLine = line.replace(/^[0-9]+[.)]\s*/, '').trim();
              if (cleanLine.startsWith('[시사점]')) {
                return (
                  <p key={idx} className="text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 leading-relaxed pl-1 font-medium pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="inline-block text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded mr-1.5 align-middle">
                      시사점
                    </span>
                    <span className="align-middle">{cleanLine.replace(/^\[시사점\]\s*/, '')}</span>
                  </p>
                );
              }
              return (
                <p key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed pl-1 font-normal">
                  {cleanLine}
                </p>
              );
            })}
          </div>

          {/* Interactive Cluster Section (For Overlapping Stories) */}
          {isCluster && (
            <div className="bg-purple-50/50 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-800/70 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>언론사별 보도 원문 클러스터 ({clusterItems.length > 0 ? clusterItems.length : story.coveredOutlets?.length || 0}개사 교차 검증)</span>
                </span>
                <span className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded font-bold">
                  실시간 교차 보도
                </span>
              </div>

              {/* Outlet Tabs Selector */}
              {clusterItems.length > 0 ? (
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2">
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
                              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
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
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
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
                    <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/70 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300">
                            {currentClusterItem.outletName}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {currentClusterItem.reporter || '취재기자'} · {currentClusterItem.publishedAt || '당일 보도'}
                          </span>
                        </div>
                        <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          논조: {currentClusterItem.stance}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {currentClusterItem.headline}
                      </h4>

                      <div className="bg-slate-50 dark:bg-slate-800/70 rounded-lg p-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                        {currentClusterItem.leadSummary.map((line, i) => {
                          const clean = line.replace(/^[0-9]+[.)]\s*/, '').trim();
                          if (clean.startsWith('[시사점]')) {
                            return (
                              <p
                                key={i}
                                className="leading-relaxed text-indigo-900 dark:text-indigo-200 font-medium pt-1 border-t border-slate-200/70 dark:border-slate-700/70"
                              >
                                <span className="inline-block text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded mr-1.5">
                                  시사점
                                </span>
                                {clean.replace(/^\[시사점\]\s*/, '')}
                              </p>
                            );
                          }
                          return (
                            <p key={i} className="leading-relaxed">
                              {clean.startsWith('▪') || clean.startsWith('•') ? clean : `• ${clean}`}
                            </p>
                          );
                        })}
                      </div>

                      {/* Sync notice pointing to the unified original article section below */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        선택하신 <strong className="text-slate-700 dark:text-slate-200">{currentClusterItem.outletName}</strong> 기준으로 하단 <strong className="text-blue-600 dark:text-blue-400">기사 원문 바로가기 및 대안 검색</strong>이 자동 연동됩니다.
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
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        {outlet}
                      </span>
                    ))}
                  </div>
                )
              )}

              {/* Consensus & Divergence Matrix */}
              {story.consensusPoints && (
                <div className="pt-3 border-t border-purple-200/80 dark:border-purple-800/60 space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                  <div className="font-bold text-purple-900 dark:text-purple-200 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>언론사 간 쟁점 및 합의점 심층 분석:</span>
                  </div>
                  {story.consensusPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-1.5 pl-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full Article Content (원기사 상세 본문 전문) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
            {/* Header with Reading Tools */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2 flex-wrap">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>
                  {isCluster && currentClusterItem
                    ? `${currentClusterItem.outletName} 보도 원문 전문`
                    : '원기사 보도 전문'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {photoCount > 0 ? `원문·사진 ${photoCount}장` : '원문 전문'}
                </span>
              </h4>

              {/* Reading Stats & Action Tools */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-mono">
                  {photoCount > 0 ? `사진 ${photoCount}장 · ` : ''}약 {estimatedReadingTime}분 분량 · {charCount.toLocaleString()}자
                </span>

                {/* Font Size Toggle */}
                <button
                  onClick={() => setFontSize(fontSize === 'base' ? 'lg' : 'base')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition active:scale-95"
                  title="본문 글자 크기 조절"
                >
                  <Type className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{fontSize === 'base' ? '크게 A+' : '보통 A'}</span>
                </button>
              </div>
            </div>

            {/* Verbatim Original Article Body with Inline Photos & Subheadings */}
            <div
              className={`text-slate-800 dark:text-slate-200 leading-relaxed space-y-4 font-normal transition-all ${
                fontSize === 'lg' ? 'text-sm sm:text-base leading-loose' : 'text-xs sm:text-sm leading-relaxed'
              }`}
            >
              {activeBlocks.length > 0 ? (
                <>
                  {inlineImageCount === 0 && activeLeadImage && (
                    <ArticlePhoto
                      url={activeLeadImage}
                      caption={activeLeadImageCaption}
                      alt={activeTitle}
                    />
                  )}
                  {activeBlocks.map((block, i) => {
                    if (block.type === 'image' && block.url) {
                      return (
                        <ArticlePhoto
                          key={`img-${i}`}
                          url={block.url}
                          caption={block.caption}
                          alt={activeTitle}
                        />
                      );
                    }
                    if (block.type === 'subheading' && block.text) {
                      return (
                        <h5
                          key={`sub-${i}`}
                          className="border-l-[3px] border-blue-500 pl-3 py-1 text-slate-900 dark:text-white font-bold text-[13px] sm:text-[15px] leading-snug bg-slate-50/90 dark:bg-slate-800/50 rounded-r-lg"
                        >
                          {block.text}
                        </h5>
                      );
                    }
                    if (block.type === 'text' && block.text) {
                      const trimmed = block.text.trim();
                      if (trimmed.startsWith('[')) {
                        const match = trimmed.match(/^(\[.*?\])\s*(.*)/);
                        if (match) {
                          return (
                            <p key={`txt-${i}`} className="leading-relaxed text-slate-700 dark:text-slate-200">
                              <span className="inline-block bg-slate-100 dark:bg-slate-800 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded text-xs mr-1.5 border border-slate-200 dark:border-slate-700">
                                {match[1]}
                              </span>
                              <span>{match[2]}</span>
                            </p>
                          );
                        }
                      }
                      return (
                        <p key={`txt-${i}`} className="text-slate-700 dark:text-slate-200 leading-relaxed">
                          {trimmed}
                        </p>
                      );
                    }
                    return null;
                  })}
                </>
              ) : (
                <>
                  {activeLeadImage && (
                    <ArticlePhoto
                      url={activeLeadImage}
                      caption={activeLeadImageCaption}
                      alt={activeTitle}
                    />
                  )}
                  {fullArticleText.split('\n\n').map((paragraph, i) => {
                    const trimmed = paragraph.trim();
                    if (!trimmed) return null;
                    if (trimmed.startsWith('[')) {
                      const match = trimmed.match(/^(\[.*?\])\s*(.*)/);
                      if (match) {
                        return (
                          <p key={i} className="leading-relaxed text-slate-700 dark:text-slate-200">
                            <span className="inline-block bg-slate-100 dark:bg-slate-800 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded text-xs mr-1.5 border border-slate-200 dark:border-slate-700">
                              {match[1]}
                            </span>
                            <span>{match[2]}</span>
                          </p>
                        );
                      }
                    }
                    return (
                      <p key={i} className="text-slate-700 dark:text-slate-200 leading-relaxed">
                        {trimmed}
                      </p>
                    );
                  })}
                </>
              )}
            </div>

            {/* Article Footer & Copyright Citation */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/50 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-2xl">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">보도 출처: {activeOutletName}</span>
                <span className="mx-1.5">·</span>
                <span>취재: {activeReporter}</span>
                <span className="mx-1.5">·</span>
                <span>발행: {activePublishedAt}</span>
              </div>
              <button
                onClick={handleCopyFullText}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300">전문 복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>기사 전문 텍스트 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* External Link & Alternative Search Box */}
          <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>기사 원문 바로가기 및 대안 검색</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  언론사 공식 홈페이지 원문 이동과 언론사명·제목 기반 네이버 대안 검색을 제공합니다.
                </p>
              </div>
              <span className="self-start sm:self-center text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-full shrink-0">
                공식 원문 연결
              </span>
            </div>

            {/* Official Press Outlet Direct Link (Full-Width Balanced CTA) */}
            <a
              href={officialArticleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3.5 sm:px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 text-white font-bold text-xs flex items-center justify-between gap-3 transition-all duration-150 active:scale-[0.99] group shadow-sm hover:shadow-md cursor-pointer"
              title={`${activeOutletName} 공식 홈페이지 원문/기사로 이동 (새 창)`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20">
                  <Building2 className="w-4 h-4" />
                </span>
                <div className="min-w-0 text-left">
                  <div className="text-[13px] font-black text-white truncate">
                    {activeOutletName} 공식 홈페이지 원문
                  </div>
                  <div className="text-[11px] text-slate-300 font-normal truncate">
                    공식 언론사 사이트 원문 및 최신 보도 바로 확인 (새 창)
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-200 group-hover:text-white bg-white/10 group-hover:bg-white/15 px-2.5 py-1.5 rounded-lg shrink-0 transition">
                <span className="hidden sm:inline">원문 열기</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </a>

            {/* Alternative Search Query & One-Click Copy / Open Naver */}
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md shrink-0">
                    대안 검색어
                  </span>
                  <div className="break-words font-mono text-xs text-slate-800 dark:text-slate-100 font-semibold select-all bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-slate-700 leading-snug flex-1 min-w-0">
                    {cleanSearchQuery}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={handleCopyNaverQuery}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="네이버 검색창에 붙여넣을 수 있는 정제된 검색어를 복사합니다."
                  >
                    {copiedNaverQuery ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>검색어 복사</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://search.naver.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={async (e) => {
                      e.preventDefault();
                      await copyToClipboardSafe(cleanSearchQuery);
                      setCopiedNaverQuery(true);
                      showToast(`검색어 "${cleanSearchQuery}" 복사 완료! 네이버 검색창에 붙여넣기(Ctrl+V)하세요.`);
                      openExternalSafe('https://search.naver.com');
                      setTimeout(() => setCopiedNaverQuery(false), 2400);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#03C75A] hover:bg-[#02b350] transition active:scale-95 cursor-pointer shadow-2xs"
                    title="검색어를 자동 복사한 뒤 네이버 메인 검색창을 엽니다."
                  >
                    <span>자동 복사 후 네이버 열기</span>
                    <ExternalLink className="w-3 h-3 text-white" />
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/70 leading-relaxed">
                ※ 원문 직접 연결이 차단되는 환경에서는 [자동 복사 후 네이버 열기]를 누르신 뒤 네이버 검색창에 붙여넣기(Ctrl+V 또는 길게 터치)하시면 해당 언론사 기사를 바로 찾으실 수 있습니다.
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

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenShare(story);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
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
  );
};
