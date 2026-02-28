import { describe, expect, it } from "vitest";
import type { Scholarship, StudentProfile } from "@/types";
import { calcDaysUntilDeadline, matchScholarships, scoreScholarship } from "../matching";

const baseStudent: StudentProfile = {
	id: "s1",
	userProfileId: "u1",
	gpa: 3.5,
	gradeLevel: 12,
	stateOfResidence: "CA",
	incomeBracket: "30_48k",
	isFirstGen: true,
	intendedMajor: "Computer Science",
	satScore: null,
	actScore: null,
	collegeTypePreference: "either",
	locationPreference: "anywhere",
	createdAt: new Date(),
	updatedAt: new Date(),
};

const baseScholarship: Scholarship = {
	id: "sc1",
	name: "Test Scholarship",
	description: "",
	amount: null,
	amountMin: null,
	amountMax: null,
	deadlineText: "",
	deadlineMonth: null,
	deadlineDay: null,
	minGpa: null,
	requiresFirstGen: false,
	requiresEssay: false,
	eligibleStates: null,
	eligibleMajors: null,
	demographicTags: null,
	applicationUrl: "",
	renewable: false,
	source: "curated",
	isActive: true,
	createdAt: new Date(),
};

describe("scoreScholarship — hard disqualifiers", () => {
	it("returns null when requiresFirstGen=true and student is not first-gen", () => {
		const s = { ...baseScholarship, requiresFirstGen: true };
		const st = { ...baseStudent, isFirstGen: false };
		expect(scoreScholarship(s, st)).toBeNull();
	});

	it("returns null when student GPA is below minimum", () => {
		const s = { ...baseScholarship, minGpa: 3.8 };
		const st = { ...baseStudent, gpa: 3.5 };
		expect(scoreScholarship(s, st)).toBeNull();
	});

	it("returns null for state-restricted scholarship when student not in state", () => {
		const s = { ...baseScholarship, eligibleStates: JSON.stringify(["TX", "OH"]) };
		expect(scoreScholarship(s, baseStudent)).toBeNull(); // student is CA
	});

	it("returns null for inactive scholarships via matchScholarships filter", () => {
		const inactive = { ...baseScholarship, isActive: false };
		expect(matchScholarships([inactive], baseStudent)).toHaveLength(0);
	});
});

describe("scoreScholarship — positive scoring", () => {
	it("awards first-gen bonus and reason when student is first-gen", () => {
		const s = { ...baseScholarship, requiresFirstGen: true };
		const result = scoreScholarship(s, baseStudent)!;
		expect(result).not.toBeNull();
		expect(result.score).toBeGreaterThanOrEqual(30);
		expect(result.reasons.some((r) => r.includes("first-generation"))).toBe(true);
	});

	it("awards state bonus for state-matched scholarship", () => {
		const s = { ...baseScholarship, eligibleStates: JSON.stringify(["CA", "NY"]) };
		const result = scoreScholarship(s, baseStudent)!;
		expect(result).not.toBeNull();
		expect(result.reasons.some((r) => r.includes("CA"))).toBe(true);
	});

	it("awards major match bonus", () => {
		const s = {
			...baseScholarship,
			eligibleMajors: JSON.stringify(["Computer Science", "Engineering"]),
		};
		const result = scoreScholarship(s, baseStudent)!;
		expect(result).not.toBeNull();
		expect(result.reasons.some((r) => r.includes("major"))).toBe(true);
	});

	it("awards low-income bonus for 0_30k bracket", () => {
		const s = {
			...baseScholarship,
			demographicTags: JSON.stringify(["low_income"]),
		};
		const st = { ...baseStudent, incomeBracket: "0_30k" as const };
		const result = scoreScholarship(s, st)!;
		expect(result).not.toBeNull();
		expect(result.reasons.some((r) => r.includes("low-income"))).toBe(true);
	});

	it("does not exceed 100", () => {
		const s = {
			...baseScholarship,
			requiresFirstGen: true,
			minGpa: 2.0,
			demographicTags: JSON.stringify(["low_income"]),
		};
		const st = { ...baseStudent, incomeBracket: "0_30k" as const };
		const result = scoreScholarship(s, st)!;
		expect(result.score).toBeLessThanOrEqual(100);
	});
});

describe("matchScholarships", () => {
	it("returns empty array when all scholarships are inactive", () => {
		const s = { ...baseScholarship, isActive: false };
		expect(matchScholarships([s], baseStudent)).toHaveLength(0);
	});

	it("sorts results by score descending", () => {
		const s1 = { ...baseScholarship, id: "a", requiresFirstGen: true }; // higher score
		const s2 = { ...baseScholarship, id: "b" }; // lower score
		const results = matchScholarships([s2, s1], baseStudent);
		expect(results.length).toBeGreaterThanOrEqual(1);
		// First-gen scholarship should score higher for first-gen student
		if (results.length >= 2) {
			expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
		}
	});

	it("filters out disqualified scholarships", () => {
		const wrongState = {
			...baseScholarship,
			id: "ws",
			eligibleStates: JSON.stringify(["TX"]),
		};
		const match = { ...baseScholarship, id: "ok" };
		const results = matchScholarships([wrongState, match], baseStudent);
		expect(results.find((r) => r.scholarship.id === "ws")).toBeUndefined();
		expect(results.find((r) => r.scholarship.id === "ok")).toBeDefined();
	});
});

describe("calcDaysUntilDeadline", () => {
	it("returns null for rolling deadline (null month)", () => {
		expect(calcDaysUntilDeadline(null, null)).toBeNull();
	});

	it("returns a positive number for a future deadline", () => {
		// Use a month far in the future to guarantee it's positive
		const farFuture = new Date();
		farFuture.setMonth(farFuture.getMonth() + 3);
		const days = calcDaysUntilDeadline(farFuture.getMonth() + 1, 15);
		expect(days).toBeGreaterThan(0);
	});

	it("wraps to next year when deadline has passed", () => {
		// January 1 — if we're past Jan 1, it should return ~365 days
		const days = calcDaysUntilDeadline(1, 1);
		expect(days).toBeGreaterThan(0);
		expect(days).toBeLessThanOrEqual(366);
	});
});
