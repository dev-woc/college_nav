export const dynamic = "force-dynamic";

import { and, asc, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { FAFSA_STEPS } from "@/lib/agents/applications/fafsa-steps";
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
	studentProfiles,
	studentScholarships,
	userProfiles,
} from "@/lib/db/schema";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ studentId: string }> },
) {
	const { studentId } = await params;

	const { data } = await auth.getSession();
	const user = data?.user ?? null;
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

	// Verify student is in caseload
	const connection = await db.query.counselorStudents.findFirst({
		where: and(
			eq(counselorStudents.counselorProfileId, counselorProfile.id),
			eq(counselorStudents.studentProfileId, studentId),
		),
	});
	if (!connection) {
		return NextResponse.json({ error: "Student not in your caseload" }, { status: 403 });
	}

	const studentProfile = await db.query.studentProfiles.findFirst({
		where: eq(studentProfiles.id, studentId),
	});
	if (!studentProfile) {
		return NextResponse.json({ error: "Student not found" }, { status: 404 });
	}

	const studentUserProfile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.id, studentProfile.userProfileId),
	});

	// Fetch all data in parallel
	const [listEntries, fafsa, scholarshipMatches, tasks, pendingTasks, runs, latestRun] =
		await Promise.all([
			db.query.collegeListEntries.findMany({
				where: eq(collegeListEntries.studentProfileId, studentId),
				columns: { id: true },
			}),
			db.query.fafsaProgress.findFirst({
				where: eq(fafsaProgress.studentProfileId, studentId),
			}),
			db.query.studentScholarships.findMany({
				where: eq(studentScholarships.studentProfileId, studentId),
				columns: { id: true },
			}),
			db.query.applicationTasks.findMany({
				where: eq(applicationTasks.studentProfileId, studentId),
				orderBy: [asc(applicationTasks.deadlineDate)],
			}),
			db.query.applicationTasks.findMany({
				where: and(eq(applicationTasks.studentProfileId, studentId)),
				columns: { deadlineDate: true, status: true },
			}),
			db.query.agentRuns.findMany({
				where: eq(agentRuns.studentProfileId, studentId),
				orderBy: [desc(agentRuns.startedAt)],
				limit: 10,
			}),
			db.query.agentRuns.findFirst({
				where: eq(agentRuns.studentProfileId, studentId),
				orderBy: (r, { desc: d }) => [d(r.startedAt)],
			}),
		]);

	const activePendingTasks = pendingTasks.filter(
		(t) => t.status !== "completed" && t.status !== "skipped",
	);

	const urgencyInput = {
		hasCollegeList: listEntries.length > 0,
		hasFinancialAidRun: false,
		hasScholarshipMatches: scholarshipMatches.length > 0,
		fafsaCurrentStep: fafsa?.currentStep ?? 0,
		pendingTasks: activePendingTasks.map((t) => ({
			deadlineDate: t.deadlineDate,
		})),
		gradeLevel: studentProfile.gradeLevel,
	};

	const fafsaStatus =
		(fafsa?.currentStep ?? 0) >= 12
			? "complete"
			: (fafsa?.currentStep ?? 0) > 0
				? "in-progress"
				: "not-started";

	const hasAppTasks = activePendingTasks.length > 0;

	const student = {
		id: studentProfile.id,
		displayName: studentUserProfile?.displayName ?? "Unknown",
		email: studentUserProfile?.email ?? "",
		gradeLevel: studentProfile.gradeLevel,
		isFirstGen: studentProfile.isFirstGen,
		urgencyScore: computeUrgencyScore(urgencyInput),
		flaggedReason: buildFlaggedReason(urgencyInput),
		milestones: {
			onboarding: studentUserProfile?.onboardingCompleted ? "complete" : "not-started",
			collegeList: listEntries.length > 0 ? "complete" : "not-started",
			financialAid: "not-started" as const,
			scholarships: scholarshipMatches.length > 0 ? "complete" : "not-started",
			fafsa: fafsaStatus,
			applications: hasAppTasks ? "in-progress" : "not-started",
			lastAgentRun: latestRun?.completedAt ?? null,
		},
	};

	const completedSteps = fafsa ? (JSON.parse(fafsa.completedSteps) as number[]) : [];
	const fafsaSteps = FAFSA_STEPS.map((s) => ({
		...s,
		isCompleted: completedSteps.includes(s.step),
	}));

	return NextResponse.json({
		student,
		tasks,
		fafsaSteps,
		agentRuns: runs,
	});
}
