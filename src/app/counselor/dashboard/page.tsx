"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CaseloadTable } from "@/components/counselor/caseload-table";
import { CohortStats } from "@/components/counselor/cohort-stats";

interface CohortStatsData {
	totalStudents: number;
	fafsaCompletionRate: number;
	avgScholarshipsMatched: number;
	avgCollegesOnList: number;
	studentsWithApplicationTasks: number;
	highUrgencyCount: number;
}

interface StudentSummary {
	id: string;
	displayName: string;
	email: string;
	gradeLevel: number | null;
	isFirstGen: boolean;
	urgencyScore: number;
	flaggedReason: string;
	milestones: {
		onboarding: "complete" | "not-started";
		collegeList: "complete" | "not-started";
		financialAid: "complete" | "not-started";
		scholarships: "complete" | "not-started";
		fafsa: "not-started" | "in-progress" | "complete";
		applications: "not-started" | "in-progress" | "complete";
		lastAgentRun: Date | string | null;
	};
}

export default function CounselorDashboardPage() {
	const router = useRouter();
	const [students, setStudents] = useState<StudentSummary[]>([]);
	const [cohortStats, setCohortStats] = useState<CohortStatsData | null>(null);
	const [schoolCode, setSchoolCode] = useState<string | null>(null);
	const [sortByUrgency, setSortByUrgency] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchCaseload = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Verify role
			const userRes = await fetch("/api/user");
			if (!userRes.ok) {
				if (userRes.status === 401) {
					router.push("/login");
					return;
				}
				throw new Error("Failed to load user");
			}
			const userData = await userRes.json();

			if (userData.userProfile?.role !== "counselor") {
				router.push("/student/dashboard");
				return;
			}

			if (!userData.userProfile?.onboardingCompleted) {
				router.push("/counselor/onboarding");
				return;
			}

			setSchoolCode(userData.counselorProfile?.schoolCode ?? null);

			// Fetch caseload
			const caseloadRes = await fetch("/api/counselor/caseload");
			if (!caseloadRes.ok) {
				throw new Error("Failed to load caseload");
			}
			const data = await caseloadRes.json();
			setStudents(data.students ?? []);
			setCohortStats(data.cohortStats ?? null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load caseload");
		} finally {
			setIsLoading(false);
		}
	}, [router]);

	useEffect(() => {
		fetchCaseload();
	}, [fetchCaseload]);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<p className="text-destructive">{error}</p>
			</div>
		);
	}

	const sortedStudents = sortByUrgency
		? [...students].sort((a, b) => b.urgencyScore - a.urgencyScore)
		: students;

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4 flex-wrap border-b border-black/[0.06] pb-6">
				<div>
					<p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">
						Caseload
					</p>
					<h1 className="text-2xl font-bold tracking-tight">Your Students</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{students.length} student{students.length !== 1 ? "s" : ""} in your caseload
					</p>
				</div>
				{schoolCode && (
					<div className="border border-black/[0.08] px-4 py-3 text-sm">
						<p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1">
							School code
						</p>
						<p className="font-mono font-bold tracking-widest text-lg">{schoolCode}</p>
						<p className="text-xs text-muted-foreground mt-1">Share with students to connect</p>
					</div>
				)}
			</div>
			{cohortStats && <CohortStats stats={cohortStats} />}
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Your Students</h2>
				<button
					type="button"
					onClick={() => setSortByUrgency((s) => !s)}
					className="text-sm text-muted-foreground underline"
				>
					{sortByUrgency ? "Sorted by urgency \u2193" : "Sort by urgency"}
				</button>
			</div>
			<CaseloadTable students={sortedStudents} />
		</div>
	);
}
