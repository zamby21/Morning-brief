import React from 'react';
import {
  Newspaper,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Calendar,
} from 'lucide-react';
import { NewsStory } from '../types/news';
import { PRESS_OUTLETS } from '../data/mockNewsData';
import { getCurrentKoreanDateString } from '../utils/dateUtils';

interface FrontPageSectionProps {
  stories: NewsStory[];
  onOpenShareModal: (story: NewsStory) => void;
  onOpenArticleModal: (story: NewsStory) => void;
  onReact: (storyId: string, reactionType: 'insightful' | 'important' | 'surprising') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onScrollToTop?: () => void;
  onOpenOutletSettings?: () => void;
  isMobileView?: boolean;
}

export const FrontPageSection: React.FC<FrontPageSectionProps> = ({
  stories,
  onOpenShareModal,
  onOpenArticleModal,
  onReact,
  isCollapsed = false,
  onToggleCollapse,
  onScrollToTop,
  onOpenOutletSettings,
  isMobileView = false,
}) => {
  return (
    <section id="section-frontpage" className="bg-gradient-to-b from-blue-50/80 via-blue-50/40 to-white/90 border border-blue-200/80 rounded-3xl p-4 sm:p-6 space-y-4 scroll-mt-24 shadow-2xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                1. 각 언론사 공식 홈페이지 첫화면 중앙 1면 핵심 보도
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                총 {stories.length}건
              </span>
            </div>
            <p className="text-xs text-slate-500">
              각 언론사 공식 홈페이지 첫화면 중앙에 가장 크게 떠있는 실시간 1면 톱기사를 엄선하여 3줄 브리핑으로 정밀 요약했습니다.
            </p>
          </div>
        </div>

        {/* Section Actions: Outlet settings, Collapse/Expand, Scroll to Top */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onOpenOutletSettings && (
            <button
              onClick={onOpenOutletSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs transition active:scale-95 cursor-pointer"
              title="1면 핵심 수집 언론사 맞춤 변경"
            >
              <span>1면 언론사 ({stories.length}사)</span>
            </button>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition active:scale-95 cursor-pointer"
              title={isCollapsed ? '섹션 펼치기' : '섹션 접기'}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>펼치기</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
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
          className="cursor-pointer bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center text-xs text-slate-600 hover:text-slate-900 transition shadow-xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-blue-600" />
            <span>신문 1면 핵심 보도 <strong>{stories.length}건</strong>이 접혀있습니다.</span>
          </div>
          <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-1">
            클릭하여 펼쳐보기
            <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm shadow-xs">
          선택하신 주제나 언론사에 해당하는 1면 기사가 없습니다. 필터를 해제해보세요.
        </div>
      ) : (
        <div className={isMobileView ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
          {stories.map((story) => {
            const outletMeta = PRESS_OUTLETS.find((p) => p.name === story.outletName || p.id === story.outletId);

            return (
              <div
                key={story.id}
                className="bg-white border border-blue-100 hover:border-blue-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md group shadow-xs"
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
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        첫화면 중앙 톱
                      </span>
                      {story.topic && (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {story.topic}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {(story.publishedAt && story.publishedAt.includes(' ')
                          ? story.publishedAt.split(' ')[1]
                          : story.publishedAt) || '09:00'} 집계
                      </span>
                    </div>
                  </div>

                  {/* Headline */}
                  <h3
                    onClick={() => onOpenArticleModal(story)}
                    className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-3 cursor-pointer"
                    title="원기사 전문 및 포털 확인"
                  >
                    {story.title}
                  </h3>

                  {/* 3-line Core Summary Box (Light, high-contrast readability) */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 space-y-1.5 mb-3">
                    {story.leadSummary.slice(0, 3).map((line, idx) => (
                      <p
                        key={idx}
                        className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal"
                      >
                        {line.replace(/^[0-9]+[.)]\s*/, '').trim()}
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
