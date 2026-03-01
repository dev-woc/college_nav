export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { counselorProfiles, userProfiles } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { counselorOnboardingSchema } from "@/lib/validations";

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
		return NextResponse.json(
			{ error: "Only counselors can complete counselor onboarding" },
			{ status: 403 },
		);
	}

	const body = await request.json();
	const result = counselorOnboardingSchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
	}

	await db
		.update(counselorProfiles)
		.set({
			schoolName: result.data.schoolName,
			district: result.data.district,
			stateCode: result.data.stateCode,
		})
		.where(eq(counselorProfiles.userProfileId, userProfile.id));

	await db
		.update(userProfiles)
		.set({ onboardingCompleted: true, updatedAt: new Date() })
		.where(eq(userProfiles.id, userProfile.id));

	return NextResponse.json({ success: true });
}
