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

export const auth = new Proxy({} as ReturnType<typeof createAuthServer>, {
	get(_, prop: string) {
		return (getServer() as Record<string, unknown>)[prop];
	},
});
