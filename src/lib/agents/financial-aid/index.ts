import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentRuns, collegeListEntries, studentProfiles } from "@/lib/db/schema";
import { buildFinancialSummary } from "./net-price";

/**
 * Run the Financial Aid Agent for a student.
 * Computes net price, 4-year cost, debt estimate, and monthly payment for every college
 * on the student's list. Results are served fresh from the /api/financial-aid route.
 * Returns a summary string on success, throws on failure.
 */
export async function runFinancialAidAgent(studentProfileId: string): Promise<string> {
	const startedAt = new Date();

	const [run] = await db
		.insert(agentRuns)
		.values({
			studentProfileId,
			agentType: "financial_aid",
			status: "running",
			startedAt,
		})
		.returning();

	try {
		const student = await db.query.studentProfiles.findFirst({
			where: eq(studentProfiles.id, studentProfileId),
		});
		if (!student) throw new Error("Student profile not found");
		if (!student.incomeBracket) {
			throw new Error(
				"Student must complete financial onboarding before running the Financial Aid Agent",
			);
		}

		// Fetch student's college list with college data
		const listEntries = await db.query.collegeListEntries.findMany({
			where: eq(collegeListEntries.studentProfileId, studentProfileId),
			with: { college: true },
		});

		if (listEntries.length === 0) {
			throw new Error("No colleges on list. Run the Discovery Agent first.");
		}

		const summaries = listEntries.map((entry) => buildFinancialSummary(entry.college, student));

		const withData = summaries.filter((s) => s.netPricePerYear !== null).length;
		const summary = `Computed financial summaries for ${listEntries.length} colleges (${withData} with net price data for your income bracket)`;

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
