import { loadChats } from "@/lib/server/chat";
import { HttpError, getViewer, handle } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

/** The chats the signed-in member (or the administrator) can see. */
export const GET = handle(async () => {
  const viewer = await getViewer();
  if (!viewer.member && !viewer.isAdmin) throw new HttpError(403, "Only party members can use the chat");
  return loadChats(viewer);
});
