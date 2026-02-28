import type { InferSelectModel } from "drizzle-orm";
import type {
	agentRuns,
	awardLetters,
	collegeListEntries,
	colleges,
	counselorProfiles,
	counselorStudents,
	scholarships,
	studentProfiles,
	studentScholarships,
	userProfiles,
} from "@/lib/db/schema";

// --- Database model types ---

export type UserProfile = InferSelectModel<typeof userProfiles>;
export type StudentProfile = InferSelectModel<typeof studentProfiles>;
export type CounselorProfile = InferSelectModel<typeof counselorProfiles>;
export type CounselorStudent = InferSelectModel<typeof counselorStudents>;
export type College = InferSelectModel<typeof colleges>;
export type CollegeListEntry = InferSelectModel<typeof collegeListEntries>;
export type AgentRun = InferSelectModel<typeof agentRuns>;
export type Scholarship = InferSelectModel<typeof scholarships>;
export type StudentScholarship = InferSelectModel<typeof studentScholarships>;
export type AwardLetter = InferSelectModel<typeof awardLetters>;

// --- Enum types (match pgEnum values) ---

export type UserRole = "student" | "counselor" | "admin";
export type IncomeBracket = "0_30k" | "30_48k" | "48_75k" | "75_110k" | "110k_plus";
export type CollegeTier = "reach" | "match" | "likely";
export type ApplicationStatus = "saved" | "applied" | "accepted" | "rejected" | "enrolled";
export type AgentStatus = "pending" | "running" | "completed" | "failed";

// --- API response types ---

export interface UserWithProfile {
	userProfile: UserProfile;
	studentProfile: StudentProfile | null;
	counselorProfile: CounselorProfile | null;
}

export interface CollegeListEntryWithCollege extends CollegeListEntry {
	college: College;
}

export interface TieredCollegeList {
	reach: CollegeListEntryWithCollege[];
	match: CollegeListEntryWithCollege[];
	likely: CollegeListEntryWithCollege[];
	agentRun: AgentRun | null;
}

// --- Form / onboarding types ---

export interface StudentOnboardingData {
	gradeLevel: number;
	gpa: number;
	satScore: number | null;
	actScore: number | null;
	stateOfResidence: string;
	incomeBracket: IncomeBracket;
	isFirstGen: boolean;
	intendedMajor: string;
	collegeTypePreference: "public" | "private" | "either";
	locationPreference: "in_state" | "anywhere" | "regional";
}

// --- Scorecard API response shape (fields we request) ---

export interface ScorecardCollege {
	id: number;
	"school.name": string;
	"school.city": string;
	"school.state": string;
	"school.ownership": number;
	"latest.student.size": number | null;
	"latest.admissions.admission_rate.overall": number | null;
	"latest.cost.net_price.public.by_income_level.0-30000": number | null;
	"latest.cost.net_price.public.by_income_level.30001-48000": number | null;
	"latest.cost.net_price.public.by_income_level.48001-75000": number | null;
	"latest.cost.net_price.public.by_income_level.75001-110000": number | null;
	"latest.cost.net_price.public.by_income_level.110001-plus": number | null;
	"latest.cost.net_price.private.by_income_level.0-30000": number | null;
	"latest.cost.net_price.private.by_income_level.30001-48000": number | null;
	"latest.cost.net_price.private.by_income_level.48001-75000": number | null;
	"latest.cost.net_price.private.by_income_level.75001-110000": number | null;
	"latest.cost.net_price.private.by_income_level.110001-plus": number | null;
	"latest.completion.completion_rate_4yr_150nt": number | null;
	"latest.completion.completion_rate_less_than_4yr_150nt": number | null;
	"latest.earnings.10_yrs_after_entry.median": number | null;
	"latest.cost.attendance.academic_year": number | null;
	"latest.cost.tuition.in_state": number | null;
	"latest.cost.tuition.out_of_state": number | null;
}

// --- Financial aid types ---

export interface AidComponent {
	name: string;
	amount: number;
	category: "grant" | "scholarship" | "loan" | "work_study";
	mustRepay: boolean;
	renewable: boolean;
}

export interface FinancialAidSummary {
	collegeId: string;
	collegeName: string;
	netPricePerYear: number | null;
	costOfAttendance: number | null;
	fourYearNetCost: number | null;
	totalDebtEstimate: number | null;
	monthlyPayment: number | null;
	awardLetter: AwardLetter | null;
}

export interface ScholarshipMatch {
	scholarship: Scholarship;
	matchScore: number;
	matchReasons: string[];
	status: "matched" | "applied" | "awarded" | "rejected";
	daysUntilDeadline: number | null;
	notifiedAt: Date | null;
}

// --- Agent scoring types (intermediate, not persisted directly) ---

export interface CollegeScore {
	college: College;
	admissionScore: number; // 0-100
	netPriceScore: number; // 0-100
	outcomeScore: number; // 0-100
	compositeScore: number; // 0-100
	tier: CollegeTier;
}
