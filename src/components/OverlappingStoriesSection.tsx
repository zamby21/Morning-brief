import React from 'react';
import {
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
} from 'lucide-react';
import { NewsStory } from '../types/news';

interface OverlappingStoriesSectionProps {
  stories: NewsStory[];
  onOpenShareModal: (story: NewsStory) => void;
  onOpenArticleModal: (story: NewsStory) => void;
  onReact: (storyId: string, reactionType: 'insightful' | 'important' | 'surprising') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onScrollToTop?: () => void;
}

export const OverlappingStoriesSection: React.FC<OverlappingStoriesSectionProps> = ({
  stories,
  onOpenShareModal,
  onOpenArticleModal,
  onReact,
  isCollapsed = false,
  onToggleCollapse,
  onScrollToTop,
}) => {
  return (
    <section id="section-overlapping" className="bg-gradient-to-b from-purple-50/80 via-purple-50/40 to-white/90 border border-purple-200/80 rounded-3xl p-4 sm:p-6 space-y-4 scroll-mt-24 shadow-2xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              2. 언론사 공통 핵심 이슈 (중복 집중 보도)
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                주요 {stories.length}대 어젠다
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              다수의 언론사에서 일제히 중요하게 다룬 중복 기사를 종합하고, 언론사 간 합의점과 시각차를 3줄로 정리했습니다.
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
                  <ChevronDown className="w-3.5 h-3.5 text-purple-600" />
                  <span>펼치기</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-purple-600" />
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
          className="cursor-pointer bg-white border border-slate-200 hover:border-purple-400 rounded-2xl p-4 text-center text-xs text-slate-600 hover:text-slate-900 transition shadow-xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>공통 핵심 이슈 <strong>{stories.length}건</strong>이 접혀있습니다.</span>
          </div>
          <span className="text-purple-600 font-bold group-hover:underline flex items-center gap-1">
            클릭하여 펼쳐보기
            <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm shadow-xs">
          선택하신 필터에 해당하는 공통 이슈가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-white border border-purple-100 hover:border-purple-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md shadow-xs group"
            >
              <div>
                {/* Topic & Covered Outlets */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-600 text-white shadow-xs">
                      {story.topic || '종합 어젠다'}
                    </span>
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-purple-600" />
                      {story.coveredOutlets?.length || 0}개 언론사 동시 집중 보도
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {(story.publishedAt && story.publishedAt.includes(' ')
                      ? story.publishedAt.split(' ')[1]
                      : story.publishedAt) || '09:00'} 집계
                  </span>
                </div>

                {/* Covered Outlet Badges */}
                {story.coveredOutlets && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-500 mr-1 shrink-0">보도 언론사:</span>
                    {story.coveredOutlets.map((outlet, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-xs"
                      >
                        {outlet}
                      </span>
                    ))}
                  </div>
                )}

                {/* Headline */}
                <h3
                  onClick={() => onOpenArticleModal(story)}
                  className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors leading-snug mb-3 cursor-pointer"
                  title="원기사 교차 비교 확인"
                >
                  {story.title}
                </h3>

                {/* 3-line Summary Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 mb-2.5">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between border-b border-slate-200/80 pb-1.5 mb-1.5">
                    <span className="text-slate-800">공통 보도 핵심 3줄 요약</span>
                    <span className="text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-bold text-[10px]">
                      Cross Analysis
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
          ))}
        </div>
      )}
    </section>
  );
};
