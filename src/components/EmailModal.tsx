import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  History,
  Sparkles,
  ExternalLink,
  Save,
  Check,
  BookmarkCheck,
  Trash2,
  Plus,
  ShieldCheck,
  Bell,
  Smartphone,
  MapPin,
} from 'lucide-react';
import { DailyBriefing, EmailDispatchLog } from '../types/news';
import { EmailSchedulerPanel, EmailScheduleValues } from './EmailSchedulerPanel';
import {
  formatKoreanTimeLabel,
  formatScheduleDaysSummary,
  getTimezoneShortLabel,
} from '../utils/emailScheduler';
import { KOREAN_REGIONS, getRegionByCode } from '../utils/koreanRegions';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefing: DailyBriefing;
  recipientEmail: string;
  savedRecipientEmails?: string[];
  deliveryTime: string;
  deliveryTimezone?: string;
  deliveryDays?: string[];
  autoEmailEnabled?: boolean;
  pushNotificationEnabled?: boolean;
  onTogglePush?: (enabled: boolean) => void;
  onTestPush?: () => void;
  localNewsAlertEnabled?: boolean;
  selectedRegionSido?: string;
  selectedRegionSigungu?: string;
  onToggleLocalNewsAlert?: (enabled: boolean, sidoCode?: string, sigungu?: string) => void;
  onChangeAlertRegion?: (sidoCode: string, sigungu: string) => void;
  onTestLocalNewsAlert?: (sidoCode: string, sigungu: string) => void;
  emailLogs: EmailDispatchLog[];
  mailProviderConfigured?: boolean;
  onSendEmail: (email: string) => Promise<string>;
  onSaveRecipientEmail?: (email: string, alsoAddToList?: boolean) => void;
  onDeleteSavedEmail?: (email: string) => void;
  onUpdateSchedule?: (updated: EmailScheduleValues, notifyMessage?: string) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  briefing,
  recipientEmail,
  savedRecipientEmails = [],
  deliveryTime,
  deliveryTimezone = 'Asia/Seoul',
  deliveryDays = ['월', '화', '수', '목', '금'],
  autoEmailEnabled = true,
  pushNotificationEnabled = false,
  onTogglePush,
  onTestPush,
  localNewsAlertEnabled = false,
  selectedRegionSido = 'all',
  selectedRegionSigungu = 'all',
  onToggleLocalNewsAlert,
  onChangeAlertRegion,
  onTestLocalNewsAlert,
  emailLogs,
  mailProviderConfigured = false,
  onSendEmail,
  onSaveRecipientEmail,
  onDeleteSavedEmail,
  onUpdateSchedule,
}) => {
  const [emailInput, setEmailInput] = useState(recipientEmail || '');
  const [activeTab, setActiveTab] = useState<'send' | 'preview' | 'logs'>('send');
  const [isSending, setIsSending] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [autoSaveOnSend, setAutoSaveOnSend] = useState(true);

  // Sync with recipientEmail prop when modal opens or prop changes
  useEffect(() => {
    setEmailInput(recipientEmail || '');
  }, [recipientEmail, isOpen]);

  if (!isOpen) return null;

  const emailList = Array.from(
    new Set(
      [recipientEmail, ...savedRecipientEmails].filter(
        (e): e is string => Boolean(e && e.includes('@'))
      )
    )
  );

  const isCurrentInputSavedDefault =
    Boolean(recipientEmail.trim()) &&
    emailInput.trim().toLowerCase() === recipientEmail.trim().toLowerCase();

  const handleSaveDefaultEmail = (targetEmail?: string) => {
    const toSave = (targetEmail || emailInput).trim();
    if (!toSave || !toSave.includes('@')) {
      setSaveSuccessMsg('올바른 이메일 주소(예: name@example.com)를 입력해주세요.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      return;
    }

    if (onSaveRecipientEmail) {
      onSaveRecipientEmail(toSave, true);
    }
    setEmailInput(toSave);
    setSaveSuccessMsg(`'${toSave}' 주소가 기본 수신 이메일로 저장되었습니다. (다시 실행해도 유지)`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleSelectSavedEmail = (email: string) => {
    setEmailInput(email);
    setSendResultMsg(null);
  };

  const handleDeleteEmail = (e: React.MouseEvent, emailToDelete: string) => {
    e.stopPropagation();
    if (onDeleteSavedEmail) {
      onDeleteSavedEmail(emailToDelete);
    }
  };

  const handleSend = async () => {
    const target = emailInput.trim();
    if (!target || !target.includes('@')) {
      setSendResultMsg('올바른 발송 대상 이메일 주소를 입력해주세요.');
      return;
    }

    // Auto save if enabled
    if (autoSaveOnSend && onSaveRecipientEmail) {
      onSaveRecipientEmail(target, true);
    }

    setIsSending(true);
    setSendResultMsg(null);
    try {
      const msg = await onSendEmail(target);
      setSendResultMsg(msg || `${target} 주소로 발송 완료되었습니다.`);
    } catch (err: any) {
      setSendResultMsg('발송 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl h-[92dvh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 shrink-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {mailProviderConfigured ? '이메일 발송 & 수신 설정' : '뉴스레터 미리보기 & 수신 설정'}
                </h3>
                {mailProviderConfigured ? (
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Resend 실제 발송 연동</span>
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <Eye className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>미리보기 모드</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                희망 스케줄: {formatScheduleDaysSummary(deliveryDays)} {formatKoreanTimeLabel(deliveryTime)} ({getTimezoneShortLabel(deliveryTimezone)})
                {mailProviderConfigured ? ' · Resend API 즉시 발송 지원' : ' · 외부 메일 발송 미연동'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-3 sm:px-6 pt-2 pb-1.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-xs overflow-x-auto scrollbar-none whitespace-nowrap shrink-0">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'send'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{mailProviderConfigured ? '수신 설정 & 이메일 발송' : '수신 설정 & 뉴스레터 미리보기 생성'}</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>뉴스레터 템플릿 미리보기</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{mailProviderConfigured ? `발송 이력 (${emailLogs.length})` : `미리보기 이력 (${emailLogs.length})`}</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/40">
          {activeTab === 'send' && (
            <div className="space-y-4">
              {/* Honest Mode Notice */}
              {mailProviderConfigured ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  <span className="font-bold block mb-0.5">Resend 실제 이메일 발송 연동됨</span>
                  아래에서 수신 이메일을 입력하고 <strong>뉴스레터 발송하기</strong>를 누르면 현재 브리핑 요약이 실제 이메일로 즉시 전송됩니다.
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <span className="font-bold block mb-0.5">미리보기 모드 안내 (외부 이메일 발송 미연동)</span>
                  현재 서버에 <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">RESEND_API_KEY</code>가 설정되지 않아 실제 이메일은 전송되지 않으며, 아래 버튼은 뉴스레터 HTML 미리보기만 생성합니다.
                </div>
              )}

              {/* Recipient Email Settings & Storage Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>수신 예정 이메일 주소 설정 및 저장</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {mailProviderConfigured
                        ? '입력하신 이메일 주소를 저장해두고 즉시 뉴스레터를 발송할 수 있습니다.'
                        : '입력하신 이메일 주소를 브라우저에 저장해두고 뉴스레터 미리보기에 반영할 수 있습니다.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">현재 기본값:</span>
                    {recipientEmail ? (
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        {recipientEmail}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        미설정
                      </span>
                    )}
                  </div>
                </div>

                {/* Email Input & Action Buttons */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="수신할 이메일 주소 (예: user@example.com)"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition"
                      />
                    </div>

                    {/* Save Recipient Email Button */}
                    <button
                      type="button"
                      onClick={() => handleSaveDefaultEmail()}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer ${
                        isCurrentInputSavedDefault
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                      title="입력한 이메일을 기본 수신 주소로 브라우저에 저장합니다."
                    >
                      {isCurrentInputSavedDefault ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>기본값 저장됨</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>수신 메일 저장</span>
                        </>
                      )}
                    </button>

                    {/* Send or Generate Preview Button */}
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={isSending || !emailInput}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      {mailProviderConfigured ? (
                        <Send className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isSending
                          ? mailProviderConfigured
                            ? '발송 중...'
                            : '생성 중...'
                          : mailProviderConfigured
                          ? '뉴스레터 발송하기'
                          : '뉴스레터 미리보기 생성'}
                      </span>
                    </button>
                  </div>

                  {/* Auto-save checkbox */}
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1 px-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoSaveOnSend}
                        onChange={(e) => setAutoSaveOnSend(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                      />
                      <span>
                        {mailProviderConfigured
                          ? '발송 시 이 주소를 기본 수신 이메일로 자동 저장'
                          : '뉴스레터 미리보기 생성 시 이 주소를 기본 수신 이메일로 브라우저에 저장'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Save Feedback Alert */}
                {saveSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {/* Send Result Feedback Alert */}
                {sendResultMsg && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{sendResultMsg}</span>
                  </div>
                )}

                {/* Saved Recipient Emails Chips (Quick Selection) */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <BookmarkCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>저장된 수신 이메일 목록 (클릭하여 빠른 선택)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">총 {emailList.length}개 주소 등록됨</span>
                  </div>

                  {emailList.length === 0 ? (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 py-1">
                      저장된 수신 이메일이 없습니다. 위 입력창에 이메일 주소를 입력하고 &apos;수신 메일 저장&apos;을 눌러주세요.
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {emailList.map((addr) => {
                        const isDefault = addr.toLowerCase() === recipientEmail.toLowerCase();
                        const isSelected = addr.toLowerCase() === emailInput.trim().toLowerCase();
                        return (
                          <div
                            key={addr}
                            onClick={() => handleSelectSavedEmail(addr)}
                            className={`group px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span>{addr}</span>
                            {isDefault && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isSelected ? 'bg-white text-blue-700' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                }`}
                              >
                                기본
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteEmail(e, addr)}
                              className={`p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ml-0.5 ${
                                isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                              }`}
                              title="저장 목록에서 삭제"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Automatic Dispatch Schedule Controls */}
              {onUpdateSchedule ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <EmailSchedulerPanel
                    variant="modal"
                    autoEmailEnabled={autoEmailEnabled}
                    deliveryTime={deliveryTime}
                    deliveryTimezone={deliveryTimezone}
                    deliveryDays={deliveryDays}
                    recipientEmail={recipientEmail}
                    mailProviderConfigured={mailProviderConfigured}
                    onChangeSchedule={onUpdateSchedule}
                  />
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-blue-200 dark:border-blue-800/70 rounded-2xl p-4 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatScheduleDaysSummary(deliveryDays)} {formatKoreanTimeLabel(deliveryTime)} ({getTimezoneShortLabel(deliveryTimezone)}) 자동 발송 안내
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      저장된 수신 이메일로 지정된 요일 및 시각에 뉴스레터가 자동 발송됩니다. 설정하신 이메일과 스케줄은 브라우저(localStorage)에 영구 저장됩니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Push Notification Settings */}
              {onTogglePush && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5 shadow-xs">
                  <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>웹 &amp; 모바일 푸시 알림</span>
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          실시간 헤드라인 푸시 팝업
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          브라우저 및 모바일 잠금화면으로 핵심 요약 알림 수신
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {onTestPush && (
                        <button
                          type="button"
                          onClick={onTestPush}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition cursor-pointer"
                        >
                          푸시 테스트
                        </button>
                      )}
                      <input
                        type="checkbox"
                        checked={pushNotificationEnabled}
                        onChange={(e) => onTogglePush(e.target.checked)}
                        aria-label="웹 및 모바일 푸시 알림 활성화"
                        className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Local Region News Real-time Push Alert Toggle */}
                  {onToggleLocalNewsAlert && (() => {
                    const regionMeta = getRegionByCode(selectedRegionSido);
                    const regionLabel = regionMeta
                      ? selectedRegionSigungu && selectedRegionSigungu !== 'all'
                        ? `${regionMeta.shortName} · ${selectedRegionSigungu}`
                        : regionMeta.name
                      : '';
                    const sigunguOptions = regionMeta?.sigungu || [];

                    return (
                      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/70 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                  내 지역 뉴스 알림
                                </span>
                                {regionLabel ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                                    {regionLabel}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    지자체 미선택
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                선택한 지자체에서 새로운 주요 기사가 업데이트되면 실시간 푸시 알림 수신
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                            {onTestLocalNewsAlert && selectedRegionSido !== 'all' && (
                              <button
                                type="button"
                                onClick={() =>
                                  onTestLocalNewsAlert(selectedRegionSido, selectedRegionSigungu)
                                }
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900 transition cursor-pointer"
                              >
                                지역 알림 테스트
                              </button>
                            )}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={localNewsAlertEnabled}
                              aria-label="내 지역 뉴스 알림"
                              onClick={() =>
                                onToggleLocalNewsAlert(
                                  !localNewsAlertEnabled,
                                  selectedRegionSido,
                                  selectedRegionSigungu
                                )
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                                localNewsAlertEnabled
                                  ? 'bg-amber-600 dark:bg-amber-500'
                                  : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                                  localNewsAlertEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {onChangeAlertRegion && (
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/70 dark:border-amber-800/50 text-[11px]">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              알림 지자체 지정:
                            </span>
                            <select
                              value={selectedRegionSido}
                              onChange={(e) => onChangeAlertRegion(e.target.value, 'all')}
                              aria-label="알림 시/도 지자체 선택"
                              className="px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer focus:outline-none focus:border-amber-500"
                            >
                              <option value="all">지자체 선택...</option>
                              {KOREAN_REGIONS.map((region) => (
                                <option key={region.code} value={region.code}>
                                  {region.name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={selectedRegionSigungu}
                              onChange={(e) =>
                                onChangeAlertRegion(selectedRegionSido, e.target.value)
                              }
                              disabled={selectedRegionSido === 'all' || sigunguOptions.length === 0}
                              aria-label="알림 시/군/구 지자체 선택"
                              className="px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-50 cursor-pointer focus:outline-none focus:border-amber-500"
                            >
                              <option value="all">
                                {selectedRegionSido === 'all'
                                  ? '시/도 먼저 선택'
                                  : `${regionMeta?.shortName || ''} 전체`}
                              </option>
                              {sigunguOptions.map((sg) => (
                                <option key={sg} value={sg}>
                                  {sg}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="text-xs text-slate-400 dark:text-slate-500">발송 제목:</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  [모닝브리프] {briefing.briefingDate} 대한민국 주요 언론사 1면 및 공통이슈 3줄 요약
                </div>
              </div>

              {/* Newsletter Preview Card */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 text-xs text-slate-700 dark:text-slate-200">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center justify-between">
                  <span className="font-bold text-blue-700 dark:text-blue-400">모닝브리프 데일리 미리보기</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{briefing.briefingDate}</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                  {briefing.summaryNote}
                </p>

                <div className="pt-2 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    ■ 주요 신문 1면 톱 보도 (미리보기):
                  </div>
                  {briefing.frontPageStories.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                        [{s.outletName}] {s.title}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                        {s.leadSummary.slice(0, 2).map((l, i) => (
                          <div key={i}>{l}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {emailLogs.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs shadow-xs">
                  아직 생성된 뉴스레터 미리보기 이력이 없습니다.
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white">{log.headline}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        대상: {log.recipient} · {log.sentAt}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        log.status === 'preview' || log.isPreviewOnly
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                          : log.status === 'failed'
                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {log.status === 'preview' || log.isPreviewOnly
                        ? '미리보기 생성됨'
                        : log.status === 'failed'
                        ? '실패'
                        : '발송됨'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
