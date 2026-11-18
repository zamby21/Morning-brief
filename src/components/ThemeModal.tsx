import React from 'react';
import { X, Palette, ShieldCheck, Monitor, Sun, Moon } from 'lucide-react';
import { ThemeMode } from '../types/news';
import { ThemeSelector } from './ThemeSelector';
import { getThemeLabel } from '../utils/theme';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  onChangeTheme: (mode: ThemeMode) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  themeMode,
  resolvedTheme,
  onChangeTheme,
}) => {
  if (!isOpen) return null;

  const CurrentIcon =
    themeMode === 'light' ? Sun : themeMode === 'dark' ? Moon : Monitor;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  화면 테마 설정
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>자동 저장</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                라이트 모드, 다크 모드 또는 기기 시스템 설정 중 원하는 화면 스타일을 선택하세요.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 ml-2"
            aria-label="화면 테마 설정 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <CurrentIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>대시보드 테마 선택</span>
              </div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                현재: {getThemeLabel(themeMode)}
                {themeMode === 'system' &&
                  ` (${resolvedTheme === 'dark' ? '다크 적용' : '라이트 적용'})`}
              </span>
            </div>

            <ThemeSelector
              themeMode={themeMode}
              resolvedTheme={resolvedTheme}
              onChangeTheme={onChangeTheme}
              variant="panel"
            />
          </div>

          <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
            선택한 테마는 브라우저에 영구 저장되며, <strong className="text-slate-800 dark:text-slate-100">시스템 설정</strong> 선택 시 OS의 다크/라이트 모드 전환에 맞춰 자동으로 변경됩니다.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-xs"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};
