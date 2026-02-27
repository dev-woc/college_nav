"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CaseloadTable } from "@/components/counselor/caseload-table";

interface StudentSummary {
	id: string;
	displayName: string;
	gradeLevel: number | null;
	isFirstGen: boolean;
	milestones: {
		onboarding: "complete" | "not-started";
		collegeList: "complete" | "not-started";
		lastAgentRun: Date | string | null;
	};
}

export default function CounselorDashboardPage() {
	const router = useRouter();
	const [students, setStudents] = useState<StudentSummary[]>([]);
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

			// Fetch caseload
			const caseloadRes = await fetch("/api/counselor/caseload");
			if (!caseloadRes.ok) {
				throw new Error("Failed to load caseload");
			}
			const data = await caseloadRes.json();
			setStudents(data.students ?? []);
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

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Your Students</h1>
				<p className="text-muted-foreground">
					{students.length} student{students.length !== 1 ? "s" : ""} in your caseload
				</p>
			</div>
			<CaseloadTable students={students} />
		</div>
	);
}
