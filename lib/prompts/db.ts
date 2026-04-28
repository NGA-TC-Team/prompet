import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { promptSchema, type Prompt } from "./schema";
import { isTagColor, type TagColor } from "./tag-colors";

const DB_NAME = "prompet";
const DB_VERSION = 2;
const PROMPTS = "prompts" as const;
const TAG_COLORS_STORE = "tag_colors" as const;

interface TagColorRecord {
  name: string;
  color: TagColor;
}

interface PrompetDB extends DBSchema {
  prompts: {
    key: string;
    value: Prompt;
    indexes: { "by-updatedAt": number; "by-tag": string };
  };
  tag_colors: {
    key: string;
    value: TagColorRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<PrompetDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB는 브라우저에서만 사용 가능합니다");
  }
  if (!dbPromise) {
    dbPromise = openDB<PrompetDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore(PROMPTS, { keyPath: "id" });
          store.createIndex("by-updatedAt", "updatedAt");
          store.createIndex("by-tag", "tags", { multiEntry: true });
        }
        if (oldVersion < 2) {
          db.createObjectStore(TAG_COLORS_STORE, { keyPath: "name" });
        }
      },
    });
  }
  return dbPromise;
}

export async function listPrompts(): Promise<Prompt[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex(PROMPTS, "by-updatedAt");
  return all.reverse();
}

export async function getPrompt(id: string): Promise<Prompt | undefined> {
  const db = await getDB();
  return db.get(PROMPTS, id);
}

export async function putPrompt(prompt: Prompt): Promise<void> {
  const validated = promptSchema.parse(prompt);
  const db = await getDB();
  await db.put(PROMPTS, validated);
}

export async function deletePrompt(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(PROMPTS, id);
}

export async function searchByTag(tag: string): Promise<Prompt[]> {
  const db = await getDB();
  return db.getAllFromIndex(PROMPTS, "by-tag", tag);
}

export async function listTagColors(): Promise<Record<string, TagColor>> {
  const db = await getDB();
  const all = await db.getAll(TAG_COLORS_STORE);
  const out: Record<string, TagColor> = {};
  for (const r of all) {
    if (isTagColor(r.color)) out[r.name] = r.color;
  }
  return out;
}

export async function putTagColor(name: string, color: TagColor): Promise<void> {
  const db = await getDB();
  await db.put(TAG_COLORS_STORE, { name, color });
}

export async function deleteTagColor(name: string): Promise<void> {
  const db = await getDB();
  await db.delete(TAG_COLORS_STORE, name);
}
