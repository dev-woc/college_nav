import { describe, expect, it } from "vitest";
import { buildTasksForCollegeList, detectConflicts } from "../task-builder";

const baseCollege = {
	id: "col-1",
	scorecardId: 123,
	name: "State University",
	city: "Phoenix",
	state: "AZ",
	ownership: 1,
	admissionRate: 0.7,
	netPrice0_30k: 12000,
	netPrice30_48k: 16000,
	netPrice48_75k: 20000,
	netPrice75_110k: 25000,
	netPrice110kPlus: 35000,
	completionRate: 0.6,
	medianEarnings10yr: 50000,
	studentSize: 40000,
	costOfAttendance: 28000,
	tuitionInState: 12000,
	tuitionOutOfState: 28000,
	cachedAt: new Date(),
};

const baseEntry = {
	id: "entry-1",
	studentProfileId: "sp-1",
	collegeId: "col-1",
	tier: "match" as const,
	admissionScore: 70,
	netPriceScore: 65,
	outcomeScore: 60,
	compositeScore: 65,
	explanation: "",
	applicationStatus: "saved" as const,
	agentRunId: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	college: baseCollege,
};

describe("buildTasksForCollegeList", () => {
	it("always creates a FAFSA task", () => {
		const tasks = buildTasksForCollegeList([baseEntry], "sp-1");
		expect(tasks.find((t) => t.taskType === "fafsa")).toBeDefined();
	});

	it("creates a common_app task for each college", () => {
		const tasks = buildTasksForCollegeList([baseEntry], "sp-1");
		expect(tasks.filter((t) => t.taskType === "common_app")).toHaveLength(1);
	});

	it("creates supplement for reach and match, not likely", () => {
		const likelyEntry = {
			...baseEntry,
			id: "e2",
			tier: "likely" as const,
			college: { ...baseCollege, id: "col-2" },
			collegeId: "col-2",
		};
		const tasks = buildTasksForCollegeList([baseEntry, likelyEntry], "sp-1");
		expect(tasks.filter((t) => t.taskType === "supplement")).toHaveLength(1);
	});

	it("creates CSS Profile for private schools (ownership=2)", () => {
		const privateEntry = {
			...baseEntry,
			college: { ...baseCollege, ownership: 2 },
		};
		const tasks = buildTasksForCollegeList([privateEntry], "sp-1");
		expect(tasks.find((t) => t.taskType === "css_profile")).toBeDefined();
	});

	it("does NOT create CSS Profile for public schools", () => {
		const tasks = buildTasksForCollegeList([baseEntry], "sp-1");
		expect(tasks.find((t) => t.taskType === "css_profile")).toBeUndefined();
	});
});

describe("detectConflicts", () => {
	it("marks common_app as conflict when css_profile due first", () => {
		const privateEntry = {
			...baseEntry,
			college: { ...baseCollege, ownership: 2 },
		};
		const tasks = buildTasksForCollegeList([privateEntry], "sp-1");
		const detected = detectConflicts(tasks);
		const commonApp = detected.find((t) => t.taskType === "common_app");
		expect(commonApp?.isConflict).toBe(true);
	});
});
