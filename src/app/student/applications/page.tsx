"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApplicationChecklist } from "@/components/student/application-checklist";
import type { UserWithProfile } from "@/types";

interface ApplicationTask {
	id: string;
	studentProfileId: string;
	collegeId: string | null;
	collegeName: string;
	taskType:
		| "common_app"
		| "supplement"
		| "fafsa"
		| "css_profile"
		| "scholarship_app"
		| "institutional_app";
	title: string;
	description: string;
	deadlineDate: string | null;
	deadlineLabel: string;
	status: "pending" | "in_progress" | "completed" | "skipped";
	isConflict: boolean;
	conflictNote: string;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

interface ChecklistData {
	tasks: ApplicationTask[];
	conflicts: ApplicationTask[];
	totalTasks: number;
	completedTasks: number;
	nextDeadline: string | null;
}

export default function ApplicationsPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [checklist, setChecklist] = useState<ChecklistData | null>(null);
	const [agentRunning, setAgentRunning] = useState(false);

	const fetchChecklist = useCallback(async () => {
		const res = await fetch("/api/applications");
		if (res.ok) {
			const data: ChecklistData = await res.json();
			setChecklist(data);
			return data;
		}
		return null;
	}, []);

	useEffect(() => {
		async function init() {
			setIsLoading(true);

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

			const data = await fetchChecklist();
			setIsLoading(false);

			// Auto-run agent if no tasks
			if (data && data.totalTasks === 0) {
				setAgentRunning(true);
				try {
					await fetch("/api/agents/applications", { method: "POST" });
					await fetchChecklist();
				} finally {
					setAgentRunning(false);
				}
			}
		}

		init();
	}, [router, fetchChecklist]);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-sm text-muted-foreground">Loading applications...</p>
			</div>
		);
	}

	return (
		<div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">My Applications</h1>
				<p className="text-muted-foreground">Track every deadline, all in one place.</p>
			</div>
			{agentRunning && (
				<div className="flex items-center gap-3 text-sm text-muted-foreground">
					<Loader2 className="h-4 w-4 animate-spin" />
					Building your application checklist...
				</div>
			)}
			{checklist && (
				<ApplicationChecklist
					tasks={checklist.tasks}
					conflicts={checklist.conflicts}
					totalTasks={checklist.totalTasks}
					completedTasks={checklist.completedTasks}
					nextDeadline={checklist.nextDeadline}
					onTaskUpdated={fetchChecklist}
				/>
			)}
			<div className="mt-4">
				<Link href="/student/fafsa" className="text-primary underline">
					Open FAFSA Guide &rarr;
				</Link>
			</div>
		</div>
	);
}
