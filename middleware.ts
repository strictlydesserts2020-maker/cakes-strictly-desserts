import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Refresh Supabase session everywhere; guard /admin in updateSession().
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only the admin area needs the Supabase session check. Running it on
  // every public page made the whole shop depend on Supabase auth.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
