export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { counselorProfiles, studentProfiles, userProfiles } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validations";

async function getUser() {
	const { data } = await auth.getSession();
	return data?.user ?? null;
}

// GET /api/user — fetch current user profile with role-specific sub-profile
export async function GET(request: NextRequest) {
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
		return NextResponse.json({ userProfile: null, studentProfile: null, counselorProfile: null });
	}

	const [studentProfile, counselorProfile] = await Promise.all([
		userProfile.role === "student"
			? db.query.studentProfiles.findFirst({
					where: eq(studentProfiles.userProfileId, userProfile.id),
				})
			: null,
		userProfile.role === "counselor"
			? db.query.counselorProfiles.findFirst({
					where: eq(counselorProfiles.userProfileId, userProfile.id),
				})
			: null,
	]);

	return NextResponse.json({
		userProfile,
		studentProfile: studentProfile ?? null,
		counselorProfile: counselorProfile ?? null,
	});
}

// POST /api/user — create user profile after signup
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

	// Check if profile already exists
	const existing = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, user.id),
	});
	if (existing) {
		return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
	}

	const body = await request.json();
	const result = signupSchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
	}

	// Check slug uniqueness
	const slugTaken = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.slug, result.data.slug),
	});
	if (slugTaken) {
		return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
	}

	// Create user profile
	const [userProfile] = await db
		.insert(userProfiles)
		.values({
			userId: user.id,
			slug: result.data.slug,
			displayName: result.data.displayName,
			email: user.email ?? "",
			role: result.data.role,
		})
		.returning();

	// Create role-specific sub-profile
	if (result.data.role === "counselor") {
		await db.insert(counselorProfiles).values({
			userProfileId: userProfile.id,
			schoolName: result.data.schoolName ?? "",
			district: result.data.district ?? "",
			stateCode: result.data.stateCode ?? "",
		});
	}

	return NextResponse.json({ userProfile }, { status: 201 });
}
