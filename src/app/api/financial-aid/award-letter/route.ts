export const dynamic = "force-dynamic";

import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { parseAwardLetter } from "@/lib/agents/financial-aid/award-letter-parser";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { awardLetters, collegeListEntries, studentProfiles, userProfiles } from "@/lib/db/schema";

const bodySchema = z.object({
	text: z.string().min(10, "Award letter text is too short"),
	collegeName: z.string().min(1, "College name is required"),
	academicYear: z.string().optional().default(""),
	collegeId: z.string().optional(),
});

// POST /api/financial-aid/award-letter — parse pasted award letter text
export async function POST(request: NextRequest) {
	const { data: session } = await auth.getSession();
	const user = session?.user ?? null;
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userProfile = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, user.id),
	});
	if (!userProfile || userProfile.role !== "student") {
		return NextResponse.json({ error: "Student account required" }, { status: 403 });
	}

	const studentProfile = await db.query.studentProfiles.findFirst({
		where: eq(studentProfiles.userProfileId, userProfile.id),
	});
	if (!studentProfile) {
		return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
	}

	let body: z.infer<typeof bodySchema>;
	try {
		const raw = await request.json();
		const result = bodySchema.safeParse(raw);
		if (!result.success) {
			return NextResponse.json({ error: result.error.message }, { status: 400 });
		}
		body = result.data;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	// Optionally resolve college cost of attendance for out-of-pocket calculation
	let costOfAttendance: number | null = null;
	if (body.collegeId) {
		const entry = await db.query.collegeListEntries.findFirst({
			where: and(
				eq(collegeListEntries.studentProfileId, studentProfile.id),
				eq(collegeListEntries.collegeId, body.collegeId),
			),
			with: { college: true },
		});
		costOfAttendance = entry?.college.costOfAttendance ?? null;
	}

	const parsed = await parseAwardLetter(body.text, costOfAttendance);

	// Upsert award letter (one per student per college)
	const existing = body.collegeId
		? await db.query.awardLetters.findFirst({
				where: and(
					eq(awardLetters.studentProfileId, studentProfile.id),
					eq(awardLetters.collegeId, body.collegeId),
				),
			})
		: null;

	const letterData = {
		studentProfileId: studentProfile.id,
		collegeId: body.collegeId ?? null,
		collegeName: body.collegeName,
		academicYear: body.academicYear ?? "",
		rawText: body.text,
		components: JSON.stringify(parsed.components),
		freeMoneyTotal: parsed.freeMoneyTotal,
		loanTotal: parsed.loanTotal,
		workStudyTotal: parsed.workStudyTotal,
		outOfPocket: parsed.outOfPocket,
		updatedAt: new Date(),
	};

	if (existing) {
		await db.update(awardLetters).set(letterData).where(eq(awardLetters.id, existing.id));
	} else {
		await db.insert(awardLetters).values(letterData);
	}

	return NextResponse.json({
		components: parsed.components,
		summary: {
			freeMoneyTotal: parsed.freeMoneyTotal,
			loanTotal: parsed.loanTotal,
			workStudyTotal: parsed.workStudyTotal,
			outOfPocket: parsed.outOfPocket,
		},
	});
}
