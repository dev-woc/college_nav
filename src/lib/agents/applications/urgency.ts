export interface UrgencyInput {
	hasCollegeList: boolean;
	hasFinancialAidRun: boolean;
	hasScholarshipMatches: boolean;
	fafsaCurrentStep: number;
	pendingTasks: Array<{ deadlineDate: Date | string | null }>;
	gradeLevel: number | null;
}

function daysUntil(date: Date | string): number {
	const target = new Date(date);
	const today = new Date();
	return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isFafsaOpen(): boolean {
	const today = new Date();
	// FAFSA opens October 1
	return today.getMonth() >= 9;
}

export function computeUrgencyScore(input: UrgencyInput): number {
	let score = 0;

	if (!input.hasCollegeList) score += 15;
	if (!input.hasScholarshipMatches) score += 10;

	if (isFafsaOpen()) {
		if (input.fafsaCurrentStep === 0) score += 30;
		else if (input.fafsaCurrentStep < 12) score += 10;
	}

	const pendingWithDates = input.pendingTasks
		.filter((t) => t.deadlineDate !== null)
		.map((t) => daysUntil(t.deadlineDate as Date | string));

	if (pendingWithDates.length > 0) {
		const earliest = Math.min(...pendingWithDates);
		if (earliest <= 3) score += 40;
		else if (earliest <= 7) score += 30;
		else if (earliest <= 14) score += 20;
		else if (earliest <= 30) score += 10;
	}

	return Math.min(100, score);
}

export function buildFlaggedReason(input: UrgencyInput): string {
	const parts: string[] = [];

	if (!input.hasCollegeList) parts.push("No college list");
	if (isFafsaOpen() && input.fafsaCurrentStep === 0) parts.push("FAFSA not started");
	if (!input.hasScholarshipMatches) parts.push("Scholarships not matched");

	const pendingWithDates = input.pendingTasks
		.filter((t) => t.deadlineDate !== null)
		.map((t) => ({ days: daysUntil(t.deadlineDate as Date | string) }))
		.filter((t) => t.days <= 30);

	if (pendingWithDates.length > 0) {
		const earliest = Math.min(...pendingWithDates.map((t) => t.days));
		parts.push(`Application deadline in ${earliest} day${earliest === 1 ? "" : "s"}`);
	}

	return parts.join(", ") || "On track";
}
