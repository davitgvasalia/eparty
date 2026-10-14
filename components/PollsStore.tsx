"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { X } from "lucide-react";
import { pollFinished, pollStarted, type Member, type Poll } from "@/lib/model";
import type { PublicState } from "@/lib/server/state";

const EMPTY: PublicState = {
  today: "",
  districts: [],
  members: [],
  polls: [],
  initiatives: [],
  viewer: { isAdmin: false, demoAdmin: false },
};

/** Calls the API; throws an Error with the server's message on failure. */
export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

interface Store {
  state: PublicState;
  loaded: boolean;
  refresh: () => Promise<void>;
  /** Runs an API call, then reloads the data. Errors show in a toast and return false. */
  run: (path: string, init?: { method?: string; body?: unknown }) => Promise<boolean>;
  signIn: () => Promise<void>;
  signingIn: boolean;
}

const StoreContext = createContext<Store | null>(null);

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...Array.from(bytes)));

// Data comes from the database through /api. Signing in proves wallet ownership:
// the wallet signs a one-time message and the server sets a session cookie.
export function PollsProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const [state, setState] = useState<PublicState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [toast, setToast] = useState("");
  const askedFor = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setState(await api<PublicState>("/api/state"));
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const wallet = publicKey?.toBase58();

  const signIn = useCallback(async () => {
    if (!wallet || !signMessage) return;
    setSigningIn(true);
    try {
      const { message } = await api<{ message: string }>("/api/auth/nonce", { body: {} });
      const signature = await signMessage(new TextEncoder().encode(message));
      await api("/api/auth/verify", { body: { wallet, signature: toBase64(signature) } });
      await refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setSigningIn(false);
    }
  }, [wallet, signMessage, refresh]);

  // Ask for a signature once per newly connected wallet; drop the session on disconnect.
  useEffect(() => {
    if (!loaded) return;
    const sessionWallet = state.viewer.wallet;
    if (connected && wallet && sessionWallet !== wallet && askedFor.current !== wallet) {
      askedFor.current = wallet;
      signIn();
    } else if (!connected && sessionWallet) {
      askedFor.current = null;
      api("/api/auth/logout", { body: {} }).then(refresh, () => {});
    }
  }, [loaded, connected, wallet, state.viewer.wallet, signIn, refresh]);

  const run = useCallback<Store["run"]>(
    async (path, init) => {
      try {
        await api(path, init ?? { body: {} });
        return true;
      } catch (e) {
        setToast((e as Error).message);
        return false;
      } finally {
        await refresh();
      }
    },
    [refresh]
  );

  return (
    <StoreContext.Provider value={{ state, loaded, refresh, run, signIn, signingIn }}>
      {children}
      {toast && (
        <div className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl border border-rose-700/30 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg md:bottom-6">
          <span className="flex-1">{toast}</span>
          <button aria-label="Close" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside PollsProvider");
  return ctx;
}

export interface Session {
  /** Connected wallet, signed in or not. */
  wallet?: string;
  /** True once the connected wallet has signed in. */
  signedIn: boolean;
  member?: Member;
  isAdmin: boolean;
  demoAdmin: boolean;
  signIn: () => Promise<void>;
  signingIn: boolean;
}

export function useSession(): Session {
  const { state, signIn, signingIn } = useStore();
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();
  const signedIn = !!wallet && state.viewer.wallet === wallet;
  return {
    wallet,
    signedIn,
    member: signedIn ? state.members.find((m) => m.id === state.viewer.memberId) : undefined,
    isAdmin: state.viewer.demoAdmin || (signedIn && state.viewer.isAdmin),
    demoAdmin: state.viewer.demoAdmin,
    signIn,
    signingIn,
  };
}

export const usePolls = () => useStore().state.polls;
export const useMembers = () => useStore().state.members;
export const useInitiatives = () => useStore().state.initiatives;
export const useDistricts = () => useStore().state.districts;

/** Today's server date as YYYY-MM-DD, or "" before the first load. */
export const useToday = () => useStore().state.today;

export function useHasStarted(): (p: Poll) => boolean {
  const today = useToday();
  return (p) => today !== "" && pollStarted(p, today);
}

export function useIsFinished(): (p: Poll) => boolean {
  const today = useToday();
  return (p) => p.closed || (today !== "" && pollFinished(p, today));
}

export function useOpenPolls(): Poll[] {
  const isFinished = useIsFinished();
  return usePolls().filter((p) => !isFinished(p));
}

export function useFinishedPolls(): Poll[] {
  const isFinished = useIsFinished();
  return usePolls().filter(isFinished);
}
