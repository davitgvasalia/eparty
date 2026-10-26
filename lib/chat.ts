// Chat types the API sends to the browser, and the limits shared by server and client.
import type { L10n } from "./i18n";

export type ChatKind = "general" | "group" | "direct";
export type AttachmentKind = "image" | "voice" | "file";

/** Id of the one chat every member is in. */
export const GENERAL_CHAT = "general";

export const MAX_TEXT = 4000;
export const MAX_FILES = 10;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
/** All files of one message together (nginx allows a little more, deploy/nginx.conf). */
export const MAX_MESSAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VOICE_SECONDS = 5 * 60;
/** Messages per page when scrolling back. */
export const PAGE_SIZE = 50;

/** Pictures shown inline. Other image types (HEIC, SVG, ...) are sent as plain files. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
/** Formats browsers record voice in. */
export const VOICE_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/aac", "audio/wav"];

export interface ChatSummary {
  id: string;
  kind: ChatKind;
  name?: string; // groups only
  /** Group members, or both people in a direct chat. Empty for the general chat. */
  memberIds: string[];
  /** False when the viewer can read but not write (the administrator without a member record). */
  canWrite: boolean;
  last?: { senderId: string; text: string; kind?: AttachmentKind; deleted: boolean; at: string };
  unread: number;
  lastAt: string; // ISO time
}

export interface ChatAttachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  mime: string;
  size: number;
  duration?: number;
  url: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: L10n;
  text: string;
  createdAt: string; // ISO time
  editedAt?: string;
  deleted: boolean;
  updatedAt: string;
  attachments: ChatAttachment[];
}

export interface MessagePage {
  messages: ChatMessage[];
  /** True when older messages exist before the first one returned. */
  hasMore: boolean;
}
