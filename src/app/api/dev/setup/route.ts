export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";

const DEV_USER_ID = "dev-user-local-001";

// GET /api/dev/setup
// Seeds the dev user_profiles record and redirects to onboarding.
// Only works when SKIP_AUTH=true — never runs in production.
export async function GET() {
	if (process.env.SKIP_AUTH !== "true") {
		return NextResponse.json({ error: "Not available" }, { status: 404 });
	}

	const existing = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, DEV_USER_ID),
	});

	if (!existing) {
		await db.insert(userProfiles).values({
			userId: DEV_USER_ID,
			slug: "dev-student",
			displayName: "Dev Student",
			email: "dev@localhost",
			role: "student",
			onboardingCompleted: false,
		});
	}

	const destination = existing?.onboardingCompleted ? "/student/dashboard" : "/student/onboarding";
	return NextResponse.redirect(
		new URL(destination, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
	);
}
