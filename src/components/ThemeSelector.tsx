import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sun, Moon, Monitor, Sunrise, Check, ChevronDown } from 'lucide-react';
import { ThemeMode } from '../types/news';
import { getSunSchedule } from '../utils/theme';

interface ThemeOption {
  id: ThemeMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'sun',
    label: '일출·일몰 자동',
    shortLabel: '일출·몰',
    description: '일출 시 라이트, 일몰 시 다크 자동 전환',
    icon: Sunrise,
  },
  {
    id: 'light',
    label: '라이트 모드',
    shortLabel: '라이트',
    description: '밝고 선명한 주간 브리핑 화면',
    icon: Sun,
  },
  {
    id: 'dark',
    label: '다크 모드',
    shortLabel: '다크',
    description: '눈이 편안한 야간 고대비 화면',
    icon: Moon,
  },
  {
    id: 'system',
    label: '시스템 설정',
    shortLabel: '시스템',
    description: '기기 OS 테마 설정에 자동 연동',
    icon: Monitor,
  },
];

interface ThemeSelectorProps {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  onChangeTheme: (mode: ThemeMode) => void;
  variant?: 'header' | 'sidebar' | 'panel';
  isSidebarOpen?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  themeMode,
  resolvedTheme,
  onChangeTheme,
  variant = 'header',
  isSidebarOpen = true,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  const sunSchedule = useMemo(() => getSunSchedule(), [themeMode, resolvedTheme, isDropdownOpen]);
  const currentOption = THEME_OPTIONS.find((opt) => opt.id === themeMode) || THEME_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  const cycleTheme = () => {
    const order: ThemeMode[] = ['sun', 'light', 'dark', 'system'];
    const nextIdx = (order.indexOf(themeMode) + 1) % order.length;
    onChangeTheme(order[nextIdx]);
  };

  if (variant === 'panel') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = themeMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeTheme(opt.id)}
              aria-pressed={isSelected}
              className={`p-3.5 rounded-2xl border text-left transition flex items-start justify-between gap-2 cursor-pointer active:scale-[0.99] ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-xl shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{opt.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {opt.id === 'sun'
                      ? `일출 ${sunSchedule.sunriseText} · 일몰 ${sunSchedule.sunsetText} (${sunSchedule.resolvedTheme === 'dark' ? '현재 다크' : '현재 라이트'})`
                      : opt.id === 'system'
                      ? `OS 연동 (${resolvedTheme === 'dark' ? '현재 다크' : '현재 라이트'})`
                      : opt.description}
                  </p>
                </div>
              </div>
              {isSelected && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'sidebar') {
    if (!isSidebarOpen) {
      return (
        <button
          type="button"
          onClick={cycleTheme}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition group cursor-pointer"
          title={`화면 테마: ${currentOption.label} (클릭하여 전환)`}
          aria-label={`화면 테마: ${currentOption.label}`}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <CurrentIcon className="w-4 h-4" />
          </div>
        </button>
      );
    }

    return (
      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <CurrentIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>화면 테마</span>
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            {currentOption.label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = themeMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeTheme(opt.id)}
                aria-pressed={isSelected}
                title={opt.label}
                className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span>{opt.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Header variant: crisp dropdown menu showing exact Korean labels ('라이트 모드', '다크 모드', '시스템 설정')
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isDropdownOpen}
        aria-label={`테마 선택: ${currentOption.label}`}
        title={`화면 테마 변경 (현재: ${currentOption.label})`}
        className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer shrink-0 ${
          isDropdownOpen
            ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
        }`}
      >
        <CurrentIcon
          className={`w-3.5 h-3.5 shrink-0 ${
            themeMode === 'dark' || (themeMode === 'system' && resolvedTheme === 'dark')
              ? 'text-amber-400'
              : 'text-amber-500'
          }`}
        />
        <span className="hidden lg:inline">{currentOption.label}</span>
        <ChevronDown
          className={`w-3 h-3 hidden sm:inline transition-transform duration-150 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isDropdownOpen && (
        <div
          role="menu"
          aria-label="테마 선택 메뉴"
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>대시보드 화면 테마</span>
            <span className="text-blue-600 dark:text-blue-400">자동 저장</span>
          </div>
          <div className="space-y-0.5">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themeMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => {
                    onChangeTheme(opt.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {opt.id === 'sun'
                          ? `일출 ${sunSchedule.sunriseText} · 일몰 ${sunSchedule.sunsetText}`
                          : opt.id === 'system'
                          ? `시스템 (${resolvedTheme === 'dark' ? '다크' : '라이트'} 적용 중)`
                          : opt.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
