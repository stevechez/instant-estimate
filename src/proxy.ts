import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// `middleware.ts` was renamed to `proxy.ts` in Next.js 16 — same behavior,
// new file/export name. See node_modules/next/dist/docs/.../proxy.md.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and image optimization files,
     * so the session cookie stays fresh across normal navigation without
     * proxy intercepting every asset request.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
