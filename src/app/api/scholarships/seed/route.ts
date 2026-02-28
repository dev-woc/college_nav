export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { SEED_SCHOLARSHIPS } from "@/lib/agents/scholarships/seed-data";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { scholarships, userProfiles } from "@/lib/db/schema";

// POST /api/scholarships/seed — seed the scholarship database
// Allowed in dev mode (SKIP_AUTH=true) or for admin users
export async function POST(request: NextRequest) {
	const isDevMode = process.env.SKIP_AUTH === "true";

	if (!isDevMode) {
		const { data } = await auth.getSession();
		const user = data?.user ?? null;
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const userProfile = await db.query.userProfiles.findFirst({
			where: eq(userProfiles.userId, user.id),
		});
		if (userProfile?.role !== "admin") {
			return NextResponse.json({ error: "Admin access required" }, { status: 403 });
		}
	}

	// Insert all seed scholarships, skip duplicates by name
	const values = SEED_SCHOLARSHIPS.map((s) => ({ ...s }));

	await db.insert(scholarships).values(values).onConflictDoNothing();

	const count = await db.$count(scholarships);

	return NextResponse.json({ seeded: values.length, totalInDb: count });
}
