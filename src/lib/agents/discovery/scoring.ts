import type { College, CollegeScore, CollegeTier, IncomeBracket, StudentProfile } from "@/types";

// Map income bracket to approximate family income midpoint (for affordability ratio)
function getBracketMidpoint(bracket: IncomeBracket): number {
	const midpoints: Record<IncomeBracket, number> = {
		"0_30k": 20000,
		"30_48k": 39000,
		"48_75k": 61000,
		"75_110k": 92000,
		"110k_plus": 140000,
	};
	return midpoints[bracket];
}

// Get net price for a student's income bracket from a cached college
export function getNetPrice(college: College, bracket: IncomeBracket): number | null {
	const map: Record<IncomeBracket, number | null> = {
		"0_30k": college.netPrice0_30k,
		"30_48k": college.netPrice30_48k,
		"48_75k": college.netPrice48_75k,
		"75_110k": college.netPrice75_110k,
		"110k_plus": college.netPrice110kPlus,
	};
	return map[bracket];
}

/**
 * Admission score (0–100): higher acceptance rate = higher score.
 * Proxy for how likely a typical student is to be admitted.
 * null admission rate returns 50 (neutral).
 */
export function scoreAdmission(college: College): number {
	if (college.admissionRate === null) return 50;
	return Math.round(college.admissionRate * 100);
}

/**
 * Net price fit score (0–100): how affordable is this school for the student's income bracket.
 * - Score 100: net price ≤ 25% of family income midpoint
 * - Score 0: net price ≥ 75% of family income midpoint
 * - Linear between those thresholds
 * - null net price returns 40 (slightly below neutral)
 */
export function scoreNetPrice(college: College, bracket: IncomeBracket): number {
	const netPrice = getNetPrice(college, bracket);
	if (netPrice === null) return 40;

	const familyIncome = getBracketMidpoint(bracket);
	const ratio = netPrice / familyIncome;

	// score = clamp(0, 100, round((1 - (ratio - 0.25) / 0.5) * 100))
	const raw = (1 - (ratio - 0.25) / 0.5) * 100;
	return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Outcome score (0–100): combination of graduation rate and median earnings.
 * - 40% weight: completion rate (0–100%)
 * - 60% weight: median earnings relative to national median (~$45k)
 * - null values default to 50 each
 */
export function scoreOutcome(college: College): number {
	const NATIONAL_MEDIAN = 45000;

	const completionScore =
		college.completionRate !== null ? Math.round(college.completionRate * 100) : 50;

	const earningsScore =
		college.medianEarnings10yr !== null
			? Math.min(100, Math.round((college.medianEarnings10yr / NATIONAL_MEDIAN) * 50))
			: 50;

	return Math.round(completionScore * 0.4 + earningsScore * 0.6);
}

/**
 * Composite weighted score: 30% admission + 40% net price + 30% outcome
 */
export function compositeScore(
	admissionScore: number,
	netPriceScore: number,
	outcomeScore: number,
): number {
	return Math.round(admissionScore * 0.3 + netPriceScore * 0.4 + outcomeScore * 0.3);
}

/**
 * Classify tier based on admission score (proxy for admission probability):
 * - Likely: score ≥ 70 (≥70% acceptance rate)
 * - Match: score 35–69
 * - Reach: score < 35 (<35% acceptance rate)
 */
export function classifyTier(admissionScore: number): CollegeTier {
	if (admissionScore >= 70) return "likely";
	if (admissionScore >= 35) return "match";
	return "reach";
}

/**
 * Score a single college for a given student profile.
 * Throws if student has no incomeBracket set.
 */
export function scoreCollegeForStudent(college: College, student: StudentProfile): CollegeScore {
	if (!student.incomeBracket) {
		throw new Error("Student must have incomeBracket set before scoring colleges");
	}

	const admission = scoreAdmission(college);
	const netPrice = scoreNetPrice(college, student.incomeBracket);
	const outcome = scoreOutcome(college);
	const composite = compositeScore(admission, netPrice, outcome);
	const tier = classifyTier(admission);

	return {
		college,
		admissionScore: admission,
		netPriceScore: netPrice,
		outcomeScore: outcome,
		compositeScore: composite,
		tier,
	};
}
