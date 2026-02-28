import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	real,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const userRoleEnum = pgEnum("user_role", ["student", "counselor", "admin"]);

export const incomeBracketEnum = pgEnum("income_bracket", [
	"0_30k",
	"30_48k",
	"48_75k",
	"75_110k",
	"110k_plus",
]);

export const collegeTierEnum = pgEnum("college_tier", ["reach", "match", "likely"]);

export const agentStatusEnum = pgEnum("agent_status", [
	"pending",
	"running",
	"completed",
	"failed",
]);

export const applicationStatusEnum = pgEnum("application_status", [
	"saved",
	"applied",
	"accepted",
	"rejected",
	"enrolled",
]);

export const scholarshipStatusEnum = pgEnum("scholarship_status", [
	"matched",
	"applied",
	"awarded",
	"rejected",
]);

export const taskTypeEnum = pgEnum("task_type", [
	"common_app",
	"supplement",
	"fafsa",
	"css_profile",
	"scholarship_app",
	"institutional_app",
]);

export const taskStatusEnum = pgEnum("task_status", [
	"pending",
	"in_progress",
	"completed",
	"skipped",
]);

// --- Tables ---

// Universal profile for all users (students, counselors, admins)
export const userProfiles = pgTable(
	"user_profiles",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id").notNull().unique(), // Neon Auth user.id
		slug: text("slug").notNull().unique(),
		displayName: text("display_name").notNull().default(""),
		email: text("email").notNull().default(""),
		role: userRoleEnum("role").notNull().default("student"),
		onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("idx_user_profiles_user_id").on(table.userId),
		uniqueIndex("idx_user_profiles_slug").on(table.slug),
		index("idx_user_profiles_role").on(table.role),
	],
);

// Student-specific academic and financial profile
export const studentProfiles = pgTable(
	"student_profiles",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userProfileId: uuid("user_profile_id")
			.notNull()
			.unique()
			.references(() => userProfiles.id, { onDelete: "cascade" }),
		gradeLevel: integer("grade_level"), // 9, 10, 11, 12
		gpa: real("gpa"), // 0.0 - 4.0
		satScore: integer("sat_score"), // 400-1600, nullable
		actScore: integer("act_score"), // 1-36, nullable
		stateOfResidence: text("state_of_residence"), // 2-letter code
		incomeBracket: incomeBracketEnum("income_bracket"),
		isFirstGen: boolean("is_first_gen").notNull().default(false),
		intendedMajor: text("intended_major").notNull().default(""),
		collegeTypePreference: text("college_type_preference").notNull().default("either"), // "public" | "private" | "either"
		locationPreference: text("location_preference").notNull().default("anywhere"), // "in_state" | "anywhere" | "regional"
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index("idx_student_profiles_user_profile_id").on(table.userProfileId)],
);

// Counselor-specific school/district info
export const counselorProfiles = pgTable(
	"counselor_profiles",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userProfileId: uuid("user_profile_id")
			.notNull()
			.unique()
			.references(() => userProfiles.id, { onDelete: "cascade" }),
		schoolName: text("school_name").notNull().default(""),
		district: text("district").notNull().default(""),
		stateCode: text("state_code").notNull().default(""),
		schoolCode: text("school_code").notNull().default(""),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_counselor_profiles_user_profile_id").on(table.userProfileId),
		uniqueIndex("idx_counselor_profiles_school_code").on(table.schoolCode),
	],
);

// Junction: counselor manages student
export const counselorStudents = pgTable(
	"counselor_students",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		counselorProfileId: uuid("counselor_profile_id")
			.notNull()
			.references(() => counselorProfiles.id, { onDelete: "cascade" }),
		studentProfileId: uuid("student_profile_id")
			.notNull()
			.references(() => studentProfiles.id, { onDelete: "cascade" }),
		connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("idx_counselor_students_pair").on(table.counselorProfileId, table.studentProfileId),
		index("idx_counselor_students_counselor").on(table.counselorProfileId),
		index("idx_counselor_students_student").on(table.studentProfileId),
	],
);

