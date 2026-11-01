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
    
    // Immediate synchronous localStorage persistence backup
    try {
      const raw = localStorage.getItem('morning_brief_user_preferences_v2');
      const parsed = raw ? JSON.parse(raw) : {};
      const combined = Array.from(new Set([...finalFront, ...finalOverlap]));
      const updated = {
        ...parsed,
        selectedOutlets: combined,
        frontPageOutlets: finalFront,
        overlappingOutlets: finalOverlap,
      };
      localStorage.setItem('morning_brief_user_preferences_v2', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to direct save in modal', e);
    }

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white sm:border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-5xl h-[92dvh] sm:h-[86vh] sm:max-h-[850px] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Modal Header (Fixed, Compact) */}
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-blue-100 text-blue-700 shadow-xs shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-slate-900 flex items-center gap-1.5 truncate">
                <span>대한민국 수집 언론사 맞춤 설정</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                1면 핵심 기사와 공통 이슈 기사를 각각 원하는 언론사로 분리 설정합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer shrink-0 ml-2"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Section Selector Banner (1면 핵심 vs 공통이슈) */}
        <div className="shrink-0 px-3 sm:px-6 py-2.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* 2-Segment Control */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl sm:rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveTargetSection('frontPage')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTargetSection === 'frontPage'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>1면 핵심</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTargetSection === 'frontPage' ? 'bg-blue-800 text-white' : 'bg-slate-300 text-slate-800'
                }`}
              >
                {counts.frontPageTotal}개사
              </span>
            </button>

            <button
              onClick={() => setActiveTargetSection('overlapping')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTargetSection === 'overlapping'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>공통 이슈</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTargetSection === 'overlapping' ? 'bg-purple-800 text-white' : 'bg-slate-300 text-slate-800'
                }`}
              >
                {counts.overlappingTotal}개사
              </span>
            </button>
          </div>

          {/* Sync Button */}
          <div className="flex items-center justify-end">
            <button
              onClick={handleSyncSections}
              className="w-full sm:w-auto px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] sm:text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title={
                activeTargetSection === 'frontPage'
                  ? '현재 1면 언론사 설정을 공통이슈 언론사에도 똑같이 복사'
                  : '현재 공통이슈 설정을 1면 언론사에도 똑같이 복사'
              }
            >
              <ArrowRightLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
              <span>
                {activeTargetSection === 'frontPage'
                  ? '1면 설정을 공통이슈에 복사'
                  : '공통이슈 설정을 1면에 복사'}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Presets & Search bar */}
        <div className="shrink-0 px-3 sm:px-6 py-2 bg-white border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-x-auto scrollbar-none">
            <button
              onClick={handleSetDefault10}
              className="px-2 sm:px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap text-[11px] sm:text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>10대 기본</span>
            </button>
            <button
              onClick={handleSelectAll}
              className="px-2 sm:px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition cursor-pointer font-medium whitespace-nowrap text-[11px] sm:text-xs"
            >
              전체 선택 ({counts.all})
            </button>
            <button
              onClick={handleClearAll}
              className="px-2 sm:px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 transition cursor-pointer whitespace-nowrap text-[11px] sm:text-xs"
            >
              선택 해제
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-initial sm:w-60 min-w-[130px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="언론사명 검색 (예: 매경, SBS)"
              className="w-full pl-7 pr-7 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="shrink-0 px-3 sm:px-6 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
          <button
            onClick={() => setActiveCategoryTab('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeCategoryTab === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <span>전체</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                activeCategoryTab === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('종합/경제')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeCategoryTab === '종합/경제'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>종합/경제</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                activeCategoryTab === '종합/경제' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.general_economy}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('방송/통신')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeCategoryTab === '방송/통신'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Tv className="w-3 h-3" />
            <span>방송/통신</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                activeCategoryTab === '방송/통신' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.broadcast}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('IT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeCategoryTab === 'IT'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>IT/과학</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                activeCategoryTab === 'IT' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.tech}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('지역')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeCategoryTab === '지역'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>지역</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                activeCategoryTab === '지역' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.local}
            </span>
          </button>

          <button
            onClick={() => setActiveCategoryTab('selected')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
              activeCategoryTab === 'selected'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            <span>선택됨 ★</span>
            <span className="text-[9px] px-1 py-0.2 rounded-full bg-emerald-700 text-white font-mono font-bold">
              {counts.selected}
            </span>
          </button>
        </div>

        {/* Media Tiles Grid Container: Flexible Scrollable Area (NO arbitrary min-height, never causes overflow cutoff) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2.5 sm:p-5 space-y-3 text-slate-800 bg-slate-50/50">
          {/* Active Category Header with "전체선택" Action */}
          {activeCategoryTab !== 'all' && activeCategoryTab !== 'selected' && (
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  [{activeCategoryTab}] ({filteredOutlets.length}개)
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  편집 중: <strong className="text-blue-600">{activeTargetSection === 'frontPage' ? '신문 1면 핵심' : '공통 이슈'}</strong>
                </span>
              </div>
              <button
                onClick={() => handleToggleGroup(activeCategoryTab as PressGroupCategory)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                  isCurrentGroupFullySelected(activeCategoryTab as PressGroupCategory)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>{activeCategoryTab} 일괄 선택/해제</span>
              </button>
            </div>
          )}

          {/* Grid of Media Outlets */}
          {filteredOutlets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-1.5">
              <Building2 className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs font-semibold text-slate-600">검색 조건에 맞는 언론사가 없습니다.</p>
              <p className="text-[11px] text-slate-500">검색어를 지우거나 다른 카테고리를 눌러보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
              {filteredOutlets.map((outlet) => {
                const isSelected = (currentSelection || []).includes(outlet.id);
                return (
                  <button
                    key={outlet.id}
                    onClick={() => toggleOutlet(outlet.id)}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer group min-h-[76px] sm:min-h-[88px] relative overflow-hidden active:scale-98 ${
                      isSelected
                        ? activeTargetSection === 'frontPage'
                          ? 'bg-white border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                          : 'bg-white border-purple-500 shadow-xs ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs text-slate-600'
                    }`}
                  >
                    {/* Top Indicator & 10대 기본 badge */}
                    <div className="flex items-start justify-between gap-1 w-full">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">
                        {outlet.groupCategory || '언론사'}
                      </span>
                      {outlet.isDefaultMajor && (
                        <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200 shrink-0">
                          10대 기본
                        </span>
                      )}
                    </div>

                    {/* Logo & Name Area */}
                    <div className="my-1">
                      <div
                        className={`text-xs font-black truncate leading-tight transition-colors ${
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
                      <div className="text-[9px] sm:text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                        {outlet.logoText || outlet.name}
                      </div>
                    </div>

                    {/* Bottom Checkmark Bar */}
                    <div
                      className={`w-full py-0.5 sm:py-1 px-1 rounded-md flex items-center justify-center transition-colors ${
                        isSelected
                          ? activeTargetSection === 'frontPage'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-purple-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSelected ? 'text-white' : 'opacity-40 group-hover:opacity-70'}`}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer (Pinned, ALWAYS Visible and Accessible on Mobile) */}
        <div className="shrink-0 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg z-20">
          <div className="text-xs text-slate-600 flex items-center justify-between w-full sm:w-auto gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                1면: {frontPageSelection.length}사
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                공통: {overlappingSelection.length}사
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200 shrink-0">
              💾 저장 유지
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer text-center"
            >
              취소
            </button>

            <button
              onClick={handleSave}
              className="flex-2 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
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
