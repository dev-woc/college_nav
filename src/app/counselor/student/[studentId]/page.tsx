"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApplicationChecklist } from "@/components/student/application-checklist";
import { FafsaGuide } from "@/components/student/fafsa-guide";

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

interface FafsaStepData {
	step: number;
	title: string;
	description: string;
	documents: string[];
	tips: string[];
	url?: string;
	isCompleted: boolean;
}

interface StudentMilestoneStatus {
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
		lastAgentRun: string | null;
	};
}

interface AgentRun {
	id: string;
	agentType: string;
	status: string;
	summary: string | null;
	completedAt: string | null;
}

interface StudentDetailData {
	student: StudentMilestoneStatus;
	tasks: ApplicationTask[];
	fafsaSteps: FafsaStepData[];
	agentRuns: AgentRun[];
}

export default function CounselorStudentPage() {
	const router = useRouter();
	const params = useParams();
	const studentId = params.studentId as string;
	const [isLoading, setIsLoading] = useState(true);
	const [data, setData] = useState<StudentDetailData | null>(null);

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
			const userData = await userRes.json();

			if (userData.userProfile?.role !== "counselor") {
				router.push("/student/dashboard");
				return;
			}

			const res = await fetch(`/api/counselor/student/${studentId}`);
			if (res.ok) {
				const detail: StudentDetailData = await res.json();
				setData(detail);
			}
			setIsLoading(false);
		}

		init();
	}, [router, studentId]);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<p className="text-muted-foreground">Unable to load student data.</p>
			</div>
		);
	}

	const { student, tasks, fafsaSteps, agentRuns } = data;
	const conflicts = tasks.filter((t) => t.isConflict);
	const completedTasks = tasks.filter((t) => t.status === "completed").length;
	const completedFafsa = fafsaSteps.filter((s) => s.isCompleted).length;
	const firstUncompletedFafsa = fafsaSteps.findIndex((s) => !s.isCompleted);

	return (
		<div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
			<div>
				<Link href="/counselor/dashboard" className="text-sm text-muted-foreground">
					&larr; Back to Dashboard
				</Link>
				<h1 className="text-2xl font-bold mt-2">
					{student.displayName}
					{student.isFirstGen && (
						<span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
							First-Gen
						</span>
					)}
				</h1>
				<p className="text-muted-foreground">
					Grade {student.gradeLevel} &middot; Urgency: {student.urgencyScore}/100
				</p>
				{student.flaggedReason !== "On track" && (
					<p className="text-amber-600 text-sm mt-1">{student.flaggedReason}</p>
				)}
			</div>

			<section>
				<h2 className="text-lg font-semibold mb-3">Application Checklist</h2>
				<ApplicationChecklist
					tasks={tasks}
					conflicts={conflicts}
					totalTasks={tasks.length}
					completedTasks={completedTasks}
					nextDeadline={null}
					onTaskUpdated={() => {}}
					readOnly
				/>
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-3">FAFSA Progress</h2>
				<FafsaGuide
					steps={fafsaSteps}
					currentStep={firstUncompletedFafsa >= 0 ? firstUncompletedFafsa : fafsaSteps.length}
					completedCount={completedFafsa}
					totalSteps={fafsaSteps.length}
					onStepToggled={() => {}}
					readOnly
				/>
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-3">Agent Activity</h2>
				{agentRuns.length === 0 ? (
					<p className="text-sm text-muted-foreground">No agent runs yet.</p>
				) : (
					agentRuns.map((run) => (
						<div key={run.id} className="text-sm border-b py-2">
							<span className="font-medium">{run.agentType}</span>
							<span className="mx-2 text-muted-foreground">&middot;</span>
							<span className={run.status === "completed" ? "text-green-600" : "text-destructive"}>
								{run.status}
							</span>
							<span className="mx-2 text-muted-foreground">&middot;</span>
							<span className="text-muted-foreground">
								{run.completedAt ? new Date(run.completedAt).toLocaleDateString() : "\u2014"}
							</span>
							{run.summary && <p className="text-muted-foreground mt-0.5">{run.summary}</p>}
						</div>
					))
				)}
			</section>
		</div>
	);
}
