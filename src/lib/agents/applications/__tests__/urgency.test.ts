import { describe, expect, it } from "vitest";
import { computeUrgencyScore } from "../urgency";

const completeInput = {
	hasCollegeList: true,
	hasFinancialAidRun: true,
	hasScholarshipMatches: true,
	fafsaCurrentStep: 12,
	pendingTasks: [],
	gradeLevel: 12,
};

describe("computeUrgencyScore", () => {
	it("returns 0 for fully on-track student (FAFSA not open)", () => {
		// Note: if FAFSA IS open and fafsa=12, still 0
		expect(computeUrgencyScore(completeInput)).toBe(0);
	});

	it("adds 15 for no college list", () => {
		const score = computeUrgencyScore({
			...completeInput,
			hasCollegeList: false,
		});
		expect(score).toBeGreaterThanOrEqual(15);
	});

	it("adds 10 for no scholarship matches", () => {
		const score = computeUrgencyScore({
			...completeInput,
			hasScholarshipMatches: false,
		});
		expect(score).toBeGreaterThanOrEqual(10);
	});

	it("caps at 100", () => {
		const worst = {
			hasCollegeList: false,
			hasFinancialAidRun: false,
			hasScholarshipMatches: false,
			fafsaCurrentStep: 0,
			gradeLevel: 12,
			pendingTasks: [{ deadlineDate: new Date(Date.now() + 86400000) }],
		};
		expect(computeUrgencyScore(worst)).toBeLessThanOrEqual(100);
	});

	it("adds urgency for imminent deadline", () => {
		const tomorrow = new Date(Date.now() + 86400000);
		const score = computeUrgencyScore({
			...completeInput,
			pendingTasks: [{ deadlineDate: tomorrow }],
		});
		expect(score).toBeGreaterThan(30);
	});
});
