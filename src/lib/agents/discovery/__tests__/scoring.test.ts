import { describe, expect, it } from "vitest";
import type { College } from "@/types";
import {
	classifyTier,
	compositeScore,
	getNetPrice,
	scoreAdmission,
	scoreCollegeForStudent,
	scoreNetPrice,
	scoreOutcome,
} from "../scoring";

const mockCollege: College = {
	id: "test-uuid-1",
	scorecardId: 196097,
	name: "Test University",
	city: "Phoenix",
	state: "AZ",
	ownership: 1,
	admissionRate: 0.6,
	netPrice0_30k: 8000,
	netPrice30_48k: 12000,
	netPrice48_75k: 18000,
	netPrice75_110k: 24000,
	netPrice110kPlus: 35000,
	completionRate: 0.62,
	medianEarnings10yr: 48000,
	studentSize: 15000,
	cachedAt: new Date(),
};

const mockStudent = {
	id: "student-uuid-1",
	userProfileId: "profile-uuid-1",
	gradeLevel: 11,
	gpa: 3.5,
	satScore: null,
	actScore: null,
	stateOfResidence: "AZ",
	incomeBracket: "0_30k" as const,
	isFirstGen: true,
	intendedMajor: "Computer Science",
	collegeTypePreference: "public",
	locationPreference: "in_state",
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("getNetPrice", () => {
	it("returns the correct net price for each bracket", () => {
		expect(getNetPrice(mockCollege, "0_30k")).toBe(8000);
		expect(getNetPrice(mockCollege, "30_48k")).toBe(12000);
		expect(getNetPrice(mockCollege, "48_75k")).toBe(18000);
		expect(getNetPrice(mockCollege, "75_110k")).toBe(24000);
		expect(getNetPrice(mockCollege, "110k_plus")).toBe(35000);
	});

	it("returns null for missing net price data", () => {
		const nullCollege = { ...mockCollege, netPrice0_30k: null };
		expect(getNetPrice(nullCollege, "0_30k")).toBeNull();
	});
});

describe("scoreAdmission", () => {
	it("returns 60 for 60% admission rate", () => {
		expect(scoreAdmission(mockCollege)).toBe(60);
	});

	it("returns 100 for 100% admission rate", () => {
		expect(scoreAdmission({ ...mockCollege, admissionRate: 1.0 })).toBe(100);
	});

	it("returns 0 for 0% admission rate (hypothetical)", () => {
		expect(scoreAdmission({ ...mockCollege, admissionRate: 0.0 })).toBe(0);
	});

	it("returns 50 for null admission rate", () => {
		expect(scoreAdmission({ ...mockCollege, admissionRate: null })).toBe(50);
	});
});

describe("scoreNetPrice", () => {
	it("returns a high score when net price is well within affordable range", () => {
		// $8k net price with $20k family income = 40% of income → slightly below affordable threshold
		const score = scoreNetPrice(mockCollege, "0_30k");
		expect(score).toBeGreaterThan(50);
		expect(score).toBeLessThanOrEqual(100);
	});

	it("returns 40 for null net price", () => {
		const nullCollege = { ...mockCollege, netPrice0_30k: null };
		expect(scoreNetPrice(nullCollege, "0_30k")).toBe(40);
	});

	it("gives higher score for same net price with higher income bracket", () => {
		// Same $8k net price looks more affordable to higher-income families
		// (But mock has different net prices per bracket — test with same price)
		const samePrice = { ...mockCollege, netPrice0_30k: 8000, netPrice110kPlus: 8000 };
		const scoreLoIncome = scoreNetPrice(samePrice, "0_30k"); // $8k of $20k = 40% → score ~70
		const scoreHiIncome = scoreNetPrice(samePrice, "110k_plus"); // $8k of $140k = 5.7% → score 100
		expect(scoreHiIncome).toBeGreaterThan(scoreLoIncome);
	});

	it("returns 0 when net price far exceeds income", () => {
		// $50k net price on $20k income = 250% of income → score well below 0, clamped to 0
		const expensiveCollege = { ...mockCollege, netPrice0_30k: 50000 };
		expect(scoreNetPrice(expensiveCollege, "0_30k")).toBe(0);
	});
});

describe("scoreOutcome", () => {
	it("returns a value between 0 and 100", () => {
		const score = scoreOutcome(mockCollege);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});

	it("returns higher score for higher earnings", () => {
		const highEarnings = { ...mockCollege, medianEarnings10yr: 90000 };
		const lowEarnings = { ...mockCollege, medianEarnings10yr: 20000 };
		expect(scoreOutcome(highEarnings)).toBeGreaterThan(scoreOutcome(lowEarnings));
	});

	it("returns 50 for null completion rate and null earnings", () => {
		const nullCollege = { ...mockCollege, completionRate: null, medianEarnings10yr: null };
		expect(scoreOutcome(nullCollege)).toBe(50);
	});
});

describe("compositeScore", () => {
	it("weights correctly: 30% admission + 40% netPrice + 30% outcome", () => {
		// 100 + 100 + 100 = 100
		expect(compositeScore(100, 100, 100)).toBe(100);
		// 0 + 0 + 0 = 0
		expect(compositeScore(0, 0, 0)).toBe(0);
		// Only admission matters (others 0): 30 * 0.3 = 9 → but verify weighting
		expect(compositeScore(100, 0, 0)).toBe(30);
		expect(compositeScore(0, 100, 0)).toBe(40);
		expect(compositeScore(0, 0, 100)).toBe(30);
	});
});

describe("classifyTier", () => {
	it("returns 'likely' for score >= 70", () => {
		expect(classifyTier(70)).toBe("likely");
		expect(classifyTier(100)).toBe("likely");
		expect(classifyTier(75)).toBe("likely");
	});

	it("returns 'match' for score 35-69", () => {
		expect(classifyTier(35)).toBe("match");
		expect(classifyTier(50)).toBe("match");
		expect(classifyTier(69)).toBe("match");
	});

	it("returns 'reach' for score < 35", () => {
		expect(classifyTier(0)).toBe("reach");
		expect(classifyTier(20)).toBe("reach");
		expect(classifyTier(34)).toBe("reach");
	});
});

describe("scoreCollegeForStudent", () => {
	it("returns all four score fields and tier", () => {
		const result = scoreCollegeForStudent(mockCollege, mockStudent);
		expect(result.admissionScore).toBeDefined();
		expect(result.netPriceScore).toBeDefined();
		expect(result.outcomeScore).toBeDefined();
		expect(result.compositeScore).toBeDefined();
		expect(["reach", "match", "likely"]).toContain(result.tier);
	});

	it("classifies 60% acceptance rate college as match tier", () => {
		// 60% acceptance = admissionScore 60 → "match" (35-69)
		const result = scoreCollegeForStudent(mockCollege, mockStudent);
		expect(result.tier).toBe("match");
		expect(result.admissionScore).toBe(60);
	});

	it("throws when student has no incomeBracket", () => {
		const noIncomeBracketStudent = { ...mockStudent, incomeBracket: null };
		expect(() => scoreCollegeForStudent(mockCollege, noIncomeBracketStudent as never)).toThrow();
	});
});
