export const dynamic = "force-dynamic";

import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { applicationTasks, studentProfiles, userProfiles } from "@/lib/db/schema";

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

	const tasks = await db.query.applicationTasks.findMany({
		where: eq(applicationTasks.studentProfileId, studentProfile.id),
		orderBy: [asc(applicationTasks.deadlineDate)],
	});

	const completed = tasks.filter((t) => t.status === "completed");
	const conflicts = tasks.filter((t) => t.isConflict);
	const pending = tasks.filter((t) => t.status !== "completed" && t.status !== "skipped");
	const nextDeadline = pending.find((t) => t.deadlineDate !== null)?.deadlineDate ?? null;

	return NextResponse.json({
		tasks,
		conflicts,
		totalTasks: tasks.length,
		completedTasks: completed.length,
		nextDeadline,
	});
}
