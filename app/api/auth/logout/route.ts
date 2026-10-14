import { signOut } from "@/lib/server/session";
import { handle } from "@/lib/server/viewer";

export const POST = handle(async () => {
  signOut();
});
