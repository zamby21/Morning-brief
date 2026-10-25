import React, { useState } from 'react';
import {
  X,
  Newspaper,
  ZoomIn,
  ZoomOut,
  Printer,
  ExternalLink,
  Share2,
  Bookmark,
  Calendar,
  Layers,
  Sparkles,
  Check,
  Building2,
  Maximize2,
  FileText,
} from 'lucide-react';
import { NewsStory } from '../types/news';
import { PRESS_OUTLETS } from '../data/mockNewsData';
import { copyToClipboardSafe } from '../utils/linkUtils';
import { getCurrentKoreanFullDateString } from '../utils/dateUtils';

interface NewspaperViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: NewsStory | null;
  onOpenShare?: (story: NewsStory) => void;
}

type PaperTheme = 'newsprint' | 'clean' | 'sepia';

export const NewspaperViewerModal: React.FC<NewspaperViewerModalProps> = ({
  isOpen,
  onClose,
  story,
  onOpenShare,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('newsprint');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !story) return null;

  const outletMeta = PRESS_OUTLETS.find(
    (p) => p.name === story.outletName || p.id === story.outletId
  );

  const issueNumber = story.newspaperIssueNo || '제 32,842호';
  const issueDate = getCurrentKoreanFullDateString();
  const pageLabel = story.newspaperPage || '제 1 면 (종합)';
  const editionType = story.editionType || '조간 1판 (본사 직발행)';

  // Theme styling for authentic paper facsimile
  const getThemeStyles = () => {
    switch (paperTheme) {
      case 'sepia':
        return {
          wrapper: 'bg-[#f4ede1] text-[#2c2217] border-[#d8c9b3]',
          mastheadBg: 'border-b-2 border-[#5c4a36]',
          ruleBorder: 'border-[#cfbfa8]',
          photoBox: 'bg-[#ebe1cf] border-[#cbb99e]',
          badge: 'bg-[#5c4a36] text-[#f4ede1]',
        };
      case 'clean':
        return {
          wrapper: 'bg-white text-slate-900 border-slate-300',
          mastheadBg: 'border-b-2 border-slate-900',
          ruleBorder: 'border-slate-300',
          photoBox: 'bg-slate-100 border-slate-200',
          badge: 'bg-slate-900 text-white',
        };
      case 'newsprint':
      default:
        return {
          wrapper: 'bg-[#faf7f0] text-[#1e2022] border-[#d9d3c5]',
          mastheadBg: 'border-b-2 border-[#1e2022]',
          ruleBorder: 'border-[#ded8cb]',
          photoBox: 'bg-[#f0ebe0] border-[#d8d1c1]',
          badge: 'bg-[#1e2022] text-[#faf7f0]',
        };
    }
  };

  const currentTheme = getThemeStyles();

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const textToCopy = `[${story.outletName} 1면 톱기사]\n${story.title}\n\n${story.leadSummary.join('\n')}\n\n출처: ${story.originalUrl}`;
    const ok = await copyToClipboardSafe(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300 text-slate-800">
        {/* Modal Top Control Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-tight">
                  {story.outletName} 지면 신문 1면 정밀 뷰어
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  {pageLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                실제 신문 지면 1면 톱 기사의 활자 배치, 헤드라인 규격, 포토 박스를 가독성 높은 지면 스타일로 재현합니다.
              </p>
            </div>
          </div>

          {/* Interactive Viewer Toolbar */}
          <div className="flex items-center gap-2">
            {/* Paper Theme Selector */}
            <div className="hidden md:flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setPaperTheme('newsprint')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  paperTheme === 'newsprint'
                    ? 'bg-amber-100 text-amber-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="미색 지면 신문지 느낌"
              >
                미색 신문지
              </button>
              <button
                onClick={() => setPaperTheme('clean')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  paperTheme === 'clean'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="선명하고 깨끗한 화이트"
              >
                고대비 화이트
              </button>
              <button
                onClick={() => setPaperTheme('sepia')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  paperTheme === 'sepia'
                    ? 'bg-amber-800 text-amber-50 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="클래식 세피아 빈티지"
              >
                클래식 세피아
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(80, prev - 15))}
                disabled={zoomLevel <= 80}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="축소"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold px-2 text-slate-200">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(150, prev + 15))}
                disabled={zoomLevel >= 150}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="확대"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer hidden sm:block"
              title="지면 인쇄하기"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="기사 텍스트 복사"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4" />}
            </button>

            {onOpenShare && (
              <button
                onClick={() => onOpenShare(story)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                title="공유하기"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer ml-1"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Paper Canvas Container */}
        <div className="flex-1 overflow-auto p-3 sm:p-8 bg-slate-200/80 flex justify-center">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className={`w-full max-w-4xl shadow-xl rounded-lg p-6 sm:p-10 border transition-colors duration-200 ${currentTheme.wrapper}`}
          >
            {/* Top Newspaper Folio Header (지면 최상단 메타 바) */}
            <div className={`flex items-center justify-between text-[11px] pb-1.5 mb-2 font-serif border-b ${currentTheme.ruleBorder}`}>
              <div className="flex items-center gap-2">
                <span className="font-bold">{issueDate}</span>
                <span>·</span>
                <span>{editionType}</span>
                <span>·</span>
                <span>{issueNumber}</span>
              </div>
              <div className="flex items-center gap-2 font-bold tracking-widest">
                <span>{story.outletName}</span>
                <span>|</span>
                <span className="px-1.5 py-0.5 rounded bg-black/5 font-black text-xs">
                  {pageLabel}
                </span>
              </div>
            </div>

            {/* Official Newspaper Masthead Title */}
            <header className={`py-4 sm:py-6 text-center border-b-2 sm:border-b-4 mb-4 ${currentTheme.mastheadBg}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="text-left hidden sm:block text-[11px] font-serif leading-tight opacity-75 max-w-[160px]">
                  <div>창간 1920년</div>
                  <div>사시(社是): 정론직필·민주주의</div>
                  <div>우편번호 03186 서울 중구</div>
                </div>

                <div className="text-center flex-1">
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight sm:tracking-widest font-serif drop-shadow-xs">
                    {outletMeta?.logoText || story.outletName}
                  </h1>
                  <p className="text-[11px] sm:text-xs font-serif uppercase tracking-widest mt-1 opacity-70">
                    THE {outletMeta?.name || 'DAILY NEWSPAPER'} FIRST PAGE EDITION
                  </p>
                </div>

                <div className="text-right hidden sm:block text-[11px] font-serif leading-tight opacity-75 max-w-[160px]">
                  <div>구독신청 1577-0000</div>
                  <div>독자투고 opinion@press.kr</div>
                  <div>공식 홈페이지 바로가기</div>
                </div>
              </div>
            </header>

            {/* Thin Double Rule under Masthead */}
            <div className={`border-t-2 border-b border-double h-1 mb-5 opacity-40 ${currentTheme.ruleBorder}`} />

            {/* Main 1-Page Headline & Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Left / Center 8 Columns: Main 1면 톱 기사 (Lead Story) */}
              <article className="lg:col-span-8 flex flex-col justify-between space-y-4">
                <div>
                  {/* Category & Section Kicker */}
                  <div className="flex items-center gap-2 mb-2 font-serif text-xs">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${currentTheme.badge}`}>
                      1면 톱 (Top Lead)
                    </span>
                    <span className="font-semibold underline decoration-slate-400 underline-offset-4">
                      {story.topic || '정치·경제'} 특별취재반
                    </span>
                    <span className="opacity-50">|</span>
                    <span className="opacity-75">{story.reporter || `${story.outletName} 취재본부`}</span>
                  </div>

                  {/* Main Newspaper Headline */}
                  <h2 className="text-2xl sm:text-3xl font-black font-serif leading-snug sm:leading-tight tracking-tight mb-3">
                    {story.title}
                  </h2>

                  {/* Sub-headline Box (부제목) */}
                  <div className={`p-3 rounded-lg border-l-4 border-slate-900 bg-black/5 mb-4 font-serif text-xs sm:text-sm font-semibold leading-relaxed`}>
                    <p>
                      ▲ {story.leadSummary[0] || '당일 신문 지면 1면 톱기사 핵심 골자 보도'}
                    </p>
                  </div>

                  {/* 1면 Lead Photo Box (지면 포토뉴스) */}
                  <div className={`p-3 rounded-xl border mb-5 ${currentTheme.photoBox}`}>
                    <div className="relative aspect-video sm:aspect-21/9 bg-gradient-to-br from-slate-800 to-slate-950 rounded-lg overflow-hidden flex flex-col justify-end p-4 text-white shadow-inner">
                      <div className="absolute top-3 left-3 bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        1면 현장 포토
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                      <div className="relative z-10 space-y-1">
                        <span className="text-[11px] font-bold text-blue-300">
                          [{story.outletName} 현장 사진DB]
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2">
                          {story.title}
                        </h4>
                      </div>
                    </div>
                    <div className="text-[11px] font-serif opacity-75 mt-2 flex items-start gap-1.5 leading-normal">
                      <span className="font-bold shrink-0">▲ [지면 1면 포토뉴스]</span>
                      <span>
                        {story.leadImageCaption ||
                          `${issueDate} ${story.outletName} 1면에 게재된 주요 현장 보도 사진. 관계 당국 및 핵심 당사자들의 공식 회담과 주요 정책 발표 현장 모습.`}
                      </span>
                    </div>
                  </div>

                  {/* Multi-column Body Text (신문 다단 조판) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-[13px] font-serif leading-relaxed text-justify">
                    <div className="space-y-2.5">
                      <p className="first-letter:text-3xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:leading-none">
                        {story.leadSummary[0]}
                      </p>
                      {story.leadSummary[1] && (
                        <p>{story.leadSummary[1]}</p>
                      )}
                    </div>
                    <div className="space-y-2.5 sm:border-l sm:pl-4 border-slate-300/80">
                      {story.leadSummary[2] && (
                        <p>{story.leadSummary[2]}</p>
                      )}
                      {story.fullContent && (
                        <p className="opacity-90 pt-1 line-clamp-4">
                          {story.fullContent.slice(0, 200)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Article Footer & Official Portal Link */}
                <div className={`pt-3 border-t mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-serif ${currentTheme.ruleBorder}`}>
                  <span className="opacity-75">
                    기사승인: {story.publishedAt || '2026-10-19 06:00'} | 지면 1면 게재본
                  </span>
                  <a
                    href={story.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                  >
                    <span>{story.outletName} 공식 지면 원문 확인</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>

              {/* Right 4 Columns: Side Column & Editorial Box (1면 사이드 기사) */}
              <aside className={`lg:col-span-4 lg:border-l lg:pl-6 space-y-5 ${currentTheme.ruleBorder}`}>
                {/* 1면 사이드 박스: 오늘의 주요 사설 및 칼럼 */}
                <div className={`p-4 rounded-xl border ${currentTheme.photoBox}`}>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10">
                    <span className="text-[11px] font-black uppercase tracking-wider font-serif">
                      오늘의 1면 사설·시론
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10">
                      Editorial
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold font-serif leading-snug mb-1.5">
                    [사설] {story.title.split(' ')[0]} {story.title.split(' ')[1] || ''}… 국가 백년대계 관점에서 엄정 대처해야
                  </h4>
                  <p className="text-[11px] font-serif leading-relaxed opacity-80">
                    이번 사안은 단순한 일회성 이슈를 넘어 미래 세대와 산업 생태계 전반에 지대한 파급력을 미칠 중대 분수령이다. 당정은 정파적 이해를 떠나 근본적 해법 마련에 착수해야 한다.
                  </p>
                </div>

                {/* 1면 사이드 단신: 지면 안내 (Index) */}
                <div className={`p-4 rounded-xl border bg-black/5 ${currentTheme.ruleBorder}`}>
                  <span className="text-[11px] font-black uppercase tracking-wider font-serif block mb-2">
                    지면 주요 안내 (Index)
                  </span>
                  <ul className="text-[11px] font-serif space-y-1.5 opacity-85">
                    <li className="flex justify-between border-b border-black/5 pb-1">
                      <span>• 종합·정치 해설</span>
                      <strong className="font-mono">2면</strong>
                    </li>
                    <li className="flex justify-between border-b border-black/5 pb-1">
                      <span>• 금융·글로벌 마켓 심층</span>
                      <strong className="font-mono">3면</strong>
                    </li>
                    <li className="flex justify-between border-b border-black/5 pb-1">
                      <span>• 테크·AI 미래 비즈니스</span>
                      <strong className="font-mono">8면</strong>
                    </li>
                    <li className="flex justify-between border-b border-black/5 pb-1">
                      <span>• 오피니언 & 명사 칼럼</span>
                      <strong className="font-mono">23면</strong>
                    </li>
                  </ul>
                </div>

                {/* Keywords Bar */}
                {story.keywords && story.keywords.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-serif font-bold block mb-1.5 opacity-70">
                      1면 핵심 연관 검색어:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {story.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-serif px-2 py-0.5 rounded border border-black/10 bg-white/60"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Press Stamp */}
                <div className="pt-3 border-t border-black/10 flex items-center justify-between text-[11px] font-serif opacity-70">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>한국신문협회 회원사</span>
                  </div>
                  <span className="font-mono text-[10px]">VERIFIED PRESS</span>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            💡 <strong>TIP:</strong> 마우스 휠로 스크롤하거나 확대/축소 버튼으로 지면 글씨 크기를 조정할 수 있습니다.
          </div>
          <div className="flex items-center gap-2">
            <a
              href={story.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <span>원문 신문 지면 PDF / 포털</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
