export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { counselorProfiles } from "@/lib/db/schema";

function generateCode(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST() {
	if (process.env.SKIP_AUTH !== "true") {
		return NextResponse.json({ error: "Dev only" }, { status: 403 });
	}

	const counselors = await db.query.counselorProfiles.findMany({
		columns: { id: true, schoolCode: true },
	});

	let updated = 0;
	for (const c of counselors) {
		if (c.schoolCode === "") {
			const code = generateCode();
			await db
				.update(counselorProfiles)
				.set({ schoolCode: code })
				.where(eq(counselorProfiles.id, c.id));
			updated++;
		}
	}

	return NextResponse.json({ updated });
}
