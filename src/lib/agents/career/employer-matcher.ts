import type { Employer, EmployerMatch, EmployerRecruitingPref } from "@/types";

/**
 * Match employers against a student's college tiers and intended major.
 * Pure function — no DB calls, deterministic, unit-testable.
 *
 * Matching rules:
 * 1. An employer's active pref must have at least one matching college tier
 * 2. Major match is a bonus: any majorKeyword (case-insensitive) substring of studentMajor
 * 3. Sort: major-match=true first, then alphabetically by employer name
 */
export function matchEmployers(
	employersWithPrefs: (Employer & { recruitingPrefs: EmployerRecruitingPref[] })[],
	studentCollegeTiers: string[],
	studentMajor: string,
): EmployerMatch[] {
	const results: EmployerMatch[] = [];
	const majorLower = studentMajor.toLowerCase();

	for (const employer of employersWithPrefs) {
		for (const pref of employer.recruitingPrefs) {
			if (!pref.isActive) continue;

			const prefTiers: string[] = JSON.parse(pref.collegeTiers);
			const prefKeywords: string[] = JSON.parse(pref.majorKeywords);

			const matchedTiers = studentCollegeTiers.filter((t) => prefTiers.includes(t));
			if (matchedTiers.length === 0) continue;

			const matchedMajor =
				prefKeywords.length === 0 ||
				prefKeywords.some((kw) => majorLower.includes(kw.toLowerCase()));

			results.push({
				employer: {
					id: employer.id,
					name: employer.name,
					industry: employer.industry,
					description: employer.description,
					website: employer.website,
					logoUrl: employer.logoUrl,
					isVerified: employer.isVerified,
					createdAt: employer.createdAt,
					updatedAt: employer.updatedAt,
				},
				pref,
				matchedTiers,
				matchedMajor,
			});
			break;
		}
	}

	results.sort((a, b) => {
		if (a.matchedMajor && !b.matchedMajor) return -1;
		if (!a.matchedMajor && b.matchedMajor) return 1;
		return a.employer.name.localeCompare(b.employer.name);
	});

	return results;
}
