import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentRuns, collegeListEntries, colleges, studentProfiles } from "@/lib/db/schema";
import { scorecardToDbValues, searchScorecard } from "@/lib/integrations/scorecard";
import type { College, StudentProfile } from "@/types";
import { generateExplanations } from "./explanations";
import { scoreCollegeForStudent } from "./scoring";

const COLLEGES_PER_TIER = 5; // target 5 reach, 5 match, 5 likely
const EXPLANATION_BATCH_SIZE = 10; // max colleges per Claude call
const MIN_CACHE_SIZE = 30; // populate cache if fewer than this many colleges cached

/**
 * Run the College Discovery Agent for a student.
 * Returns a summary string on success, throws on failure.
 */
export async function runDiscoveryAgent(studentProfileId: string): Promise<string> {
	const startedAt = new Date();

	// Create agent run record
	const [run] = await db
		.insert(agentRuns)
		.values({
			studentProfileId,
			agentType: "discovery",
			status: "running",
			startedAt,
		})
		.returning();

	try {
		// 1. Fetch student profile
		const student = await db.query.studentProfiles.findFirst({
			where: eq(studentProfiles.id, studentProfileId),
		});
		if (!student) throw new Error("Student profile not found");
		if (!student.incomeBracket) {
			throw new Error("Student must complete onboarding before running the discovery agent");
		}

		// 2. Ensure college cache is populated
		const candidateColleges = await fetchOrPopulateColleges(student);

		if (candidateColleges.length === 0) {
			throw new Error("No colleges found. Please ensure COLLEGE_SCORECARD_API_KEY is configured.");
		}

		// 3. Score all candidates
		const scored = candidateColleges
			.map((c) => scoreCollegeForStudent(c, student))
			.sort((a, b) => b.compositeScore - a.compositeScore);

		// 4. Select top colleges per tier
		const selected = [
			...scored.filter((s) => s.tier === "reach").slice(0, COLLEGES_PER_TIER),
			...scored.filter((s) => s.tier === "match").slice(0, COLLEGES_PER_TIER),
			...scored.filter((s) => s.tier === "likely").slice(0, COLLEGES_PER_TIER),
		];

		if (selected.length === 0) {
			throw new Error("Scoring produced no results. Check college data.");
		}

		// 5. Generate explanations in batches
		const explanationMap = new Map<number, string>();
		for (let i = 0; i < selected.length; i += EXPLANATION_BATCH_SIZE) {
			const batch = selected.slice(i, i + EXPLANATION_BATCH_SIZE);
			const batchExplanations = await generateExplanations(batch, student);
			for (const [batchIdx, explanation] of batchExplanations) {
				explanationMap.set(i + batchIdx, explanation);
			}
		}

		// 6. Delete existing list entries for this student (fresh run replaces previous)
		await db
			.delete(collegeListEntries)
			.where(eq(collegeListEntries.studentProfileId, studentProfileId));

		// 7. Insert new entries
		const entries = selected.map((s, i) => ({
			studentProfileId,
			collegeId: s.college.id,
			tier: s.tier,
			admissionScore: s.admissionScore,
			netPriceScore: s.netPriceScore,
			outcomeScore: s.outcomeScore,
			compositeScore: s.compositeScore,
			explanation: explanationMap.get(i) ?? "",
			agentRunId: run.id,
		}));

		await db.insert(collegeListEntries).values(entries);

		// 8. Mark agent run as completed
		const reachCount = selected.filter((s) => s.tier === "reach").length;
		const matchCount = selected.filter((s) => s.tier === "match").length;
		const likelyCount = selected.filter((s) => s.tier === "likely").length;
		const summary = `Found ${selected.length} colleges: ${reachCount} reach, ${matchCount} match, ${likelyCount} likely`;

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

/**
 * Fetch colleges from local cache; populate from Scorecard if cache is thin.
 */
async function fetchOrPopulateColleges(student: StudentProfile): Promise<College[]> {
	// Determine search scope based on student preferences
	const useStateFilter = student.locationPreference === "in_state" && !!student.stateOfResidence;

	// Count cached colleges
	const cached = useStateFilter
		? await db.query.colleges.findMany({
				where: eq(colleges.state, student.stateOfResidence!),
			})
		: await db.query.colleges.findMany();

	if (cached.length >= MIN_CACHE_SIZE) {
		return cached;
	}

	// Populate cache from Scorecard
	const searchParams = {
		state: useStateFilter ? (student.stateOfResidence ?? undefined) : undefined,
		ownership:
			student.collegeTypePreference === "public"
				? (1 as const)
				: student.collegeTypePreference === "private"
					? (2 as const)
					: undefined,
		perPage: 100 as const,
	};

	const scorecardResults = await searchScorecard(searchParams);

	if (scorecardResults.length > 0) {
		const insertValues = scorecardResults.map(scorecardToDbValues);

		// Upsert: insert or update on scorecardId conflict
		await db
			.insert(colleges)
			.values(insertValues)
			.onConflictDoUpdate({
				target: colleges.scorecardId,
				set: {
					name: sql`excluded.name`,
					city: sql`excluded.city`,
					state: sql`excluded.state`,
					ownership: sql`excluded.ownership`,
					admissionRate: sql`excluded.admission_rate`,
					netPrice0_30k: sql`excluded.net_price_0_30k`,
					netPrice30_48k: sql`excluded.net_price_30_48k`,
					netPrice48_75k: sql`excluded.net_price_48_75k`,
					netPrice75_110k: sql`excluded.net_price_75_110k`,
					netPrice110kPlus: sql`excluded.net_price_110k_plus`,
					completionRate: sql`excluded.completion_rate`,
					medianEarnings10yr: sql`excluded.median_earnings_10yr`,
					studentSize: sql`excluded.student_size`,
					cachedAt: sql`now()`,
				},
			});
	}

	// Return freshly populated data
	return useStateFilter
		? db.query.colleges.findMany({
				where: eq(colleges.state, student.stateOfResidence!),
			})
		: db.query.colleges.findMany();
}
