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
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index("idx_counselor_profiles_user_profile_id").on(table.userProfileId)],
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
