export const dynamic = "force-dynamic";

import { and, eq, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { buildFlaggedReason, computeUrgencyScore } from "@/lib/agents/applications/urgency";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
	agentRuns,
	applicationTasks,
	collegeListEntries,
	counselorProfiles,
	counselorStudents,
	fafsaProgress,
	studentScholarships,
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

			// FAFSA progress
			const fafsa = await db.query.fafsaProgress.findFirst({
				where: eq(fafsaProgress.studentProfileId, sp.id),
				columns: { currentStep: true },
			});

			// Scholarship matches
			const scholarshipMatches = await db.query.studentScholarships.findMany({
				where: eq(studentScholarships.studentProfileId, sp.id),
				columns: { id: true },
			});

			// Pending application tasks
			const pendingTasks = await db.query.applicationTasks.findMany({
				where: and(
					eq(applicationTasks.studentProfileId, sp.id),
					ne(applicationTasks.status, "completed"),
				),
				columns: { deadlineDate: true },
			});

			// Urgency
			const urgencyInput = {
				hasCollegeList: listEntries.length > 0,
				hasFinancialAidRun: false,
				hasScholarshipMatches: scholarshipMatches.length > 0,
				fafsaCurrentStep: fafsa?.currentStep ?? 0,
				pendingTasks: pendingTasks.map((t) => ({
					deadlineDate: t.deadlineDate,
				})),
				gradeLevel: sp.gradeLevel,
			};
			const urgencyScore = computeUrgencyScore(urgencyInput);
			const flaggedReason = buildFlaggedReason(urgencyInput);

			const fafsaStatus =
				(fafsa?.currentStep ?? 0) >= 12
					? "complete"
					: (fafsa?.currentStep ?? 0) > 0
						? "in-progress"
						: "not-started";
			const hasAppTasks = pendingTasks.length > 0;

			return {
				id: sp.id,
				displayName: up?.displayName ?? "Unknown",
				email: up?.email ?? "",
				gradeLevel: sp.gradeLevel,
				isFirstGen: sp.isFirstGen,
				urgencyScore,
				flaggedReason,
				milestones: {
					onboarding: up?.onboardingCompleted ? "complete" : "not-started",
					collegeList: listEntries.length > 0 ? "complete" : "not-started",
					financialAid: "not-started" as const,
					scholarships: scholarshipMatches.length > 0 ? "complete" : "not-started",
					fafsa: fafsaStatus,
					applications: hasAppTasks ? "in-progress" : "not-started",
					lastAgentRun: latestRun?.completedAt ?? null,
				},
			};
		}),
	);

	const cohortStats = {
		totalStudents: studentSummaries.length,
		fafsaCompletionRate:
			studentSummaries.filter((s) => s.milestones.fafsa === "complete").length /
			Math.max(1, studentSummaries.length),
		avgScholarshipsMatched: 0,
		avgCollegesOnList: 0,
		studentsWithApplicationTasks: studentSummaries.filter(
			(s) => s.milestones.applications !== "not-started",
		).length,
		highUrgencyCount: studentSummaries.filter((s) => s.urgencyScore >= 60).length,
	};

	return NextResponse.json({
		students: studentSummaries,
		cohortStats,
		total: studentSummaries.length,
	});
}