// Local cache of College Scorecard data
export const colleges = pgTable(
	"colleges",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		scorecardId: integer("scorecard_id").notNull().unique(), // Scorecard `id` field
		name: text("name").notNull(),
		city: text("city").notNull().default(""),
		state: text("state").notNull().default(""),
		ownership: integer("ownership"), // 1=public, 2=private nonprofit, 3=for-profit
		admissionRate: real("admission_rate"), // 0.0-1.0, null if not reported
		netPrice0_30k: integer("net_price_0_30k"),
		netPrice30_48k: integer("net_price_30_48k"),
		netPrice48_75k: integer("net_price_48_75k"),
		netPrice75_110k: integer("net_price_75_110k"),
		netPrice110kPlus: integer("net_price_110k_plus"),
		completionRate: real("completion_rate"), // 0.0-1.0
		medianEarnings10yr: integer("median_earnings_10yr"),
		studentSize: integer("student_size"),
		costOfAttendance: integer("cost_of_attendance"),
		tuitionInState: integer("tuition_in_state"),
		tuitionOutOfState: integer("tuition_out_of_state"),
		cachedAt: timestamp("cached_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("idx_colleges_scorecard_id").on(table.scorecardId),
		index("idx_colleges_state").on(table.state),
		index("idx_colleges_ownership").on(table.ownership),
	],
);

// A student's personalized college list
export const collegeListEntries = pgTable(
	"college_list_entries",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		studentProfileId: uuid("student_profile_id")
			.notNull()
			.references(() => studentProfiles.id, { onDelete: "cascade" }),
		collegeId: uuid("college_id")
			.notNull()
			.references(() => colleges.id, { onDelete: "cascade" }),
		tier: collegeTierEnum("tier").notNull(),
		admissionScore: real("admission_score").notNull(),
		netPriceScore: real("net_price_score").notNull(),
		outcomeScore: real("outcome_score").notNull(),
		compositeScore: real("composite_score").notNull(),
		explanation: text("explanation").notNull().default(""),
		applicationStatus: applicationStatusEnum("application_status").notNull().default("saved"),
		agentRunId: uuid("agent_run_id"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_college_list_student").on(table.studentProfileId),
		uniqueIndex("idx_college_list_student_college").on(table.studentProfileId, table.collegeId),
	],
);

// Log of agent executions (counselor-visible)
export const agentRuns = pgTable(
	"agent_runs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		studentProfileId: uuid("student_profile_id")
			.notNull()
			.references(() => studentProfiles.id, { onDelete: "cascade" }),
		agentType: text("agent_type").notNull(), // "discovery" | "financial_aid" | etc.
		status: agentStatusEnum("status").notNull().default("pending"),
		summary: text("summary").notNull().default(""),
		durationMs: integer("duration_ms"),
		errorMessage: text("error_message"),
		startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
	},
	(table) => [
		index("idx_agent_runs_student").on(table.studentProfileId),
		index("idx_agent_runs_type").on(table.agentType),
		index("idx_agent_runs_status").on(table.status),
	],
);

// Scholarship database (seeded nationally curated list)
export const scholarships = pgTable(
	"scholarships",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name").notNull(),
		description: text("description").notNull().default(""),
		amount: integer("amount"), // null = varies
		amountMin: integer("amount_min"),
		amountMax: integer("amount_max"),
		deadlineText: text("deadline_text").notNull().default(""), // e.g. "March 1 annually"
		deadlineMonth: integer("deadline_month"), // 1-12, null = rolling
		deadlineDay: integer("deadline_day"),
		minGpa: real("min_gpa"),
		requiresFirstGen: boolean("requires_first_gen").notNull().default(false),
		requiresEssay: boolean("requires_essay").notNull().default(false),
		eligibleStates: text("eligible_states"), // JSON.stringify(string[]) or null = national
		eligibleMajors: text("eligible_majors"), // JSON.stringify(string[]) or null = any
		demographicTags: text("demographic_tags"), // JSON.stringify(string[]) e.g. ["hispanic","black"]
		applicationUrl: text("application_url").notNull().default(""),
		renewable: boolean("renewable").notNull().default(false),
		source: text("source").notNull().default("curated"),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_scholarships_deadline_month").on(table.deadlineMonth),
		index("idx_scholarships_first_gen").on(table.requiresFirstGen),
	],
);

