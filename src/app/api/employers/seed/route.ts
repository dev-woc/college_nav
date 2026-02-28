export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { SEED_EMPLOYERS } from "@/lib/agents/career/seed-employers";
import { db } from "@/lib/db";
import { employerRecruitingPrefs, employers } from "@/lib/db/schema";

// POST /api/employers/seed — dev-only: insert seed employer records
// Guard: only runs in non-production environments
export async function POST() {
	if (process.env.NODE_ENV === "production") {
		return NextResponse.json({ error: "Seed endpoint disabled in production" }, { status: 403 });
	}

	const inserted: string[] = [];

	for (const seed of SEED_EMPLOYERS) {
		const [employer] = await db
			.insert(employers)
			.values({
				...seed.employer,
				isVerified: true,
			})
			.onConflictDoNothing()
			.returning();

		if (employer) {
			for (const pref of seed.prefs) {
				await db
					.insert(employerRecruitingPrefs)
					.values({ ...pref, employerId: employer.id })
					.onConflictDoNothing();
			}
			inserted.push(employer.name);
		}
	}

	return NextResponse.json({
		message: `Seeded ${inserted.length} employers`,
		employers: inserted,
	});
}
