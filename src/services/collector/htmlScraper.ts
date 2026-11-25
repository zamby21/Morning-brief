import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import type { ArticleContentBlock } from '../../types/news.ts';
import { PRESS_OUTLETS, DEFAULT_10_OUTLETS } from '../../data/pressMetadata.ts';
import { extractSearchKeywords, getOfficialOutletHomepage } from '../../utils/linkUtils.ts';
import type { OutletCacheEntry, OutletFetchHealth, RawRSSArticle } from './types.ts';
import { OUTLET_PRESS_DESK_MAP, TOP10_CUSTOM_HOMEPAGE_IDS } from './outletSources.ts';
import {
  areTitlesNearDuplicate,
  decodeHtmlEntities,
  extractRealPubDateFromHtml,
  getKstDateKey,
  isCleanBodySentence,
  isCleanParagraph,
  isCleanSubheading,
  isCleanVerbatimLine,
  isWithinLast24Hours,
  matchesOutletSourceName,
  normalizeArticleUrl,
  parseKstDateTimeString,
  splitLongParagraphCleanly,
  stripInlineTagsCleanly,
  stripReporterEmailSuffix,
} from './textUtils.ts';

const outletCache = new Map<string, OutletCacheEntry>();
const outletFetchHealth = new Map<string, OutletFetchHealth>();
const CACHE_TTL_MS = 120 * 1000;

export function recordOutletHealth(outletId: string, ok: boolean): void {
  const prev = outletFetchHealth.get(outletId) || { okCount: 0, failCount: 0 };
  const nowIso = new Date().toISOString();
  if (ok) {
    prev.okCount += 1;
    prev.lastOkAt = nowIso;
  } else {
    prev.failCount += 1;
    prev.lastErrorAt = nowIso;
  }
  outletFetchHealth.set(outletId, prev);
}

export function getOutletCacheSize(): number {
  return outletCache.size;
}

export function getOutletHealthSnapshot(): {
  trackedOutlets: number;
  healthyOutlets: number;
  degradedOutlets: string[];
  cachedOutletCount: number;
} {
  let healthyOutlets = 0;
  const degradedOutlets: string[] = [];
  for (const [id, stat] of outletFetchHealth.entries()) {
    const lastOk = stat.lastOkAt ? Date.parse(stat.lastOkAt) : 0;
    const lastErr = stat.lastErrorAt ? Date.parse(stat.lastErrorAt) : 0;
    if (stat.okCount > 0 && lastOk >= lastErr) {
      healthyOutlets += 1;
    } else if (stat.failCount > 0) {
      degradedOutlets.push(id);
    }
  }
  return {
    trackedOutlets: outletFetchHealth.size,
    healthyOutlets,
    degradedOutlets: degradedOutlets.slice(0, 15),
    cachedOutletCount: outletCache.size,
  };
}

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
};

function decodeHtmlBuffer(buf: Buffer, contentTypeHeader = ''): string {
  const ct = contentTypeHeader.toLowerCase();
  const headAscii = buf.subarray(0, 2048).toString('latin1').toLowerCase();
  const isEucKr =
    ct.includes('euc-kr') ||
    ct.includes('ks_c_5601') ||
    ct.includes('cp949') ||
    /charset\s*=\s*['"]?(?:euc-kr|ks_c_5601|cp949)/.test(headAscii);

  if (isEucKr) {
    try {
      return new TextDecoder('euc-kr').decode(buf);
    } catch {
      return buf.toString('utf8');
    }
  }
  return buf.toString('utf8');
}

export async function fetchHtmlFast(
  url: string,
  timeoutMs = 4500,
  redirectsLeft = 4,
  retriesLeft = 1
): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  const attempt = (): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> =>
    new Promise((resolve) => {
      let settled = false;
      const done = (resObj: { ok: boolean; status: number; text: string; finalUrl: string }) => {
        if (!settled) {
          settled = true;
          resolve(resObj);
        }
      };

      try {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.get(
          url,
          {
            family: 4,
            timeout: timeoutMs,
            headers: BROWSER_HEADERS,
          },
          (res) => {
            const status = res.statusCode || 0;
            if (status >= 300 && status < 400 && res.headers.location && redirectsLeft > 0) {
              res.resume();
              const nextUrl = new URL(res.headers.location, url).toString();
              fetchHtmlFast(nextUrl, timeoutMs, redirectsLeft - 1, retriesLeft).then(done);
              return;
            }

            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            res.on('end', () => {
              try {
                const raw = Buffer.concat(chunks);
                const enc = (res.headers['content-encoding'] || '').toLowerCase();
                let buf: Buffer = raw;
                if (enc.includes('gzip')) buf = zlib.gunzipSync(raw);
                else if (enc.includes('br')) buf = zlib.brotliDecompressSync(raw);
                else if (enc.includes('deflate')) buf = zlib.inflateSync(raw);
                const decodedText = decodeHtmlBuffer(buf, String(res.headers['content-type'] || ''));
                done({ ok: status >= 200 && status < 300, status, text: decodedText, finalUrl: url });
              } catch {
                done({ ok: false, status, text: '', finalUrl: url });
              }
            });
            res.on('error', () => done({ ok: false, status, text: '', finalUrl: url }));
          }
        );
        req.on('timeout', () => {
          req.destroy();
          done({ ok: false, status: 0, text: '', finalUrl: url });
        });
        req.on('error', () => done({ ok: false, status: 0, text: '', finalUrl: url }));
      } catch {
        done({ ok: false, status: 0, text: '', finalUrl: url });
      }
    });

  const first = await attempt();
  if (!first.ok && first.status === 0 && retriesLeft > 0) {
    return fetchHtmlFast(url, timeoutMs, redirectsLeft, retriesLeft - 1);
  }
  return first;
}

function resolveArticleImageUrl(rawUrl: string, baseUrl: string): string | null {
  if (!rawUrl) return null;
  const cleaned = decodeHtmlEntities(rawUrl).trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('javascript:')) return null;

  let abs = cleaned;
  try {
    if (cleaned.startsWith('//')) {
      abs = `https:${cleaned}`;
    } else if (!/^https?:\/\//i.test(cleaned)) {
      abs = baseUrl ? new URL(cleaned, baseUrl).toString() : '';
    }
  } catch {
    return null;
  }
  if (!/^https?:\/\//i.test(abs)) return null;

  const lower = abs.toLowerCase();
  if (/\.(?:svg|ico)(?:\?|$)/i.test(lower)) return null;
  if (
    /(?:\/icon|\/icons\/|\/logo|logo_|_logo|\/btn|btn_|_btn|banner|\/ad\/|\/ads\/|ad_|doubleclick|googlesyndication|blank\.|spacer\.|1x1|pixel\.|sprite|share_|sns_|journalist_img|profile_|avatar|loading\.gif|noimage|no_img|default_img|common\/img\/ic_|static\.news\.naver\.net\/image\/news\/m\/20|ssl\.pstatic\.net\/static\/newsstand|dthumb-phinf\.pstatic\.net\/.*type=nf)/i.test(
      lower
    )
  ) {
    return null;
  }
  return abs;
}

