export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { buildFinancialSummary } from "@/lib/agents/financial-aid/net-price";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { awardLetters, collegeListEntries, studentProfiles, userProfiles } from "@/lib/db/schema";
import type { FinancialAidSummary } from "@/types";

// GET /api/financial-aid — return financial summaries for all colleges on the student's list
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
	if (!studentProfile) {
		return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
	}

	const entries = await db.query.collegeListEntries.findMany({
		where: eq(collegeListEntries.studentProfileId, studentProfile.id),
		with: { college: true },
	});

	const letters = await db.query.awardLetters.findMany({
		where: eq(awardLetters.studentProfileId, studentProfile.id),
	});

	const summaries: FinancialAidSummary[] = entries.map((entry) => {
		const { netPricePerYear, fourYearNetCost, totalDebtEstimate, monthlyPayment } =
			buildFinancialSummary(entry.college, studentProfile);
		const awardLetter = letters.find((l) => l.collegeId === entry.collegeId) ?? null;

		return {
			collegeId: entry.collegeId,
			collegeName: entry.college.name,
			netPricePerYear,
			costOfAttendance: entry.college.costOfAttendance,
			fourYearNetCost,
			totalDebtEstimate,
			monthlyPayment,
			awardLetter,
		};
	});

	return NextResponse.json({ summaries });
}
