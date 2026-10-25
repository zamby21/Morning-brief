import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
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
  onOpenOutletSettings?: () => void;
  isMobileView?: boolean;
  minCoverageRatio?: number;
  minSimilarityScore?: number;
  onChangeThresholds?: (coverageRatio: number, similarityScore: number) => void;
  totalSelectedOutletsCount?: number;
  totalAvailableStoriesCount?: number;
}

export const OverlappingStoriesSection: React.FC<OverlappingStoriesSectionProps> = ({
  stories,
  onOpenShareModal,
  onOpenArticleModal,
  onReact,
  isCollapsed = false,
  onToggleCollapse,
  onScrollToTop,
  onOpenOutletSettings,
  isMobileView = false,
  minCoverageRatio = 50,
  minSimilarityScore = 70,
  onChangeThresholds,
  totalSelectedOutletsCount = 10,
  totalAvailableStoriesCount,
}) => {
  const [isAdjustPanelOpen, setIsAdjustPanelOpen] = useState(false);

  // Minimum required outlets count calculated dynamically based on current coverage ratio
  const minRequiredOutlets = Math.max(1, Math.ceil(totalSelectedOutletsCount * (minCoverageRatio / 100)));

  return (
    <section id="section-overlapping" className="bg-gradient-to-b from-purple-50/80 via-purple-50/40 to-white/90 border border-purple-200/80 rounded-3xl p-4 sm:p-6 space-y-4 scroll-mt-24 shadow-2xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                2. 언론사 공통 핵심 이슈 (중복 집중 보도)
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                주요 {stories.length}대 어젠다
              </span>
              <button
                onClick={() => setIsAdjustPanelOpen((prev) => !prev)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                title="클릭하여 기준 비율(언론사 보도율, 유사도) 직접 조정"
              >
                <SlidersHorizontal className="w-2.5 h-2.5 text-emerald-700" />
                <span>언론사 {minCoverageRatio}%↑ · 유사도 {minSimilarityScore}%↑</span>
                <span className="text-emerald-700 underline text-[9px] font-extrabold">조정</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              수집 언론사 중 {minCoverageRatio}%({minRequiredOutlets}개사 이상)가 유사도 {minSimilarityScore}% 이상으로 일제히 다룬 중복 기사를 종합했습니다.
            </p>
          </div>
        </div>

        {/* Section Actions: Adjust Thresholds, Outlet Settings, Collapse/Expand and Scroll to Top */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Threshold Adjust Button */}
          <button
            onClick={() => setIsAdjustPanelOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs transition active:scale-95 cursor-pointer ${
              isAdjustPanelOpen
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200'
            }`}
            title="언론사 비율 및 유사도 기준 비율 변경"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>기준 비율 ({minCoverageRatio}% / {minSimilarityScore}%)</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isAdjustPanelOpen ? 'rotate-180' : ''}`} />
          </button>

          {onOpenOutletSettings && (
            <button
              onClick={onOpenOutletSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs transition active:scale-95 cursor-pointer"
              title="공통 이슈 수집 언론사 맞춤 변경"
            >
              <span>언론사 설정</span>
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

      {/* Interactive Threshold Adjustment Control Panel */}
      {isAdjustPanelOpen && (
        <div className="bg-white/95 border border-purple-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-slate-900">공통 핵심 이슈 엄선 기준 비율 실시간 조정</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">
                현재 기준 충족: <strong className="text-purple-700 font-bold">{stories.length}건</strong>
                {totalAvailableStoriesCount !== undefined && ` (전체 ${totalAvailableStoriesCount}건 중)`}
              </span>
              <button
                onClick={() => onChangeThresholds && onChangeThresholds(50, 70)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1 active:scale-95"
                title="기본값 (언론사 50% / 유사도 70%)으로 복원"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>기본값(50%/70%) 리셋</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. 언론사 보도 비율 기준 슬라이더 */}
            <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>① 수집 언론사 동시 보도 비율</span>
                    <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-bold">
                      최소 {minRequiredOutlets}개사 이상
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    수집 대상 {totalSelectedOutletsCount}개 언론사 중 동시 보도한 비율
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-purple-700 font-mono">
                    {minCoverageRatio}%
                  </span>
                  <span className="text-xs font-bold text-purple-600 ml-0.5">이상</span>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={20}
                  max={80}
                  step={5}
                  value={minCoverageRatio}
                  onChange={(e) => onChangeThresholds && onChangeThresholds(Number(e.target.value), minSimilarityScore)}
                  className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>20% (완화·다수 노출)</span>
                  <span>50% (기본 권장)</span>
                  <span>80% (초집중·소수 엄선)</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">빠른 선택:</span>
                {[
                  { label: '30% (폭넓게)', val: 30 },
                  { label: '50% (표준 기본)', val: 50 },
                  { label: '70% (집중 어젠다)', val: 70 },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => onChangeThresholds && onChangeThresholds(item.val, minSimilarityScore)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      minCoverageRatio === item.val
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-purple-100 border border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 기사 유사도 기준 슬라이더 */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>② 기사 본문 맥락 유사도</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      키워드·맥락 매칭
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    언론사 간 핵심 논점 및 팩트 유사도 점수
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    {minSimilarityScore}%
                  </span>
                  <span className="text-xs font-bold text-emerald-600 ml-0.5">이상</span>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={50}
                  max={90}
                  step={5}
                  value={minSimilarityScore}
                  onChange={(e) => onChangeThresholds && onChangeThresholds(minCoverageRatio, Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>50% (포괄적 매칭)</span>
                  <span>70% (표준 유사도)</span>
                  <span>90% (초고도 일치)</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">빠른 선택:</span>
                {[
                  { label: '60% (유연)', val: 60 },
                  { label: '70% (표준 기본)', val: 70 },
                  { label: '80% (정밀 엄격)', val: 80 },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => onChangeThresholds && onChangeThresholds(minCoverageRatio, item.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      minSimilarityScore === item.val
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-emerald-100 border border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Collapsed, Empty, or Stories Grid */}
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
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm shadow-xs space-y-3 p-6">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-800">
              현재 설정된 기준(언론사 {minCoverageRatio}%↑ 및 유사도 {minSimilarityScore}%↑)에 일치하는 공통 이슈가 없습니다.
            </p>
            <p className="text-xs text-slate-400">
              상단의 기준 비율을 낮추거나 '공통이슈 언론사 설정'에서 수집 언론사를 추가해보세요.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => onChangeThresholds && onChangeThresholds(30, 60)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              기준 완화하기 (30% / 60% 적용)
            </button>
            <button
              onClick={() => onChangeThresholds && onChangeThresholds(50, 70)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              기본값(50% / 70%) 복원
            </button>
          </div>
        </div>
      ) : (
        <div className={isMobileView ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-white border border-purple-100 hover:border-purple-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md shadow-xs group"
            >
              <div>
                {/* Topic & Covered Outlets */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-600 text-white shadow-xs">
                      {story.topic || '종합 어젠다'}
                    </span>
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-purple-600" />
                      {story.coveredOutlets?.length || 0}개 언론사 동시 집중 보도
                    </span>
                    {story.similarityScore && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        유사도 {story.similarityScore}%
                      </span>
                    )}
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
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 space-y-1.5 mb-2.5">
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
