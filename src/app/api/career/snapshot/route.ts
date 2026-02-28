export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { careerSnapshots, studentProfiles, userProfiles } from "@/lib/db/schema";

const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isStale(lastRefreshedAt: Date): boolean {
	return Date.now() - new Date(lastRefreshedAt).getTime() > SNAPSHOT_TTL_MS;
}

// GET /api/career/snapshot — return cached career snapshot; null if missing or stale
export async function GET() {
	const { data } = await auth.getSession();
	const user = data?.user ?? null;
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userProfile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, user.id),
	});
	if (!userProfile) {
		return NextResponse.json({ error: "Profile not found" }, { status: 404 });
	}

	const studentProfile = await db.query.studentProfiles.findFirst({
		where: eq(studentProfiles.userProfileId, userProfile.id),
	});
	if (!studentProfile) {
		return NextResponse.json({ snapshot: null });
	}

	const snapshot = await db.query.careerSnapshots.findFirst({
		where: eq(careerSnapshots.studentProfileId, studentProfile.id),
	});

	if (!snapshot || isStale(snapshot.lastRefreshedAt)) {
		return NextResponse.json({ snapshot: null });
	}

	return NextResponse.json({ snapshot });
}
