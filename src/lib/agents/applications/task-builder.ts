import type { CollegeListEntryWithCollege } from "@/types";

export interface TaskToInsert {
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
	deadlineDate: Date | null;
	deadlineLabel: string;
	isConflict: boolean;
	conflictNote: string;
}

const PRIVATE_OWNERSHIP = 2;

function getDeadlineForTier(tier: "reach" | "match" | "likely"): Date {
	const now = new Date();
	const nextYear = now.getFullYear() + 1;
	if (tier === "reach") return new Date(nextYear, 0, 1); // Jan 1
	if (tier === "match") return new Date(nextYear, 0, 15); // Jan 15
	return new Date(nextYear, 1, 1); // Feb 1 (likely)
}

function getTierLabel(_tier: "reach" | "match" | "likely"): string {
	return "Regular Decision";
}

function getFafsaPriorityDeadline(): Date {
	const now = new Date();
	const year = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
	return new Date(year, 11, 1); // December 1
}

export function buildTasksForCollegeList(
	entries: CollegeListEntryWithCollege[],
	studentProfileId: string,
): TaskToInsert[] {
	const tasks: TaskToInsert[] = [];

	// FAFSA task — one per student
	tasks.push({
		studentProfileId,
		collegeId: null,
		collegeName: "",
		taskType: "fafsa",
		title: "Complete FAFSA",
		description:
			"The Free Application for Federal Student Aid unlocks Pell Grants, subsidized loans, and most institutional aid. Priority deadlines are typically December 1.",
		deadlineDate: getFafsaPriorityDeadline(),
		deadlineLabel: "Priority Deadline",
		isConflict: false,
		conflictNote: "",
	});

	for (const entry of entries) {
		const { college, tier } = entry;
		const admissionDeadline = getDeadlineForTier(tier);
		const deadlineLabel = getTierLabel(tier);

		// Common App
		tasks.push({
			studentProfileId,
			collegeId: college.id,
			collegeName: college.name,
			taskType: "common_app",
			title: `Common App — ${college.name}`,
			description: `Submit your Common Application for ${college.name}.`,
			deadlineDate: admissionDeadline,
			deadlineLabel,
			isConflict: false,
			conflictNote: "",
		});

		// Supplement for reach and match
		if (tier === "reach" || tier === "match") {
			tasks.push({
				studentProfileId,
				collegeId: college.id,
				collegeName: college.name,
				taskType: "supplement",
				title: `Essays/Supplement — ${college.name}`,
				description: `Complete supplemental essays and school-specific questions for ${college.name}.`,
				deadlineDate: admissionDeadline,
				deadlineLabel,
				isConflict: false,
				conflictNote: "",
			});
		}

		// CSS Profile for private schools
		if (college.ownership === PRIVATE_OWNERSHIP) {
			const cssDeadline = new Date(admissionDeadline);
			cssDeadline.setDate(cssDeadline.getDate() - 14);

			tasks.push({
				studentProfileId,
				collegeId: college.id,
				collegeName: college.name,
				taskType: "css_profile",
				title: `CSS Profile — ${college.name}`,
				description: `${college.name} requires the CSS Profile for institutional aid. Complete it before the admission deadline.`,
				deadlineDate: cssDeadline,
				deadlineLabel: "CSS Profile Deadline",
				isConflict: true,
				conflictNote:
					"CSS Profile deadline is 2 weeks before admission deadline — complete this first",
			});
		}
	}

	return tasks;
}

export function detectConflicts(tasks: TaskToInsert[]): TaskToInsert[] {
	return tasks.map((task) => {
		if (task.taskType === "common_app" || task.taskType === "supplement") {
			const cssTask = tasks.find(
				(t) => t.collegeId === task.collegeId && t.taskType === "css_profile",
			);
			if (cssTask?.deadlineDate && task.deadlineDate) {
				if (new Date(cssTask.deadlineDate) < new Date(task.deadlineDate)) {
					return {
						...task,
						isConflict: true,
						conflictNote: `Complete CSS Profile (due ${new Date(cssTask.deadlineDate).toLocaleDateString()}) before this deadline`,
					};
				}
			}
		}
		return task;
	});
}
