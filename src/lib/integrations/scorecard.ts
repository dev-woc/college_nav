import type { ScorecardCollege } from "@/types";

const SCORECARD_BASE = "https://api.data.gov/ed/collegescorecard/v1/schools";

// Fields we fetch from the College Scorecard API
const FIELDS = [
	"id",
	"school.name",
	"school.city",
	"school.state",
	"school.ownership",
	"latest.student.size",
	"latest.admissions.admission_rate.overall",
	// Net price by income — public institutions
	"latest.cost.net_price.public.by_income_level.0-30000",
	"latest.cost.net_price.public.by_income_level.30001-48000",
	"latest.cost.net_price.public.by_income_level.48001-75000",
	"latest.cost.net_price.public.by_income_level.75001-110000",
	"latest.cost.net_price.public.by_income_level.110001-plus",
	// Net price by income — private institutions
	"latest.cost.net_price.private.by_income_level.0-30000",
	"latest.cost.net_price.private.by_income_level.30001-48000",
	"latest.cost.net_price.private.by_income_level.48001-75000",
	"latest.cost.net_price.private.by_income_level.75001-110000",
	"latest.cost.net_price.private.by_income_level.110001-plus",
	// Completion and earnings
	"latest.completion.completion_rate_4yr_150nt",
	"latest.completion.completion_rate_less_than_4yr_150nt",
	"latest.earnings.10_yrs_after_entry.median",
	// Cost of attendance and tuition breakdown
	"latest.cost.attendance.academic_year",
	"latest.cost.tuition.in_state",
	"latest.cost.tuition.out_of_state",
].join(",");

export interface ScorecardSearchParams {
	state?: string; // 2-letter state code
	ownership?: 1 | 2 | 3; // 1=public, 2=private nonprofit, 3=for-profit
	perPage?: number; // default 100, max 100
	page?: number;
}

export async function searchScorecard(params: ScorecardSearchParams): Promise<ScorecardCollege[]> {
	const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
	if (!apiKey) {
		console.warn("COLLEGE_SCORECARD_API_KEY not set — skipping Scorecard fetch");
		return [];
	}

	const url = new URL(SCORECARD_BASE);
	url.searchParams.set("api_key", apiKey);
	url.searchParams.set("fields", FIELDS);
	url.searchParams.set("per_page", String(params.perPage ?? 100));
	url.searchParams.set("page", String(params.page ?? 0));

	// Only include degree-granting institutions (predominant degree 2=associate, 3=bachelor, 4=graduate)
	url.searchParams.set("school.degrees_awarded.predominant__range", "2..4");

	if (params.state) {
		url.searchParams.set("school.state", params.state);
	}
	if (params.ownership) {
		url.searchParams.set("school.ownership", String(params.ownership));
	}

	const res = await fetch(url.toString(), {
		headers: { Accept: "application/json" },
		next: { revalidate: 86400 }, // cache for 24h in Next.js
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Scorecard API error ${res.status}: ${text.slice(0, 200)}`);
	}

	const json = (await res.json()) as {
		results: ScorecardCollege[];
		metadata: { total: number };
	};
	return json.results ?? [];
}

// Convert a ScorecardCollege to the shape expected by db.insert(colleges).values(...)
export function scorecardToDbValues(sc: ScorecardCollege) {
	const isPublic = sc["school.ownership"] === 1;

	return {
		scorecardId: sc.id,
		name: sc["school.name"] ?? "",
		city: sc["school.city"] ?? "",
		state: sc["school.state"] ?? "",
		ownership: sc["school.ownership"] ?? null,
		admissionRate: sc["latest.admissions.admission_rate.overall"] ?? null,
		netPrice0_30k: isPublic
			? (sc["latest.cost.net_price.public.by_income_level.0-30000"] ?? null)
			: (sc["latest.cost.net_price.private.by_income_level.0-30000"] ?? null),
		netPrice30_48k: isPublic
			? (sc["latest.cost.net_price.public.by_income_level.30001-48000"] ?? null)
			: (sc["latest.cost.net_price.private.by_income_level.30001-48000"] ?? null),
		netPrice48_75k: isPublic
			? (sc["latest.cost.net_price.public.by_income_level.48001-75000"] ?? null)
			: (sc["latest.cost.net_price.private.by_income_level.48001-75000"] ?? null),
		netPrice75_110k: isPublic
			? (sc["latest.cost.net_price.public.by_income_level.75001-110000"] ?? null)
			: (sc["latest.cost.net_price.private.by_income_level.75001-110000"] ?? null),
		netPrice110kPlus: isPublic
			? (sc["latest.cost.net_price.public.by_income_level.110001-plus"] ?? null)
			: (sc["latest.cost.net_price.private.by_income_level.110001-plus"] ?? null),
		completionRate:
			sc["latest.completion.completion_rate_4yr_150nt"] ??
			sc["latest.completion.completion_rate_less_than_4yr_150nt"] ??
			null,
		medianEarnings10yr: sc["latest.earnings.10_yrs_after_entry.median"] ?? null,
		studentSize: sc["latest.student.size"] ?? null,
		costOfAttendance: sc["latest.cost.attendance.academic_year"] ?? null,
		tuitionInState: sc["latest.cost.tuition.in_state"] ?? null,
		tuitionOutOfState: sc["latest.cost.tuition.out_of_state"] ?? null,
	};
}
