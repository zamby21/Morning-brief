export type PressCategory = 'major' | 'economy' | 'broadcast' | 'tech' | 'general' | 'local';

export type PressGroupCategory = '종합/경제' | '방송/통신' | 'IT' | '지역';

export interface PressOutlet {
  id: string;
  name: string;
  category: PressCategory;
  groupCategory?: PressGroupCategory;
  isDefaultMajor: boolean; // Part of 10 major outlets (5 major + 5 economy)
  logoText: string;
  badgeColor: string;
  homepageUrl: string;
}

export type BriefingTone = 'formal' | 'bullet' | 'friendly' | 'insight';

export interface ArticleContentBlock {
  type: 'text' | 'subheading' | 'image';
  text?: string;
  url?: string;
  caption?: string;
}

export interface ClusterOutletItem {
  outletName: string;
  outletId: string;
  category: string;
  headline: string;
  stance: string; // 각 언론사의 보도 논조 및 핵심 시각
  leadSummary: string[];
  originalUrl: string;
  reporter?: string;
  publishedAt?: string;
  fullContent?: string;
  articleBlocks?: ArticleContentBlock[];
  leadImage?: string;
  leadImageCaption?: string;
}

export interface NewsStory {
  id: string;
  outletId: string;
  outletName: string;
  category: 'frontpage' | 'overlapping' | 'exclusive';
  title: string;
  leadSummary: string[]; // 3 lines (formal/bullet/friendly) or 4 lines (insight: 3 bullet summary + 1 bullet [시사점])
  baseSummary?: string[]; // Raw factual 3-line summary preserved for lossless tone switching
  aiInsight?: string; // Gemini deep cross-article [시사점] preserved across tone switches
  originalUrl: string;
  naverUrl?: string;
  publishedAt: string;
  keywords: string[];
  topic: string; // e.g., '반도체·AI', '금융·거시', '정치·정책', '부동산', '글로벌'
  reactions?: {
    insightful: number;
    important: number;
    surprising: number;
  };
  // Specific to overlapping stories
  coveredOutlets?: string[];
  consensusPoints?: string[];
  clusterOutlets?: ClusterOutletItem[]; // 언론사별 원문 클러스터 세부 정보
  similarityScore?: number; // 기사 유사도 점수 (0~100%, 70% 이상 엄선 기준)
  integratedOneLineSummary?: string; // 유사 기사 3개 이상 묶일 때 핵심 내용을 통합한 종합 1줄 요약
  // Specific to exclusive stories
  exclusiveBadge?: string;
  importanceRating?: 'High' | 'Crucial' | 'Medium';

  // Full article body & ordered verbatim content blocks (text + subheadings + photos)
  fullContent?: string;
  articleBlocks?: ArticleContentBlock[];
  reporter?: string;
  pressSection?: string;

  // Newspaper Facsimile & Front Page Layout Data
  newspaperPage?: string; // e.g. "1면 (종합)"
  newspaperIssueNo?: string; // e.g. "제 32048호"
  editionType?: string; // e.g. "조간" | "석간" | "종합 1판"
  leadImage?: string; // photo or infographic visual
  leadImageCaption?: string;
  sideStoryHeadline?: string;
  sideStoryLead?: string;
  quoteHighlight?: string;
}

export type DataSourceType = 'live' | 'cached' | 'mock';

export interface KeywordTrendPoint {
  hourLabel: string;
  timeLabel: string;
  outletCount: number;
}

export interface KeywordTrendData {
  keyword: string;
  dailyChangePercent: number | null;
  direction: 'up' | 'down' | 'flat';
  currentOutletCount: number;
  previousOutletCount: number | null;
  matchedArticleCount?: number;
  coveredOutlets: string[];
  hourlySeries: KeywordTrendPoint[];
  peakHourLabel: string;
  peakOutletCount: number;
  hasHistoricalTrend: boolean;
}

export type OperationalStatus = 'ok' | 'degraded' | 'unavailable';

export interface DailyBriefing {
  id: string;
  briefingDate: string; // e.g. "2026년 10월 19일 (월)"
  briefingTime: string; // e.g. "09:00 AM"
  sourceType?: DataSourceType;
  sectorSourceType?: DataSourceType;
  isFallback?: boolean;
  degraded?: boolean;
  errorCode?: string;
  collectorStatus?: OperationalStatus;
  aiStatus?: OperationalStatus;
  aiErrorCode?: string;
  sampleSnapshotDate?: string; // Fixed YYYY-MM-DD snapshot date when fallback sample data is shown
  collectedAt?: string; // ISO timestamp of actual collection
  topKeywords: string[];
  keywordTrends?: Record<string, KeywordTrendData>;
  tone: BriefingTone;
  frontPageStories: NewsStory[];
  overlappingStories: NewsStory[];
  exclusiveStories: NewsStory[];
  sectorHeadlines?: SectorHeadlineItem[]; // 4번째 기능: 건설·부동산·도시개발·금융 특화 헤드라인
  selectedOutletIds: string[];
  frontPageOutletIds?: string[];
  overlappingOutletIds?: string[];
  summaryNote: string;
}

