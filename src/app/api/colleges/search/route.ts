export const dynamic = "force-dynamic";

import { and, eq, ilike, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { colleges } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";

// GET /api/colleges/search — search the local college cache
// Query params: q (name search), state, ownership, page, perPage
export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	const { searchParams } = request.nextUrl;
	const q = searchParams.get("q")?.trim() ?? "";
	const state = searchParams.get("state")?.toUpperCase() ?? "";
	const ownership = searchParams.get("ownership");
	const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
	const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get("perPage") ?? "20", 10)));

	const conditions = [];

	if (q) {
		conditions.push(ilike(colleges.name, `%${q}%`));
	}
	if (state.length === 2) {
		conditions.push(eq(colleges.state, state));
	}
	if (ownership && ["1", "2", "3"].includes(ownership)) {
		conditions.push(eq(colleges.ownership, parseInt(ownership, 10)));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [results, countResult] = await Promise.all([
		db.query.colleges.findMany({
			where,
			limit: perPage,
			offset: page * perPage,
			orderBy: (c, { desc }) => [desc(c.studentSize)],
		}),
		db.select({ count: sql<number>`count(*)::int` }).from(colleges).where(where),
	]);

	return NextResponse.json({
		results,
		total: countResult[0]?.count ?? 0,
		page,
		perPage,
	});
}
