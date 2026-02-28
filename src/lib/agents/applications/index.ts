import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentRuns, applicationTasks, collegeListEntries, studentProfiles } from "@/lib/db/schema";
import { buildTasksForCollegeList, detectConflicts } from "./task-builder";

export async function runApplicationAgent(studentProfileId: string): Promise<string> {
	const startedAt = new Date();

	const [run] = await db
		.insert(agentRuns)
		.values({
			studentProfileId,
			agentType: "application_management",
			status: "running",
			startedAt,
		})
		.returning();

	try {
		const student = await db.query.studentProfiles.findFirst({
			where: eq(studentProfiles.id, studentProfileId),
		});
		if (!student) throw new Error("Student profile not found");

		const listEntries = await db.query.collegeListEntries.findMany({
			where: eq(collegeListEntries.studentProfileId, studentProfileId),
			with: { college: true },
		});

		if (listEntries.length === 0) {
			throw new Error("No colleges on list. Run the Discovery Agent first.");
		}

		const rawTasks = buildTasksForCollegeList(listEntries, studentProfileId);
		const tasksWithConflicts = detectConflicts(rawTasks);

		await db
			.delete(applicationTasks)
			.where(eq(applicationTasks.studentProfileId, studentProfileId));
		await db
			.insert(applicationTasks)
			.values(tasksWithConflicts.map((t) => ({ ...t, agentRunId: run.id })));

		const conflictCount = tasksWithConflicts.filter((t) => t.isConflict).length;
		const summary = `Created ${tasksWithConflicts.length} application tasks for ${listEntries.length} colleges${conflictCount > 0 ? ` (${conflictCount} deadline conflicts detected)` : ""}`;

		await db
			.update(agentRuns)
			.set({
				status: "completed",
				summary,
				durationMs: Date.now() - startedAt.getTime(),
				completedAt: new Date(),
			})
			.where(eq(agentRuns.id, run.id));

		return summary;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

		await db
			.update(agentRuns)
			.set({
				status: "failed",
				errorMessage,
				durationMs: Date.now() - startedAt.getTime(),
				completedAt: new Date(),
			})
			.where(eq(agentRuns.id, run.id));

		throw error;
	}
}
