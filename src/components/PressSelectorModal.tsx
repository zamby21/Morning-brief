import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Building2,
  Search,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Layers,
  Tv,
  Cpu,
  MapPin,
  Flame,
} from 'lucide-react';
import { PressOutlet, PressGroupCategory } from '../types/news';
import { PRESS_OUTLETS, DEFAULT_10_OUTLETS } from '../data/mockNewsData';

interface PressSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOutletIds?: string[];
  onApplyOutlets: (outlets: string[]) => void;
}

type TabType = 'all' | '종합/경제' | '방송/통신' | 'IT' | '지역' | 'selected';

export const PressSelectorModal: React.FC<PressSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedOutletIds = [],
  onApplyOutlets,
}) => {
  // 1. All hooks MUST be declared at the very top, before any return statement
  const [currentSelection, setCurrentSelection] = useState<string[]>(selectedOutletIds || []);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Synchronize selection whenever the modal opens or input props change
  useEffect(() => {
    if (isOpen) {
      setCurrentSelection(selectedOutletIds || []);
      setSearchQuery('');
    }
  }, [isOpen, selectedOutletIds]);

  // 3. Memoized counts across all categories
  const counts = useMemo(() => {
    const safeSelected = currentSelection || [];
    return {
      all: PRESS_OUTLETS.length,
      general_economy: PRESS_OUTLETS.filter((o) => o.groupCategory === '종합/경제').length,
      broadcast: PRESS_OUTLETS.filter((o) => o.groupCategory === '방송/통신').length,
      tech: PRESS_OUTLETS.filter((o) => o.groupCategory === 'IT').length,
      local: PRESS_OUTLETS.filter((o) => o.groupCategory === '지역').length,
      selected: safeSelected.length,
    };
  }, [currentSelection]);

  // 4. Filtered outlets based on active tab and search query
  const filteredOutlets = useMemo(() => {
    const safeSelected = currentSelection || [];
    return PRESS_OUTLETS.filter((outlet) => {
      // Tab filter
      if (activeTab === 'selected') {
        if (!safeSelected.includes(outlet.id)) return false;
      } else if (activeTab !== 'all') {
        if (outlet.groupCategory !== activeTab) return false;
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
  }, [activeTab, searchQuery, currentSelection]);

  // 5. Early return AFTER all hooks have executed
  if (!isOpen) return null;

  // Handlers
  const toggleOutlet = (id: string) => {
    setCurrentSelection((prev) => {
      const safe = prev || [];
      return safe.includes(id) ? safe.filter((item) => item !== id) : [...safe, id];
    });
  };

  const handleSetDefault10 = () => {
    setCurrentSelection([...DEFAULT_10_OUTLETS]);
  };

  const handleSelectAll = () => {
    setCurrentSelection(PRESS_OUTLETS.map((o) => o.id));
  };

  const handleClearAll = () => {
    setCurrentSelection([]);
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
    const safe = currentSelection || [];
    const finalSelection = safe.length > 0 ? safe : [...DEFAULT_10_OUTLETS];
    onApplyOutlets(finalSelection);
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
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                대한민국 수집 언론사 맞춤 선택
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                  {(currentSelection || []).length}개 선택됨
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                선택하지 않을 경우 10대 대표 언론사(메이저 5개 + 경제지 5개)가 기본 자동 적용됩니다.
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

        {/* Quick presets & search bar */}
        <div className="px-5 sm:px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSetDefault10}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>10대 기본값 복원 (메이저5+경제5)</span>
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
              placeholder="언론사명 검색 (예: 부산, SBS, 블로터...)"
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
        <div className="px-5 sm:px-6 pt-2.5 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <span>전체 언론사</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('종합/경제')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === '종합/경제'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>종합/경제</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === '종합/경제' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {counts.general_economy}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('방송/통신')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === '방송/통신'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>방송/통신</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === '방송/통신' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {counts.broadcast}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('IT')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'IT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>IT / 과학</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === 'IT' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {counts.tech}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('지역')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === '지역'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>지역 언론사</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === '지역' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {counts.local}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('selected')}
            className={`ml-auto px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'selected'
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
          {activeTab !== 'all' && activeTab !== 'selected' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  [{activeTab}] 카테고리 전체 언론사 ({filteredOutlets.length}개)
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  카드를 클릭하여 선택하거나 해제할 수 있습니다.
                </span>
              </div>
              <button
                onClick={() => handleToggleGroup(activeTab as PressGroupCategory)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  isCurrentGroupFullySelected(activeTab as PressGroupCategory)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{activeTab} 전체 선택/해제</span>
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
              {/* Category "전체선택" special card if on a category tab and no search query */}
              {activeTab !== 'all' && activeTab !== 'selected' && !searchQuery && (
                <button
                  onClick={() => handleToggleGroup(activeTab as PressGroupCategory)}
                  className={`p-3 rounded-2xl border text-center flex flex-col justify-between transition cursor-pointer shadow-xs group min-h-[92px] ${
                    isCurrentGroupFullySelected(activeTab as PressGroupCategory)
                      ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-300'
                      : 'bg-white border-dashed border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="pt-1">
                    <div className="text-xs font-black text-slate-900">전체선택</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{activeTab}</div>
                  </div>
                  <div
                    className={`w-full py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                      isCurrentGroupFullySelected(activeTab as PressGroupCategory)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-[11px]">
                      {isCurrentGroupFullySelected(activeTab as PressGroupCategory)
                        ? '모두 선택됨'
                        : '한번에 선택'}
                    </span>
                  </div>
                </button>
              )}

              {/* Outlet Cards */}
              {filteredOutlets.map((outlet) => {
                const isSelected = (currentSelection || []).includes(outlet.id);
                return (
                  <button
                    key={outlet.id}
                    onClick={() => toggleOutlet(outlet.id)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer group min-h-[92px] relative overflow-hidden ${
                      isSelected
                        ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
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
                          isSelected ? 'text-blue-900' : 'text-slate-900 group-hover:text-blue-600'
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
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-white' : 'opacity-40 group-hover:opacity-70'
                        }`}
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
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>
              현재 총 <strong className="text-blue-600 font-bold">{(currentSelection || []).length}개</strong>의 언론사가 기사 수집 대상으로 지정되어 있습니다.
            </span>
            {(currentSelection || []).length === 0 && (
              <span className="text-amber-600 text-[11px] font-semibold">(미선택 시 10대 언론사 자동 적용)</span>
            )}
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
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>선택완료 ({(currentSelection || []).length}개 적용)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
