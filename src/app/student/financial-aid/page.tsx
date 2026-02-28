"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AwardLetterUploader } from "@/components/student/award-letter-uploader";
import { FinancialComparison } from "@/components/student/financial-comparison";
import { ScholarshipList } from "@/components/student/scholarship-list";
import type { FinancialAidSummary, ScholarshipMatch, UserWithProfile } from "@/types";

export default function FinancialAidPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [summaries, setSummaries] = useState<FinancialAidSummary[]>([]);
	const [scholarships, setScholarships] = useState<ScholarshipMatch[]>([]);

	const fetchFinancial = useCallback(async () => {
		const res = await fetch("/api/financial-aid");
		if (res.ok) {
			const data: { summaries: FinancialAidSummary[] } = await res.json();
			setSummaries(data.summaries);
		}
	}, []);

	const fetchScholarships = useCallback(async () => {
		const res = await fetch("/api/scholarships");
		if (res.ok) {
			const data: { matches: ScholarshipMatch[] } = await res.json();
			setScholarships(data.matches);
		}
	}, []);

	useEffect(() => {
		async function init() {
			setIsLoading(true);

			// Auth check
			const userRes = await fetch("/api/user");
			if (!userRes.ok) {
				if (userRes.status === 401) {
					router.push("/login");
					return;
				}
				setIsLoading(false);
				return;
			}
			const userData: UserWithProfile = await userRes.json();

			if (userData.userProfile?.role === "counselor") {
				router.push("/counselor/dashboard");
				return;
			}

			if (!userData.userProfile?.onboardingCompleted) {
				router.push("/student/onboarding");
				return;
			}

			// Fetch data in parallel
			const [finRes, schRes] = await Promise.all([
				fetch("/api/financial-aid"),
				fetch("/api/scholarships"),
			]);

			if (finRes.ok) {
				const finData: { summaries: FinancialAidSummary[] } = await finRes.json();
				setSummaries(finData.summaries);

				// Auto-trigger financial aid agent if all net prices are null
				const allNull = finData.summaries.every((s) => s.netPricePerYear === null);
				if (allNull) {
					fetch("/api/agents/financial-aid", { method: "POST" });
				}
			}

			if (schRes.ok) {
				const schData: { matches: ScholarshipMatch[] } = await schRes.json();
				setScholarships(schData.matches);

				// Auto-trigger scholarship agent if no matches
				if (schData.matches.length === 0) {
					fetch("/api/agents/scholarships", { method: "POST" });
				}
			}

			setIsLoading(false);
		}

		init();
	}, [router]);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-sm text-muted-foreground">Loading financial aid data...</p>
			</div>
		);
	}

	const collegeList = summaries.map((s) => ({
		collegeId: s.collegeId,
		collegeName: s.collegeName,
	}));

	return (
		<div className="container max-w-6xl mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-2">Financial Aid &amp; Scholarships</h1>
			<p className="text-muted-foreground mb-8">
				Compare your real cost across colleges and find money you qualify for.
			</p>

			<section className="mb-10">
				<h2 className="text-xl font-semibold mb-4">Cost Comparison</h2>
				<FinancialComparison summaries={summaries} />
			</section>

			<section className="mb-10">
				<h2 className="text-xl font-semibold mb-4">Award Letters</h2>
				<p className="text-sm text-muted-foreground mb-4">
					Upload your official award letters to see your exact out-of-pocket cost.
				</p>
				<AwardLetterUploader collegeList={collegeList} onUploaded={fetchFinancial} />
			</section>

			<section>
				<h2 className="text-xl font-semibold mb-4">Scholarships Matched to Your Profile</h2>
				<ScholarshipList matches={scholarships} />
			</section>
		</div>
	);
}
