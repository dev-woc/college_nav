import { CheckCircle, Clock, XCircle } from "lucide-react";

interface StudentMilestones {
	onboarding: "complete" | "not-started";
	collegeList: "complete" | "not-started";
	lastAgentRun: Date | string | null;
}

interface StudentSummary {
	id: string;
	displayName: string;
	gradeLevel: number | null;
	isFirstGen: boolean;
	milestones: StudentMilestones;
}

interface CaseloadTableProps {
	students: StudentSummary[];
}

function MilestoneIcon({ status }: { status: "complete" | "not-started" }) {
	if (status === "complete") {
		return <CheckCircle className="h-4 w-4 text-green-600" />;
	}
	return <XCircle className="h-4 w-4 text-muted-foreground" />;
}

function formatDate(date: Date | string | null): string {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

export function CaseloadTable({ students }: CaseloadTableProps) {
	if (students.length === 0) {
		return (
			<div className="rounded-xl border border-dashed p-12 text-center">
				<p className="text-muted-foreground">No students connected yet.</p>
				<p className="mt-1 text-sm text-muted-foreground">
					Share your counselor link with students to add them to your caseload.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl border">
			<table className="w-full text-sm">
				<thead className="border-b bg-muted/50">
					<tr>
						<th className="px-4 py-3 text-left font-medium">Student</th>
						<th className="px-4 py-3 text-center font-medium">Grade</th>
						<th className="px-4 py-3 text-center font-medium">First-Gen</th>
						<th className="px-4 py-3 text-center font-medium">Onboarding</th>
						<th className="px-4 py-3 text-center font-medium">College List</th>
						<th className="px-4 py-3 text-left font-medium">Last Agent Run</th>
					</tr>
				</thead>
				<tbody className="divide-y">
					{students.map((student) => (
						<tr key={student.id} className="hover:bg-muted/20">
							<td className="px-4 py-3 font-medium">{student.displayName}</td>
							<td className="px-4 py-3 text-center text-muted-foreground">
								{student.gradeLevel ? `Grade ${student.gradeLevel}` : "—"}
							</td>
							<td className="px-4 py-3 text-center">
								{student.isFirstGen ? (
									<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
										First-Gen
									</span>
								) : (
									<span className="text-muted-foreground">—</span>
								)}
							</td>
							<td className="px-4 py-3 text-center">
								<div className="flex justify-center">
									<MilestoneIcon status={student.milestones.onboarding} />
								</div>
							</td>
							<td className="px-4 py-3 text-center">
								<div className="flex justify-center">
									<MilestoneIcon status={student.milestones.collegeList} />
								</div>
							</td>
							<td className="px-4 py-3 text-muted-foreground">
								<div className="flex items-center gap-1.5">
									{student.milestones.lastAgentRun ? (
										<>
											<Clock className="h-3.5 w-3.5" />
											{formatDate(student.milestones.lastAgentRun)}
										</>
									) : (
										"Never"
									)}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
