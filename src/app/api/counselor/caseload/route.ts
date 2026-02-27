export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
	agentRuns,
	collegeListEntries,
	counselorProfiles,
	counselorStudents,
	userProfiles,
} from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";

async function getUser() {
	const { data } = await auth.getSession();
	return data?.user ?? null;
}

// GET /api/counselor/caseload — fetch counselor's student list with milestone status
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
	if (!userProfile || userProfile.role !== "counselor") {
		return NextResponse.json({ error: "Counselor access required" }, { status: 403 });
	}

	const counselorProfile = await db.query.counselorProfiles.findFirst({
		where: eq(counselorProfiles.userProfileId, userProfile.id),
	});
	if (!counselorProfile) {
		return NextResponse.json({ error: "Counselor profile not found" }, { status: 404 });
	}

	// Fetch connected students
	const connections = await db.query.counselorStudents.findMany({
		where: eq(counselorStudents.counselorProfileId, counselorProfile.id),
		with: {
			student: {
				with: { userProfile: true },
			},
		},
	});

	// Build student summaries with milestone status
	const studentSummaries = await Promise.all(
		connections.map(async (conn) => {
			const sp = conn.student;
			const up = sp.userProfile;

			// Count college list entries
			const listEntries = await db.query.collegeListEntries.findMany({
				where: eq(collegeListEntries.studentProfileId, sp.id),
				columns: { id: true },
			});

			// Get latest agent run
			const latestRun = await db.query.agentRuns.findFirst({
				where: eq(agentRuns.studentProfileId, sp.id),
				orderBy: (r, { desc }) => [desc(r.startedAt)],
			});

			return {
				id: sp.id,
				displayName: up?.displayName ?? "Unknown",
				gradeLevel: sp.gradeLevel,
				isFirstGen: sp.isFirstGen,
				milestones: {
					onboarding: up?.onboardingCompleted ? "complete" : "not-started",
					collegeList: listEntries.length > 0 ? "complete" : "not-started",
					lastAgentRun: latestRun?.completedAt ?? null,
				},
			};
		}),
	);

	return NextResponse.json({
		students: studentSummaries,
		total: studentSummaries.length,
	});
}
