import type { Scholarship, StudentProfile } from "@/types";

export interface MatchResult {
	scholarship: Scholarship;
	score: number; // 0-100
	reasons: string[];
}

/**
 * Score a single scholarship against a student profile.
 * Returns null if the student is hard-disqualified (wrong state, GPA below min, wrong demographic).
 */
export function scoreScholarship(
	scholarship: Scholarship,
	student: StudentProfile,
): MatchResult | null {
	const reasons: string[] = [];
	let score = 0;

	// ── Hard disqualifiers — return null immediately ──────────────────
	if (scholarship.requiresFirstGen && !student.isFirstGen) return null;

	if (scholarship.minGpa !== null && student.gpa !== null && student.gpa < scholarship.minGpa) {
		return null;
	}

	// State restriction: if scholarship is state-specific and student not in that state
	if (scholarship.eligibleStates) {
		const states = JSON.parse(scholarship.eligibleStates) as string[];
		if (student.stateOfResidence && !states.includes(student.stateOfResidence)) {
			return null;
		}
		if (student.stateOfResidence && states.includes(student.stateOfResidence)) {
			score += 15;
			reasons.push(`eligible in ${student.stateOfResidence}`);
		}
	} else {
		// National scholarship — accessible from anywhere
		score += 10;
		reasons.push("nationally available");
	}

	// ── Positive scoring ──────────────────────────────────────────────

	// First-gen bonus
	if (scholarship.requiresFirstGen && student.isFirstGen) {
		score += 30;
		reasons.push("first-generation student");
	} else if (!scholarship.requiresFirstGen && student.isFirstGen) {
		score += 5; // mild bonus: more scholarships apply to them
	}

	// GPA match
	if (scholarship.minGpa !== null && student.gpa !== null && student.gpa >= scholarship.minGpa) {
		const excess = student.gpa - scholarship.minGpa;
		const gpaBonus = Math.min(15, Math.round(excess * 7));
		score += gpaBonus;
		reasons.push(`GPA ${student.gpa.toFixed(1)} meets minimum ${scholarship.minGpa}`);
	} else if (scholarship.minGpa === null) {
		score += 10; // no GPA requirement = accessible
	}

	// Major match
	if (scholarship.eligibleMajors && student.intendedMajor) {
		const majors = JSON.parse(scholarship.eligibleMajors) as string[];
		const studentMajorLower = student.intendedMajor.toLowerCase();
		const matchedMajor = majors.find(
			(m) =>
				studentMajorLower.includes(m.toLowerCase()) || m.toLowerCase().includes(studentMajorLower),
		);
		if (matchedMajor) {
			score += 20;
			reasons.push(`matches your major: ${student.intendedMajor}`);
		} else {
			// Major-restricted scholarship that doesn't match → reduce score but don't disqualify
			score -= 10;
		}
	} else if (!scholarship.eligibleMajors) {
		score += 5; // no major restriction = accessible
	}

	// Demographic tags
	if (scholarship.demographicTags) {
		const tags = JSON.parse(scholarship.demographicTags) as string[];

		if (tags.includes("low_income") && ["0_30k", "30_48k"].includes(student.incomeBracket ?? "")) {
			score += 15;
			reasons.push("low-income eligible");
		}

		if (tags.includes("transfer_student")) {
			// neutral — can't determine from profile, don't add/subtract
		}
	}

	// No-essay bonus: slight accessibility boost
	if (!scholarship.requiresEssay) {
		score += 5;
		reasons.push("no essay required");
	}

	// Minimum relevance threshold
	if (score < 15) return null;

	return { scholarship, score: Math.min(100, Math.max(0, score)), reasons };
}

/**
 * Match all scholarships against a student profile.
 * Filters inactive, applies hard disqualifiers, sorts by score descending.
 */
export function matchScholarships(
	scholarships: Scholarship[],
	student: StudentProfile,
): MatchResult[] {
	return scholarships
		.filter((s) => s.isActive)
		.map((s) => scoreScholarship(s, student))
		.filter((r): r is MatchResult => r !== null)
		.sort((a, b) => b.score - a.score);
}

/**
 * Calculate days until a scholarship deadline.
 * Returns null for rolling deadlines (deadlineMonth is null).
 * Handles year rollover (if deadline has passed this year, use next year).
 */
export function calcDaysUntilDeadline(
	deadlineMonth: number | null,
	deadlineDay: number | null,
): number | null {
	if (deadlineMonth === null || deadlineDay === null) return null;

	const now = new Date();
	const thisYear = now.getFullYear();

	// Try this year's deadline
	let deadline = new Date(thisYear, deadlineMonth - 1, deadlineDay);
	if (deadline < now) {
		// Deadline passed — use next year
		deadline = new Date(thisYear + 1, deadlineMonth - 1, deadlineDay);
	}

	const diffMs = deadline.getTime() - now.getTime();
	return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
