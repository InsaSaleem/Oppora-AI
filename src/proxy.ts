import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-client";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.includes(path);

  // Not logged in and hitting a protected route -> send to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  // Logged in and hitting login/register -> send to dashboard
  if (user && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role-based redirect: when a logged-in user hits /dashboard but is a mentor or admin,
  // redirect them to their correct dashboard root.
  if (user && path === "/dashboard") {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op in middleware for reads
          },
        },
      }
    );

    const { data: profileUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileUser?.role === "mentor") {
      const url = request.nextUrl.clone();
      url.pathname = "/mentor";
      return NextResponse.redirect(url);
    }
    if (profileUser?.role === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
