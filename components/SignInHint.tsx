"use client";

import type { Dict } from "@/lib/dictionaries";
import { useSession } from "./PollsStore";

/** Says why the visitor can't act yet: no wallet, not signed in, or not a member. */
export default function SignInHint({ dict, membersOnly }: { dict: Dict; membersOnly: string }) {
  const { wallet, signedIn, member, signIn, signingIn } = useSession();
  if (member) return null;
  if (!wallet) return <span className="text-xs text-slate-500">{dict.common.connectToVote}</span>;
  if (!signedIn)
    return (
      <button
        className="text-xs text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400"
        disabled={signingIn}
        onClick={signIn}
      >
        {dict.common.signIn}
      </button>
    );
  return <span className="text-xs text-slate-500">{membersOnly}</span>;
}
