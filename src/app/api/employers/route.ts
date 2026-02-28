export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { employerRecruitingPrefs, employers } from "@/lib/db/schema";

const EmployerSchema = z.object({
	name: z.string().min(2).max(200),
	industry: z.string().min(2).max(100),
	description: z.string().max(1000).default(""),
	website: z.string().url(),
	collegeTiers: z.array(z.enum(["reach", "match", "likely"])).min(1),
	minGpa: z
		.string()
		.regex(/^\d\.\d$/)
		.default("0.0"),
	majorKeywords: z.array(z.string()).default([]),
	roleType: z.enum(["internship", "full_time", "both"]).default("both"),
	targetGradYear: z.number().int().min(2025).max(2035).nullable().default(null),
});

// POST /api/employers — employer self-registration (no auth; isVerified defaults to false)
export async function POST(request: NextRequest) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = EmployerSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
	}

	const {
		name,
		industry,
		description,
		website,
		collegeTiers,
		minGpa,
		majorKeywords,
		roleType,
		targetGradYear,
	} = parsed.data;

	const [employer] = await db
		.insert(employers)
		.values({
			name,
			industry,
			description,
			website,
			isVerified: false,
		})
		.returning();

	await db.insert(employerRecruitingPrefs).values({
		employerId: employer.id,
		collegeTiers: JSON.stringify(collegeTiers),
		minGpa,
		majorKeywords: JSON.stringify(majorKeywords),
		roleType,
		targetGradYear,
		isActive: true,
	});

	return NextResponse.json({ employer }, { status: 201 });
}
