export const dynamic = "force-dynamic";

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
	counselorProfiles,
	counselorStudents,
	studentProfiles,
	userProfiles,
} from "@/lib/db/schema";

const connectSchema = z.object({
	schoolCode: z.string().min(1),
});

export async function POST(request: Request) {
	const { data } = await auth.getSession();
	const user = data?.user ?? null;
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userProfile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, user.id),
	});
	if (!userProfile || userProfile.role !== "student") {
		return NextResponse.json(
			{ error: "Only students can connect to a counselor" },
			{ status: 403 },
		);
	}

	const body = await request.json();
	const parsed = connectSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "School code is required" }, { status: 400 });
	}

	const counselorProfile = await db.query.counselorProfiles.findFirst({
		where: eq(counselorProfiles.schoolCode, parsed.data.schoolCode),
		with: { userProfile: true },
	});
	if (!counselorProfile) {
		return NextResponse.json(
			{ error: "No counselor found with that school code" },
			{ status: 404 },
		);
	}

	const studentProfile = await db.query.studentProfiles.findFirst({
		where: eq(studentProfiles.userProfileId, userProfile.id),
	});
	if (!studentProfile) {
		return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
	}

	const existing = await db.query.counselorStudents.findFirst({
		where: and(
			eq(counselorStudents.counselorProfileId, counselorProfile.id),
			eq(counselorStudents.studentProfileId, studentProfile.id),
		),
	});
	if (existing) {
		return NextResponse.json({ alreadyConnected: true }, { status: 200 });
	}

	await db.insert(counselorStudents).values({
		counselorProfileId: counselorProfile.id,
		studentProfileId: studentProfile.id,
	});

	return NextResponse.json(
		{
			connected: true,
			counselorName: counselorProfile.userProfile?.displayName ?? "Counselor",
			schoolName: counselorProfile.schoolName,
		},
		{ status: 201 },
	);
}
