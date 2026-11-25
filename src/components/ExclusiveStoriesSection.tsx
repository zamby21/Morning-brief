import React, { useMemo } from 'react';
import {
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Check,
  Volume2,
} from 'lucide-react';
import { NewsStory } from '../types/news';
import { PRESS_OUTLETS } from '../data/pressMetadata';
import { isArticleRead } from '../utils/readArticles';
import { SectionAudioButton, useActiveSectionSpeechItemId } from './SectionAudioButton';
import type { SpeechBriefingItem } from '../utils/sectionSpeechPlayer';
import { FallbackBadge } from './FallbackNotice';

interface ExclusiveStoriesSectionProps {
  stories: NewsStory[];
  onOpenShareModal: (story: NewsStory) => void;
  onOpenArticleModal: (story: NewsStory) => void;
  onReact: (storyId: string, reactionType: 'insightful' | 'important' | 'surprising') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onScrollToTop?: () => void;
  isMobileView?: boolean;
  readArticleKeys?: ReadonlySet<string>;
  isFallback?: boolean;
}

export const ExclusiveStoriesSection: React.FC<ExclusiveStoriesSectionProps> = ({
  stories,
  onOpenShareModal,
  onOpenArticleModal,
  onReact,
  isCollapsed = false,
  onToggleCollapse,
  onScrollToTop,
  isMobileView = false,
  readArticleKeys,
  isFallback = false,
}) => {
  const readCount = stories.filter((story) => isArticleRead(readArticleKeys, story)).length;
  const activeSpeechItemId = useActiveSectionSpeechItemId('exclusive');

  const speechItems = useMemo<SpeechBriefingItem[]>(
    () =>
      stories.map((story) => ({
        id: story.id,
        outletLabel: `${story.outletName} 단독 보도`,
        title: story.title,
        summaryLines: story.leadSummary.slice(0, 4),
        aiInsight: story.aiInsight,
      })),
    [stories]
  );

  return (
    <section
      id="section-exclusive"
      className={`rounded-3xl p-4 sm:p-6 space-y-4 scroll-mt-24 shadow-2xs transition-colors border ${
        isFallback
          ? 'bg-gradient-to-b from-amber-50/55 via-white to-white dark:from-amber-950/20 dark:via-slate-900/95 dark:to-slate-900 border-amber-300/90 dark:border-amber-700/70'
          : 'bg-gradient-to-b from-rose-50/80 via-rose-50/40 to-white/90 dark:from-rose-950/35 dark:via-slate-900/90 dark:to-slate-900 border-rose-200/80 dark:border-rose-900/60'
      }`}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/80 dark:border-rose-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              3. 각 언론사 단독 및 심층 특별 보도
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                특종·단독 {stories.length}건
              </span>
              {isFallback && (
                <FallbackBadge label="수집 실패 · 샘플 데이터" size="xs" variant="solid" />
              )}
              {readCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <Check className="w-3 h-3" />
                  <span>읽음 {readCount}</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isFallback
                ? '실시간 기사 수집에 실패하여 예시 단독 보도 샘플을 표시하고 있습니다.'
                : '제목에 [단독]이 표기되고 현재 선택한 매체 수집 범위 내 중복 후보가 없는 기사를 표시합니다.'}
            </p>
          </div>
        </div>

        {/* Section Actions: Section Audio, Collapse/Expand and Scroll to Top */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <SectionAudioButton
            sectionId="exclusive"
            sectionLabel="언론사 단독 특별 보도"
            items={speechItems}
            accent="rose"
          />

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition active:scale-95 cursor-pointer"
              title={isCollapsed ? '섹션 펼치기' : '섹션 접기'}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>펼치기</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>접기</span>
                </>
              )}
            </button>
          )}

          {onScrollToTop && (
            <button
              onClick={onScrollToTop}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition active:scale-95 flex items-center gap-1 text-xs cursor-pointer"
              title="맨위로 바로가기"
            >
              <ArrowUp className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">맨위로</span>
            </button>
          )}
        </div>
      </div>

      {isCollapsed ? (
        <div
          onClick={onToggleCollapse}
          className="cursor-pointer bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 rounded-2xl p-4 text-center text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>단독·심층 보도 <strong>{stories.length}건</strong>이 접혀있습니다.</span>
          </div>
          <span className="text-rose-600 dark:text-rose-400 font-bold group-hover:underline flex items-center gap-1">
            클릭하여 펼쳐보기
            <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm shadow-xs">
          선택한 매체 수집 범위 내에서 중복 후보 없이 확인된 [단독] 표기 기사가 없습니다.
        </div>
      ) : (
        <div className={isMobileView ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
          {stories.map((story) => {
            const outletMeta = PRESS_OUTLETS.find((p) => p.name === story.outletName || p.id === story.outletId);
            const isRead = isArticleRead(readArticleKeys, story);
            const isSpeaking = activeSpeechItemId === story.id;

            return (
              <div
                key={story.id}
                className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md shadow-xs group border ${
                  isSpeaking
                    ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-500 ring-2 ring-rose-300/70 dark:ring-rose-500/40'
                    : isRead
                    ? 'bg-slate-50/75 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    : 'bg-white dark:bg-slate-900/90 border-rose-100 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-600'
                }`}
              >
                <div>
                  {/* Outlet & Meta info */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md shadow-xs ${
                          outletMeta?.badgeColor || 'bg-slate-800 text-white'
                        }`}
                      >
                        {outletMeta?.logoText || story.outletName}
                      </span>
                      <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        단독 표기
                      </span>
                      {story.topic && (
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {story.topic}
                        </span>
                      )}
                      {isSpeaking && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                          <Volume2 className="w-2.5 h-2.5" aria-hidden="true" />
                          <span>읽는 중</span>
                        </span>
                      )}
                      {isRead && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/70 dark:border-slate-700">
                          <Check className="w-2.5 h-2.5" />
                          <span>읽은 기사</span>
                        </span>
                      )}
                    </div>
                    {isFallback ? (
                      <FallbackBadge label="샘플 데이터" size="xs" variant="outline" />
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                        {(story.publishedAt && story.publishedAt.includes(' ')
                          ? story.publishedAt.split(' ')[1]
                          : story.publishedAt) || '09:00'} 집계
                      </span>
                    )}
                  </div>

                  {/* Headline */}
                  <h3
                    onClick={() => onOpenArticleModal(story)}
                    className={`text-base font-bold transition-colors leading-snug mb-3 cursor-pointer ${
                      isRead
                        ? 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        : 'text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400'
                    }`}
                    title={isRead ? '읽은 기사 · 클릭하여 다시 확인' : '원기사 발췌 및 포털 확인'}
                  >
                    {story.title}
                  </h3>

                  {/* 3+1 / 3-line Summary Box */}
                  <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1.5 mb-3">
                    {story.leadSummary.slice(0, 4).map((line, idx) => {
                      const cleanLine = line.replace(/^[0-9]+[.)]\s*/, '').trim();
                      if (cleanLine.startsWith('[시사점]')) {
                        return (
                          <p
                            key={idx}
                            className="text-xs sm:text-[13px] text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium pt-1.5 border-t border-slate-200/70 dark:border-slate-800"
                          >
                            <span className="inline-block text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded mr-1.5 align-middle">
                              시사점
                            </span>
                            <span className="align-middle">{cleanLine.replace(/^\[시사점\]\s*/, '')}</span>
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

                  {/* Keywords */}
                  {story.keywords && story.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {story.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium border border-slate-200/60 dark:border-slate-700"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
