export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { counselorProfiles, userProfiles } from "@/lib/db/schema";
import { sendStudentInvite } from "@/lib/email";
import { apiRateLimiter } from "@/lib/rate-limit";
import { inviteStudentsSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const { data } = await auth.getSession();
	const user = data?.user ?? null;
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const userProfile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, user.id),
	});
	if (!userProfile || userProfile.role !== "counselor") {
		return NextResponse.json({ error: "Only counselors can invite students" }, { status: 403 });
	}

	const counselorProfile = await db.query.counselorProfiles.findFirst({
		where: eq(counselorProfiles.userProfileId, userProfile.id),
	});
	if (!counselorProfile) {
		return NextResponse.json({ error: "Counselor profile not found" }, { status: 404 });
	}

	const body = await request.json();
	const result = inviteStudentsSchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
	}

	const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
	const signupUrl = `${baseUrl}/signup?code=${counselorProfile.schoolCode}`;
	let sent = 0;

	for (const email of result.data.emails) {
		try {
			await sendStudentInvite({
				to: email,
				counselorName: userProfile.displayName,
				schoolName: counselorProfile.schoolName,
				signupUrl,
			});
			sent++;
		} catch {
			// Log but don't fail the entire request if one email fails
			console.error(`Failed to send invite to ${email}`);
		}
	}

	return NextResponse.json({ sent });
}
