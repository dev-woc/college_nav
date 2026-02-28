import { describe, expect, it } from "vitest";
import type { College } from "@/types";
import {
	calcFourYearNetCost,
	calcMonthlyPayment,
	estimateDebt,
	getNetPriceForBracket,
} from "../net-price";

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
	costOfAttendance: 32000,
	tuitionInState: 11000,
	tuitionOutOfState: 28000,
	cachedAt: new Date(),
};

describe("getNetPriceForBracket", () => {
	it("returns the correct net price for each bracket", () => {
		expect(getNetPriceForBracket(mockCollege, "0_30k")).toBe(8000);
		expect(getNetPriceForBracket(mockCollege, "30_48k")).toBe(12000);
		expect(getNetPriceForBracket(mockCollege, "48_75k")).toBe(18000);
		expect(getNetPriceForBracket(mockCollege, "75_110k")).toBe(24000);
		expect(getNetPriceForBracket(mockCollege, "110k_plus")).toBe(35000);
	});

	it("returns null for missing net price data", () => {
		const nullCollege = { ...mockCollege, netPrice0_30k: null };
		expect(getNetPriceForBracket(nullCollege, "0_30k")).toBeNull();
	});
});

describe("calcFourYearNetCost", () => {
	it("returns null for null input", () => {
		expect(calcFourYearNetCost(null)).toBeNull();
	});

	it("multiplies by 4", () => {
		expect(calcFourYearNetCost(15_000)).toBe(60_000);
	});

	it("rounds to integer", () => {
		expect(calcFourYearNetCost(10_001)).toBe(40_004);
	});
});

describe("estimateDebt", () => {
	it("returns null for null net price", () => {
		expect(estimateDebt(null, "0_30k")).toBeNull();
	});

	it("returns 0 when net price is within pocket capacity", () => {
		// pocket for 0_30k = $3,000, net price = $2,000 → no loans
		expect(estimateDebt(2_000, "0_30k")).toBe(0);
	});

	it("calculates 4-year loans for 0_30k bracket at $15k/yr", () => {
		// 15k - 3k = 12k/yr × 4 = $48k
		expect(estimateDebt(15_000, "0_30k")).toBe(48_000);
	});

	it("uses higher pocket capacity for higher income brackets", () => {
		// Same net price $15k: 110k_plus pocket = $18k → 0 debt
		expect(estimateDebt(15_000, "110k_plus")).toBe(0);
	});
});

describe("calcMonthlyPayment", () => {
	it("returns 0 for zero debt", () => {
		expect(calcMonthlyPayment(0)).toBe(0);
	});

	it("returns 0 for negative debt", () => {
		expect(calcMonthlyPayment(-100)).toBe(0);
	});

	it("returns ~$345-355 for $30k at 6.8% over 10 years", () => {
		const payment = calcMonthlyPayment(30_000);
		expect(payment).toBeGreaterThan(340);
		expect(payment).toBeLessThan(360);
	});

	it("is proportional to principal", () => {
		const p1 = calcMonthlyPayment(20_000);
		const p2 = calcMonthlyPayment(40_000);
		expect(p2).toBeCloseTo(p1 * 2, 0);
	});
});
