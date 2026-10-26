"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ChatSummary } from "@/lib/chat";
import { api, useSession } from "./PollsStore";

interface ChatStore {
  /** True when the signed-in viewer may use the chat (a member or the administrator). */
  enabled: boolean;
  chats: ChatSummary[];
  loaded: boolean;
  unread: number;
  refresh: () => Promise<void>;
  /** Calls back with the id of every chat that changes ("*" after a reconnect: anything may have). */
  subscribe: (fn: (chatId: string) => void) => () => void;
}

const ChatContext = createContext<ChatStore | null>(null);

// Without the event stream (a proxy that drops it, a phone waking up) this still catches up.
const FALLBACK_POLL_MS = 30_000;

export function ChatProvider({ children }: { children: ReactNode }) {
  const { signedIn, member, isAdmin, wallet } = useSession();
  const enabled = signedIn && (!!member || isAdmin);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const subscribers = useRef(new Set<(chatId: string) => void>());

  const refresh = useCallback(async () => {
    try {
      setChats(await api<ChatSummary[]>("/api/chat"));
    } catch {
    } finally {
      setLoaded(true);
    }
  }, []);

  const subscribe = useCallback<ChatStore["subscribe"]>((fn) => {
    subscribers.current.add(fn);
    return () => {
      subscribers.current.delete(fn);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setChats([]);
      setLoaded(false);
      return;
    }
    refresh();
    const changed = (chatId: string) => {
      refresh();
      subscribers.current.forEach((fn) => fn(chatId));
    };

    let opened = false;
    const events = new EventSource("/api/chat/events");
    events.onmessage = (e) => changed(e.data);
    // EventSource reconnects by itself; whatever happened in between is fetched again.
    events.onopen = () => {
      if (opened) changed("*");
      opened = true;
    };
    const poll = setInterval(() => changed("*"), FALLBACK_POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && changed("*");
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      events.close();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, wallet, refresh]);

  const unread = chats.reduce((s, c) => s + c.unread, 0);

  return (
    <ChatContext.Provider value={{ enabled, chats, loaded, unread, refresh, subscribe }}>{children}</ChatContext.Provider>
  );
}

export function useChat(): ChatStore {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}
