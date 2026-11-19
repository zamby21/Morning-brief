import React, { useMemo, useState } from 'react';
import {
  X,
  Palette,
  ShieldCheck,
  Monitor,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { ThemeMode } from '../types/news';
import { ThemeSelector } from './ThemeSelector';
import {
  formatTimeHHMM,
  getSunSchedule,
  getThemeLabel,
  requestCurrentLocationCoords,
  resetSunCoordsToDefault,
} from '../utils/theme';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  onChangeTheme: (mode: ThemeMode) => void;
  onRefreshSunTheme?: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  themeMode,
  resolvedTheme,
  onChangeTheme,
  onRefreshSunTheme,
}) => {
  const [locLoading, setLocLoading] = useState(false);
  const [locNotice, setLocNotice] = useState<string | null>(null);
  const [coordTick, setCoordTick] = useState(0);

  const sunSchedule = useMemo(() => getSunSchedule(), [coordTick, themeMode, resolvedTheme, isOpen]);

  if (!isOpen) return null;

  const CurrentIcon =
    themeMode === 'sun'
      ? Sunrise
      : themeMode === 'light'
      ? Sun
      : themeMode === 'dark'
      ? Moon
      : Monitor;

  const handleUseCurrentLocation = async () => {
    setLocLoading(true);
    setLocNotice(null);
    try {
      const coords = await requestCurrentLocationCoords();
      setCoordTick((t) => t + 1);
      onRefreshSunTheme?.();
      setLocNotice(`${coords.label} 기준으로 일출·일몰 시간이 갱신되었습니다.`);
    } catch (err: any) {
      setLocNotice(err?.message || '현재 위치를 가져오지 못했습니다.');
    } finally {
      setLocLoading(false);
    }
  };

  const handleResetLocation = () => {
    resetSunCoordsToDefault();
    setCoordTick((t) => t + 1);
    onRefreshSunTheme?.();
    setLocNotice('서울 기준 일출·일몰 시간으로 복원되었습니다.');
  };

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
                일출·일몰 자동 전환, 라이트 모드, 다크 모드 또는 시스템 설정을 선택하세요.
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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <CurrentIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>대시보드 테마 선택</span>
              </div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                현재: {getThemeLabel(themeMode)}
                {(themeMode === 'system' || themeMode === 'sun') &&
                  ` (${resolvedTheme === 'dark' ? '다크 적용' : '라이트 적용'})`}
              </span>
            </div>

            <ThemeSelector
              themeMode={themeMode}
              resolvedTheme={resolvedTheme}
              onChangeTheme={onChangeTheme}
              variant="panel"
            />

            {/* Sunrise / Sunset Schedule Summary & Location Control */}
            <div className="pt-3.5 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                  <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold">
                    <Sunrise className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>일출 {sunSchedule.sunriseText}</span>
                    <span className="text-[11px] font-sans font-normal text-slate-500 dark:text-slate-400">
                      (라이트)
                    </span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="inline-flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold">
                    <Sunset className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>일몰 {sunSchedule.sunsetText}</span>
                    <span className="text-[11px] font-sans font-normal text-slate-500 dark:text-slate-400">
                      (다크)
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                    <span>{locLoading ? '위치 확인 중...' : '내 위치 적용'}</span>
                  </button>
                  {sunSchedule.coords.isCustom && (
                    <button
                      type="button"
                      onClick={handleResetLocation}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
                      title="서울 기본값으로 복원"
                    >
                      <RotateCcw className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>서울 기준</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  적용 위치: <strong className="text-slate-700 dark:text-slate-200">{sunSchedule.coords.label}</strong>
                </span>
                <span className="font-mono tabular-nums">
                  다음 자동 전환:{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {sunSchedule.nextTransitionType === 'sunset' ? '일몰' : '일출'}{' '}
                    {formatTimeHHMM(sunSchedule.nextTransitionTime)}
                  </strong>{' '}
                  → {sunSchedule.nextTransitionTheme === 'dark' ? '다크 모드' : '라이트 모드'}
                </span>
              </div>

              {locNotice && (
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {locNotice}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-100">일출·일몰 자동</strong> 모드에서는 일출 시간부터 일몰 전까지 라이트 모드, 일몰 이후부터 다음 날 일출 전까지 다크 모드로 실시간 자동 전환됩니다.
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
