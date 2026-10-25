import React from 'react';
import {
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowUp,
} from 'lucide-react';
import { NewsStory } from '../types/news';
import { PRESS_OUTLETS } from '../data/mockNewsData';

interface ExclusiveStoriesSectionProps {
  stories: NewsStory[];
  onOpenShareModal: (story: NewsStory) => void;
  onOpenArticleModal: (story: NewsStory) => void;
  onReact: (storyId: string, reactionType: 'insightful' | 'important' | 'surprising') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onScrollToTop?: () => void;
}

export const ExclusiveStoriesSection: React.FC<ExclusiveStoriesSectionProps> = ({
  stories,
  onOpenShareModal,
  onOpenArticleModal,
  onReact,
  isCollapsed = false,
  onToggleCollapse,
  onScrollToTop,
}) => {
  return (
    <section id="section-exclusive" className="bg-gradient-to-b from-rose-50/80 via-rose-50/40 to-white/90 border border-rose-200/80 rounded-3xl p-4 sm:p-6 space-y-4 scroll-mt-24 shadow-2xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              3. 각 언론사 단독 및 심층 특별 보도
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                특종·단독 {stories.length}건
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              다른 언론사에는 없는 해당 언론사만의 단독 취재 및 차별화된 심층 기획 보도입니다.
            </p>
          </div>
        </div>

        {/* Section Actions: Collapse/Expand and Scroll to Top */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition active:scale-95 cursor-pointer"
              title={isCollapsed ? '섹션 펼치기' : '섹션 접기'}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>펼치기</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-rose-600" />
                  <span>접기</span>
                </>
              )}
            </button>
          )}

          {onScrollToTop && (
            <button
              onClick={onScrollToTop}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition active:scale-95 flex items-center gap-1 text-xs cursor-pointer"
              title="맨위로 바로가기"
            >
              <ArrowUp className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">맨위로</span>
            </button>
          )}
        </div>
      </div>

      {isCollapsed ? (
        <div
          onClick={onToggleCollapse}
          className="cursor-pointer bg-white border border-slate-200 hover:border-rose-400 rounded-2xl p-4 text-center text-xs text-slate-600 hover:text-slate-900 transition shadow-xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-600" />
            <span>단독·심층 보도 <strong>{stories.length}건</strong>이 접혀있습니다.</span>
          </div>
          <span className="text-rose-600 font-bold group-hover:underline flex items-center gap-1">
            클릭하여 펼쳐보기
            <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm shadow-xs">
          선택하신 필터에 해당하는 단독 기사가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stories.map((story) => {
            const outletMeta = PRESS_OUTLETS.find((p) => p.name === story.outletName || p.id === story.outletId);

            return (
              <div
                key={story.id}
                className="bg-white border border-rose-100 hover:border-rose-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md shadow-xs group"
              >
                <div>
                  {/* Outlet & Meta info */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md shadow-xs ${
                          outletMeta?.badgeColor || 'bg-slate-800 text-white'
                        }`}
                      >
                        {outletMeta?.logoText || story.outletName}
                      </span>
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        단독 특종
                      </span>
                      {story.topic && (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {story.topic}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {(story.publishedAt && story.publishedAt.includes(' ')
                        ? story.publishedAt.split(' ')[1]
                        : story.publishedAt) || '09:00'} 집계
                    </span>
                  </div>

                  {/* Headline */}
                  <h3
                    onClick={() => onOpenArticleModal(story)}
                    className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors leading-snug mb-3 cursor-pointer"
                    title="원기사 전문 및 포털 확인"
                  >
                    {story.title}
                  </h3>

                  {/* 3-line Summary Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 mb-3">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between border-b border-slate-200/80 pb-1.5 mb-1.5">
                      <span className="text-slate-800">단독 취재 핵심 3줄 요약</span>
                      <span className="text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-bold text-[10px]">
                        Exclusive
                      </span>
                    </div>
                    {story.leadSummary.slice(0, 3).map((line, idx) => (
                      <p
                        key={idx}
                        className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal"
                      >
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Keywords */}
                  {story.keywords && story.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {story.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200/60"
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
