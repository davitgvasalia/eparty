import "server-only";
import { NextResponse } from "next/server";
import type { Member as DbMember } from "@prisma/client";
import { db } from "./db";
import { sessionWallet } from "./session";

export const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || "";

/** With no administrator wallet configured, the admin API is open, but never in production. */
export const demoAdmin = () => ADMIN_WALLET === "" && process.env.NODE_ENV !== "production";

export interface Viewer {
  wallet?: string;
  member?: DbMember; // active member record for the wallet
  isAdmin: boolean;
}

export async function getViewer(): Promise<Viewer> {
  const wallet = sessionWallet();
  const member = wallet ? (await db.member.findFirst({ where: { wallet, active: true } })) ?? undefined : undefined;
  const isAdmin = demoAdmin() || (!!wallet && wallet === ADMIN_WALLET) || member?.role === "admin";
  return { wallet, member, isAdmin };
}

/** Thrown by route code to answer with an error status. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireMember(): Promise<Viewer & { member: DbMember }> {
  const viewer = await getViewer();
  if (!viewer.wallet) throw new HttpError(401, "Sign in with your wallet first");
  if (!viewer.member) throw new HttpError(403, "Only party members can do this");
  return viewer as Viewer & { member: DbMember };
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer.isAdmin) throw new HttpError(403, "Administrator only");
  return viewer;
}

/** Wraps a route handler: HttpError becomes a JSON error, success defaults to { ok: true }. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  return async (...args: A) => {
    try {
      const result = await fn(...args);
      return result instanceof Response ? result : NextResponse.json(result ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      // Unique constraint: a second vote/like, or a wallet that already exists.
      if ((e as { code?: string })?.code === "P2002") return NextResponse.json({ error: "Already done" }, { status: 409 });
      console.error(e);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  };
}

/** Reads a JSON body, answering 400 if it isn't an object. */
export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    if (b && typeof b === "object") return b as Record<string, unknown>;
  } catch {}
  throw new HttpError(400, "Invalid request body");
}

/** A required, trimmed, non-empty string field. */
export function str(b: Record<string, unknown>, key: string, max = 2000): string {
  const v = b[key];
  if (typeof v !== "string" || !v.trim()) throw new HttpError(400, `Missing ${key}`);
  if (v.length > max) throw new HttpError(400, `${key} is too long`);
  return v.trim();
}

/** An optional trimmed string field; empty becomes undefined. */
export function optStr(b: Record<string, unknown>, key: string, max = 2000): string | undefined {
  const v = b[key];
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string") throw new HttpError(400, `Invalid ${key}`);
  if (v.length > max) throw new HttpError(400, `${key} is too long`);
  return v.trim() || undefined;
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
