import type express from 'express';
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns/promises';
import net from 'node:net';
import { PRESS_OUTLETS } from '../../src/data/pressMetadata.ts';
import { OUTLET_PRESS_DESK_MAP } from '../../src/services/realNewsCollector.ts';
import { createRateLimiter } from '../utils/security.ts';

function extractRegistrableDomain(urlStr: string): string | null {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    const parts = host.split('.').filter(Boolean);
    if (parts.length < 2) return null;
    const tld2 = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (['co.kr', 'or.kr', 'go.kr', 'ne.kr', 're.kr'].includes(tld2) && parts.length >= 3) {
      return `${parts[parts.length - 3]}.${tld2}`;
    }
    return tld2;
  } catch {
    return null;
  }
}

const ALLOWED_IMAGE_DOMAINS = new Set<string>([
  // Verified Korean news portal & press image CDNs
  'pstatic.net',
  'naver.net',
  'daumcdn.net',
  'kakaocdn.net',
  'yna.co.kr',
  'yonhapnews.co.kr',
  'yonhapnewstv.co.kr',
  'chosun.com',
  'joongang.co.kr',
  'joins.com',
  'donga.com',
  'hani.co.kr',
  'khan.co.kr',
  'mk.co.kr',
  'hankyung.com',
  'sedaily.com',
  'heraldcorp.com',
  'asiae.co.kr',
  'kmib.co.kr',
  'hankookilbo.com',
  'munhwa.com',
  'seoul.co.kr',
  'segye.com',
  'mt.co.kr',
  'edaily.co.kr',
  'fnnews.com',
  'nocutnews.co.kr',
  'newstapa.org',
  'tf.co.kr',
  'dailian.co.kr',
  'sidaenews.co.kr',
  'mediatoday.co.kr',
  'bizwatch.co.kr',
  'inews24.com',
  'ohmynews.com',
  'economist.co.kr',
  'joseilbo.com',
  'pressian.com',
  'news1.kr',
  'newsis.com',
  'kbs.co.kr',
  'imbc.com',
  'sbs.co.kr',
  'ytn.co.kr',
  'jtbc.co.kr',
  'tvchosun.com',
  'mbn.co.kr',
  'ichannela.com',
  'wowtv.co.kr',
  'ikbc.co.kr',
  'etnews.com',
  'zdnet.co.kr',
  'bloter.net',
  'ddaily.co.kr',
  'dt.co.kr',
  'kado.net',
  'kwnews.co.kr',
  'kyeonggi.com',
  'kookje.co.kr',
  'daejonilbo.com',
  'imaeil.com',
  'busan.com',
]);

for (const outlet of PRESS_OUTLETS) {
  const dom = extractRegistrableDomain(outlet.homepageUrl);
  if (dom) ALLOWED_IMAGE_DOMAINS.add(dom);
}
for (const entry of Object.values(OUTLET_PRESS_DESK_MAP)) {
  const dom = extractRegistrableDomain(entry.homepageUrl);
  if (dom) ALLOWED_IMAGE_DOMAINS.add(dom);
}

function isAllowedImageHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, '');
  if (!h || h === 'localhost' || net.isIP(h) !== 0) {
    return false;
  }
  for (const allowed of ALLOWED_IMAGE_DOMAINS) {
    if (h === allowed || h.endsWith(`.${allowed}`)) {
      return true;
    }
  }
  return false;
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 0 && parts[2] === 0) return true;
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  if (a === 203 && b === 0 && parts[2] === 113) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateOrReservedIp(rawIp: string): boolean {
  const ip = rawIp.trim().toLowerCase().replace(/^\[|\]$/g, '');
  const version = net.isIP(ip);
  if (version === 4) {
    return isPrivateOrReservedIpv4(ip);
  }
  if (version === 6) {
    if (ip === '::' || ip === '::1' || /^0+:0+:0+:0+:0+:0+:0+:[01]$/.test(ip)) {
      return true;
    }
    const mappedDotted = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mappedDotted) {
      return isPrivateOrReservedIpv4(mappedDotted[1]);
    }
    const mappedHex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (mappedHex) {
      const hi = parseInt(mappedHex[1], 16);
      const lo = parseInt(mappedHex[2], 16);
      const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      return isPrivateOrReservedIpv4(ipv4);
    }
    const firstSegment = ip.split(':')[0] || '';
    if (/^(fc|fd|ff)/i.test(firstSegment) || /^fe[89abcf]/i.test(firstSegment)) {
      return true;
    }
    if (ip.startsWith('2001:db8:') || ip.startsWith('2001:0db8:')) {
      return true;
    }
    return false;
  }
  return true;
}

