export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { matchEmployers } from "@/lib/agents/career/employer-matcher";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { collegeListEntries, employers, studentProfiles, userProfiles } from "@/lib/db/schema";

// GET /api/career/employers — return employer matches for student's college tiers + major
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
		return NextResponse.json({ employers: [] });
	}

	const listEntries = await db.query.collegeListEntries.findMany({
		where: eq(collegeListEntries.studentProfileId, studentProfile.id),
	});

	const studentTiers = [...new Set(listEntries.map((e) => e.tier))];
	const tiersToMatch = studentTiers.length > 0 ? studentTiers : ["reach", "match", "likely"];
	const major = studentProfile.intendedMajor ?? "";

	const employersWithPrefs = await db.query.employers.findMany({
		where: eq(employers.isVerified, true),
		with: {
			recruitingPrefs: true,
		},
	});

	const matches = matchEmployers(employersWithPrefs, tiersToMatch, major);

	return NextResponse.json({ employers: matches });
}
