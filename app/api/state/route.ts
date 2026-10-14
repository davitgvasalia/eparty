import { loadPublicState } from "@/lib/server/state";
import { demoAdmin, getViewer, handle } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

/** Everything the public pages show, plus the signed-in member's own votes. */
export const GET = handle(async () => loadPublicState(await getViewer(), demoAdmin()));
