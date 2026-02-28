"use client";

interface CohortStats {
	totalStudents: number;
	fafsaCompletionRate: number;
	avgScholarshipsMatched: number;
	avgCollegesOnList: number;
	studentsWithApplicationTasks: number;
	highUrgencyCount: number;
}

interface CohortStatsProps {
	stats: CohortStats;
}

export function CohortStats({ stats }: CohortStatsProps) {
	const fafsaPct = Math.round(stats.fafsaCompletionRate * 100);
	const fafsaColor =
		fafsaPct >= 70
			? "text-green-700 bg-green-50"
			: fafsaPct >= 40
				? "text-yellow-700 bg-yellow-50"
				: "text-red-700 bg-red-50";

	const urgencyColor =
		stats.highUrgencyCount > 0 ? "text-red-700 bg-red-50" : "text-green-700 bg-green-50";

	return (
		<div className="grid gap-4 sm:grid-cols-3">
			<div className={`rounded-xl border p-4 ${fafsaColor}`}>
				<p className="text-sm font-medium opacity-80">FAFSA Complete</p>
				<p className="mt-1 text-2xl font-bold">{fafsaPct}%</p>
			</div>
			<div className={`rounded-xl border p-4 ${urgencyColor}`}>
				<p className="text-sm font-medium opacity-80">High Urgency</p>
				<p className="mt-1 text-2xl font-bold">{stats.highUrgencyCount} students</p>
			</div>
			<div className="rounded-xl border p-4">
				<p className="text-sm font-medium text-muted-foreground">With Application Tasks</p>
				<p className="mt-1 text-2xl font-bold">
					{stats.studentsWithApplicationTasks} of {stats.totalStudents}
				</p>
			</div>
		</div>
	);
}
