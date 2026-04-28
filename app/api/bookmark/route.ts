import { z } from "zod";
import { consume, getLimiter, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = getLimiter("bookmark", {
  windowMs: 60_000,
  perIp: 12, // a careful user can paste ~1 URL / 5s; well within
  global: 200, // soft global ceiling so one attacker rotating IPs still hits a wall
});

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
  const ip = ipFromRequest(request);
  const verdict = consume(limiter, ip);
  if (!verdict.ok) {
    return new Response(
      JSON.stringify({
        error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요.",
        retryAfter: verdict.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(verdict.retryAfter),
          "x-ratelimit-limit": String(verdict.limit),
          "x-ratelimit-remaining": "0",
        },
      },
    );
  }

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
    return Response.json(
      {
        title: meta.title,
        description: meta.description,
        imageUrl: meta.image ? new URL(meta.image, target).toString() : undefined,
        sourceUrl: target.toString(),
      },
      {
        headers: {
          "x-ratelimit-limit": String(verdict.limit),
          "x-ratelimit-remaining": String(verdict.remaining),
        },
      },
    );
  } catch (e) {
    const aborted = (e as { name?: string }).name === "AbortError";
    return Response.json({ error: aborted ? "타임아웃" : "가져오기 실패" }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

function extractMeta(html: string): { title?: string; description?: string; image?: string } {
  const find = (re: RegExp): string | undefined => {
    const m = html.match(re);
    return m?.[1] ? decodeEntities(m[1].trim()) : undefined;
  };
  // Some sites put the content attribute before the property attribute.
  const findAttr = (selector: RegExp, attr = "content"): string | undefined => {
    const tag = html.match(selector)?.[0];
    if (!tag) return undefined;
    const m = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, "i"));
    return m?.[1] ? decodeEntities(m[1].trim()) : undefined;
  };
  const title =
    find(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
    find(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ??
    findAttr(/<meta[^>]+(?:property|name)=["']og:title["'][^>]*>/i) ??
    find(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    find(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
    find(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i) ??
    find(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
    findAttr(/<meta[^>]+(?:property|name)=["']og:description["'][^>]*>/i);
  const image =
    find(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ??
    find(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
    findAttr(/<meta[^>]+(?:property|name)=["']og:image["'][^>]*>/i) ??
    find(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
  return { title, description, image };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
