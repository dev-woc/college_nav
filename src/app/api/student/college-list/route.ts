export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { agentRuns, collegeListEntries, studentProfiles, userProfiles } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import type { CollegeListEntryWithCollege, TieredCollegeList } from "@/types";

async function getUser() {
	const { data } = await auth.getSession();
	return data?.user ?? null;
}

// GET /api/student/college-list — fetch the current student's tiered college list
export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	const user = await getUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userProfile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, user.id),
	});
	if (!userProfile) {
		return NextResponse.json({ error: "User profile not found" }, { status: 404 });
	}

	const studentProfile = await db.query.studentProfiles.findFirst({
		where: eq(studentProfiles.userProfileId, userProfile.id),
	});
	if (!studentProfile) {
		return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
	}

	// Fetch entries with college data
	const entries = await db.query.collegeListEntries.findMany({
		where: eq(collegeListEntries.studentProfileId, studentProfile.id),
		with: { college: true },
		orderBy: (e, { desc }) => [desc(e.compositeScore)],
	});

	// Fetch most recent agent run
	const latestRun = await db.query.agentRuns.findFirst({
		where: eq(agentRuns.studentProfileId, studentProfile.id),
		orderBy: [desc(agentRuns.startedAt)],
	});

	const result: TieredCollegeList = {
		reach: entries.filter((e) => e.tier === "reach") as CollegeListEntryWithCollege[],
		match: entries.filter((e) => e.tier === "match") as CollegeListEntryWithCollege[],
		likely: entries.filter((e) => e.tier === "likely") as CollegeListEntryWithCollege[],
		agentRun: latestRun ?? null,
	};

	return NextResponse.json(result);
}
