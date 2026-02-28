export const dynamic = "force-dynamic";

import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { applicationTasks, studentProfiles, userProfiles } from "@/lib/db/schema";

const updateSchema = z.object({
	status: z.enum(["pending", "in_progress", "completed", "skipped"]),
});

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ taskId: string }> },
) {
	const { taskId } = await params;

	const { data } = await auth.getSession();
	const user = data?.user ?? null;
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const parsed = updateSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid status" }, { status: 400 });
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

	const task = await db.query.applicationTasks.findFirst({
		where: and(
			eq(applicationTasks.id, taskId),
			eq(applicationTasks.studentProfileId, studentProfile.id),
		),
	});
	if (!task) {
		return NextResponse.json({ error: "Task not found" }, { status: 404 });
	}

	await db
		.update(applicationTasks)
		.set({
			status: parsed.data.status,
			completedAt: parsed.data.status === "completed" ? new Date() : null,
			updatedAt: new Date(),
		})
		.where(eq(applicationTasks.id, taskId));

	return NextResponse.json({ success: true });
}
