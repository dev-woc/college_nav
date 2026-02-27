export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { slugCheckRateLimiter } from "@/lib/rate-limit";
import { slugSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = slugCheckRateLimiter.check(ip);
	if (!success) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	const { searchParams } = new URL(request.url);
	const slug = searchParams.get("slug") ?? "";

	const result = slugSchema.safeParse(slug);
	if (!result.success) {
		return NextResponse.json({
			available: false,
			error: result.error.issues[0]?.message,
		});
	}

	const existing = await db.query.userProfiles.findFirst({
		where: eq(userProfiles.slug, slug),
	});

	return NextResponse.json({ available: !existing });
}