// Student's matched scholarships (from Scholarship Matching Agent)
export const studentScholarships = pgTable(
	"student_scholarships",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		studentProfileId: uuid("student_profile_id")
			.notNull()
			.references(() => studentProfiles.id, { onDelete: "cascade" }),
		scholarshipId: uuid("scholarship_id")
			.notNull()
			.references(() => scholarships.id, { onDelete: "cascade" }),
		matchScore: real("match_score").notNull(),
		matchReasons: text("match_reasons").notNull().default("[]"), // JSON.stringify(string[])
		status: scholarshipStatusEnum("status").notNull().default("matched"),
		agentRunId: uuid("agent_run_id"),
		notifiedAt: timestamp("notified_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("idx_student_scholarships_pair").on(table.studentProfileId, table.scholarshipId),
		index("idx_student_scholarships_student").on(table.studentProfileId),
	],
);

// Parsed award letters (uploaded text → AI-categorized components)
export const awardLetters = pgTable(
	"award_letters",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		studentProfileId: uuid("student_profile_id")
			.notNull()
			.references(() => studentProfiles.id, { onDelete: "cascade" }),
		collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "set null" }),
		collegeName: text("college_name").notNull().default(""),
		academicYear: text("academic_year").notNull().default(""),
		rawText: text("raw_text").notNull().default(""),
		components: text("components").notNull().default("[]"), // JSON.stringify(AidComponent[])
		freeMoneyTotal: integer("free_money_total").notNull().default(0),
		loanTotal: integer("loan_total").notNull().default(0),
		workStudyTotal: integer("work_study_total").notNull().default(0),
		outOfPocket: integer("out_of_pocket").notNull().default(0),
		agentRunId: uuid("agent_run_id"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_award_letters_student").on(table.studentProfileId),
		index("idx_award_letters_college").on(table.collegeId),
	],
);

// Application tasks (from Application Management Agent)
export const applicationTasks = pgTable(
	"application_tasks",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		studentProfileId: uuid("student_profile_id")
			.notNull()
			.references(() => studentProfiles.id, { onDelete: "cascade" }),
		collegeId: uuid("college_id").references(() => colleges.id, {
			onDelete: "cascade",
		}),
		collegeName: text("college_name").notNull().default(""),
		taskType: taskTypeEnum("task_type").notNull(),
		title: text("title").notNull(),
		description: text("description").notNull().default(""),
		deadlineDate: timestamp("deadline_date", { withTimezone: true }),
		deadlineLabel: text("deadline_label").notNull().default(""),
		status: taskStatusEnum("task_status").notNull().default("pending"),
		isConflict: boolean("is_conflict").notNull().default(false),
		conflictNote: text("conflict_note").notNull().default(""),
		agentRunId: uuid("agent_run_id"),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_application_tasks_student").on(table.studentProfileId),
		index("idx_application_tasks_college").on(table.collegeId),
		index("idx_application_tasks_status").on(table.status),
		index("idx_application_tasks_deadline").on(table.deadlineDate),
	],
);

// FAFSA step-by-step progress tracking
export const fafsaProgress = pgTable(
	"fafsa_progress",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		studentProfileId: uuid("student_profile_id")
			.notNull()
			.unique()
			.references(() => studentProfiles.id, { onDelete: "cascade" }),
		completedSteps: text("completed_steps").notNull().default("[]"),
		currentStep: integer("current_step").notNull().default(0),
		notes: text("notes").notNull().default(""),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex("idx_fafsa_progress_student").on(table.studentProfileId)],
);

