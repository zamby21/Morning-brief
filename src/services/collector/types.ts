import type { ArticleContentBlock } from '../../types/news.ts';

export interface RawRSSArticle {
  outletId: string;
  outletName: string;
  title: string;
  link: string;
  naverUrl?: string;
  pubDate: string;
  snippet: string;
  leadSentences?: string[];
  fullBody?: string;
  articleBlocks?: ArticleContentBlock[];
  leadImage?: string;
  leadImageCaption?: string;
  reporter?: string;
  category?: string;
  isTopLead?: boolean;
}

export interface OutletCacheEntry {
  articles: RawRSSArticle[];
  fetchedAt: number;
  kstDate: string;
}

export interface OutletFetchHealth {
  okCount: number;
  failCount: number;
  lastOkAt?: string;
  lastErrorAt?: string;
}
