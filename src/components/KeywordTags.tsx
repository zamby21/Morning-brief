import React from 'react';
import { Flame, X } from 'lucide-react';

interface KeywordTagsProps {
  keywords: string[];
  selectedKeyword: string | null;
  onSelectKeyword: (kw: string | null) => void;
}

export const KeywordTags: React.FC<KeywordTagsProps> = ({
  keywords,
  selectedKeyword,
  onSelectKeyword,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200/60">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              오늘의 핵심 키워드 태그
              <span className="text-[11px] font-normal text-slate-500">
                (클릭 시 관련 보도 필터링)
              </span>
            </h3>
          </div>
        </div>

        {selectedKeyword && (
          <button
            onClick={() => onSelectKeyword(null)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition cursor-pointer"
          >
            <span>전체 키워드 보기</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tag pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {keywords.map((kw) => {
          const isSelected = selectedKeyword === kw;
          return (
            <button
              key={kw}
              onClick={() => onSelectKeyword(isSelected ? null : kw)}
              className={`text-xs px-2.5 py-1 rounded-xl font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs font-bold ring-2 ring-blue-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              <span>{kw}</span>
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
