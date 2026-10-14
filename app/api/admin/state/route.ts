import { loadAdminState } from "@/lib/server/state";
import { handle, requireAdmin } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

/** Applications and member contact details, for the administrator only. */
export const GET = handle(async () => {
  await requireAdmin();
  return loadAdminState();
});
