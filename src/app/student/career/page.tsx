"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CareerPathwayDisplay } from "@/components/student/career-pathway";
import { EmployerList } from "@/components/student/employer-list";
import type { CareerPathway } from "@/lib/career/pathways";
import type { BlsWageData } from "@/lib/integrations/bls";
import type { CareerSnapshot, EmployerMatch, UserWithProfile } from "@/types";

export default function CareerPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [pathway, setPathway] = useState<CareerPathway | null>(null);
	const [wageData, setWageData] = useState<Record<string, Partial<BlsWageData>>>({});
	const [employers, setEmployers] = useState<EmployerMatch[]>([]);
	const [hasNoMajor, setHasNoMajor] = useState(false);

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

			// Fetch snapshot and employers in parallel
			const [snapRes, empRes] = await Promise.all([
				fetch("/api/career/snapshot"),
				fetch("/api/career/employers"),
			]);

			let snapshot: CareerSnapshot | null = null;

			if (snapRes.ok) {
				const snapData: { snapshot: CareerSnapshot | null } = await snapRes.json();
				snapshot = snapData.snapshot;
			}

			// Auto-trigger career agent if no snapshot
			if (!snapshot) {
				await fetch("/api/agents/career", { method: "POST" });
				// Re-fetch snapshot after agent run
				const retryRes = await fetch("/api/career/snapshot");
				if (retryRes.ok) {
					const retryData: { snapshot: CareerSnapshot | null } = await retryRes.json();
					snapshot = retryData.snapshot;
				}
			}

			if (snapshot) {
				try {
					setPathway(JSON.parse(snapshot.pathwayJson) as CareerPathway);
					setWageData(JSON.parse(snapshot.wageDataJson) as Record<string, Partial<BlsWageData>>);
				} catch {
					// Malformed JSON — treat as no data
					setHasNoMajor(true);
				}
			} else {
				setHasNoMajor(true);
			}

			if (empRes.ok) {
				const empData: { employers: EmployerMatch[] } = await empRes.json();
				setEmployers(empData.employers);
			}

			setIsLoading(false);
		}

		init();
	}, [router]);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-sm text-muted-foreground">Loading career data...</p>
			</div>
		);
	}

	return (
		<div className="container max-w-5xl mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-2">Career Paths</h1>
			<p className="text-muted-foreground mb-8">
				See where your major leads — real salaries, job growth, and employers who recruit from your
				colleges.
			</p>

			{pathway ? (
				<CareerPathwayDisplay pathway={pathway} wageData={wageData} />
			) : (
				<div className="rounded-xl border p-6 text-center">
					<p className="text-muted-foreground">
						{hasNoMajor
							? "Set your intended major in your profile to see career paths."
							: "Loading career pathway data..."}
					</p>
				</div>
			)}

			<section className="mt-10">
				<h2 className="text-xl font-semibold mb-4">Employers Recruiting from Your Colleges</h2>
				<EmployerList employers={employers} />
			</section>
		</div>
	);
}
