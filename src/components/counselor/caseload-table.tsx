import { CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

interface StudentMilestones {
	onboarding: "complete" | "not-started";
	collegeList: "complete" | "not-started";
	financialAid: "complete" | "not-started";
	scholarships: "complete" | "not-started";
	fafsa: "not-started" | "in-progress" | "complete";
	applications: "not-started" | "in-progress" | "complete";
	lastAgentRun: Date | string | null;
}

interface StudentSummary {
	id: string;
	displayName: string;
	email: string;
	gradeLevel: number | null;
	isFirstGen: boolean;
	urgencyScore: number;
	flaggedReason: string;
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

function TriStateStatus({ status }: { status: "not-started" | "in-progress" | "complete" }) {
	if (status === "complete") {
		return <span className="text-green-600 font-medium">Done</span>;
	}
	if (status === "in-progress") {
		return <span className="text-blue-600 font-medium">In Progress</span>;
	}
	return <span className="text-muted-foreground">Not Started</span>;
}

function UrgencyBadge({ score }: { score: number }) {
	const color =
		score >= 60
			? "bg-red-100 text-red-800"
			: score >= 30
				? "bg-yellow-100 text-yellow-800"
				: "bg-green-100 text-green-800";
	return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{score}</span>;
}

function formatDate(date: Date | string | null): string {
	if (!date) return "\u2014";
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
						<th className="px-4 py-3 text-center font-medium">Urgency</th>
						<th className="px-4 py-3 text-center font-medium">Onboarding</th>
						<th className="px-4 py-3 text-center font-medium">College List</th>
						<th className="px-4 py-3 text-center font-medium">FAFSA</th>
						<th className="px-4 py-3 text-center font-medium">Applications</th>
						<th className="px-4 py-3 text-left font-medium">Last Agent Run</th>
					</tr>
				</thead>
				<tbody className="divide-y">
					{students.map((student) => (
						<tr key={student.id} className="hover:bg-muted/20">
							<td className="px-4 py-3">
								<Link
									href={`/counselor/student/${student.id}`}
									className="font-medium text-primary hover:underline"
								>
									{student.displayName}
								</Link>
								{student.flaggedReason && student.flaggedReason !== "On track" && (
									<p className="text-xs text-muted-foreground mt-0.5">{student.flaggedReason}</p>
								)}
							</td>
							<td className="px-4 py-3 text-center text-muted-foreground">
								{student.gradeLevel ? `Grade ${student.gradeLevel}` : "\u2014"}
							</td>
							<td className="px-4 py-3 text-center">
								{student.isFirstGen ? (
									<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
										First-Gen
									</span>
								) : (
									<span className="text-muted-foreground">\u2014</span>
								)}
							</td>
							<td className="px-4 py-3 text-center">
								<UrgencyBadge score={student.urgencyScore} />
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
							<td className="px-4 py-3 text-center">
								<TriStateStatus status={student.milestones.fafsa} />
							</td>
							<td className="px-4 py-3 text-center">
								<TriStateStatus status={student.milestones.applications} />
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
