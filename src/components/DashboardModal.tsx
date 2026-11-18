import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Mail,
  Bell,
  Smartphone,
  CheckCircle2,
  Calendar,
  Palette,
} from 'lucide-react';
import { ThemeMode, UserPreferences } from '../types/news';
import { ThemeSelector } from './ThemeSelector';
import { getThemeLabel } from '../utils/theme';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updated: UserPreferences) => void;
  onTestPush: () => void;
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  onChangeTheme: (mode: ThemeMode) => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onTestPush,
  themeMode,
  resolvedTheme,
  onChangeTheme,
}) => {
  const [formData, setFormData] = useState<UserPreferences>(preferences);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(preferences);
    }
  }, [isOpen, preferences]);

  if (!isOpen) return null;

  const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      deliveryDays: prev.deliveryDays.includes(day)
        ? prev.deliveryDays.filter((d) => d !== day)
        : [...prev.deliveryDays, day],
    }));
  };

  const handleSave = () => {
    onUpdatePreferences({ ...formData, theme: themeMode });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                맞춤 알림 & 대시보드 설정
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                수신 시각, 알림 수단 및 화면 테마(라이트·다크·시스템)를 자유롭게 설정할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/40">
          {/* 0. Theme Mode Setting */}
          <div className="space-y-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>화면 테마 설정 (자동 저장)</span>
              </label>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                현재: {getThemeLabel(themeMode)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              라이트 모드, 다크 모드 또는 기기 시스템 설정에 맞추어 전체 화면 테마가 즉시 적용되고 브라우저에 영구 저장됩니다.
            </p>
            <ThemeSelector
              themeMode={themeMode}
              resolvedTheme={resolvedTheme}
              onChangeTheme={(mode) => {
                onChangeTheme(mode);
                setFormData((prev) => ({ ...prev, theme: mode }));
              }}
              variant="panel"
            />
          </div>

          {/* 1. Delivery Time Setting */}
          <div className="space-y-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>모닝브리프 자동 발송 시각</span>
              </label>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                현재: 오전 {formData.deliveryTime}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              출근 전 읽기 편한 시각을 선택하세요. 매일 지정된 시각에 AI가 갓 나온 조간 1면을 정리해 발송합니다.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {['07:00', '08:00', '08:30', '09:00', '09:30', '10:00', '12:00'].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryTime: time })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.deliveryTime === time
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{time} {time === '09:00' ? '(기본)' : ''}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Delivery Days Setting */}
          <div className="space-y-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>발송 요일 선택</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              주말(토/일) 수신 여부를 선택할 수 있습니다.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {daysOfWeek.map((day) => {
                const isSelected = formData.deliveryDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-10 rounded-xl font-bold text-xs transition flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Recipient Email */}
          <div className="space-y-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>수신 이메일 주소</span>
            </label>
            <input
              type="email"
              value={formData.recipientEmail}
              onChange={(e) =>
                setFormData({ ...formData, recipientEmail: e.target.value })
              }
              placeholder="name@example.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition"
            />
          </div>

          {/* 4. Notification Channels (Email & Browser Web Push) */}
          <div className="space-y-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>알림 채널 활성화</span>
            </label>

            {/* Email Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">이메일 뉴스레터 발송</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">매일 지정 시각에 HTML 요약본 발송</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.autoEmailEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoEmailEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Web Push Notification Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">웹 & 모바일 푸시 알림</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">브라우저 및 스마트폰 잠금화면으로 즉시 헤드라인 팝업</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onTestPush}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition cursor-pointer"
                >
                  테스트 발송
                </button>
                <input
                  type="checkbox"
                  checked={formData.pushNotificationEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pushNotificationEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 shadow-xs flex items-center gap-2 cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>저장 완료!</span>
              </>
            ) : (
              <span>설정 저장하기</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
