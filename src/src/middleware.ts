import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login, /forgot-password (auth pages)
     * - /api/auth (NextAuth routes)
     * - /api/health (health check)
     * - /_next (Next.js internals)
     * - /favicon.ico, /manifest.json, /sw.js (static files)
     */
    "/((?!login|forgot-password|api/auth|api/health|_next|favicon\\.ico|manifest\\.json|sw\\.js).*)",
  ],
};
