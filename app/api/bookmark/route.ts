import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), { message: "http(s) URL only" }),
});

const MAX_BYTES = 1_000_000; // 1MB cap
const TIMEOUT_MS = 5_000;

const PRIVATE_HOST_RE =
  /^(localhost$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd|fe80:)/i;

export async function POST(request: Request) {
  let parsed: { url: string };
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "올바른 URL이 아닙니다" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(parsed.url);
  } catch {
    return Response.json({ error: "URL을 해석할 수 없습니다" }, { status: 400 });
  }
  if (PRIVATE_HOST_RE.test(target.hostname)) {
    return Response.json({ error: "사설망 주소는 허용되지 않습니다" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(target.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Prompet-Bookmark/1.0 (+local)", accept: "text/html,*/*;q=0.5" },
    });
    if (!res.ok) {
      return Response.json({ error: `원격 응답 ${res.status}` }, { status: 502 });
    }
    const ctype = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml/i.test(ctype)) {
      return Response.json({ error: "HTML이 아닙니다" }, { status: 415 });
    }
    const reader = res.body?.getReader();
    if (!reader) return Response.json({ error: "응답 없음" }, { status: 502 });
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BYTES) break;
      chunks.push(value);
    }
    const buf = new Uint8Array(received);
    let offset = 0;
    for (const c of chunks) {
      buf.set(c, offset);
      offset += c.byteLength;
    }
    const html = new TextDecoder("utf-8").decode(buf);
    const meta = extractMeta(html);
    return Response.json({
      title: meta.title,
      description: meta.description,
      sourceUrl: target.toString(),
    });
  } catch (e) {
    const aborted = (e as { name?: string }).name === "AbortError";
    return Response.json({ error: aborted ? "타임아웃" : "가져오기 실패" }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

function extractMeta(html: string): { title?: string; description?: string } {
  const find = (re: RegExp): string | undefined => {
    const m = html.match(re);
    return m?.[1] ? decodeEntities(m[1].trim()) : undefined;
  };
  const title =
    find(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
    find(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ??
    find(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    find(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
    find(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i) ??
    find(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  return { title, description };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
