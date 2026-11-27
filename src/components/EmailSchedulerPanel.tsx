import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  Mail,
  PauseCircle,
  Send,
} from 'lucide-react';
import {
  DAYS_OF_WEEK,
  QUICK_TIME_PRESETS,
  TIMEZONE_OPTIONS,
  WEEKDAY_PRESET,
  WEEKEND_PRESET,
  formatKoreanTimeLabel,
  formatScheduleDaysSummary,
  getNextScheduledDispatchInfo,
  getTimezoneShortLabel,
  getZonedNowParts,
} from '../utils/emailScheduler';

export interface EmailScheduleValues {
  autoEmailEnabled: boolean;
  deliveryTime: string;
  deliveryTimezone: string;
  deliveryDays: string[];
}

interface EmailSchedulerPanelProps {
  autoEmailEnabled: boolean;
  deliveryTime: string;
  deliveryTimezone?: string;
  deliveryDays: string[];
  recipientEmail: string;
  mailProviderConfigured?: boolean;
  mailProviderLabel?: string;
  onChangeSchedule: (updated: EmailScheduleValues, notifyMessage?: string) => void;
  onOpenEmailModal?: () => void;
  onSendTestNow?: () => Promise<void> | void;
  variant?: 'dashboard' | 'modal';
}

export const EmailSchedulerPanel: React.FC<EmailSchedulerPanelProps> = ({
  autoEmailEnabled,
  deliveryTime,
  deliveryTimezone = 'Asia/Seoul',
  deliveryDays,
  recipientEmail,
  mailProviderConfigured = false,
  mailProviderLabel = '네이버 메일 SMTP',
  onChangeSchedule,
  onOpenEmailModal,
  onSendTestNow,
  variant = 'dashboard',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [nowTick, setNowTick] = useState(() => new Date());
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Update live clock / next-dispatch countdown every 30s
  useEffect(() => {
    const id = window.setInterval(() => {
      setNowTick(new Date());
    }, 30 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const currentValues: EmailScheduleValues = {
    autoEmailEnabled,
    deliveryTime: deliveryTime || '09:00',
    deliveryTimezone: deliveryTimezone || 'Asia/Seoul',
    deliveryDays: deliveryDays || [],
  };

  const zonedNow = getZonedNowParts(currentValues.deliveryTimezone, nowTick);
  const nextInfo = getNextScheduledDispatchInfo(currentValues, nowTick);
  const tzShort = getTimezoneShortLabel(currentValues.deliveryTimezone);

  const emitChange = (partial: Partial<EmailScheduleValues>, notifyMsg?: string) => {
    onChangeSchedule(
      {
        ...currentValues,
        ...partial,
      },
      notifyMsg
    );
  };

  const handleToggleDay = (day: string) => {
    const exists = currentValues.deliveryDays.includes(day);
    const nextDays = exists
      ? currentValues.deliveryDays.filter((d) => d !== day)
      : DAYS_OF_WEEK.filter((d) => d === day || currentValues.deliveryDays.includes(d));
    emitChange(
      { deliveryDays: nextDays },
      `발송 요일이 '${formatScheduleDaysSummary(nextDays)}'(으)로 저장되었습니다.`
    );
  };

  const handleApplyDayPreset = (days: string[], label: string) => {
    emitChange(
      { deliveryDays: [...days] },
      `발송 요일이 '${label}'(으)로 설정되었습니다.`
    );
  };

  const handleTriggerTestSend = async () => {
    if (!onSendTestNow || isSendingTest) return;
    setIsSendingTest(true);
    try {
      await onSendTestNow();
    } finally {
      setIsSendingTest(false);
    }
  };

  const isEveryDay = currentValues.deliveryDays.length === 7;
  const isWeekdaysOnly =
    currentValues.deliveryDays.length === 5 &&
    WEEKDAY_PRESET.every((d) => currentValues.deliveryDays.includes(d));
  const isWeekendsOnly =
    currentValues.deliveryDays.length === 2 &&
    WEEKEND_PRESET.every((d) => currentValues.deliveryDays.includes(d));

  const showBody = variant === 'modal' || isExpanded;

  return (
    <section
      id="section-email-scheduler"
      aria-label="이메일 자동 발송 스케줄러 설정"
      className={
        variant === 'dashboard'
          ? 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-colors'
          : 'space-y-4'
      }
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/70 shrink-0 mt-0.5 sm:mt-0">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                뉴스레터 수신 희망 스케줄
              </h3>
              {mailProviderConfigured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  {mailProviderLabel} 연동됨
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                  미리보기 설정 (네이버 SMTP 미연동)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              <span className="font-sans font-medium text-slate-700 dark:text-slate-200">
                {formatKoreanTimeLabel(currentValues.deliveryTime)} ({tzShort})
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-sans">{formatScheduleDaysSummary(currentValues.deliveryDays)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-sans text-slate-600 dark:text-slate-300 font-medium">
                예정 슬롯: {nextInfo.nextLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Auto-send toggle + Collapse/Expand */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            role="switch"
            aria-checked={autoEmailEnabled}
            aria-label="이메일 자동 발송 활성화 전환"
            onClick={() =>
              emitChange(
                { autoEmailEnabled: !autoEmailEnabled },
                !autoEmailEnabled
                  ? '이메일 자동 발송 스케줄러가 활성화되었습니다.'
                  : '이메일 자동 발송이 일시 중지되었습니다.'
              )
            }
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer whitespace-nowrap shrink-0 ${
              autoEmailEnabled
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span>{autoEmailEnabled ? 'ON' : 'OFF'}</span>
            <span
              className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                autoEmailEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-400 dark:bg-slate-600 justify-start'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-white shadow-2xs" />
            </span>
          </button>

          {variant === 'dashboard' && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{isExpanded ? '접기' : '스케줄 설정'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Controls Body */}
      {showBody && (
        <div
          className={
            variant === 'dashboard'
              ? 'mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3'
              : 'space-y-4'
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Timezone & Delivery Time */}
            <div className="space-y-3">
              {/* Timezone Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={`tz-select-${variant}`}
                    className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>시간대 선택 (Timezone)</span>
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    현지 현재 {zonedNow.hhmm} ({zonedNow.weekdayKo})
                  </span>
                </div>
                <select
                  id={`tz-select-${variant}`}
                  value={currentValues.deliveryTimezone}
                  onChange={(e) => {
                    const nextTz = e.target.value;
                    emitChange(
                      { deliveryTimezone: nextTz },
                      `발송 시간대가 '${getTimezoneShortLabel(nextTz)}'(으)로 변경되었습니다.`
                    );
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Time Picker + Quick Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={`time-input-${variant}`}
                    className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>발송 시각 선택</span>
                  </label>
                  <span className="text-[11px] font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">
                    {formatKoreanTimeLabel(currentValues.deliveryTime)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    id={`time-input-${variant}`}
                    type="time"
                    value={currentValues.deliveryTime}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      emitChange(
                        { deliveryTime: e.target.value },
                        `자동 발송 시각이 '${formatKoreanTimeLabel(e.target.value)}'(으)로 저장되었습니다.`
                      );
                    }}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition cursor-pointer shrink-0"
                  />

                  {QUICK_TIME_PRESETS.map((preset) => {
                    const isSelected = currentValues.deliveryTime === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() =>
                          emitChange(
                            { deliveryTime: preset },
                            `자동 발송 시각이 '${formatKoreanTimeLabel(preset)}'(으)로 저장되었습니다.`
                          )
                        }
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-mono tabular-nums font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Per-Day Delivery Settings + Next Dispatch Footer */}
            <div className="space-y-3 lg:pl-4 lg:border-l lg:border-slate-200/80 dark:lg:border-slate-800">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    요일별 발송 설정
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyDayPreset([...DAYS_OF_WEEK], '매일')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                        isEveryDay
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      매일
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDayPreset(WEEKDAY_PRESET, '평일 (월~금)')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                        isWeekdaysOnly
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      평일
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDayPreset(WEEKEND_PRESET, '주말 (토·일)')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                        isWeekendsOnly
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      주말
                    </button>
                  </div>
                </div>

                {/* Individual Mon-Sun buttons */}
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = currentValues.deliveryDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`${day}요일 자동 발송 ${isSelected ? '선택됨' : '선택 안됨'}`}
                        onClick={() => handleToggleDay(day)}
                        className={`h-9 rounded-xl font-bold text-xs transition flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Next Dispatch Preview & Recipient Summary */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-slate-700 dark:text-slate-200 font-semibold truncate">
                    수신 주소: <span className="font-mono">{recipientEmail || '미설정 (이메일 입력 필요)'}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {nextInfo.remainingLabel}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenEmailModal && (
                    <button
                      type="button"
                      onClick={onOpenEmailModal}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer whitespace-nowrap"
                    >
                      <Mail className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>수신 주소 변경</span>
                    </button>
                  )}
                  {onSendTestNow && (
                    <button
                      type="button"
                      onClick={handleTriggerTestSend}
                      disabled={isSendingTest}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition cursor-pointer whitespace-nowrap"
                    >
                      <Send className="w-3 h-3" />
                      <span>
                        {isSendingTest
                          ? mailProviderConfigured
                            ? '발송 중...'
                            : '생성 중...'
                          : mailProviderConfigured
                          ? '뉴스레터 발송하기'
                          : '뉴스레터 미리보기 생성'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
