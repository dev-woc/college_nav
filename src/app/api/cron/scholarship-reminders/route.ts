export const dynamic = "force-dynamic";

import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { calcDaysUntilDeadline } from "@/lib/agents/scholarships/matching";
import { db } from "@/lib/db";
import { scholarships, studentProfiles, studentScholarships, userProfiles } from "@/lib/db/schema";
import { sendScholarshipReminder } from "@/lib/email";

export async function GET(request: Request) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Find all matched scholarships that haven't been notified yet
	const pending = await db.query.studentScholarships.findMany({
		where: and(eq(studentScholarships.status, "matched"), isNull(studentScholarships.notifiedAt)),
		with: { scholarship: true },
	});

	let sent = 0;

	for (const entry of pending) {
		const days = calcDaysUntilDeadline(
			entry.scholarship.deadlineMonth,
			entry.scholarship.deadlineDay,
		);

		// Send reminder only at 7, 3, or 1 days before deadline
		if (days === null || ![1, 3, 7].includes(days)) continue;

		// Fetch student email
		const studentProfile = await db.query.studentProfiles.findFirst({
			where: eq(studentProfiles.id, entry.studentProfileId),
		});
		if (!studentProfile) continue;

		const userProfile = await db.query.userProfiles.findFirst({
			where: eq(userProfiles.id, studentProfile.userProfileId),
		});
		if (!userProfile) continue;

		const email = userProfile.email;
		if (!email) continue;

		const scholarship = entry.scholarship;
		const amountStr = scholarship.amount
			? `$${scholarship.amount.toLocaleString()}`
			: scholarship.amountMax
				? `up to $${scholarship.amountMax.toLocaleString()}`
				: "varies";

		try {
			await sendScholarshipReminder({
				to: email,
				studentName: userProfile.displayName ?? "Student",
				scholarshipName: scholarship.name,
				amount: amountStr,
				deadlineText: scholarship.deadlineText ?? "See website",
				applicationUrl: scholarship.applicationUrl,
				daysUntil: days,
			});

			// Mark as notified
			await db
				.update(studentScholarships)
				.set({ notifiedAt: new Date() })
				.where(eq(studentScholarships.id, entry.id));

			sent++;
		} catch {
			// Continue with other reminders even if one fails
		}
	}

	return NextResponse.json({ sent });
}
