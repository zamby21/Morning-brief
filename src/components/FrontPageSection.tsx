import React from 'react';
import {
  Newspaper,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Calendar,
  Maximize2,
} from 'lucide-react';
import { NewsStory } from '../types/news';
import { PRESS_OUTLETS } from '../data/mockNewsData';
import { getCurrentKoreanDateString } from '../utils/dateUtils';

interface FrontPageSectionProps {
  stories: NewsStory[];
  onOpenShareModal: (story: NewsStory) => void;
  onOpenArticleModal: (story: NewsStory) => void;
  onOpenNewspaperModal?: (story: NewsStory) => void;
  onReact: (storyId: string, reactionType: 'insightful' | 'important' | 'surprising') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onScrollToTop?: () => void;
  newspaperViewMode?: boolean;
  onToggleNewspaperViewMode?: () => void;
}

export const FrontPageSection: React.FC<FrontPageSectionProps> = ({
  stories,
  onOpenShareModal,
  onOpenArticleModal,
  onOpenNewspaperModal,
  onReact,
  isCollapsed = false,
  onToggleCollapse,
  onScrollToTop,
  newspaperViewMode = false,
  onToggleNewspaperViewMode,
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
                1. 각 언론사 신문 1면(첫페이지) 핵심 보도
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                총 {stories.length}건
              </span>
            </div>
            <p className="text-xs text-slate-500">
              오늘 아침 지면 1면 톱기사들을 엄선하여 신문 지면 형태와 핵심 3줄 브리핑으로 정밀 요약했습니다.
            </p>
          </div>
        </div>

        {/* Section Actions: Newspaper View Mode Toggle, Collapse/Expand, Scroll to Top */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Newspaper Facsimile Style Toggle */}
          {onToggleNewspaperViewMode && (
            <button
              onClick={onToggleNewspaperViewMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer border ${
                newspaperViewMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs ring-1 ring-amber-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
              }`}
              title={newspaperViewMode ? '요약 카드 모드로 전환' : '신문 지면 1면 스타일로 전환'}
            >
              <Newspaper className={`w-3.5 h-3.5 ${newspaperViewMode ? 'text-amber-800' : 'text-blue-600'}`} />
              <span>{newspaperViewMode ? '📰 지면 모드 ON' : '📰 신문 지면 모드'}</span>
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
      ) : newspaperViewMode ? (
        /* REALISTIC NEWSPAPER 1-PAGE FACSIMILE GRID VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {stories.map((story) => {
            const outletMeta = PRESS_OUTLETS.find((p) => p.name === story.outletName || p.id === story.outletId);

            return (
              <div
                key={story.id}
                className="bg-[#faf7f0] border-2 border-[#d9d3c5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md transition-all duration-200 hover:shadow-xl hover:border-amber-700/60 text-[#1e2022]"
              >
                <div>
                  {/* Newspaper Folio & Masthead Header */}
                  <div className="border-b-2 border-[#2b2b2b] pb-2.5 mb-3">
                    <div className="flex items-center justify-between text-[11px] font-serif text-slate-600 mb-1 border-b border-[#e2dcd0] pb-1">
                      <span className="font-semibold">
                        {getCurrentKoreanDateString()} · 조간 1판
                      </span>
                      <span className="font-bold text-amber-900">
                        {story.newspaperPage || '제 1 면 (종합)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-black font-serif tracking-tight text-slate-900">
                          {outletMeta?.logoText || story.outletName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10 font-bold">
                          1면 톱
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenNewspaperModal ? onOpenNewspaperModal(story) : onOpenArticleModal(story)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 transition active:scale-95 shadow-2xs cursor-pointer"
                        title="신문 1면 정밀 뷰어로 전체 지면 보기"
                      >
                        <Maximize2 className="w-3 h-3 text-amber-900" />
                        <span>지면 크게보기</span>
                      </button>
                    </div>
                  </div>

                  {/* Headline & Kicker */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-[11px] font-serif text-slate-600 mb-1.5">
                      <span className="font-bold text-blue-900">[{story.topic || '종합'}]</span>
                      <span>·</span>
                      <span>{story.reporter || `${story.outletName} 취재반`}</span>
                    </div>
                    <h3
                      onClick={() => onOpenNewspaperModal ? onOpenNewspaperModal(story) : onOpenArticleModal(story)}
                      className="text-base sm:text-lg font-black font-serif leading-snug hover:text-blue-700 transition cursor-pointer"
                      title="클릭하여 지면 신문 뷰어 열기"
                    >
                      {story.title}
                    </h3>
                  </div>

                  {/* Newspaper Lead Photo / Infographic Preview Box */}
                  <div
                    onClick={() => onOpenNewspaperModal ? onOpenNewspaperModal(story) : onOpenArticleModal(story)}
                    className="cursor-pointer group relative bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-xl overflow-hidden mb-3 aspect-21/9 flex flex-col justify-end p-3 text-white border border-[#ded8cb] shadow-inner"
                  >
                    <div className="absolute top-2 left-2 bg-red-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded uppercase">
                      1면 포토
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      <span>확대보기</span>
                    </div>
                    <div className="relative z-10">
                      <span className="text-[10px] font-mono text-amber-300">
                        [{story.outletName} 1면 현장 포토]
                      </span>
                      <p className="text-xs font-bold text-slate-100 line-clamp-1">
                        {story.title}
                      </p>
                    </div>
                  </div>

                  {/* 3-Column Newspaper Article Synopsis */}
                  <div className="bg-[#f0ebe0] border border-[#ded8cb] rounded-xl p-3 space-y-1.5 font-serif">
                    <div className="flex items-center justify-between pb-1 border-b border-[#ded8cb] text-[10px] font-bold text-slate-600">
                      <span>1면 톱기사 3줄 요약</span>
                      <span className="text-amber-800">3-Lines Brief</span>
                    </div>
                    {story.leadSummary.slice(0, 3).map((line, idx) => (
                      <p key={idx} className="text-xs text-slate-800 leading-relaxed font-normal">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD COMPACT CARD VIEW (WITH DIRECT 1면 지면보기 BUTTON) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        신문 1면 톱
                      </span>
                      {story.topic && (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {story.topic}
                        </span>
                      )}
                    </div>

                    {/* Quick Button: 지면 1면 보기 */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenNewspaperModal ? onOpenNewspaperModal(story) : onOpenArticleModal(story)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition cursor-pointer"
                        title="실제 종이신문 1면 지면 뷰어로 확인"
                      >
                        <Newspaper className="w-3 h-3 text-amber-700" />
                        <span>1면 지면보기</span>
                      </button>
                      <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
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
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 mb-3">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between border-b border-slate-200/80 pb-1.5 mb-1.5">
                      <span className="text-slate-800">핵심 요약 (3줄 요약)</span>
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold text-[10px]">
                        3 Lines Brief
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
