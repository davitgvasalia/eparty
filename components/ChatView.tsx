"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileText,
  Lock,
  MessageCircle,
  Mic,
  Paperclip,
  Pencil,
  Send,
  Settings,
  Square,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  MAX_MESSAGE_BYTES,
  MAX_VOICE_SECONDS,
  type ChatMessage,
  type ChatSummary,
  type MessagePage,
} from "@/lib/chat";
import type { Dict } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { Member } from "@/lib/model";
import { useChat } from "./ChatStore";
import { api, useMembers, useSession, useStore } from "./PollsStore";
import WalletButton from "./WalletButton";

type Panel = null | "direct" | "group" | { group: string };

const dateLocale = (locale: Locale) => (locale === "ka" ? "ka-GE" : "en-GB");
const fmtTime = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleTimeString(dateLocale(locale), { hour: "2-digit", minute: "2-digit" });
const fmtDay = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(dateLocale(locale), { day: "numeric", month: "long", year: "numeric" });
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

const fmtSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Replaces messages by id and keeps them in sending order. */
function merge(list: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(list.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export default function ChatView({ locale, dict }: { locale: Locale; dict: Dict }) {
  const t = dict.chat;
  const { enabled, chats, loaded, refresh } = useChat();
  const { wallet, signedIn, signIn, signingIn, member: me, isAdmin } = useSession();
  const members = useMembers();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = useSearchParams()?.get("c") ?? null;
  const [panel, setPanel] = useState<Panel>(null);

  const memberName = useCallback(
    (id?: string) => members.find((m) => m.id === id)?.name[locale] ?? t.formerMember,
    [members, locale, t.formerMember]
  );
  const chatTitle = useCallback(
    (c: ChatSummary) =>
      c.kind === "general"
        ? t.general
        : c.kind === "group"
          ? c.name ?? ""
          : memberName(c.memberIds.find((id) => id !== me?.id)),
    [t.general, memberName, me?.id]
  );

  const open = (id: string | null) => {
    setPanel(null);
    router.push(id ? `${pathname}?c=${encodeURIComponent(id)}` : pathname);
  };

  if (!signedIn || !enabled) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Lock size={22} />
        </div>
        <p className="text-sm text-slate-600">{signedIn ? t.membersOnly : t.connectFirst}</p>
        <div className="mt-5 flex justify-center">
          {!wallet ? (
            <WalletButton />
          ) : (
            !signedIn && (
              <button className="btn btn-primary" disabled={signingIn} onClick={signIn}>
                {dict.common.signIn}
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  const selected = chats.find((c) => c.id === selectedId);
  const groups = chats.filter((c) => c.kind === "group");
  const directs = chats.filter((c) => c.kind === "direct");
  const general = chats.find((c) => c.kind === "general");

  const row = (c: ChatSummary) => {
    const last = c.last;
    const preview = !last
      ? c.kind === "general"
        ? t.generalHint
        : c.kind === "group"
          ? `${c.memberIds.length} ${t.members}`
          : ""
      : last.deleted
        ? t.deleted
        : last.text || (last.kind === "image" ? t.photo : last.kind === "voice" ? t.voice : t.file);
    const who = last && c.kind !== "direct" ? (last.senderId === me?.id ? t.you : memberName(last.senderId).split(" ")[0]) : "";
    return (
      <button
        key={c.id}
        onClick={() => open(c.id)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
          c.id === selectedId ? "bg-indigo-50" : "hover:bg-slate-100"
        }`}
      >
        <ChatAvatar kind={c.kind} title={chatTitle(c)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`flex-1 truncate text-sm ${c.unread ? "font-semibold" : "font-medium"}`}>{chatTitle(c)}</span>
            {last && <span className="shrink-0 text-[11px] text-slate-500">{sameDay(last.at, new Date().toISOString()) ? fmtTime(last.at, locale) : new Date(last.at).toLocaleDateString(dateLocale(locale), { day: "numeric", month: "short" })}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate text-xs text-slate-500">
              {who && `${who}: `}
              {preview}
            </span>
            {c.unread > 0 && (
              <span className="min-w-[20px] rounded-full bg-indigo-600 px-1.5 text-center text-[11px] font-semibold leading-5 text-white">
                {c.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="card chat-height flex overflow-hidden">
      {/* Chat list */}
      <aside
        className={`w-full shrink-0 flex-col border-slate-200 md:flex md:w-80 md:border-r ${selectedId ? "hidden" : "flex"}`}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <h1 className="flex-1 text-lg font-semibold">{t.title}</h1>
          {me && (
            <button className="btn btn-ghost !p-2" title={t.newDirect} aria-label={t.newDirect} onClick={() => setPanel("direct")}>
              <UserPlus size={18} />
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-ghost !p-2" title={t.newGroup} aria-label={t.newGroup} onClick={() => setPanel("group")}>
              <Users size={18} />
            </button>
          )}
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {general && row(general)}
          {groups.length > 0 && <ListHeading>{t.groups}</ListHeading>}
          {groups.map(row)}
          {directs.length > 0 && <ListHeading>{t.direct}</ListHeading>}
          {directs.map(row)}
        </div>
      </aside>

      {/* Open chat */}
      <section className={`min-w-0 flex-1 flex-col md:flex ${selectedId ? "flex" : "hidden"}`}>
        {selected ? (
          <Thread
            key={selected.id}
            chat={selected}
            title={chatTitle(selected)}
            locale={locale}
            dict={dict}
            memberName={memberName}
            onBack={() => open(null)}
            onManage={isAdmin && selected.kind === "group" ? () => setPanel({ group: selected.id }) : undefined}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-slate-500">
            <MessageCircle size={32} />
            {loaded && selectedId ? t.empty : t.pick}
          </div>
        )}
      </section>

      {panel === "direct" && (
        <MemberPicker
          title={t.newDirect}
          dict={dict}
          locale={locale}
          members={members.filter((m) => m.id !== me?.id)}
          onClose={() => setPanel(null)}
          onPick={async (id) => {
            const { id: chatId } = await api<{ id: string }>("/api/chat/direct", { body: { memberId: id } });
            await refresh();
            open(chatId);
          }}
        />
      )}
      {(panel === "group" || (panel && typeof panel === "object")) && (
        <GroupEditor
          dict={dict}
          locale={locale}
          members={members}
          group={typeof panel === "object" ? chats.find((c) => c.id === panel.group) : undefined}
          onClose={() => setPanel(null)}
          onDone={(id) => open(id)}
        />
      )}
    </div>
  );
}

function ListHeading({ children }: { children: ReactNode }) {
  return <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{children}</div>;
}

function ChatAvatar({ kind, title }: { kind: ChatSummary["kind"]; title: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
      {kind === "general" ? <MessageCircle size={18} /> : kind === "group" ? <Users size={18} /> : title.slice(0, 1).toUpperCase()}
    </div>
  );
}

// ---- One conversation -------------------------------------------------------------------

function Thread({
  chat,
  title,
  locale,
  dict,
  memberName,
  onBack,
  onManage,
}: {
  chat: ChatSummary;
  title: string;
  locale: Locale;
  dict: Dict;
  memberName: (id?: string) => string;
  onBack: () => void;
  onManage?: () => void;
}) {
  const t = dict.chat;
  const { subscribe, refresh: refreshChats } = useChat();
  const { notify } = useStore();
  const { member: me, isAdmin } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // Where the view should go after the next render: the bottom, or keep the reader's place
  // when older messages are added above.
  const pendingScroll = useRef<"bottom" | { keepFrom: number } | null>("bottom");
  const syncedAt = useRef("");

  const nearBottom = () => {
    const el = scroller.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const markRead = useCallback(async () => {
    if (!me) return;
    await api(`/api/chat/${chat.id}/read`, { body: {} }).catch(() => {});
    refreshChats();
  }, [chat.id, me, refreshChats]);

  const absorb = useCallback(
    (incoming: ChatMessage[]) => {
      if (incoming.length === 0) return;
      for (const m of incoming) if (m.updatedAt > syncedAt.current) syncedAt.current = m.updatedAt;
      if (nearBottom()) pendingScroll.current = "bottom";
      setMessages((list) => merge(list, incoming));
      if (incoming.some((m) => m.senderId !== me?.id) && document.visibilityState === "visible") markRead();
    },
    [me?.id, markRead]
  );

  // First page.
  useEffect(() => {
    let live = true;
    api<MessagePage>(`/api/chat/${chat.id}/messages`)
      .then((page) => {
        if (!live) return;
        setHasMore(page.hasMore);
        absorb(page.messages);
      })
      .catch((e) => notify((e as Error).message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [chat.id, absorb, notify]);

  // Live changes: fetch what changed since the newest change seen (with some overlap).
  useEffect(
    () =>
      subscribe((id) => {
        if (id !== chat.id && id !== "*") return;
        const since = syncedAt.current
          ? new Date(new Date(syncedAt.current).getTime() - 5000).toISOString()
          : new Date(0).toISOString();
        api<MessagePage>(`/api/chat/${chat.id}/messages?since=${encodeURIComponent(since)}`)
          .then((page) => absorb(page.messages))
          .catch(() => {});
      }),
    [chat.id, subscribe, absorb]
  );

  const loadOlder = async () => {
    if (!messages[0]) return;
    const el = scroller.current;
    try {
      const page = await api<MessagePage>(
        `/api/chat/${chat.id}/messages?before=${encodeURIComponent(messages[0].createdAt)}`
      );
      pendingScroll.current = { keepFrom: el ? el.scrollHeight - el.scrollTop : 0 };
      setHasMore(page.hasMore);
      setMessages((list) => merge(list, page.messages));
    } catch (e) {
      notify((e as Error).message);
    }
  };

  useLayoutEffect(() => {
    const el = scroller.current;
    const want = pendingScroll.current;
    if (!el || !want) return;
    el.scrollTop = want === "bottom" ? el.scrollHeight : el.scrollHeight - want.keepFrom;
    pendingScroll.current = null;
  }, [messages]);

  const remove = async (m: ChatMessage) => {
    setConfirmDelete(null);
    setActive(null);
    try {
      await api(`/api/chat/messages/${m.id}`, { method: "DELETE" });
      setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, deleted: true, text: "", attachments: [] } : x)));
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const showNames = chat.kind !== "direct";
  const subtitle =
    chat.kind === "general" ? t.generalHint : chat.kind === "group" ? `${chat.memberIds.length} ${t.members}` : "";

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-200 px-3 py-2.5">
        <button className="btn btn-ghost !p-2 md:hidden" aria-label={t.back} onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <ChatAvatar kind={chat.kind} title={title} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{title}</div>
          {subtitle && <div className="truncate text-xs text-slate-500">{subtitle}</div>}
        </div>
        {onManage && (
          <button className="btn btn-ghost !p-2" title={t.manage} aria-label={t.manage} onClick={onManage}>
            <Settings size={18} />
          </button>
        )}
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto px-3 py-4" onClick={() => setActive(null)}>
        {hasMore && (
          <div className="mb-4 text-center">
            <button className="btn btn-ghost !py-1.5 text-xs" onClick={loadOlder}>
              {t.loadOlder}
            </button>
          </div>
        )}
        {!loading && messages.length === 0 && <p className="mt-10 text-center text-sm text-slate-500">{t.empty}</p>}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || !sameDay(prev.createdAt, m.createdAt);
          const mine = m.senderId === me?.id;
          // Consecutive messages from one sender within five minutes form a run with one name.
          const runStart =
            newDay ||
            prev.senderId !== m.senderId ||
            new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60_000;
          const canEdit = mine && !m.deleted;
          const canDelete = !m.deleted && (mine || (isAdmin && chat.kind !== "direct"));
          return (
            <div key={m.id}>
              {newDay && (
                <div className="my-4 text-center text-[11px] font-medium text-slate-500">{fmtDay(m.createdAt, locale)}</div>
              )}
              <div className={`group flex ${mine ? "justify-end" : "justify-start"} ${runStart ? "mt-3" : "mt-0.5"}`}>
                <div className={`flex max-w-[85%] items-end gap-1 sm:max-w-[70%] ${mine ? "flex-row-reverse" : ""}`}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive(active === m.id ? null : m.id);
                      setConfirmDelete(null);
                    }}
                    className={`min-w-0 rounded-2xl px-3 py-2 text-sm ${
                      mine ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-900"
                    } ${m.deleted ? "opacity-70" : ""}`}
                  >
                    {showNames && !mine && runStart && (
                      <div className="mb-0.5 text-xs font-semibold text-indigo-700">
                        {memberName(m.senderId) === t.formerMember ? m.senderName[locale] : memberName(m.senderId)}
                      </div>
                    )}
                    {m.deleted ? (
                      <span className="italic">{t.deleted}</span>
                    ) : (
                      <>
                        {m.attachments.length > 0 && (
                          <div className="mb-1 space-y-1.5">
                            {m.attachments.map((a) =>
                              a.kind === "image" ? (
                                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                  <img src={a.url} alt={a.name} loading="lazy" className="max-h-72 rounded-lg object-contain" />
                                </a>
                              ) : a.kind === "voice" ? (
                                <div key={a.id} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                                  <audio controls preload="metadata" src={a.url} className="h-10 w-60 max-w-full" />
                                  {a.duration !== undefined && (
                                    <span className={`text-xs ${mine ? "text-indigo-100" : "text-slate-500"}`}>
                                      {fmtDuration(a.duration)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <a
                                  key={a.id}
                                  href={a.url}
                                  download={a.name}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${mine ? "bg-indigo-500" : "bg-surface"}`}
                                >
                                  <FileText size={18} className="shrink-0" />
                                  <span className="min-w-0 flex-1 truncate">{a.name}</span>
                                  <span className={`shrink-0 text-xs ${mine ? "text-indigo-100" : "text-slate-500"}`}>
                                    {fmtSize(a.size)}
                                  </span>
                                </a>
                              )
                            )}
                          </div>
                        )}
                        {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
                      </>
                    )}
                    <div className={`mt-0.5 text-right text-[10px] ${mine ? "text-indigo-100" : "text-slate-500"}`}>
                      {m.editedAt && !m.deleted && `${t.edited} · `}
                      {fmtTime(m.createdAt, locale)}
                    </div>
                  </div>

                  {(canEdit || canDelete) && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`flex shrink-0 items-center gap-0.5 transition ${
                        active === m.id || confirmDelete === m.id ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
                      } ${active === m.id || confirmDelete === m.id ? "" : "pointer-events-none md:pointer-events-auto"}`}
                    >
                      {confirmDelete === m.id ? (
                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-surface px-2 py-1 text-xs shadow-sm">
                          <span className="hidden sm:inline">{t.deleteConfirm}</span>
                          <button className="rounded-lg px-2 py-1 font-medium text-rose-700 hover:bg-rose-50" onClick={() => remove(m)}>
                            {t.delete}
                          </button>
                          <button className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100" onClick={() => setConfirmDelete(null)}>
                            {t.cancel}
                          </button>
                        </div>
                      ) : (
                        <>
                          {canEdit && (
                            <IconAction
                              label={t.edit}
                              onClick={() => {
                                setEditing(m);
                                setActive(null);
                              }}
                            >
                              <Pencil size={14} />
                            </IconAction>
                          )}
                          {canDelete && (
                            <IconAction label={t.delete} onClick={() => setConfirmDelete(m.id)}>
                              <Trash2 size={14} />
                            </IconAction>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {chat.canWrite ? (
        <Composer
          key={editing?.id ?? "new"}
          chatId={chat.id}
          dict={dict}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          onSent={(m) => {
            pendingScroll.current = "bottom";
            absorb([m]);
            setEditing(null);
          }}
        />
      ) : (
        <div className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">{t.readOnly}</div>
      )}
    </>
  );
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
    >
      {children}
    </button>
  );
}

// ---- Writing --------------------------------------------------------------------------

/** Container formats in the order to try; Chrome and Firefox take the first, Safari mp4. */
const RECORDING_TYPES = [
  ["audio/webm;codecs=opus", "webm"],
  ["audio/webm", "webm"],
  ["audio/mp4", "m4a"],
  ["audio/ogg;codecs=opus", "ogg"],
] as const;

function Composer({
  chatId,
  dict,
  editing,
  onCancelEdit,
  onSent,
}: {
  chatId: string;
  dict: Dict;
  editing: ChatMessage | null;
  onCancelEdit: () => void;
  onSent: (m: ChatMessage) => void;
}) {
  const t = dict.chat;
  const { notify } = useStore();
  const [text, setText] = useState(editing?.text ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState<{ seconds: number } | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const recorder = useRef<{ rec: MediaRecorder; stream: MediaStream; started: number; send: boolean; timer: number } | null>(null);

  const previews = useMemo(() => files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : "")), [files]);
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews]);

  // Grow the box with its text, up to about six lines.
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  useEffect(() => {
    if (editing) input.current?.focus();
  }, [editing]);

  // Stop the microphone if the chat closes mid-recording.
  useEffect(
    () => () => {
      const r = recorder.current;
      if (!r) return;
      r.send = false;
      clearInterval(r.timer);
      if (r.rec.state !== "inactive") r.rec.stop();
      r.stream.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const errorText = (msg: string) => (msg === "tooLarge" ? t.tooLarge : msg);

  const post = async (form: FormData) => {
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${chatId}/messages`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      onSent(data as ChatMessage);
      return true;
    } catch (e) {
      notify(errorText((e as Error).message));
      return false;
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
    if (sending) return;
    const body = text.trim();
    if (editing) {
      if (!body && editing.attachments.length === 0) return;
      setSending(true);
      try {
        onSent(await api<ChatMessage>(`/api/chat/messages/${editing.id}`, { method: "PATCH", body: { text: body } }));
      } catch (e) {
        notify((e as Error).message);
      } finally {
        setSending(false);
      }
      return;
    }
    if (!body && files.length === 0) return;
    const form = new FormData();
    form.append("text", body);
    files.forEach((f) => form.append("files", f));
    if (await post(form)) {
      setText("");
      setFiles([]);
      input.current?.focus();
    }
  };

  const addFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (picker.current) picker.current.value = "";
    const all = [...files, ...picked];
    if (all.some((f) => f.size > MAX_FILE_BYTES) || all.reduce((s, f) => s + f.size, 0) > MAX_MESSAGE_BYTES)
      return notify(t.tooLarge);
    if (files.length + picked.length > MAX_FILES) return notify(t.tooMany);
    setFiles((fs) => [...fs, ...picked]);
  };

  const startRecording = async () => {
    const type = RECORDING_TYPES.find(([mime]) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime));
    if (!type || !navigator.mediaDevices?.getUserMedia) return notify(t.micDenied);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return notify(t.micDenied);
    }
    const rec = new MediaRecorder(stream, { mimeType: type[0] });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const r = recorder.current;
      recorder.current = null;
      stream.getTracks().forEach((track) => track.stop());
      setRecording(null);
      if (!r?.send || chunks.length === 0) return;
      const seconds = Math.round((Date.now() - r.started) / 1000);
      const blob = new Blob(chunks, { type: rec.mimeType || type[0] });
      const form = new FormData();
      form.append("voice", new File([blob], `voice.${type[1]}`, { type: blob.type }));
      form.append("duration", String(seconds));
      post(form);
    };
    const started = Date.now();
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - started) / 1000);
      setRecording({ seconds });
      if (seconds >= MAX_VOICE_SECONDS) stopRecording(true);
    }, 250);
    recorder.current = { rec, stream, started, send: false, timer };
    rec.start();
    setRecording({ seconds: 0 });
  };

  const stopRecording = (send: boolean) => {
    const r = recorder.current;
    if (!r) return;
    r.send = send;
    clearInterval(r.timer);
    if (r.rec.state !== "inactive") r.rec.stop();
  };

  // On phones Enter adds a line; the send button sends.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !window.matchMedia("(pointer: coarse)").matches) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape" && editing) onCancelEdit();
  };

  if (recording) {
    return (
      <div className="flex items-center gap-3 border-t border-slate-200 px-3 py-3">
        <button className="btn btn-ghost !p-2" aria-label={t.cancel} title={t.cancel} onClick={() => stopRecording(false)}>
          <X size={18} />
        </button>
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" />
        <span className="flex-1 font-mono text-sm">
          {fmtDuration(recording.seconds)} / {fmtDuration(MAX_VOICE_SECONDS)}
        </span>
        <button className="btn btn-primary !p-2.5" aria-label={t.sendVoice} title={t.sendVoice} onClick={() => stopRecording(true)}>
          <Square size={16} className="fill-current" />
        </button>
      </div>
    );
  }

  const canSend = text.trim() !== "" || files.length > 0 || (!!editing && editing.attachments.length > 0);

  return (
    <div className="border-t border-slate-200 px-3 py-2.5">
      {editing && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700">
          <Pencil size={14} />
          <span className="flex-1">{t.editing}</span>
          <button aria-label={t.cancel} onClick={onCancelEdit}>
            <X size={14} />
          </button>
        </div>
      )}
      {files.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {files.map((f, i) => (
            <div key={i} className="relative shrink-0">
              {previews[i] ? (
                <img src={previews[i]} alt={f.name} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-32 flex-col justify-center rounded-lg bg-slate-100 px-2 text-xs">
                  <FileText size={16} className="mb-1 text-slate-500" />
                  <span className="truncate">{f.name}</span>
                  <span className="text-slate-500">{fmtSize(f.size)}</span>
                </div>
              )}
              <button
                aria-label={t.delete}
                onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-800 p-0.5 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        {!editing && (
          <>
            <input ref={picker} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            <button className="btn btn-ghost !p-2.5" aria-label={t.attach} title={t.attach} onClick={() => picker.current?.click()}>
              <Paperclip size={18} />
            </button>
          </>
        )}
        <textarea
          ref={input}
          rows={1}
          value={text}
          maxLength={4000}
          placeholder={t.placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={(e) => !editing && e.clipboardData.files.length > 0 && addFiles(e.clipboardData.files)}
          className="input max-h-40 flex-1 resize-none !py-2.5"
        />
        {editing ? (
          <button className="btn btn-primary !p-2.5" aria-label={t.save} title={t.save} disabled={sending || !canSend} onClick={submit}>
            <Check size={18} />
          </button>
        ) : canSend ? (
          <button className="btn btn-primary !p-2.5" aria-label={t.send} title={t.send} disabled={sending} onClick={submit}>
            <Send size={18} />
          </button>
        ) : (
          <button className="btn btn-ghost !p-2.5" aria-label={t.record} title={t.record} disabled={sending} onClick={startRecording}>
            <Mic size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Choosing people ------------------------------------------------------------------

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 sm:items-center" onClick={onClose}>
      <div
        className="card flex max-h-[85dvh] w-full max-w-md flex-col rounded-b-none sm:rounded-b-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <h2 className="flex-1 font-semibold">{title}</h2>
          <button className="btn btn-ghost !p-2" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function useMemberSearch(members: Member[], locale: Locale) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const found = members
    .filter((m) => !q || m.name.ka.toLowerCase().includes(q) || m.name.en.toLowerCase().includes(q) || m.wallet.toLowerCase().startsWith(q))
    .sort((a, b) => a.name[locale].localeCompare(b.name[locale]));
  return { query, setQuery, found };
}

function MemberPicker({
  title,
  dict,
  locale,
  members,
  onClose,
  onPick,
}: {
  title: string;
  dict: Dict;
  locale: Locale;
  members: Member[];
  onClose: () => void;
  onPick: (memberId: string) => Promise<void>;
}) {
  const { notify } = useStore();
  const { query, setQuery, found } = useMemberSearch(members, locale);
  return (
    <Overlay title={title} onClose={onClose}>
      <div className="p-4 pb-2">
        <input className="input" autoFocus placeholder={dict.chat.search} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {found.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">{dict.chat.noMembers}</p>}
        {found.map((m) => (
          <button
            key={m.id}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100"
            onClick={() => onPick(m.id).catch((e) => notify((e as Error).message))}
          >
            <ChatAvatar kind="direct" title={m.name[locale]} />
            {m.name[locale]}
          </button>
        ))}
      </div>
    </Overlay>
  );
}

function GroupEditor({
  dict,
  locale,
  members,
  group,
  onClose,
  onDone,
}: {
  dict: Dict;
  locale: Locale;
  members: Member[];
  group?: ChatSummary;
  onClose: () => void;
  onDone: (chatId: string | null) => void;
}) {
  const t = dict.chat;
  const { notify } = useStore();
  const { refresh } = useChat();
  const [name, setName] = useState(group?.name ?? "");
  const [picked, setPicked] = useState(() => new Set(group?.memberIds ?? []));
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { query, setQuery, found } = useMemberSearch(members, locale);

  const toggle = (id: string) =>
    setPicked((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const act = async (fn: () => Promise<string | null>) => {
    setBusy(true);
    try {
      const id = await fn();
      await refresh();
      onDone(id);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    act(async () => {
      const body = { name, memberIds: Array.from(picked) };
      if (group) {
        await api(`/api/admin/chats/${group.id}`, { method: "PATCH", body });
        return group.id;
      }
      return (await api<{ id: string }>("/api/admin/chats", { body })).id;
    });

  const remove = () =>
    act(async () => {
      await api(`/api/admin/chats/${group!.id}`, { method: "DELETE" });
      return null;
    });

  return (
    <Overlay title={group ? t.manage : t.newGroup} onClose={onClose}>
      <div className="space-y-3 p-4 pb-2">
        <input className="input" autoFocus placeholder={t.groupName} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {found.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">{t.noMembers}</p>}
        {found.map((m) => (
          <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-slate-100">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={picked.has(m.id)} onChange={() => toggle(m.id)} />
            {m.name[locale]}
          </label>
        ))}
      </div>
      <div className="space-y-2 border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <span className="flex-1 self-center text-xs text-slate-500">
            {picked.size} {t.members}
          </span>
          <button className="btn btn-ghost" onClick={onClose}>
            {t.cancel}
          </button>
          <button className="btn btn-primary" disabled={busy || !name.trim()} onClick={save}>
            {group ? t.save : t.create}
          </button>
        </div>
        {group &&
          (confirming ? (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <span className="flex-1">{t.deleteGroupConfirm}</span>
              <button className="font-medium" disabled={busy} onClick={remove}>
                {t.delete}
              </button>
              <button onClick={() => setConfirming(false)}>{t.cancel}</button>
            </div>
          ) : (
            <button className="flex items-center gap-2 text-sm text-rose-700" onClick={() => setConfirming(true)}>
              <Trash2 size={14} /> {t.deleteGroup}
            </button>
          ))}
      </div>
    </Overlay>
  );
}
