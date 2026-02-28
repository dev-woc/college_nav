export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { calcDaysUntilDeadline } from "@/lib/agents/scholarships/matching";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { studentProfiles, studentScholarships, userProfiles } from "@/lib/db/schema";
import type { ScholarshipMatch } from "@/types";

// GET /api/scholarships — return matched scholarships for the authenticated student
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
		return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
	}

	const matches = await db.query.studentScholarships.findMany({
		where: eq(studentScholarships.studentProfileId, studentProfile.id),
		with: { scholarship: true },
	});

	const scholarshipMatches: ScholarshipMatch[] = matches
		.map((m) => ({
			scholarship: m.scholarship,
			matchScore: m.matchScore,
			matchReasons: JSON.parse(m.matchReasons) as string[],
			status: m.status,
			daysUntilDeadline: calcDaysUntilDeadline(
				m.scholarship.deadlineMonth,
				m.scholarship.deadlineDay,
			),
			notifiedAt: m.notifiedAt,
		}))
		// Sort: soonest deadline first (nulls last), then by match score
		.sort((a, b) => {
			if (a.daysUntilDeadline !== null && b.daysUntilDeadline !== null) {
				return a.daysUntilDeadline - b.daysUntilDeadline;
			}
			if (a.daysUntilDeadline !== null) return -1;
			if (b.daysUntilDeadline !== null) return 1;
			return b.matchScore - a.matchScore;
		});

	return NextResponse.json({ scholarships: scholarshipMatches });
}