function extractImgSrcFromTag(imgTag: string, baseUrl: string): string | null {
  const widthM = imgTag.match(/\bwidth\s*=\s*["']?(\d+)/i);
  const heightM = imgTag.match(/\bheight\s*=\s*["']?(\d+)/i);
  if ((widthM && Number(widthM[1]) > 0 && Number(widthM[1]) < 80) || (heightM && Number(heightM[1]) > 0 && Number(heightM[1]) < 60)) {
    return null;
  }

  const attrPriority = [
    /\bdata-src\s*=\s*["']([^"']+)["']/i,
    /\bdata-lazy-src\s*=\s*["']([^"']+)["']/i,
    /\bdata-original\s*=\s*["']([^"']+)["']/i,
    /\bdata-origin\s*=\s*["']([^"']+)["']/i,
    /\bdata-img-src\s*=\s*["']([^"']+)["']/i,
    /\bsrc\s*=\s*["']([^"']+)["']/i,
  ];
  for (const re of attrPriority) {
    const m = imgTag.match(re);
    if (m && m[1]) {
      const resolved = resolveArticleImageUrl(m[1], baseUrl);
      if (resolved) return resolved;
    }
  }
  return null;
}

function extractOgImage(articleHtml: string, articleUrl: string): string | undefined {
  const raw =
    articleHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    articleHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ||
    articleHtml.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    '';
  return resolveArticleImageUrl(raw, articleUrl) || undefined;
}

function extractReporterName(articleHtml: string): string | undefined {
  const raw =
    articleHtml.match(/<em[^>]*class=["'][^"']*media_end_head_journalist_name[^"']*["'][^>]*>([\s\S]*?)<\/em>/i)?.[1] ||
    articleHtml.match(/<span[^>]*class=["'][^"']*byline_s[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ||
    articleHtml.match(/<meta[^>]+(?:name|property)=["'](?:dable:author|author|article:author)["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    '';
  const cleaned = decodeHtmlEntities(raw.replace(/<[^>]+>/g, ' '))
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned && cleaned.length >= 2 && cleaned.length <= 40 && !cleaned.startsWith('http')) {
    return cleaned;
  }
  return undefined;
}

function extractOrderedArticleBlocks(containerHtml: string, baseUrl: string): ArticleContentBlock[] {
  if (!containerHtml) return [];

  let work = containerHtml
    .replace(/<(?:script|style|noscript|iframe|aside|nav|form|button|svg)[\s\S]*?<\/(?:script|style|noscript|iframe|aside|nav|form|button|svg)>/gi, '\n')
    .replace(/<div[^>]*class=["'][^"']*(?:vod_player|video_area|ad_wrap|art_ad|related_news|reporter_area|copyright|byline_wrap|share_area|sns_area|news_like|tag_area)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '\n');

  const placeholders: ArticleContentBlock[] = [];
  const seenImages = new Set<string>();
  const registerBlock = (block: ArticleContentBlock): string => {
    const idx = placeholders.length;
    placeholders.push(block);
    return `\n[[ART_BLOCK_${idx}]]\n`;
  };

  work = work.replace(
    /<span[^>]*class=["'][^"']*end_photo_org[^"']*["'][^>]*>([\s\S]*?)<\/span>(?:\s*(?:<br\s*\/?>|\s)*<em[^>]*class=["'][^"']*img_desc[^"']*["'][^>]*>([\s\S]*?)<\/em>)?/gi,
    (_m, spanInner: string, capInner?: string) => {
      const imgTag = spanInner.match(/<img[^>]+>/i)?.[0] || '';
      const imgUrl = extractImgSrcFromTag(imgTag, baseUrl);
      if (!imgUrl || seenImages.has(imgUrl)) return '\n';
      seenImages.add(imgUrl);
      const caption = capInner
        ? decodeHtmlEntities(capInner.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).trim()
        : decodeHtmlEntities(imgTag.match(/\balt=["']([^"']+)["']/i)?.[1] || '').trim();
      return registerBlock({
        type: 'image',
        url: imgUrl,
        caption: caption && caption.length >= 2 && caption !== '이미지' ? caption : undefined,
      });
    }
  );

  work = work.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_m, figInner: string) => {
    const imgTag = figInner.match(/<img[^>]+>/i)?.[0] || '';
    const imgUrl = extractImgSrcFromTag(imgTag, baseUrl);
    if (!imgUrl || seenImages.has(imgUrl)) return '\n';
    seenImages.add(imgUrl);
    const capMatch =
      figInner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] ||
      figInner.match(/<(?:p|span|div|em)[^>]*class=["'][^"']*(?:caption|img_desc|desc|txt)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|span|div|em)>/i)?.[1] ||
      '';
    const caption =
      decodeHtmlEntities(capMatch.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).trim() ||
      decodeHtmlEntities(imgTag.match(/\balt=["']([^"']+)["']/i)?.[1] || '').trim();
    return registerBlock({
      type: 'image',
      url: imgUrl,
      caption: caption && caption.length >= 2 && caption !== '이미지' ? caption : undefined,
    });
  });

  work = work.replace(
    /<img[^>]+>(?:\s*(?:<\/a>|<\/span>|<br\s*\/?>|\s)*<(?:em|figcaption|p|span|div)[^>]*class=["'][^"']*(?:img_desc|caption|photo_desc|img_txt|photo_cap)[^"']*["'][^>]*>([\s\S]*?)<\/(?:em|figcaption|p|span|div)>)?/gi,
    (fullMatch: string, capInner?: string) => {
      const imgTag = fullMatch.match(/<img[^>]+>/i)?.[0] || '';
      const imgUrl = extractImgSrcFromTag(imgTag, baseUrl);
      if (!imgUrl || seenImages.has(imgUrl)) return '\n';
      seenImages.add(imgUrl);
      const caption = capInner
        ? decodeHtmlEntities(capInner.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).trim()
        : decodeHtmlEntities(imgTag.match(/\balt=["']([^"']+)["']/i)?.[1] || '').trim();
      return registerBlock({
        type: 'image',
        url: imgUrl,
        caption: caption && caption.length >= 2 && caption !== '이미지' ? caption : undefined,
      });
    }
  );

  work = work.replace(/<em[^>]*class=["'][^"']*img_desc[^"']*["'][^>]*>[\s\S]*?<\/em>/gi, '\n');

  work = work.replace(
    /<strong[^>]*class=["'][^"']*media_end_summary[^"']*["'][^>]*>([\s\S]*?)<\/strong>/gi,
    (_m, inner: string) => {
      const text = decodeHtmlEntities(inner.replace(/<br\s*\/?>/gi, ' · ').replace(/<[^>]+>/g, ' ')).trim();
      return isCleanSubheading(text) ? registerBlock({ type: 'subheading', text }) : '\n';
    }
  );
  work = work.replace(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi, (_m, inner: string) => {
    const text = decodeHtmlEntities(inner.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).trim();
    return isCleanSubheading(text) ? registerBlock({ type: 'subheading', text }) : '\n';
  });

  const textWithMarkers = work
    .replace(/<\/?(?:a|span|strong|em|b|i|u|mark|font|small)[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(?:p|div|li|blockquote)(?:\s+[^>]*)?>/gi, '\n')
    .replace(/<\/(?:p|div|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  const rawLines = textWithMarkers
    .split(/\n+/)
    .map((line) => decodeHtmlEntities(line).trim())
    .filter(Boolean);

  const blocks: ArticleContentBlock[] = [];
  const seenTextKeys = new Set<string>();

  for (const line of rawLines) {
    const markerMatch = line.match(/^\[\[ART_BLOCK_(\d+)\]\]$/);
    if (markerMatch) {
      const blk = placeholders[Number(markerMatch[1])];
      if (blk) blocks.push(blk);
      continue;
    }

    if (line.includes('[[ART_BLOCK_')) {
      const parts = line.split(/(\[\[ART_BLOCK_\d+\]\])/g).map((x) => x.trim()).filter(Boolean);
      for (const part of parts) {
        const mm = part.match(/^\[\[ART_BLOCK_(\d+)\]\]$/);
        if (mm) {
          const blk = placeholders[Number(mm[1])];
          if (blk) blocks.push(blk);
        } else {
          const cleaned = stripReporterEmailSuffix(part.replace(/\s+/g, ' ').trim());
          for (const para of splitLongParagraphCleanly(cleaned)) {
            if (isCleanVerbatimLine(para)) {
              const key = para.slice(0, 28);
              if (!seenTextKeys.has(key)) {
                seenTextKeys.add(key);
                blocks.push({ type: 'text', text: para });
              }
            }
          }
        }
      }
      continue;
    }

    const cleaned = stripReporterEmailSuffix(line.replace(/\s+/g, ' ').trim());
    for (const para of splitLongParagraphCleanly(cleaned)) {
      if (isCleanVerbatimLine(para)) {
        const key = para.slice(0, 28);
        if (!seenTextKeys.has(key)) {
          seenTextKeys.add(key);
          blocks.push({ type: 'text', text: para });
        }
      }
    }

    if (blocks.length >= 120) break;
  }

  return blocks;
}

function extractChosunFusionBlocks(articleHtml: string, articleUrl: string): ArticleContentBlock[] {
  const blocks: ArticleContentBlock[] = [];
  const seenImages = new Set<string>();
  const seenText = new Set<string>();

  const tokenRe =
    /"content":"((?:[^"\\]|\\.)*)","type":"(text|header)"|"caption":"((?:[^"\\]|\\.)*)"[^}]{0,400}"type":"image"[^}]{0,400}"url":"(https?:\/\/[^"]+)"|"type":"image"[^}]{0,400}"url":"(https?:\/\/[^"]+)"(?:[^}]{0,400}"caption":"((?:[^"\\]|\\.)*)")?/g;

  for (const m of articleHtml.matchAll(tokenRe)) {
    if (m[2] === 'text' || m[2] === 'header') {
      const raw = decodeHtmlEntities(
        (m[1] || '')
          .replace(/\\"/g, '"')
          .replace(/\\n/g, ' ')
          .replace(/\\u003c/gi, '<')
          .replace(/\\u003e/gi, '>')
          .replace(/<\/?(?:a|span|strong|em|b|i|u)[^>]*>/gi, '')
          .replace(/<[^>]+>/g, ' ')
      ).trim();
      const cleaned = stripReporterEmailSuffix(raw);
      if (m[2] === 'header' && isCleanSubheading(cleaned)) {
        blocks.push({ type: 'subheading', text: cleaned });
      } else if (isCleanVerbatimLine(cleaned)) {
        const key = cleaned.slice(0, 28);
        if (!seenText.has(key)) {
          seenText.add(key);
          blocks.push({ type: 'text', text: cleaned });
        }
      }
    } else {
      const imgUrlRaw = m[4] || m[5] || '';
      const capRaw = m[3] || m[6] || '';
      const imgUrl = resolveArticleImageUrl(imgUrlRaw, articleUrl);
      if (imgUrl && !seenImages.has(imgUrl)) {
        seenImages.add(imgUrl);
        const caption = decodeHtmlEntities(
          capRaw.replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/<[^>]+>/g, ' ')
        ).trim();
        blocks.push({
          type: 'image',
          url: imgUrl,
          caption: caption && caption.length >= 2 ? caption : undefined,
        });
      }
    }
    if (blocks.length >= 120) break;
  }

  return blocks;
}

export function extractArticleTextAndSummary(
  articleHtml: string,
  homepageBullets: string[] = [],
  homepagePrologue = '',
  articleUrl = ''
): {
  sentences: string[];
  fullBody: string;
  articleBlocks: ArticleContentBlock[];
  leadImage?: string;
  leadImageCaption?: string;
  reporter?: string;
} {
  const paragraphPool: string[] = [];
  const fullBodyParas: string[] = [];
  let orderedBlocks: ArticleContentBlock[] = [];
  const reporter = extractReporterName(articleHtml);

  const pushLinesToPools = (rawLines: string[]) => {
    const cleanedLines = rawLines
      .flatMap((s) => splitLongParagraphCleanly(stripReporterEmailSuffix(s.replace(/\s+/g, ' ').trim())))
      .filter(Boolean);

    const paras = cleanedLines.filter(isCleanVerbatimLine);
    fullBodyParas.push(...paras);

    for (const line of cleanedLines) {
      const sents = line
        .split(/(?<=[.?!]["'”’)?]*)\s+/)
        .map((s) => stripReporterEmailSuffix(s.trim()))
        .filter(isCleanBodySentence);
      paragraphPool.push(...sents);
    }

    if (fullBodyParas.length < 2 && paragraphPool.length >= 2) {
      for (let i = 0; i < paragraphPool.length; i += 2) {
        const chunk = paragraphPool.slice(i, i + 2).join(' ');
        if (chunk.length >= 28) fullBodyParas.push(chunk);
      }
    }
  };

  const absorbOrderedBlocks = (blocks: ArticleContentBlock[]) => {
    if (blocks.length === 0) return;
    orderedBlocks = blocks;
    const textLines = blocks
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text as string);
    pushLinesToPools(textLines);
  };

  const dicArea =
    articleHtml.match(/<article[^>]*id=["']dic_area["'][^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    articleHtml.match(/<div[^>]*id=["'](?:dic_area|articeBody|newsEndContents)["'][^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class=["'][^"']*(?:byline|copyright|news_end|reporter|media_end))/i)?.[1] ||
    articleHtml.match(/<div[^>]*class=["'][^"']*newsct_article[^"']*["'][^>]*>([\s\S]*?)<\/article>/i)?.[1];

  if (dicArea || articleUrl.includes('news.naver.com')) {
    if (dicArea) {
      absorbOrderedBlocks(extractOrderedArticleBlocks(dicArea, articleUrl));
    }
  } else {
    const dongaView =
      articleHtml.match(/class="news_view"[^>]*>([\s\S]*?)<div class="news_like_wrap/i)?.[1] ||
      articleHtml.match(/class="news_view"[^>]*>([\s\S]*?)<\/section>/i)?.[1];

    if (dongaView && articleUrl.includes('donga.com')) {
      const cleanedDonga = dongaView.replace(
        /<div[^>]*class=["'][^"']*view_(?:m_ad|ad|relation|series)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
        '\n'
      );
      absorbOrderedBlocks(extractOrderedArticleBlocks(cleanedDonga, articleUrl));
    }

    if (fullBodyParas.length < 2) {
      const fusionOrdered = extractChosunFusionBlocks(articleHtml, articleUrl);
      if (fusionOrdered.some((b) => b.type === 'text')) {
        absorbOrderedBlocks(fusionOrdered);
      }
    }

    if (fullBodyParas.length < 2) {
      const cmsContainerMatch =
        articleHtml.match(/<(?:article|div|section)[^>]*(?:id|class)=["'][^"']*(?:article-view-content-div|article_body|articleBody|news_body|news_text|rns_text|text_area|art_txt|article_txt|view_con|news_cnt|content_body|article_view_body)[^"']*["'][^>]*>([\s\S]*?)<\/(?:article|section)>/i)?.[1] ||
        articleHtml.match(/<div[^>]*(?:id|class)=["'][^"']*(?:article-view-content-div|article_body|articleBody|news_body|news_text|rns_text|text_area|art_txt|article_txt|view_con|news_cnt)[^"']*["'][^>]*>([\s\S]{150,45000}?)(?:<div[^>]*class=["'][^"']*(?:copyright|byline|reporter|share|related|tag|banner|ad_|comment)|<\/section>|<\/article>)/i)?.[1] ||
        articleHtml.match(/itemprop=["']articleBody["'][^>]*>([\s\S]{150,45000}?)(?:<\/article>|<\/section>|<div[^>]*class=["'][^"']*(?:copyright|byline|related|share))/i)?.[1];

      if (cmsContainerMatch) {
        absorbOrderedBlocks(extractOrderedArticleBlocks(cmsContainerMatch, articleUrl));
      }
    }

    if (fullBodyParas.length < 2) {
      const bodyOnly = articleHtml.replace(
        /<(?:header|footer|nav|aside|script|style)[\s\S]*?<\/(?:header|footer|nav|aside|script|style)>/gi,
        ' '
      );
      const pMatches = [...bodyOnly.matchAll(/<p(?:\s+[^>]*)?>([\s\S]*?)<\/p>/gi)];
      const pLines: string[] = [];
      for (const pm of pMatches) {
        const clean = stripInlineTagsCleanly(pm[1]).replace(/\s+/g, ' ').trim();
        if (clean) pLines.push(clean);
      }
      pushLinesToPools(pLines);
    }

    if (fullBodyParas.length < 2 || paragraphPool.length < 3) {
      const ldMatches = [
        ...articleHtml.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi),
      ];
      for (const m of ldMatches) {
        try {
          const json = JSON.parse(m[1]);
          const body =
            json?.articleBody ||
            (Array.isArray(json) ? json.find((x: any) => x?.articleBody)?.articleBody : '') ||
            (Array.isArray(json?.['@graph']) ? json['@graph'].find((x: any) => x?.articleBody)?.articleBody : '');
          if (body && typeof body === 'string' && body.length > 80) {
            const cleanBody = decodeHtmlEntities(body.replace(/<[^>]+>/g, ' '));
            pushLinesToPools(cleanBody.split(/\n+/));
          }
        } catch {
          // Ignore malformed JSON-LD
        }
      }
    }

    if (fullBodyParas.length < 2) {
      const strippedAll = articleHtml.replace(
        /<(?:head|script|style|header|footer|nav|aside|noscript|iframe|form)[\s\S]*?<\/(?:head|script|style|header|footer|nav|aside|noscript|iframe|form)>/gi,
        '\n'
      );
      const rawLines = stripInlineTagsCleanly(strippedAll)
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 42 && s.length <= 1200 && isCleanParagraph(s));
      if (rawLines.length >= 2) {
        pushLinesToPools(rawLines);
      }
    }

    const ogDesc =
      articleHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
      articleHtml.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+property=["']og:description["']/i)?.[1] ||
      '';
    if (ogDesc) {
      const ogSents = decodeHtmlEntities(ogDesc)
        .split(/(?<=[.?!]["'”’)?]*)\s+/)
        .map((s) => s.trim())
        .filter(isCleanBodySentence);
      paragraphPool.push(...ogSents);
    }
  }

  if (homepagePrologue) {
    const proSents = decodeHtmlEntities(homepagePrologue)
      .split(/(?<=[.?!]["'”’)?]*)\s+/)
      .map((s) => s.trim())
      .filter(isCleanBodySentence);
    paragraphPool.push(...proSents);
  }

  const cleanBullets = homepageBullets
    .map((b) => decodeHtmlEntities(b).replace(/^[·•\-]\s*/, '').trim())
    .filter((b) => b.length >= 12);

  const uniqueSentences: string[] = [];
  if (cleanBullets.length >= 3) {
    uniqueSentences.push(...cleanBullets.slice(0, 3));
  } else {
    for (const s of paragraphPool) {
      const normalized = s.replace(/^[0-9]+[.)]\s*/, '').trim();
      const key = normalized.slice(0, 16);
      if (!uniqueSentences.some((u) => u.includes(key) || normalized.includes(u.slice(0, 16)))) {
        uniqueSentences.push(normalized);
      }
      if (uniqueSentences.length >= 3) break;
    }
  }

  const uniqueParas: string[] = [];
  for (const p of fullBodyParas) {
    const key = p.slice(0, 24);
    if (!uniqueParas.some((u) => u.includes(key) || p.includes(u.slice(0, 24)))) {
      uniqueParas.push(p);
    }
    if (uniqueParas.length >= 100) break;
  }

  if (uniqueSentences.length < 3 && uniqueParas.length > 0) {
    for (const para of uniqueParas) {
      const normalized = para.length > 260 ? `${para.slice(0, 255).trim()}…` : para;
      const key = normalized.slice(0, 16);
      if (!uniqueSentences.some((u) => u.includes(key) || normalized.includes(u.slice(0, 16)))) {
        uniqueSentences.push(normalized);
      }
      if (uniqueSentences.length >= 3) break;
    }
  }

  if (orderedBlocks.filter((b) => b.type === 'text').length === 0 && uniqueParas.length > 0) {
    orderedBlocks = [
      ...orderedBlocks.filter((b) => b.type === 'image'),
      ...uniqueParas.map((text): ArticleContentBlock => ({ type: 'text', text })),
    ];
  }

  const hasInlineImage = orderedBlocks.some((b) => b.type === 'image' && b.url);
  const ogImage = extractOgImage(articleHtml, articleUrl);
  if (!hasInlineImage && ogImage) {
    orderedBlocks = [{ type: 'image', url: ogImage }, ...orderedBlocks];
  }

  const firstImgBlock = orderedBlocks.find((b) => b.type === 'image' && b.url);
  const leadImage = firstImgBlock?.url || ogImage;
  const leadImageCaption = firstImgBlock?.caption;
  const fullBody = uniqueParas.length > 0 ? uniqueParas.join('\n\n') : uniqueSentences.join('\n\n');

  return {
    sentences: uniqueSentences,
    fullBody,
    articleBlocks: orderedBlocks,
    leadImage,
    leadImageCaption,
    reporter,
  };
}

function extractCleanHtmlTitle(html: string, outletName: string): string {
  const raw =
    html.match(/<h2[^>]*id=["']title_area["'][^>]*>([\s\S]*?)<\/h2>/i)?.[1] ||
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+property=["']og:title["']/i)?.[1] ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    '';

  let cleaned = decodeHtmlEntities(raw.replace(/<[^>]+>/g, ' ')).trim();
  const escapedOutlet = outletName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  cleaned = cleaned
    .replace(new RegExp(`\\s*[-|·:]\\s*${escapedOutlet}(?:\\s*뉴스)?\\s*$`, 'i'), '')
    .replace(/\s*[-|]\s*(?:네이버\s*뉴스|다음\s*뉴스|뉴스)\s*$/i, '')
    .trim();
  return cleaned;
}

function parseNaverPressDeskCandidates(html: string, naverCode: string): Array<{ url: string; title: string }> {
  const candidates: Array<{ url: string; title: string }> = [];
  const seen = new Set<string>();

  const editMatches = [
    ...html.matchAll(
      /<li class="press_edit_news_item[^"]*"[\s\S]*?<a href="([^"]+)"[^>]*>[\s\S]*?<span class="press_edit_news_title">([\s\S]*?)<\/span>/gi
    ),
  ];
  for (const m of editMatches) {
    const url = decodeHtmlEntities(m[1]).trim();
    const title = decodeHtmlEntities(
      m[2].replace(/<[^>]+>/g, '').replace(/\s*[0-9]+(?:\.[0-9]+)?\s*(?:초|분|시간|일)\s*전.*$/g, '')
    ).trim();
    if (url && title.length >= 6 && !seen.has(url)) {
      seen.add(url);
      candidates.push({ url, title });
    }
  }

  if (candidates.length === 0) {
    const fallbackRe = new RegExp(
      `<a[^>]*href="(https:\\/\\/n\\.news\\.naver\\.com\\/(?:mnews\\/)?article\\/${naverCode}\\/\\d+[^"]*)"[^>]*>([\\s\\S]{6,300}?)<\\/a>`,
      'gi'
    );
    for (const m of html.matchAll(fallbackRe)) {
      const url = decodeHtmlEntities(m[1]).trim();
      const title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ' ')).trim();
      if (url && title.length >= 8 && !seen.has(url)) {
        seen.add(url);
        candidates.push({ url, title });
      }
    }
  }

  return candidates;
}

async function fetchNaverArticleDetail(
  naverArticleUrl: string,
  fallbackTitle: string,
  outletName: string,
  homepageBullets: string[] = [],
  prologue = ''
): Promise<{
  title: string;
  originUrl: string;
  naverUrl: string;
  pubDate?: string;
  leadSentences: string[];
  fullBody: string;
  articleBlocks: ArticleContentBlock[];
  leadImage?: string;
  leadImageCaption?: string;
  reporter?: string;
} | null> {
  const artRes = await fetchHtmlFast(naverArticleUrl, 4500);
  if (!artRes.ok || !artRes.text) return null;

  const artHtml = artRes.text;
  const origM =
    artHtml.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*media_end_head_origin_link/i) ||
    artHtml.match(/<a[^>]*class="[^"]*media_end_head_origin_link[^"]*"[^>]*href="([^"]+)"/i);
  const originUrl = origM ? decodeHtmlEntities(origM[1]).trim() : '';
  const resolvedTitle = fallbackTitle || extractCleanHtmlTitle(artHtml, outletName);
  const pubDate = extractRealPubDateFromHtml(artHtml);
  const extracted = extractArticleTextAndSummary(artHtml, homepageBullets, prologue, naverArticleUrl);

  return {
    title: resolvedTitle,
    originUrl,
    naverUrl: naverArticleUrl,
    pubDate,
    leadSentences: extracted.sentences,
    fullBody: extracted.fullBody,
    articleBlocks: extracted.articleBlocks,
    leadImage: extracted.leadImage,
    leadImageCaption: extracted.leadImageCaption,
    reporter: extracted.reporter,
  };
}

function extractGenericArticleLinks(html: string, homepageUrl: string): string[] {
  let rootHost = '';
  try {
    rootHost = new URL(homepageUrl).hostname.replace(/^(?:www|news|biz|it|m|imnews)\./, '');
  } catch {
    return [];
  }

  const links: string[] = [];
  const seen = new Set<string>();
  const hrefMatches = [...html.matchAll(/href=["']([^"'#\s]+)["']/gi)];

  for (const m of hrefMatches) {
    const rawHref = decodeHtmlEntities(m[1]).trim();
    if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) continue;
    let absUrl = '';
    try {
      absUrl = new URL(rawHref, homepageUrl).toString();
    } catch {
      continue;
    }
    if (!absUrl.startsWith('http')) continue;
    let u: URL;
    try {
      u = new URL(absUrl);
    } catch {
      continue;
    }
    if (!u.hostname.includes(rootHost)) continue;
    const pathAndQuery = `${u.pathname}${u.search}`;
    if (
      /\/(?:login|member|join|search|rss|sitemap|company|about|privacy|terms|ad|event|subscribe|mypage|video|photo|gallery|list|section|category|tag)\b/i.test(
        pathAndQuery
      ) ||
      /\.(?:jpg|jpeg|png|gif|webp|svg|css|js|pdf|ico|xml)(?:\?|$)/i.test(u.pathname)
    ) {
      continue;
    }

    const looksLikeArticle =
      /(?:articleView|ReadNews|news\/view|news\/read|uhtml\/view|site\/data\/html|view\.php|view\.jsp|view\.html|view\.do|view\.asp|\/article\/|\/articles\/|\/view\/\d|\/news\/\d|\/\d{4}\/\d{2}\/\d{2}\/|idxno=\d|newsId=\d|seq=\d|no=\d|art_id=\d|nid=\d|aid=\d)/i.test(
        pathAndQuery
      );

    if (looksLikeArticle && !seen.has(absUrl)) {
      seen.add(absUrl);
      links.push(absUrl);
      if (links.length >= 8) break;
    }
  }
  return links;
}

async function fetchUniversalOutletArticle(
  outletId: string,
  outletName: string,
  homepageUrl: string
): Promise<RawRSSArticle | null> {
  const candidateUrls: string[] = [];
  const seen = new Set<string>();
  const pushCandidate = (u: string) => {
    if (u && !seen.has(u)) {
      seen.add(u);
      candidateUrls.push(u);
    }
  };

  try {
    const homeRes = await fetchHtmlFast(homepageUrl, 4000, 4, 0);
    if (homeRes.ok && homeRes.text) {
      for (const u of extractGenericArticleLinks(homeRes.text, homepageUrl).slice(0, 4)) {
        pushCandidate(u);
      }
    }
  } catch {
    // Continue to Naver News search discovery
  }

  if (candidateUrls.length < 3) {
    try {
      const hostBase = new URL(homepageUrl).hostname.replace(/^(?:www|news|biz|it|m|imnews)\./, '');
      const sr = await fetchHtmlFast(
        `https://search.naver.com/search.naver?where=news&sort=1&query=${encodeURIComponent(outletName)}`,
        4000,
        3,
        0
      );
      if (sr.ok && sr.text) {
        const domainRe = new RegExp(
          `https?:\\/\\/[a-zA-Z0-9.-]*${hostBase.replace(/\./g, '\\.')}\\/[^"'\\s<>]+`,
          'gi'
        );
        for (const m of sr.text.matchAll(domainRe)) {
          const u = decodeHtmlEntities(m[0]).trim();
          if (
            u.length > homepageUrl.length + 5 &&
            !/\/(?:index|main|login|member|rss|search|image|img|photo|static|assets|favicon)\b/i.test(u) &&
            !/\.(?:jpg|jpeg|png|gif|webp|svg|css|js|ico)(?:\?|$)/i.test(u)
          ) {
            pushCandidate(u);
            if (candidateUrls.length >= 6) break;
          }
        }
      }
    } catch {
      // Ignore search error
    }
  }

  let bestFallback: RawRSSArticle | null = null;

  for (const url of candidateUrls.slice(0, 4)) {
    const artRes = await fetchHtmlFast(url, 4000, 3, 0);
    if (!artRes.ok || !artRes.text) continue;

    const title = extractCleanHtmlTitle(artRes.text, outletName);
    if (!title || title.length < 8) continue;

    const extracted = extractArticleTextAndSummary(artRes.text, [], '', artRes.finalUrl || url);
    const detectedPubDate = extractRealPubDateFromHtml(artRes.text) || new Date().toISOString();
    const articleObj: RawRSSArticle = {
      outletId,
      outletName,
      title,
      link: artRes.finalUrl || url,
      pubDate: detectedPubDate,
      snippet: extracted.fullBody || extracted.sentences.join(' '),
      leadSentences: extracted.sentences,
      fullBody: extracted.fullBody,
      articleBlocks: extracted.articleBlocks,
      leadImage: extracted.leadImage,
      leadImageCaption: extracted.leadImageCaption,
      reporter: extracted.reporter,
      isTopLead: true,
    };

    if (extracted.fullBody.length >= 140) {
      return articleObj;
    }
    if (!bestFallback || (articleObj.fullBody?.length || 0) > (bestFallback.fullBody?.length || 0)) {
      bestFallback = articleObj;
    }
  }

  return bestFallback;
}

async function fetchHomepageCenterLeadArticle(
  outletId: string,
  outletName: string
): Promise<RawRSSArticle | null> {
  const outletMeta = PRESS_OUTLETS.find((p) => p.id === outletId);
  const desk = OUTLET_PRESS_DESK_MAP[outletId];
  const homepageUrl =
    desk?.homepageUrl || outletMeta?.homepageUrl || getOfficialOutletHomepage(outletId, outletName);
  const naverCode = desk?.naverCode || '';

  let title = '';
  let link = '';
  let prologue = '';
  let homepageBullets: string[] = [];
  let naverArticleUrl = '';
  let leadSentences: string[] = [];
  let fullBody = '';
  let articleBlocks: ArticleContentBlock[] = [];
  let leadImage: string | undefined;
  let leadImageCaption: string | undefined;
  let reporter: string | undefined;
  let pubDate: string | undefined;

  if (TOP10_CUSTOM_HOMEPAGE_IDS.has(outletId)) {
    try {
      const res = await fetchHtmlFast(homepageUrl, 4500);

      if (res.ok) {
        const html = res.text;

        if (outletId === 'khan') {
          const sec = html.match(/<section class="head">([\s\S]*?)<\/section>/i)?.[1] || html;
          const m = sec.match(/<a href="(https:\/\/www\.khan\.co\.kr\/article\/[^"]+)"[^>]*title="([^"]+)"/i);
          if (m) {
            link = m[1];
            title = decodeHtmlEntities(m[2]);
            const ul = sec.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i)?.[1] || '';
            const bullets = [...ul.matchAll(/<li[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi)]
              .slice(1, 4)
              .map((x) => decodeHtmlEntities(x[1].replace(/<[^>]+>/g, '')));
            homepageBullets = bullets.filter(Boolean);
          }
        } else if (outletId === 'chosun') {
          const m =
            html.match(
              /text--center[\s\S]{0,220}<a class="story-card__headline[^"]*h2[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
            ) ||
            html.match(/<a class="story-card__headline[^"]*h2[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
            html.match(/<a class="story-card__headline[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'joongang') {
          const m =
            html.match(/<h2 class="headline[^"]*fs_lg32[^"]*"[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
            html.match(/<h2 class="headline[^"]*"[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            const spanMatch = m[2].match(/<span class="sm_hidden">([\s\S]*?)<\/span>/i);
            title = decodeHtmlEntities(
              (spanMatch ? spanMatch[1] : m[2]).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
            );
          }
        } else if (outletId === 'donga') {
          const m = html.match(/class="top_headline_sec"[\s\S]*?<h2[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'hani') {
          const m = html.match(
            /<article class="MainTopArticle_card__[^"]*"[\s\S]*?<a href="([^"]+)"[^>]*>[\s\S]*?<strong class="MainTopArticle_title__[^"]*">([\s\S]*?)<\/strong>([\s\S]*?)<\/a>/i
          );
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
            const p = m[3].match(/<p class="MainTopArticle_prologue__[^"]*">([\s\S]*?)<\/p>/i);
            if (p) prologue = decodeHtmlEntities(p[1].replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'mk') {
          const m = html.match(
            /class="headline_news_sec"[\s\S]*?class="top_headline_title[^"]*"[\s\S]*?<a href="([^"]+)"[^>]*>[\s\S]*?<h3 class="headline_tit">([\s\S]*?)<\/h3>([\s\S]*?)<\/a>/i
          );
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
            const d = m[3].match(/<div class="newsdesc">([\s\S]*?)<\/div>/i);
            if (d) prologue = decodeHtmlEntities(d[1].replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'sedaily') {
          const m = html.match(
            /class="card main-23"[^>]*>[\s\S]{0,120}?<h2[^>]*class="headline"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]{0,900})/i
          );
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
            const d = m[3].match(/<p class="description[^"]*">([\s\S]*?)<\/p>/i);
            if (d) prologue = decodeHtmlEntities(d[1].replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'herald') {
          const m = html.match(
            /site_main connect_layout[\s\S]*?<article class="headline"[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
          );
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            const tM = m[2].match(/<p class="news_title">([\s\S]*?)<\/p>/i);
            title = decodeHtmlEntities((tM ? tM[1] : m[2]).replace(/<[^>]+>/g, ''));
            const d = m[2].match(/<p class="news_text[^"]*">([\s\S]*?)<\/p>/i);
            if (d) prologue = decodeHtmlEntities(d[1].replace(/<[^>]+>/g, ''));
          }
        } else if (outletId === 'asiae') {
          const m = html.match(
            /<section class="headline" id="top"[\s\S]*?<div class="txt_box">[\s\S]*?<h2>[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)<\/div>/i
          );
          if (m) {
            link = normalizeArticleUrl(m[1], homepageUrl);
            title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
            const d = m[3].match(/<p class="desc">([\s\S]*?)<\/p>/i);
            if (d) prologue = decodeHtmlEntities(d[1].replace(/<[^>]+>/g, ''));
          }
        }
      }
    } catch (err) {
      console.warn(`Direct homepage scrape failed for ${outletName}:`, err);
    }
  }

  if (title && link) {
    const artRes = await fetchHtmlFast(link, 4500);
    if (artRes.ok && artRes.text) {
      pubDate = extractRealPubDateFromHtml(artRes.text) || pubDate;
      const extracted = extractArticleTextAndSummary(artRes.text, homepageBullets, prologue, link);
      if (extracted.sentences.length > 0 || extracted.fullBody.length > 50) {
        leadSentences = extracted.sentences;
        fullBody = extracted.fullBody;
        articleBlocks = extracted.articleBlocks;
        leadImage = extracted.leadImage;
        leadImageCaption = extracted.leadImageCaption;
        reporter = extracted.reporter;
      }
    }
  }

  const needsNaverEnrichment =
    !title || fullBody.length < 220 || !articleBlocks.some((b) => b.type === 'image');
  if (naverCode && needsNaverEnrichment) {
    try {
      const deskRes = await fetchHtmlFast(`https://media.naver.com/press/${naverCode}`, 4500);
      if (deskRes.ok && deskRes.text) {
        const candidates = parseNaverPressDeskCandidates(deskRes.text, naverCode);

        if (title && candidates.length > 0) {
          const titleWords = extractSearchKeywords(title)
            .split(' ')
            .filter((w) => w.length >= 2);
          const matchingCandidate = candidates.find(
            (c) =>
              titleWords.slice(0, 3).filter((w) => c.title.includes(w)).length >=
              Math.min(2, titleWords.length)
          );
          if (matchingCandidate) {
            const detail = await fetchNaverArticleDetail(
              matchingCandidate.url,
              title,
              outletName,
              homepageBullets,
              prologue
            );
            if (
              detail &&
              (detail.fullBody.length >= fullBody.length ||
                (!articleBlocks.some((b) => b.type === 'image') &&
                  detail.articleBlocks.some((b) => b.type === 'image')))
            ) {
              naverArticleUrl = detail.naverUrl;
              if (!link || link.includes('news.naver.com')) {
                link = detail.originUrl || detail.naverUrl;
              }
              if (detail.leadSentences.length > 0) leadSentences = detail.leadSentences;
              if (detail.fullBody.length >= fullBody.length) {
                fullBody = detail.fullBody;
                articleBlocks = detail.articleBlocks;
                leadImage = detail.leadImage || leadImage;
                leadImageCaption = detail.leadImageCaption || leadImageCaption;
              } else if (detail.leadImage && !leadImage) {
                leadImage = detail.leadImage;
                leadImageCaption = detail.leadImageCaption;
                articleBlocks = [
                  { type: 'image', url: detail.leadImage, caption: detail.leadImageCaption },
                  ...articleBlocks,
                ];
              }
              reporter = detail.reporter || reporter;
              pubDate = detail.pubDate || pubDate;
            }
          }
        }

        if ((!title || fullBody.length < 150) && candidates.length > 0) {
          let bestDetail: Awaited<ReturnType<typeof fetchNaverArticleDetail>> = null;
          for (const cand of candidates.slice(0, 5)) {
            const detail = await fetchNaverArticleDetail(cand.url, cand.title, outletName);
            if (!detail) continue;
            if (!bestDetail || detail.fullBody.length > bestDetail.fullBody.length) {
              bestDetail = detail;
            }
            if (detail.fullBody.length >= 280) {
              bestDetail = detail;
              break;
            }
          }

          if (bestDetail && bestDetail.fullBody.length > fullBody.length) {
            title = bestDetail.title;
            naverArticleUrl = bestDetail.naverUrl;
            link = bestDetail.originUrl || bestDetail.naverUrl;
            leadSentences = bestDetail.leadSentences;
            fullBody = bestDetail.fullBody;
            articleBlocks = bestDetail.articleBlocks;
            leadImage = bestDetail.leadImage;
            leadImageCaption = bestDetail.leadImageCaption;
            reporter = bestDetail.reporter || reporter;
            pubDate = bestDetail.pubDate || pubDate;
          }
        }
      }
    } catch (err) {
      console.warn(`Naver press desk fetch failed for ${outletName}:`, err);
    }
  }

  if (!title || fullBody.length < 100) {
    const universal = await fetchUniversalOutletArticle(outletId, outletName, homepageUrl);
    if (universal && (!title || (universal.fullBody?.length || 0) > fullBody.length)) {
      return universal;
    }
  }

  if (!title) return null;

  if (leadSentences.length === 0) {
    if (homepageBullets.length > 0) {
      leadSentences = homepageBullets.slice(0, 3);
    } else if (prologue) {
      leadSentences = prologue
        .split(/(?<=[.?!]["'”’)?]*)\s+/)
        .filter(isCleanBodySentence)
        .slice(0, 3);
    }
  }

  return {
    outletId,
    outletName,
    title,
    link: link || homepageUrl,
    naverUrl: naverArticleUrl || undefined,
    pubDate: pubDate || new Date().toISOString(),
    snippet: fullBody || prologue || leadSentences.join(' '),
    leadSentences,
    fullBody,
    articleBlocks: articleBlocks.length > 0 ? articleBlocks : undefined,
    leadImage,
    leadImageCaption,
    reporter,
    isTopLead: true,
  };
}

export async function fetchRealArticlesForOutlets(
  outletIds: string[] = DEFAULT_10_OUTLETS,
  forceRefresh = false
): Promise<Record<string, RawRSSArticle[]>> {
  const outletsToFetch = PRESS_OUTLETS.filter((p) =>
    outletIds.length > 0 ? outletIds.includes(p.id) : p.isDefaultMajor
  );

  const now = Date.now();
  const todayKst = getKstDateKey();

  for (const [key, entry] of outletCache.entries()) {
    if (entry.kstDate !== todayKst || now - entry.fetchedAt > 6 * 60 * 60 * 1000) {
      outletCache.delete(key);
    }
  }

  const results: Record<string, RawRSSArticle[]> = {};
  const outletsNeedingFetch: typeof outletsToFetch = [];

  for (const outlet of outletsToFetch) {
    const cached = outletCache.get(outlet.id);
    if (
      !forceRefresh &&
      cached &&
      cached.kstDate === todayKst &&
      now - cached.fetchedAt < CACHE_TTL_MS &&
      cached.articles.length > 0
    ) {
      results[outlet.id] = cached.articles;
    } else {
      outletsNeedingFetch.push(outlet);
    }
  }

  const BATCH_SIZE = 8;
  for (let i = 0; i < outletsNeedingFetch.length; i += BATCH_SIZE) {
    const batch = outletsNeedingFetch.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (outlet) => {
        const articles: RawRSSArticle[] = [];

        const topLead = await fetchHomepageCenterLeadArticle(outlet.id, outlet.name);
        if (topLead) {
          articles.push(topLead);
        }

        try {
          const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
            `"${outlet.name}" when:1d`
          )}&hl=ko&gl=KR&ceid=KR:ko`;
          const res = await fetch(searchUrl, {
            signal: AbortSignal.timeout(3000),
            headers: { 'User-Agent': 'Mozilla/5.0 (MorningBrief/1.0)' },
          });

          if (res.ok) {
            const xml = await res.text();
            const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8);
            const escapedOutlet = outlet.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            let secondaryAdded = 0;

            for (const blockMatch of itemBlocks) {
              if (secondaryAdded >= 3) break;
              const itemXml = blockMatch[1] || '';
              const sourceText = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || '';
              if (!matchesOutletSourceName(sourceText, outlet.name, outlet.logoText)) {
                continue;
              }

              const rawTitle = itemXml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
              const rawLink = itemXml.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '';
              const rawPubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || '';
              const rawDesc = itemXml.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '';

              if (rawPubDate && !isWithinLast24Hours(rawPubDate, now)) {
                continue;
              }

              let t = decodeHtmlEntities(rawTitle.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'));
              t = t
                .replace(new RegExp(`\\s*-\\s*${escapedOutlet}(?:\\s*뉴스)?\\s*$`, 'i'), '')
                .replace(/\s*-\s*(?:KBS|MBC|SBS|YTN|JTBC)\s*뉴스\s*$/i, '')
                .trim();

              let snip = decodeHtmlEntities(
                rawDesc
                  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/https?:\/\/[^\s]+/g, ' ')
                  .replace(/[\r\n]+/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
              );

              if (snip.includes('news.google.com') || snip.length < 25 || snip === t) {
                snip = '';
              }

              if (t && !articles.some((a) => areTitlesNearDuplicate(a.title, t))) {
                articles.push({
                  outletId: outlet.id,
                  outletName: outlet.name,
                  title: t,
                  link: rawLink.replace(/&amp;/g, '&').trim(),
                  pubDate: parseKstDateTimeString(rawPubDate) || rawPubDate || new Date().toISOString(),
                  snippet: snip,
                });
                secondaryAdded += 1;
              }
            }
          }
        } catch {
          // Ignore RSS secondary feed failure
        }

        if (articles.length > 0) {
          recordOutletHealth(outlet.id, true);
          outletCache.set(outlet.id, {
            articles,
            fetchedAt: Date.now(),
            kstDate: todayKst,
          });
          results[outlet.id] = articles;
        } else {
          recordOutletHealth(outlet.id, false);
        }
      })
    );
  }

  return results;
}
