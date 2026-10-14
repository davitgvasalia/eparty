import "server-only";
import { createHmac, createPublicKey, randomBytes, timingSafeEqual, verify } from "crypto";
import { cookies } from "next/headers";
import { PublicKey } from "@solana/web3.js";

const SESSION_COOKIE = "eparty_session";
const NONCE_COOKIE = "eparty_nonce";
const SESSION_DAYS = 7;
const NONCE_MINUTES = 10;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

// A signed cookie value: base64url(JSON payload) + "." + HMAC.
function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function unsign<T extends { exp: number }>(value: string | undefined): T | null {
  if (!value) return null;
  const [body, mac] = value.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

const cookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: maxAgeSeconds,
});

/** The text the wallet signs. It is free and sends no transaction. */
export const loginMessage = (nonce: string) =>
  `E-Party sign-in\n\nSigning this message proves you own this wallet. It costs nothing and sends no transaction.\n\nNonce: ${nonce}`;

/** Starts a sign-in: remembers a fresh nonce in a short-lived cookie. */
export function issueNonce(): string {
  const nonce = randomBytes(16).toString("hex");
  cookies().set(NONCE_COOKIE, sign({ nonce, exp: Date.now() + NONCE_MINUTES * 60_000 }), cookieOptions(NONCE_MINUTES * 60));
  return loginMessage(nonce);
}

// DER prefix that turns a raw 32-byte Ed25519 key into an SPKI public key.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function verifySignature(wallet: string, message: string, signature: Uint8Array): boolean {
  try {
    const raw = new PublicKey(wallet).toBytes();
    const key = createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: "der", type: "spki" });
    return verify(null, Buffer.from(message), key, signature);
  } catch {
    return false;
  }
}

/** Finishes a sign-in. Returns false if the nonce is missing/expired or the signature is wrong. */
export function completeSignIn(wallet: string, signature: Uint8Array): boolean {
  const pending = unsign<{ nonce: string; exp: number }>(cookies().get(NONCE_COOKIE)?.value);
  cookies().delete(NONCE_COOKIE);
  if (!pending || !verifySignature(wallet, loginMessage(pending.nonce), signature)) return false;
  cookies().set(SESSION_COOKIE, sign({ wallet, exp: Date.now() + SESSION_DAYS * 86_400_000 }), cookieOptions(SESSION_DAYS * 86_400));
  return true;
}

export function signOut() {
  cookies().delete(SESSION_COOKIE);
}

/** Wallet address of the signed-in visitor, if any. */
export function sessionWallet(): string | undefined {
  return unsign<{ wallet: string; exp: number }>(cookies().get(SESSION_COOKIE)?.value)?.wallet;
}
