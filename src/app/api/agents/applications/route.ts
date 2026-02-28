export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { runApplicationAgent } from "@/lib/agents/applications";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { studentProfiles, userProfiles } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";

async function getUser() {
	const { data } = await auth.getSession();
	return data?.user ?? null;
}

// POST /api/agents/applications — trigger the Application Management Agent for the current student
export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	const user = await getUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userProfile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, user.id),
	});
	if (!userProfile) {
		return NextResponse.json({ error: "User profile not found" }, { status: 404 });
	}
	if (userProfile.role !== "student") {
		return NextResponse.json(
			{ error: "Only students can run the application management agent" },
			{ status: 403 },
		);
	}

	if (!userProfile.onboardingCompleted) {
		return NextResponse.json(
			{
				error: "Complete onboarding before running the application management agent",
			},
			{ status: 400 },
		);
	}

	const studentProfile = await db.query.studentProfiles.findFirst({
		where: eq(studentProfiles.userProfileId, userProfile.id),
	});
	if (!studentProfile) {
		return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
	}

	try {
		const summary = await runApplicationAgent(studentProfile.id);
		return NextResponse.json({ summary }, { status: 202 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Agent failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
