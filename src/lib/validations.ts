import { z } from "zod";

// Reserved slugs that conflict with app routes
export const RESERVED_SLUGS = [
	"login",
	"signup",
	"student",
	"counselor",
	"onboarding",
	"dashboard",
	"api",
	"admin",
	"about",
	"help",
	"support",
	"terms",
	"privacy",
	"auth",
	"account",
	"profile",
	"public",
	"static",
	"assets",
	"images",
	"favicon",
	// Legacy reserved slugs
	"editor",
	"analytics",
	"settings",
];

export const slugSchema = z
	.string()
	.min(3, "Username must be at least 3 characters")
	.max(30, "Username must be at most 30 characters")
	.regex(
		/^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
		"Username must be lowercase alphanumeric with hyphens, cannot start or end with a hyphen",
	)
	.refine((val) => !RESERVED_SLUGS.includes(val), "This username is reserved");

export const slugCheckSchema = z.object({
	slug: z.string().min(1),
});

// --- College Nav Schemas ---

export const onboardingSchema = z.object({
	gradeLevel: z.number().int().min(9, "Grade must be 9-12").max(12, "Grade must be 9-12"),
	gpa: z.number().min(0, "GPA must be 0.0-4.0").max(4.0, "GPA must be 0.0-4.0"),
	satScore: z.number().int().min(400).max(1600).nullable().optional(),
	actScore: z.number().int().min(1).max(36).nullable().optional(),
	stateOfResidence: z.string().length(2, "Must be a 2-letter state code"),
	incomeBracket: z.enum(["0_30k", "30_48k", "48_75k", "75_110k", "110k_plus"]),
	isFirstGen: z.boolean(),
	intendedMajor: z.string().max(100).default(""),
	collegeTypePreference: z.enum(["public", "private", "either"]).default("either"),
	locationPreference: z.enum(["in_state", "anywhere", "regional"]).default("anywhere"),
});

export const signupSchema = z.object({
	slug: slugSchema,
	role: z.enum(["student", "counselor"]).default("student"),
	displayName: z.string().min(1, "Name is required").max(50),
	// Counselor-only fields
	schoolName: z.string().max(100).optional(),
	district: z.string().max(100).optional(),
	stateCode: z.string().length(2).optional(),
});

// --- Legacy schemas (kept for reference, remove when old routes are deleted) ---

export const profileSchema = z.object({
	displayName: z.string().max(50, "Name must be at most 50 characters"),
	bio: z.string().max(160, "Bio must be at most 160 characters"),
	avatarUrl: z.string().url("Must be a valid URL").or(z.literal("")),
	theme: z.enum(["minimal", "dark", "colorful", "professional"]),
});

export const linkItemSchema = z
	.object({
		type: z.enum(["link", "header", "divider"]),
		title: z.string().max(100).optional(),
		url: z.string().url("Must be a valid URL").optional(),
	})
	.refine(
		(data) => {
			if (data.type === "link") return !!data.title && !!data.url;
			if (data.type === "header") return !!data.title;
			return true;
		},
		{ message: "Links require title and URL; headers require title" },
	);

export const reorderSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().uuid(),
			sortOrder: z.number().int().nonnegative(),
		}),
	),
});
