import { createAuthServer } from "@neondatabase/auth/next/server";

// Lazy-initialize to prevent build-time failures when env vars are not set.
// createAuthServer() is called on the first request, not at module load time.
let _server: ReturnType<typeof createAuthServer> | null = null;

function getServer() {
	if (!_server) {
		_server = createAuthServer();
	}
	return _server;
}

// Fixed dev user — used when SKIP_AUTH=true in .env.local
const DEV_USER = { id: "dev-user-local-001", email: "dev@localhost" } as const;

export const auth = new Proxy({} as ReturnType<typeof createAuthServer>, {
	get(_, prop: string) {
		if (process.env.SKIP_AUTH === "true" && prop === "getSession") {
			return async () => ({ data: { user: DEV_USER }, error: null });
		}
		return (getServer() as Record<string, unknown>)[prop];
	},
});
