export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { findPathwayForMajor } from "@/lib/career/pathways";
import { db } from "@/lib/db";
import { studentProfiles, userProfiles } from "@/lib/db/schema";
import { fetchOccupationWages } from "@/lib/integrations/bls";

// GET /api/career — return career pathway + live BLS wage data for student's intended major
export async function GET() {
	const { data } = await auth.getSession();
	const user = data?.user ?? null;
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userProfile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, user.id),
	});
	if (!userProfile) {
		return NextResponse.json({ error: "Profile not found" }, { status: 404 });
	}

	const studentProfile = await db.query.studentProfiles.findFirst({
		where: eq(studentProfiles.userProfileId, userProfile.id),
	});
	if (!studentProfile?.intendedMajor) {
		return NextResponse.json({ pathway: null, wageData: {} });
	}

	const pathway = findPathwayForMajor(studentProfile.intendedMajor);
	if (!pathway) {
		return NextResponse.json({ pathway: null, wageData: {}, major: studentProfile.intendedMajor });
	}

	// Fetch live BLS wage data for each career option (in parallel, capped at 3 for rate limits)
	const careersToFetch = pathway.careers.slice(0, 3);
	const wageResults = await Promise.allSettled(
		careersToFetch.map((career) => fetchOccupationWages(career.blsOccupationCode)),
	);

	const wageData: Record<
		string,
		{
			medianAnnualWage: number | null;
			entryLevelWage: number | null;
			employmentCount: number | null;
		}
	> = {};
	for (let i = 0; i < careersToFetch.length; i++) {
		const result = wageResults[i];
		wageData[careersToFetch[i].blsOccupationCode] =
			result.status === "fulfilled"
				? result.value
				: { medianAnnualWage: null, entryLevelWage: null, employmentCount: null };
	}

	return NextResponse.json({ pathway, wageData, major: studentProfile.intendedMajor });
}
