import React from 'react';
import { AlertTriangle, RefreshCw, Info } from 'lucide-react';

interface FallbackBadgeProps {
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'solid' | 'outline';
  className?: string;
}

/**
 * Prominent, high-contrast status badge explicitly signaling
 * collection failure and sample/fallback data usage.
 */
export const FallbackBadge: React.FC<FallbackBadgeProps> = ({
  label = '수집 실패 · 샘플 데이터',
  size = 'sm',
  variant = 'solid',
  className = '',
}) => {
  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[10px] gap-1 rounded-md'
      : size === 'md'
      ? 'px-3 py-1 text-xs gap-1.5 rounded-lg'
      : 'px-2.5 py-0.5 text-[11px] gap-1.5 rounded-lg';

  const variantClasses =
    variant === 'solid'
      ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 font-extrabold shadow-xs'
      : 'bg-amber-100 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border border-amber-400/90 dark:border-amber-600/80 font-bold';

  const iconSize = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap shrink-0 tracking-tight ${sizeClasses} ${variantClasses} ${className}`}
    >
      <AlertTriangle className={`${iconSize} shrink-0`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};

interface FallbackNoticeBannerProps {
  title?: string;
  description?: string;
  sampleSnapshotDate?: string;
  onRetry?: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

/**
 * High-visibility alert banner shown when live press collection fails
 * and fallback sample data is displayed (isFallback === true).
 */
export const FallbackNoticeBanner: React.FC<FallbackNoticeBannerProps> = ({
  title = '실시간 기사 수집에 실패하여 참고용 샘플 브리핑을 표시 중입니다.',
  description = '현재 화면의 헤드라인·요약·발행 시각은 실제 당일 보도가 아닌 예시 샘플 데이터입니다. 네트워크 또는 언론사 연결 상태를 확인한 뒤 다시 시도해 주세요.',
  sampleSnapshotDate,
  onRetry,
  isLoading = false,
  compact = false,
}) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border-2 border-amber-400/90 dark:border-amber-500/70 bg-amber-50/95 dark:bg-amber-950/55 shadow-sm transition-colors ${
        compact ? 'px-4 py-3' : 'px-4 py-3.5 sm:px-5 sm:py-4'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FallbackBadge label="수집 실패 · 샘플 데이터" size={compact ? 'sm' : 'md'} variant="solid" />
            {sampleSnapshotDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono tabular-nums bg-amber-200/80 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700/80">
                샘플 시점 {sampleSnapshotDate}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
              <Info className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
              <span>오늘 날짜 실시간 보도가 아닌 예시 데이터</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100 leading-snug">
            {title}
          </p>
          {!compact && (
            <p className="text-[11px] sm:text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs shrink-0 self-start sm:self-center cursor-pointer transition active:scale-95 disabled:opacity-60 shadow-xs whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isLoading ? '다시 수집 중...' : '실시간 다시 시도'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
