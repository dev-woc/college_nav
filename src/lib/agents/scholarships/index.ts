import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentRuns, scholarships, studentProfiles, studentScholarships } from "@/lib/db/schema";
import { matchScholarships } from "./matching";

const MAX_MATCHES = 20; // persist top 20 matches per student

/**
 * Run the Scholarship Matching Agent for a student.
 * Matches all active scholarships against the student's profile and persists results.
 * Returns a summary string on success, throws on failure.
 */
export async function runScholarshipAgent(studentProfileId: string): Promise<string> {
	const startedAt = new Date();

	const [run] = await db
		.insert(agentRuns)
		.values({
			studentProfileId,
			agentType: "scholarships",
			status: "running",
			startedAt,
		})
		.returning();

	try {
		const student = await db.query.studentProfiles.findFirst({
			where: eq(studentProfiles.id, studentProfileId),
		});
		if (!student) throw new Error("Student profile not found");

		// Fetch all active scholarships
		const allScholarships = await db.query.scholarships.findMany({
			where: eq(scholarships.isActive, true),
		});

		if (allScholarships.length === 0) {
			throw new Error(
				"No scholarships in database. Seed the scholarship database first via POST /api/scholarships/seed",
			);
		}

		// Run matching algorithm
		const matches = matchScholarships(allScholarships, student);
		const topMatches = matches.slice(0, MAX_MATCHES);

		// Delete existing matches for this student (fresh run replaces previous)
		await db
			.delete(studentScholarships)
			.where(eq(studentScholarships.studentProfileId, studentProfileId));

		// Insert new matches
		if (topMatches.length > 0) {
			await db.insert(studentScholarships).values(
				topMatches.map((m) => ({
					studentProfileId,
					scholarshipId: m.scholarship.id,
					matchScore: m.score,
					matchReasons: JSON.stringify(m.reasons),
					status: "matched" as const,
					agentRunId: run.id,
				})),
			);
		}

		const summary = `Matched ${topMatches.length} scholarships from ${allScholarships.length} evaluated`;

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
