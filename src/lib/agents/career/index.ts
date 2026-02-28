import { eq } from "drizzle-orm";
import { findPathwayForMajor } from "@/lib/career/pathways";
import { db } from "@/lib/db";
import { agentRuns, careerSnapshots, studentProfiles } from "@/lib/db/schema";
import { fetchOccupationWages } from "@/lib/integrations/bls";

/**
 * Run the Career Agent for a student.
 * Fetches career pathway + BLS wage data for up to 3 careers,
 * upserts a career_snapshots record, and logs the run.
 * Returns a summary string on success, throws on failure.
 */
export async function runCareerAgent(studentProfileId: string): Promise<string> {
	const startedAt = new Date();

	const [run] = await db
		.insert(agentRuns)
		.values({
			studentProfileId,
			agentType: "career",
			status: "running",
			startedAt,
		})
		.returning();

	try {
		const student = await db.query.studentProfiles.findFirst({
			where: eq(studentProfiles.id, studentProfileId),
		});
		if (!student) throw new Error("Student profile not found");
		if (!student.intendedMajor) {
			throw new Error("Student must set an intended major before running the Career Agent");
		}

		const major = student.intendedMajor;
		const pathway = findPathwayForMajor(major);

		const wageData: Record<
			string,
			{
				medianAnnualWage: number | null;
				entryLevelWage: number | null;
				employmentCount: number | null;
			}
		> = {};

		if (pathway) {
			const careersToFetch = pathway.careers.slice(0, 3);
			const wageResults = await Promise.allSettled(
				careersToFetch.map((career) => fetchOccupationWages(career.blsOccupationCode)),
			);
			for (let i = 0; i < careersToFetch.length; i++) {
				const result = wageResults[i];
				wageData[careersToFetch[i].blsOccupationCode] =
					result.status === "fulfilled"
						? result.value
						: { medianAnnualWage: null, entryLevelWage: null, employmentCount: null };
			}
		}

		await db
			.insert(careerSnapshots)
			.values({
				studentProfileId,
				major,
				pathwayJson: JSON.stringify(pathway),
				wageDataJson: JSON.stringify(wageData),
				lastRefreshedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: careerSnapshots.studentProfileId,
				set: {
					major,
					pathwayJson: JSON.stringify(pathway),
					wageDataJson: JSON.stringify(wageData),
					lastRefreshedAt: new Date(),
					updatedAt: new Date(),
				},
			});

		const careerCount = pathway ? pathway.careers.length : 0;
		const summary = `Career snapshot updated for major: ${major} — ${careerCount} career options, ${Object.keys(wageData).length} wage datasets cached`;

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
