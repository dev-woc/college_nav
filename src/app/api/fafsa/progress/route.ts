export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { fafsaProgress, studentProfiles, userProfiles } from "@/lib/db/schema";

const progressSchema = z.object({
	step: z.number().int().min(1).max(12),
	completed: z.boolean(),
});

export async function PATCH(request: Request) {
	const { data } = await auth.getSession();
	const user = data?.user ?? null;
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const parsed = progressSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid step" }, { status: 400 });
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

	const existing = await db.query.fafsaProgress.findFirst({
		where: eq(fafsaProgress.studentProfileId, studentProfile.id),
	});

	const completedSteps: number[] = existing
		? (JSON.parse(existing.completedSteps) as number[])
		: [];

	if (parsed.data.completed) {
		if (!completedSteps.includes(parsed.data.step)) {
			completedSteps.push(parsed.data.step);
		}
	} else {
		const idx = completedSteps.indexOf(parsed.data.step);
		if (idx !== -1) completedSteps.splice(idx, 1);
	}

	const currentStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
	const completedStepsJson = JSON.stringify(completedSteps);

	await db
		.insert(fafsaProgress)
		.values({
			studentProfileId: studentProfile.id,
			completedSteps: completedStepsJson,
			currentStep,
		})
		.onConflictDoUpdate({
			target: fafsaProgress.studentProfileId,
			set: {
				completedSteps: completedStepsJson,
				currentStep,
				updatedAt: new Date(),
			},
		});

	return NextResponse.json({
		success: true,
		currentStep,
		completedCount: completedSteps.length,
	});
}
