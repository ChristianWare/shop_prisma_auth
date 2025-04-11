// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

const protectedPaths = ["/account", "/checkout", "/orders"];
const authPaths = ["/auth/signin", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // ** Explicitly pass the secret from process.env. **
  // If `process.env.NEXTAUTH_SECRET` is not undefined in your Edge runtime,
  // it will be used. Otherwise, you might need to mark it as an "Edge-compatible"
  // environment variable in your deployment settings (if using Vercel, etc.)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (isProtectedPath && !token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
