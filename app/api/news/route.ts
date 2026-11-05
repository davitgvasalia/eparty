import { listNews } from "@/lib/server/news";
import { handle } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

export const GET = handle(async () => listNews());
