export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { studentProfiles, userProfiles } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { onboardingSchema } from "@/lib/validations";

async function getUser() {
	const { data } = await auth.getSession();
	return data?.user ?? null;
}

// POST /api/onboarding — save or update student onboarding data
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

	const body = await request.json();
	const result = onboardingSchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
	}

	// Get user profile
	const userProfile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, user.id),
	});
	if (!userProfile) {
		return NextResponse.json(
			{ error: "User profile not found. Complete signup first." },
			{ status: 404 },
		);
	}
	if (userProfile.role !== "student") {
		return NextResponse.json({ error: "Only students can complete onboarding" }, { status: 403 });
	}

	const data = result.data;

	// Upsert student profile
	const existing = await db.query.studentProfiles.findFirst({
		where: eq(studentProfiles.userProfileId, userProfile.id),
	});

	let studentProfile: typeof existing;

	if (existing) {
		const [updated] = await db
			.update(studentProfiles)
			.set({
				gradeLevel: data.gradeLevel,
				gpa: data.gpa,
				satScore: data.satScore ?? null,
				actScore: data.actScore ?? null,
				stateOfResidence: data.stateOfResidence,
				incomeBracket: data.incomeBracket,
				isFirstGen: data.isFirstGen,
				intendedMajor: data.intendedMajor,
				collegeTypePreference: data.collegeTypePreference,
				locationPreference: data.locationPreference,
				updatedAt: new Date(),
			})
			.where(eq(studentProfiles.userProfileId, userProfile.id))
			.returning();
		studentProfile = updated;
	} else {
		const [created] = await db
			.insert(studentProfiles)
			.values({
				userProfileId: userProfile.id,
				gradeLevel: data.gradeLevel,
				gpa: data.gpa,
				satScore: data.satScore ?? null,
				actScore: data.actScore ?? null,
				stateOfResidence: data.stateOfResidence,
				incomeBracket: data.incomeBracket,
				isFirstGen: data.isFirstGen,
				intendedMajor: data.intendedMajor,
				collegeTypePreference: data.collegeTypePreference,
				locationPreference: data.locationPreference,
			})
			.returning();
		studentProfile = created;
	}

	// Mark onboarding as completed on user profile
	await db
		.update(userProfiles)
		.set({ onboardingCompleted: true, updatedAt: new Date() })
		.where(eq(userProfiles.id, userProfile.id));

	return NextResponse.json({ studentProfile }, { status: existing ? 200 : 201 });
}
