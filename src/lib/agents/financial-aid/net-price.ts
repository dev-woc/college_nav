import type { College, IncomeBracket, StudentProfile } from "@/types";

const MONTHLY_RATE = 0.068 / 12; // Federal direct loan rate
const LOAN_TERM = 120; // 10 years × 12 months

// Approximate pocket capacity per income bracket (what student + family can pay per year from income)
const POCKET_CAPACITY: Record<IncomeBracket, number> = {
	"0_30k": 3_000,
	"30_48k": 5_000,
	"48_75k": 8_000,
	"75_110k": 12_000,
	"110k_plus": 18_000,
};

/**
 * Returns the net price for a given income bracket from the colleges table.
 * Net price = total cost after grants/scholarships (Scorecard data).
 * Returns null if no data available for this bracket.
 */
export function getNetPriceForBracket(college: College, bracket: IncomeBracket): number | null {
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
 * Projects 4-year net cost. Uses net price (already post-grant) × 4.
 * Returns null if net price unavailable.
 */
export function calcFourYearNetCost(netPricePerYear: number | null): number | null {
	if (netPricePerYear === null) return null;
	return Math.round(netPricePerYear * 4);
}

/**
 * Estimates total loan debt over 4 years.
 * Heuristic: student can cover pocket capacity from work/family savings.
 * Loans = max(0, netPrice - pocketCapacity) × 4 years.
 * Award letter parsing provides actuals once uploaded.
 */
export function estimateDebt(
	netPricePerYear: number | null,
	bracket: IncomeBracket,
): number | null {
	if (netPricePerYear === null) return null;
	const yearlyPocket = POCKET_CAPACITY[bracket];
	const yearlyLoan = Math.max(0, netPricePerYear - yearlyPocket);
	return Math.round(yearlyLoan * 4);
}

/**
 * Monthly loan repayment using standard amortization.
 * Assumes federal direct loan rate (6.8%) over 10 years.
 * Returns 0 for zero debt.
 */
export function calcMonthlyPayment(loanTotal: number): number {
	if (loanTotal <= 0) return 0;
	const numerator = MONTHLY_RATE * (1 + MONTHLY_RATE) ** LOAN_TERM;
	const denominator = (1 + MONTHLY_RATE) ** LOAN_TERM - 1;
	return Math.round(loanTotal * (numerator / denominator));
}

/**
 * Compute full financial aid summary for one college on a student's list.
 */
export function buildFinancialSummary(
	college: College,
	student: StudentProfile,
): {
	netPricePerYear: number | null;
	fourYearNetCost: number | null;
	totalDebtEstimate: number | null;
	monthlyPayment: number | null;
} {
	const bracket = student.incomeBracket ?? "48_75k";
	const netPricePerYear = getNetPriceForBracket(college, bracket);
	const fourYearNetCost = calcFourYearNetCost(netPricePerYear);
	const totalDebtEstimate = estimateDebt(netPricePerYear, bracket);
	const monthlyPayment = totalDebtEstimate !== null ? calcMonthlyPayment(totalDebtEstimate) : null;
	return { netPricePerYear, fourYearNetCost, totalDebtEstimate, monthlyPayment };
}
