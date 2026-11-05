import "server-only";
import type { Prisma } from "@prisma/client";
import { defaultSite, normalizeSite, type SiteData } from "../siteContent";
import { db } from "./db";

const KEY = "site";

/** The website's texts as last saved by the administrator, or the defaults. */
export async function loadSite(): Promise<SiteData> {
  try {
    const row = await db.setting.findUnique({ where: { key: KEY } });
    return row ? normalizeSite(row.value) : defaultSite;
  } catch (e) {
    // The website should still open if the database is unreachable.
    console.error(e);
    return defaultSite;
  }
}

export async function saveSite(value: unknown): Promise<SiteData> {
  const site = normalizeSite(value);
  const json = site as unknown as Prisma.InputJsonValue;
  await db.setting.upsert({ where: { key: KEY }, create: { key: KEY, value: json }, update: { value: json } });
  return site;
}
