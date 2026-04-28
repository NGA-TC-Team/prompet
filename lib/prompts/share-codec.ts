import { sharedPromptSchema, type SharedPrompt } from "./schema";

const SAFE_LIMIT = 1900; // approx ?d=... budget under common URL caps

function toBase64Url(s: string): string {
  const utf8 = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(s) : Buffer.from(s, "utf-8");
  let bin = "";
  for (const b of utf8) bin += String.fromCharCode(b);
  const b64 = typeof btoa !== "undefined" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return typeof TextDecoder !== "undefined" ? new TextDecoder().decode(bytes) : Buffer.from(bytes).toString("utf-8");
}

export function encodeShared(p: SharedPrompt): string {
  const parsed = sharedPromptSchema.parse(p);
  return toBase64Url(JSON.stringify(parsed));
}

export function decodeShared(token: string): SharedPrompt | null {
  try {
    const json = fromBase64Url(token);
    const obj = JSON.parse(json);
    return sharedPromptSchema.parse(obj);
  } catch {
    return null;
  }
}

export function buildShareUrl(origin: string, p: SharedPrompt): { url: string; tooLong: boolean } {
  const token = encodeShared(p);
  const url = `${origin}/prompts?d=${token}`;
  return { url, tooLong: url.length > SAFE_LIMIT };
}