export interface WeeklyIssue {
  day: string;
  date: string;
  mainHeadline: string;
  summary: string;
  keySectors: string[];
  toneComparison: {
    conservative: string;
    progressive: string;
    economic: string;
  };
}

export interface WeeklyReport {
  weekRange: string;
  sourceType?: DataSourceType;
  isFallback?: boolean;
  overallDiagnosis: string;
  topTrendKeywords: { keyword: string; count: number }[];
  timeline: WeeklyIssue[];
  sectorAnalysis: {
    sector: string;
    summary: string;
    keyPoints: string[];
  }[];
  outlookNextWeek: string[];
}

export type SectorCategoryKey = 'construction' | 'realestate' | 'urban' | 'finance';

export type RealEstateFinanceSector = 'all' | SectorCategoryKey;

export interface SectorHeadlineItem {
  id: string;
  sector: SectorCategoryKey;
  sectorLabel: string; // e.g. '건설·SOC' | '부동산·주택' | '도시개발·정비' | '금융·금리'
  outletId: string;
  outletName: string;
  title: string;
  summary: string; // 1~2줄 핵심 요약 및 시장 파급 효과
  leadSummary?: string[]; // Section 1과 동일한 핵심 요약 (어조 반영, insight는 3+1줄)
  baseSummary?: string[]; // 어조 전환용 원 팩트 3줄 요약
  aiInsight?: string; // Gemini 심층 교차 검토 [시사점]
  publishedAt: string;
  originalUrl: string;
  naverUrl?: string;
  tags: string[];
  impactRating?: 'High' | 'Crucial' | 'Medium';
  highlightBadge?: string; // e.g. "수주 3.2조", "청약 350:1", "금리 0.25%p↓"
  keyFigure?: string;
  fullContent?: string;
  articleBlocks?: ArticleContentBlock[];
  leadImage?: string;
  leadImageCaption?: string;
  reporter?: string;
  pressSection?: string;
  sourceType?: DataSourceType;
  isFallback?: boolean;
}

export interface SectorPreferences {
  enabledSectors: SectorCategoryKey[]; // 사용자가 활성화한 관심 섹터
  favoriteKeywords: string[]; // 사용자가 집중 구독하는 세부 키워드/태그
  defaultSector: RealEstateFinanceSector; // 기본 선택 탭
  onlyCrucialOrHigh?: boolean; // 중요도 높은 핵심 기사 우선 보기
  localNewsAlertEnabled?: boolean; // 내 지역 뉴스 실시간 푸시 알림 활성화 여부
  selectedRegionSido?: string; // 선택된 시/도 코드 ('all' 또는 지역 코드)
  selectedRegionSigungu?: string; // 선택된 시/군/구 ('all' 또는 시군구명)
}

export const DEFAULT_SECTOR_PREFERENCES: SectorPreferences = {
  enabledSectors: ['construction', 'realestate', 'urban', 'finance'],
  favoriteKeywords: [],
  defaultSector: 'all',
  onlyCrucialOrHigh: false,
  localNewsAlertEnabled: false,
  selectedRegionSido: 'all',
  selectedRegionSigungu: 'all',
};

export type ThemeMode = 'light' | 'dark' | 'system' | 'sun';

export interface UserPreferences {
  recipientEmail: string;
  savedRecipientEmails?: string[]; // 자주 쓰는 / 등록된 수신 이메일 목록
  deliveryTime: string; // "09:00"
  deliveryTimezone?: string; // IANA timezone, e.g. "Asia/Seoul"
  deliveryDays: string[]; // ["월", "화", "수", "목", "금"]
  autoEmailEnabled: boolean;
  pushNotificationEnabled: boolean;
  preferredTone: BriefingTone;
  toneExplicitlySelected?: boolean;
  theme?: ThemeMode;
  subscribedTopics: string[];
  customTopics?: string[]; // 사용자가 개인화하여 추가/삭제·저장한 관심 주제 목록
  selectedOutlets: string[]; // 전체 기본/호환 언론사 목록
  frontPageOutlets?: string[]; // 1면 핵심 기사 맞춤 언론사 목록
  overlappingOutlets?: string[]; // 공통 이슈 기사 맞춤 언론사 목록
  minOutletCoverageRatio?: number; // 공통 이슈 수집 언론사 보도 비율 기준 (% 단위, 기본 50)
  minSimilarityScore?: number; // 공통 이슈 기사 유사도 기준 (% 단위, 기본 70)
  sectorPreferences?: SectorPreferences; // 4. 건설·부동산·금융 관심분야 개인설정
}

export type MailProviderKind = 'naver-smtp' | 'none';

export interface MailProviderStatus {
  configured: boolean;
  provider: MailProviderKind;
  providerLabel: string;
  missingFields: string[];
}

export interface EmailDispatchLog {
  id: string;
  sentAt: string;
  recipient: string;
  status: 'preview' | 'success' | 'failed';
  isPreviewOnly?: boolean;
  headline: string;
  storiesCount: number;
  provider?: MailProviderKind;
  messageId?: string;
}
