"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CollegeList } from "@/components/student/college-list";
import type { IncomeBracket, TieredCollegeList, UserWithProfile } from "@/types";

export default function StudentDashboardPage() {
	const router = useRouter();
	const [userWithProfile, setUserWithProfile] = useState<UserWithProfile | null>(null);
	const [collegeList, setCollegeList] = useState<TieredCollegeList | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRunningAgent, setIsRunningAgent] = useState(false);

	const fetchCollegeList = useCallback(async () => {
		const res = await fetch("/api/student/college-list");
		if (res.ok) {
			const data: TieredCollegeList = await res.json();
			setCollegeList(data);
			return data;
		}
		return null;
	}, []);

	const runAgent = useCallback(async () => {
		setIsRunningAgent(true);
		try {
			const res = await fetch("/api/agents/discovery", { method: "POST" });
			if (!res.ok) {
				const json = await res.json();
				toast.error(json.error ?? "Failed to build college list");
				return;
			}
			await fetchCollegeList();
		} catch {
			toast.error("Something went wrong building your college list.");
		} finally {
			setIsRunningAgent(false);
		}
	}, [fetchCollegeList]);

	useEffect(() => {
		async function init() {
			setIsLoading(true);

			// Fetch user profile
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

			// Redirect counselors to their dashboard
			if (userData.userProfile?.role === "counselor") {
				router.push("/counselor/dashboard");
				return;
			}

			// Redirect to onboarding if not completed
			if (!userData.userProfile?.onboardingCompleted) {
				router.push("/student/onboarding");
				return;
			}

			setUserWithProfile(userData);

			// Fetch college list
			const list = await fetchCollegeList();

			// Auto-run agent if no list exists
			const hasEntries =
				(list?.reach.length ?? 0) + (list?.match.length ?? 0) + (list?.likely.length ?? 0) > 0;

			if (!hasEntries) {
				setIsLoading(false);
				await runAgent();
			} else {
				setIsLoading(false);
			}
		}

		init();
	}, [router, fetchCollegeList, runAgent]);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-sm text-muted-foreground">Loading your dashboard...</p>
			</div>
		);
	}

	if (isRunningAgent) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
				<div>
					<h2 className="text-xl font-semibold">Building your college list...</h2>
					<p className="mt-1 text-muted-foreground">
						We're finding the best colleges for you based on your profile.
						<br />
						This takes about 20–30 seconds.
					</p>
				</div>
			</div>
		);
	}

	if (!collegeList) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<p className="text-muted-foreground">Unable to load college list. Please refresh.</p>
			</div>
		);
	}

	const incomeBracket =
		(userWithProfile?.studentProfile?.incomeBracket as IncomeBracket | null) ?? null;

	return (
		<div className="mx-auto max-w-5xl p-6">
			<div className="mb-6 flex items-center justify-between rounded-lg border bg-card p-4">
				<div>
					<h2 className="font-semibold">Financial Aid & Scholarships</h2>
					<p className="text-sm text-muted-foreground">
						See net costs, parse award letters, and find scholarships you qualify for.
					</p>
				</div>
				<Link
					href="/student/financial-aid"
					className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Explore →
				</Link>
			</div>
			<CollegeList list={collegeList} incomeBracket={incomeBracket} onRefresh={fetchCollegeList} />
		</div>
	);
}
