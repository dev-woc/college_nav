export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { studentProfiles, userProfiles } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { onboardingSchema } from "@/lib/validations";

type Db = typeof db;

async function generateUniqueSlug(raw: string, database: Db): Promise<string> {
	const base =
		raw
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 20) || "student";

	for (let attempt = 0; attempt < 5; attempt++) {
		const suffix = Math.random().toString(36).slice(2, 6);
		const candidate = `${base}-${suffix}`;
		const taken = await database.query.userProfiles.findFirst({
			where: eq(userProfiles.slug, candidate),
		});
		if (!taken) return candidate;
	}
	// Fallback: timestamp-based slug guaranteed unique
	return `student-${Date.now().toString(36)}`;
}

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

	// Get or auto-create user profile (handles Google OAuth users who bypassed the signup form)
	let userProfile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, user.id),
	});

	if (!userProfile) {
		// OAuth users have a Neon Auth user but no userProfile yet — create one now
		const slug = await generateUniqueSlug(user.name ?? user.email ?? user.id, db);
		const [created] = await db
			.insert(userProfiles)
			.values({
				userId: user.id,
				slug,
				displayName: user.name ?? "Student",
				email: user.email ?? "",
				role: "student",
			})
			.returning();
		userProfile = created;
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
