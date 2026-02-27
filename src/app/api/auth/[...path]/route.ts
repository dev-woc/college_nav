export const dynamic = "force-dynamic";

import { authApiHandler } from "@neondatabase/auth/next/server";
import type { NextRequest } from "next/server";

// Lazy-initialize to prevent build-time failures when NEON_AUTH_BASE_URL is not set.
let _handler: ReturnType<typeof authApiHandler> | null = null;

function getHandler() {
	if (!_handler) {
		_handler = authApiHandler();
	}
	return _handler;
}

export function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
	return getHandler().GET(request, context);
}

export function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
	return getHandler().POST(request, context);
}
