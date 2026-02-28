"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

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

interface ApplicationChecklistProps {
	tasks: ApplicationTask[];
	conflicts: ApplicationTask[];
	totalTasks: number;
	completedTasks: number;
	nextDeadline: string | null;
	onTaskUpdated: () => void;
	readOnly?: boolean;
}

const TASK_TYPE_LABELS: Record<ApplicationTask["taskType"], string> = {
	common_app: "Common App",
	supplement: "Supplement",
	fafsa: "FAFSA",
	css_profile: "CSS Profile",
	scholarship_app: "Scholarship",
	institutional_app: "Institutional",
};

function formatDeadline(date: string | null, label: string): string {
	if (!date) return label;
	const formatted = new Date(date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	return label ? `${formatted} — ${label}` : formatted;
}

function StatusBadge({ status }: { status: ApplicationTask["status"] }) {
	switch (status) {
		case "pending":
			return <Badge variant="secondary">Pending</Badge>;
		case "in_progress":
			return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
		case "completed":
			return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
		case "skipped":
			return <Badge variant="outline">Skipped</Badge>;
	}
}

function sortTasks(tasks: ApplicationTask[]): ApplicationTask[] {
	return [...tasks].sort((a, b) => {
		// Completed/skipped go to the bottom
		const aCompleted = a.status === "completed" || a.status === "skipped";
		const bCompleted = b.status === "completed" || b.status === "skipped";
		if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

		// Conflicts first
		if (a.isConflict !== b.isConflict) return a.isConflict ? -1 : 1;

		// Then by deadline
		if (a.deadlineDate && b.deadlineDate) {
			return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
		}
		if (a.deadlineDate) return -1;
		if (b.deadlineDate) return 1;
		return 0;
	});
}

export function ApplicationChecklist({
	tasks,
	conflicts,
	totalTasks,
	completedTasks,
	nextDeadline,
	onTaskUpdated,
	readOnly = false,
}: ApplicationChecklistProps) {
	const [updating, setUpdating] = useState<string | null>(null);
	const progressPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
	const sorted = sortTasks(tasks);

	async function toggleStatus(task: ApplicationTask) {
		if (readOnly) return;
		const newStatus = task.status === "completed" ? "pending" : "completed";
		setUpdating(task.id);
		try {
			await fetch(`/api/applications/tasks/${task.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			onTaskUpdated();
		} finally {
			setUpdating(null);
		}
	}

	return (
		<div className="space-y-4">
			{/* Progress bar */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="font-medium">
						{completedTasks} / {totalTasks} tasks complete
					</span>
					{nextDeadline && (
						<span className="text-muted-foreground">
							Next deadline:{" "}
							{new Date(nextDeadline).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
							})}
						</span>
					)}
				</div>
				<div className="h-2 w-full rounded-full bg-muted">
					<div
						className={`h-2 rounded-full transition-all ${progressPct >= 100 ? "bg-green-500" : "bg-primary"}`}
						style={{ width: `${progressPct}%` }}
					/>
				</div>
			</div>

			{/* Conflict alert */}
			{conflicts.length > 0 && (
				<div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
					<p className="font-medium text-amber-800">Deadline Conflicts Detected</p>
					<ul className="mt-2 space-y-1 text-sm text-amber-700">
						{conflicts.map((c) => (
							<li key={c.id}>{c.conflictNote || `${c.collegeName}: ${c.title}`}</li>
						))}
					</ul>
				</div>
			)}

			{/* Task list */}
			<div className="space-y-3">
				{sorted.map((task) => (
					<div
						key={task.id}
						className={`rounded-xl border p-4 ${task.isConflict ? "border-red-200" : ""}`}
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1 space-y-1">
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant="secondary">{TASK_TYPE_LABELS[task.taskType]}</Badge>
									<StatusBadge status={task.status} />
									{task.isConflict && <Badge variant="destructive">Deadline conflict</Badge>}
								</div>
								{task.collegeName && (
									<p className="text-sm text-muted-foreground">{task.collegeName}</p>
								)}
								<p className="font-semibold">{task.title}</p>
								<p className="text-sm text-muted-foreground">
									{formatDeadline(task.deadlineDate, task.deadlineLabel)}
								</p>
								{task.isConflict && task.conflictNote && (
									<p className="text-sm text-red-600">{task.conflictNote}</p>
								)}
							</div>
							{!readOnly && (
								<button
									type="button"
									disabled={updating === task.id}
									onClick={() => toggleStatus(task)}
									className="shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
								>
									{updating === task.id
										? "..."
										: task.status === "completed"
											? "Undo"
											: "Mark Complete"}
								</button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
