import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Building2,
  Search,
  CheckSquare,
  Newspaper,
  Layers,
  Tv,
  Cpu,
  MapPin,
  ArrowRightLeft,
} from 'lucide-react';
import { PressOutlet, PressGroupCategory } from '../types/news';
import { PRESS_OUTLETS, DEFAULT_10_OUTLETS } from '../data/mockNewsData';

interface PressSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOutletIds?: string[];
  frontPageOutletIds?: string[];
  overlappingOutletIds?: string[];
  initialSection?: 'frontPage' | 'overlapping';
  onApplyOutlets: (frontPageOutlets: string[], overlappingOutlets: string[]) => void;
}

type TabType = 'all' | '종합/경제' | '방송/통신' | 'IT' | '지역' | 'selected';

export const PressSelectorModal: React.FC<PressSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedOutletIds = [],
  frontPageOutletIds,
  overlappingOutletIds,
  initialSection = 'frontPage',
  onApplyOutlets,
}) => {
  // Target section state: either configuring '1면 핵심' or '공통이슈'
  const [activeTargetSection, setActiveTargetSection] = useState<'frontPage' | 'overlapping'>('frontPage');

  // Dual state for independent section selection
  const [frontPageSelection, setFrontPageSelection] = useState<string[]>([]);
  const [overlappingSelection, setOverlappingSelection] = useState<string[]>([]);

  const [activeCategoryTab, setActiveCategoryTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize selection whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTargetSection(initialSection);
      const initialFront = frontPageOutletIds && frontPageOutletIds.length > 0
        ? frontPageOutletIds
        : (selectedOutletIds && selectedOutletIds.length > 0 ? selectedOutletIds : [...DEFAULT_10_OUTLETS]);

      const initialOverlap = overlappingOutletIds && overlappingOutletIds.length > 0
        ? overlappingOutletIds
        : (selectedOutletIds && selectedOutletIds.length > 0 ? selectedOutletIds : [...DEFAULT_10_OUTLETS]);

      setFrontPageSelection(initialFront);
      setOverlappingSelection(initialOverlap);
      setSearchQuery('');
    }
  }, [isOpen, frontPageOutletIds, overlappingOutletIds, selectedOutletIds, initialSection]);

  // Current active selection list depending on target section
  const currentSelection = activeTargetSection === 'frontPage' ? frontPageSelection : overlappingSelection;
  const setCurrentSelection = (updater: (prev: string[]) => string[]) => {
    if (activeTargetSection === 'frontPage') {
      setFrontPageSelection(updater);
    } else {
      setOverlappingSelection(updater);
    }
  };

  // Memoized counts across all categories for the current active section
  const counts = useMemo(() => {
    const safeSelected = currentSelection || [];
    return {
      all: PRESS_OUTLETS.length,
      general_economy: PRESS_OUTLETS.filter((o) => o.groupCategory === '종합/경제').length,
      broadcast: PRESS_OUTLETS.filter((o) => o.groupCategory === '방송/통신').length,
      tech: PRESS_OUTLETS.filter((o) => o.groupCategory === 'IT').length,
      local: PRESS_OUTLETS.filter((o) => o.groupCategory === '지역').length,
      selected: safeSelected.length,
      frontPageTotal: frontPageSelection.length,
      overlappingTotal: overlappingSelection.length,
    };
  }, [currentSelection, frontPageSelection, overlappingSelection]);

  // Filtered outlets based on category tab and search query
  const filteredOutlets = useMemo(() => {
    const safeSelected = currentSelection || [];
    return PRESS_OUTLETS.filter((outlet) => {
      // Tab filter
      if (activeCategoryTab === 'selected') {
        if (!safeSelected.includes(outlet.id)) return false;
      } else if (activeCategoryTab !== 'all') {
        if (outlet.groupCategory !== activeCategoryTab) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = (outlet.name || '').toLowerCase().includes(q);
        const matchesLogo = (outlet.logoText || '').toLowerCase().includes(q);
        const matchesCategory = (outlet.groupCategory || '').toLowerCase().includes(q);
        if (!matchesName && !matchesLogo && !matchesCategory) return false;
      }

      return true;
    });
  }, [activeCategoryTab, searchQuery, currentSelection]);

  if (!isOpen) return null;

  // Toggle single outlet
  const toggleOutlet = (id: string) => {
    setCurrentSelection((prev) => {
      const safe = prev || [];
      return safe.includes(id) ? safe.filter((item) => item !== id) : [...safe, id];
    });
  };

  const handleSetDefault10 = () => {
    setCurrentSelection(() => [...DEFAULT_10_OUTLETS]);
  };

  const handleSelectAll = () => {
    setCurrentSelection(() => PRESS_OUTLETS.map((o) => o.id));
  };

  const handleClearAll = () => {
    setCurrentSelection(() => []);
  };

  // Sync frontpage and overlapping selections to match each other
  const handleSyncSections = () => {
    if (activeTargetSection === 'frontPage') {
      setOverlappingSelection([...frontPageSelection]);
    } else {
      setFrontPageSelection([...overlappingSelection]);
    }
  };

  const handleToggleGroup = (group: PressGroupCategory) => {
    const groupOutlets = PRESS_OUTLETS.filter((o) => o.groupCategory === group).map((o) => o.id);
    const safe = currentSelection || [];
    const allSelected = groupOutlets.every((id) => safe.includes(id));
    if (allSelected) {
      setCurrentSelection((prev) => (prev || []).filter((id) => !groupOutlets.includes(id)));
    } else {
      setCurrentSelection((prev) => Array.from(new Set([...(prev || []), ...groupOutlets])));
    }
  };

  const handleSave = () => {
    const finalFront = frontPageSelection.length > 0 ? frontPageSelection : [...DEFAULT_10_OUTLETS];
    const finalOverlap = overlappingSelection.length > 0 ? overlappingSelection : [...DEFAULT_10_OUTLETS];
    onApplyOutlets(finalFront, finalOverlap);
    onClose();
  };

  const isCurrentGroupFullySelected = (group: PressGroupCategory) => {
    const groupIds = PRESS_OUTLETS.filter((o) => o.groupCategory === group).map((o) => o.id);
    const safe = currentSelection || [];
    return groupIds.length > 0 && groupIds.every((id) => safe.includes(id));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                대한민국 수집 언론사 맞춤 개별 설정
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                1면 핵심 기사와 공통 이슈 기사를 각각 원하는 언론사로 분리 설정할 수 있습니다.
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

        {/* Dual Section Selector Banner (1면 핵심 vs 공통이슈) */}
        <div className="p-3 sm:px-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveTargetSection('frontPage')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTargetSection === 'frontPage'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>1. 신문 1면 핵심 언론사</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTargetSection === 'frontPage' ? 'bg-blue-800 text-white' : 'bg-slate-300 text-slate-800'
                }`}
              >
                {counts.frontPageTotal}개사
              </span>
            </button>

            <button
              onClick={() => setActiveTargetSection('overlapping')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTargetSection === 'overlapping'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>2. 공통 이슈 언론사</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTargetSection === 'overlapping' ? 'bg-purple-800 text-white' : 'bg-slate-300 text-slate-800'
                }`}
              >
                {counts.overlappingTotal}개사
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            <button
              onClick={handleSyncSections}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title={
                activeTargetSection === 'frontPage'
                  ? '현재 1면 언론사 설정을 공통이슈 언론사에도 똑같이 복사'
                  : '현재 공통이슈 설정을 1면 언론사에도 똑같이 복사'
              }
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {activeTargetSection === 'frontPage'
                  ? '1면 설정을 공통이슈에 복사'
                  : '공통이슈 설정을 1면에 복사'}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Presets & Search bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleSetDefault10}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>10대 기본값 적용</span>
            </button>
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 transition cursor-pointer font-medium"
            >
              전체 선택 ({counts.all})
            </button>
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 transition cursor-pointer"
            >
              선택 해제
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="언론사명 검색 (예: 매경, SBS, 부산일보...)"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="px-5 sm:px-6 pt-2 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          <button
            onClick={() => setActiveCategoryTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategoryTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <span>전체 언론사</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeCategoryTab === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('종합/경제')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategoryTab === '종합/경제'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>종합/경제</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeCategoryTab === '종합/경제' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.general_economy}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('방송/통신')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategoryTab === '방송/통신'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>방송/통신</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeCategoryTab === '방송/통신' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.broadcast}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('IT')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategoryTab === 'IT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>IT / 과학</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeCategoryTab === 'IT' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.tech}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('지역')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategoryTab === '지역'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>지역 언론사</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeCategoryTab === '지역' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.local}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('selected')}
            className={`ml-auto px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategoryTab === 'selected'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>선택된 언론사만 보기</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white font-mono font-bold">
              {counts.selected}
            </span>
          </button>
        </div>

        {/* Media Tiles Grid Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-800 min-h-[350px] bg-slate-50/50">
          {/* Active Category Header with "전체선택" Action */}
          {activeCategoryTab !== 'all' && activeCategoryTab !== 'selected' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  [{activeCategoryTab}] 카테고리 ({filteredOutlets.length}개)
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  현재 편집 중: <strong className="text-blue-600">{activeTargetSection === 'frontPage' ? '신문 1면 핵심' : '공통 이슈'}</strong>
                </span>
              </div>
              <button
                onClick={() => handleToggleGroup(activeCategoryTab as PressGroupCategory)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  isCurrentGroupFullySelected(activeCategoryTab as PressGroupCategory)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{activeCategoryTab} 전체 선택/해제</span>
              </button>
            </div>
          )}

          {/* Grid of Media Outlets */}
          {filteredOutlets.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Building2 className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-semibold text-slate-600">검색 조건에 맞는 언론사가 없습니다.</p>
              <p className="text-xs text-slate-500">검색어를 변경하거나 다른 탭을 선택해 보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {filteredOutlets.map((outlet) => {
                const isSelected = (currentSelection || []).includes(outlet.id);
                return (
                  <button
                    key={outlet.id}
                    onClick={() => toggleOutlet(outlet.id)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer group min-h-[92px] relative overflow-hidden ${
                      isSelected
                        ? activeTargetSection === 'frontPage'
                          ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                          : 'bg-white border-purple-500 shadow-sm ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs text-slate-600'
                    }`}
                  >
                    {/* Top Indicator & 10대 기본 badge */}
                    <div className="flex items-start justify-between gap-1 w-full">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {outlet.groupCategory || '언론사'}
                      </span>
                      {outlet.isDefaultMajor && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                          10대 기본
                        </span>
                      )}
                    </div>

                    {/* Logo & Name Area */}
                    <div className="my-1.5">
                      <div
                        className={`text-xs font-black truncate leading-snug transition-colors ${
                          isSelected
                            ? activeTargetSection === 'frontPage'
                              ? 'text-blue-900'
                              : 'text-purple-900'
                            : 'text-slate-900 group-hover:text-blue-600'
                        }`}
                        title={outlet.name}
                      >
                        {outlet.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                        {outlet.logoText || outlet.name}
                      </div>
                    </div>

                    {/* Bottom Checkmark Bar */}
                    <div
                      className={`w-full py-1 px-1.5 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? activeTargetSection === 'frontPage'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-purple-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'opacity-40 group-hover:opacity-70'}`}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              <span>1면 핵심: <strong className="text-blue-700 font-bold">{frontPageSelection.length}개사</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
              <span>공통이슈: <strong className="text-purple-700 font-bold">{overlappingSelection.length}개사</strong></span>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1 shadow-2xs">
              <span>💾 브라우저 자동 저장 (다음 접속 시에도 유지)</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              취소하기
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>설정 완료 및 적용</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
