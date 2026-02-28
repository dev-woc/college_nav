/**
 * BLS Occupational Employment and Wage Statistics (OEWS) integration.
 * Free API — no key required for v1 (up to 10 series, 3 years of data).
 * Docs: https://www.bls.gov/bls/api_features.htm
 */

const BLS_API = "https://api.bls.gov/publicAPI/v1/timeseries/data/";

export interface BlsWageData {
	occupationCode: string;
	occupationTitle: string;
	medianAnnualWage: number | null; // national median
	entryLevelWage: number | null;
	experiencedWage: number | null;
	employmentCount: number | null;
}

/**
 * BLS Series ID format for OEWS national data:
 * OEUS000000{occupation_code}04 → median annual wage (datatype 04)
 * OEUS000000{occupation_code}01 → employment (datatype 01)
 * OEUS000000{occupation_code}08 → 10th percentile annual wage
 * OEUS000000{occupation_code}09 → 90th percentile annual wage
 */
function buildSeriesId(occupationCode: string, datatype: string): string {
	return `OEUS000000${occupationCode.replace("-", "")}${datatype}`;
}

/**
 * Fetch median annual wage and employment for an occupation.
 * Uses national estimates (area code 000000).
 * Returns null fields if API is unavailable or rate-limited.
 */
export async function fetchOccupationWages(
	occupationCode: string,
): Promise<Pick<BlsWageData, "medianAnnualWage" | "entryLevelWage" | "employmentCount">> {
	const seriesIds = [
		buildSeriesId(occupationCode, "04"), // median annual wage
		buildSeriesId(occupationCode, "08"), // 25th percentile (entry proxy)
		buildSeriesId(occupationCode, "01"), // employment
	];

	try {
		const res = await fetch(BLS_API, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				seriesid: seriesIds,
				startyear: "2023",
				endyear: "2024",
			}),
			next: { revalidate: 86400 * 7 }, // cache for 7 days
		});

		if (!res.ok) return { medianAnnualWage: null, entryLevelWage: null, employmentCount: null };

		const json = (await res.json()) as {
			status: string;
			Results: {
				series: Array<{
					seriesID: string;
					data: Array<{ year: string; period: string; value: string }>;
				}>;
			};
		};

		if (json.status !== "REQUEST_SUCCEEDED") {
			return { medianAnnualWage: null, entryLevelWage: null, employmentCount: null };
		}

		const getLatestValue = (seriesId: string): number | null => {
			const series = json.Results.series.find((s) => s.seriesID === seriesId);
			if (!series || series.data.length === 0) return null;
			const latest = series.data.sort((a, b) => Number(b.year) - Number(a.year))[0];
			const val = Number(latest.value.replace(",", ""));
			return Number.isNaN(val) ? null : val;
		};

		return {
			medianAnnualWage: getLatestValue(seriesIds[0]),
			entryLevelWage: getLatestValue(seriesIds[1]),
			employmentCount: getLatestValue(seriesIds[2]),
		};
	} catch {
		return { medianAnnualWage: null, entryLevelWage: null, employmentCount: null };
	}
}
