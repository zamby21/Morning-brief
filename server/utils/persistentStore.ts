import fs from 'node:fs/promises';
import path from 'node:path';

const KV_URL = (
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  ''
).trim();
const KV_TOKEN = (
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  ''
).trim();

const LOCAL_STORE_PATH = process.env.VERCEL
  ? '/tmp/morning-brief-persistent-state.json'
  : path.resolve(process.cwd(), '.data', 'morning-brief-state.json');

export function isRemoteKvConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

async function readLocalJsonFile(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(LOCAL_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function writeLocalJsonFile(data: Record<string, unknown>): Promise<void> {
  try {
    await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
    await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(data), 'utf8');
  } catch {
    // Ignore read-only filesystem errors
  }
}

export async function readPersistentJson<T>(key: string): Promise<T | null> {
  if (isRemoteKvConfigured()) {
    try {
      const res = await fetch(`${KV_URL.replace(/\/$/, '')}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (typeof json?.result === 'string') {
          return JSON.parse(json.result) as T;
        }
        if (json?.result && typeof json.result === 'object') {
          return json.result as T;
        }
      }
    } catch {
      // Fallback cleanly to local temp store
    }
  }

  const all = await readLocalJsonFile();
  return (all[key] as T) ?? null;
}

export async function writePersistentJson<T>(key: string, value: T): Promise<void> {
  if (isRemoteKvConfigured()) {
    try {
      await fetch(`${KV_URL.replace(/\/$/, '')}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSON.stringify(value)),
      });
      return;
    } catch {
      // Fallback cleanly to local temp store
    }
  }

  const all = await readLocalJsonFile();
  all[key] = value;
  await writeLocalJsonFile(all);
}