// --- Relations ---

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
	studentProfile: one(studentProfiles, {
		fields: [userProfiles.id],
		references: [studentProfiles.userProfileId],
	}),
	counselorProfile: one(counselorProfiles, {
		fields: [userProfiles.id],
		references: [counselorProfiles.userProfileId],
	}),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one, many }) => ({
	userProfile: one(userProfiles, {
		fields: [studentProfiles.userProfileId],
		references: [userProfiles.id],
	}),
	collegeListEntries: many(collegeListEntries),
	agentRuns: many(agentRuns),
	counselorStudents: many(counselorStudents),
	studentScholarships: many(studentScholarships),
	awardLetters: many(awardLetters),
	applicationTasks: many(applicationTasks),
	fafsaProgress: one(fafsaProgress, {
		fields: [studentProfiles.id],
		references: [fafsaProgress.studentProfileId],
	}),
}));

export const counselorProfilesRelations = relations(counselorProfiles, ({ one, many }) => ({
	userProfile: one(userProfiles, {
		fields: [counselorProfiles.userProfileId],
		references: [userProfiles.id],
	}),
	counselorStudents: many(counselorStudents),
}));

export const counselorStudentsRelations = relations(counselorStudents, ({ one }) => ({
	counselor: one(counselorProfiles, {
		fields: [counselorStudents.counselorProfileId],
		references: [counselorProfiles.id],
	}),
	student: one(studentProfiles, {
		fields: [counselorStudents.studentProfileId],
		references: [studentProfiles.id],
	}),
}));

export const collegesRelations = relations(colleges, ({ many }) => ({
	listEntries: many(collegeListEntries),
	awardLetters: many(awardLetters),
	applicationTasks: many(applicationTasks),
}));

export const collegeListEntriesRelations = relations(collegeListEntries, ({ one }) => ({
	student: one(studentProfiles, {
		fields: [collegeListEntries.studentProfileId],
		references: [studentProfiles.id],
	}),
	college: one(colleges, {
		fields: [collegeListEntries.collegeId],
		references: [colleges.id],
	}),
}));

export const agentRunsRelations = relations(agentRuns, ({ one }) => ({
	student: one(studentProfiles, {
		fields: [agentRuns.studentProfileId],
		references: [studentProfiles.id],
	}),
}));

export const scholarshipsRelations = relations(scholarships, ({ many }) => ({
	studentScholarships: many(studentScholarships),
}));

export const studentScholarshipsRelations = relations(studentScholarships, ({ one }) => ({
	student: one(studentProfiles, {
		fields: [studentScholarships.studentProfileId],
		references: [studentProfiles.id],
	}),
	scholarship: one(scholarships, {
		fields: [studentScholarships.scholarshipId],
		references: [scholarships.id],
	}),
}));

export const awardLettersRelations = relations(awardLetters, ({ one }) => ({
	student: one(studentProfiles, {
		fields: [awardLetters.studentProfileId],
		references: [studentProfiles.id],
	}),
	college: one(colleges, {
		fields: [awardLetters.collegeId],
		references: [colleges.id],
	}),
}));

export const applicationTasksRelations = relations(applicationTasks, ({ one }) => ({
	student: one(studentProfiles, {
		fields: [applicationTasks.studentProfileId],
		references: [studentProfiles.id],
	}),
	college: one(colleges, {
		fields: [applicationTasks.collegeId],
		references: [colleges.id],
	}),
}));

export const fafsaProgressRelations = relations(fafsaProgress, ({ one }) => ({
	student: one(studentProfiles, {
		fields: [fafsaProgress.studentProfileId],
		references: [studentProfiles.id],
	}),
}));
