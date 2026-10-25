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
}

export interface NewsStory {
  id: string;
  outletId: string;
  outletName: string;
  category: 'frontpage' | 'overlapping' | 'exclusive';
  title: string;
  leadSummary: string[]; // Strictly up to 3 lines
  originalUrl: string;
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
  // Specific to exclusive stories
  exclusiveBadge?: string;
  importanceRating?: 'High' | 'Crucial' | 'Medium';

  // Full article body & metadata for verified reading
  fullContent?: string;
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

export interface DailyBriefing {
  id: string;
  briefingDate: string; // e.g. "2026년 10월 19일 (월)"
  briefingTime: string; // e.g. "09:00 AM"
  topKeywords: string[];
  tone: BriefingTone;
  frontPageStories: NewsStory[];
  overlappingStories: NewsStory[];
  exclusiveStories: NewsStory[];
  selectedOutletIds: string[];
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

export interface UserPreferences {
  recipientEmail: string;
  deliveryTime: string; // "09:00"
  deliveryDays: string[]; // ["월", "화", "수", "목", "금"]
  autoEmailEnabled: boolean;
  pushNotificationEnabled: boolean;
  preferredTone: BriefingTone;
  subscribedTopics: string[];
  selectedOutlets: string[];
}

export interface EmailDispatchLog {
  id: string;
  sentAt: string;
  recipient: string;
  status: 'success' | 'queued' | 'failed';
  headline: string;
  storiesCount: number;
}
