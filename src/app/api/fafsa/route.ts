export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { FAFSA_STEPS } from "@/lib/agents/applications/fafsa-steps";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { fafsaProgress, studentProfiles, userProfiles } from "@/lib/db/schema";

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

	const progress = await db.query.fafsaProgress.findFirst({
		where: eq(fafsaProgress.studentProfileId, studentProfile.id),
	});

	const completedSteps = progress ? (JSON.parse(progress.completedSteps) as number[]) : [];
	const currentStep = progress?.currentStep ?? 0;

	const steps = FAFSA_STEPS.map((s) => ({
		...s,
		isCompleted: completedSteps.includes(s.step),
	}));

	return NextResponse.json({
		steps,
		currentStep,
		completedCount: completedSteps.length,
		totalSteps: FAFSA_STEPS.length,
	});
}