async function resolveAndValidateProxyTarget(
  targetUrl: string
): Promise<{ parsed: URL; pinnedAddress: string; pinnedFamily: 4 | 6 } | null> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null;
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') return null;
  if (!isAllowedImageHostname(parsed.hostname)) return null;

  try {
    const records = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
    if (!records || records.length === 0) return null;

    for (const rec of records) {
      if (isPrivateOrReservedIp(rec.address)) {
        return null;
      }
    }

    const preferred = records.find((r) => r.family === 4) || records[0];
    return {
      parsed,
      pinnedAddress: preferred.address,
      pinnedFamily: preferred.family === 6 ? 6 : 4,
    };
  } catch {
    return null;
  }
}

async function fetchImageBufferSafe(
  targetUrl: string,
  redirectsLeft = 3,
  timeoutMs = 6000
): Promise<{ status: number; contentType: string; buffer: Buffer } | null> {
  const validated = await resolveAndValidateProxyTarget(targetUrl);
  if (!validated) return null;

  const { parsed, pinnedAddress, pinnedFamily } = validated;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (val: { status: number; contentType: string; buffer: Buffer } | null) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };

    try {
      const referer =
        parsed.hostname.endsWith('.pstatic.net') || parsed.hostname === 'pstatic.net'
          ? 'https://n.news.naver.com/'
          : `${parsed.protocol}//${parsed.hostname}/`;
      const lib = parsed.protocol === 'https:' ? https : http;

      const pinnedLookup: http.RequestOptions['lookup'] = (_hostname, _options, callback) => {
        callback(null, pinnedAddress, pinnedFamily);
      };

      const req = lib.get(
        parsed.toString(),
        {
          lookup: pinnedLookup,
          timeout: timeoutMs,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            Referer: referer,
          },
        },
        (upstream) => {
          const status = upstream.statusCode || 0;
          if (status >= 300 && status < 400 && upstream.headers.location && redirectsLeft > 0) {
            upstream.resume();
            try {
              const nextUrl = new URL(upstream.headers.location, parsed.toString()).toString();
              fetchImageBufferSafe(nextUrl, redirectsLeft - 1, timeoutMs).then(finish);
            } catch {
              finish(null);
            }
            return;
          }

          if (status < 200 || status >= 300) {
            upstream.resume();
            finish(null);
            return;
          }

          const contentType = String(upstream.headers['content-type'] || '')
            .split(';')[0]
            .trim()
            .toLowerCase();
          if (contentType.includes('svg') || contentType.includes('html') || contentType.includes('javascript')) {
            upstream.resume();
            finish(null);
            return;
          }

          const chunks: Buffer[] = [];
          let totalBytes = 0;
          const MAX_BYTES = 5 * 1024 * 1024;

          upstream.on('data', (chunk) => {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            totalBytes += buf.length;
            if (totalBytes > MAX_BYTES) {
              req.destroy();
              finish(null);
              return;
            }
            chunks.push(buf);
          });
          upstream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            if (buffer.length < 100) {
              finish(null);
              return;
            }
            const isRasterContentType =
              contentType === 'image/jpeg' ||
              contentType === 'image/jpg' ||
              contentType === 'image/png' ||
              contentType === 'image/gif' ||
              contentType === 'image/webp' ||
              contentType === 'image/avif';
            const isMagicImg =
              (buffer[0] === 0xff && buffer[1] === 0xd8) ||
              (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) ||
              (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) ||
              (buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
                buffer.subarray(8, 12).toString('ascii') === 'WEBP');
            if (!isRasterContentType && !isMagicImg) {
              finish(null);
              return;
            }
            finish({
              status,
              contentType: isRasterContentType ? contentType : 'image/jpeg',
              buffer,
            });
          });
          upstream.on('error', () => finish(null));
        }
      );

      req.on('timeout', () => {
        req.destroy();
        finish(null);
      });
      req.on('error', () => finish(null));
    } catch {
      finish(null);
    }
  });
}

export function registerImageProxyRoutes(app: express.Express): void {
  app.get(['/api/image-proxy', '/image-proxy'], createRateLimiter('image-proxy', 120), async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl || rawUrl.length > 2048 || !/^https?:\/\//i.test(rawUrl)) {
      return res.status(400).send('Invalid image URL');
    }
    let parsedPreview: URL;
    try {
      parsedPreview = new URL(rawUrl);
    } catch {
      return res.status(400).send('Invalid image URL');
    }
    if (!isAllowedImageHostname(parsedPreview.hostname)) {
      return res.status(403).send('Image host not permitted');
    }

    const result = await fetchImageBufferSafe(rawUrl);
    if (!result) {
      return res.status(404).send('Image unavailable');
    }
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    return res.status(200).send(result.buffer);
  });
}
