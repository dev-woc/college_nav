/**
 * Seed employers for the Career & Employer layer.
 * 8-10 well-known employers with realistic recruiting preferences.
 * Used by POST /api/employers/seed (dev-only).
 */
export const SEED_EMPLOYERS: Array<{
	employer: {
		name: string;
		industry: string;
		description: string;
		website: string;
		logoUrl: string;
		isVerified: boolean;
	};
	prefs: {
		collegeTiers: string;
		minGpa: string;
		majorKeywords: string;
		roleType: "internship" | "full_time" | "both";
		targetGradYear: number | null;
		isActive: boolean;
	}[];
}> = [
	// ── Technology ──────────────────────────────────────────────────
	{
		employer: {
			name: "Google",
			industry: "Technology",
			description:
				"Multinational technology company specializing in internet-related services and products, including search, cloud computing, and software.",
			website: "https://careers.google.com",
			logoUrl: "",
			isVerified: true,
		},
		prefs: [
			{
				collegeTiers: JSON.stringify(["reach", "match"]),
				minGpa: "3.5",
				majorKeywords: JSON.stringify([
					"computer science",
					"software engineering",
					"data science",
					"electrical engineering",
					"mathematics",
				]),
				roleType: "both",
				targetGradYear: null,
				isActive: true,
			},
		],
	},
	{
		employer: {
			name: "Microsoft",
			industry: "Technology",
			description:
				"Global technology company developing and supporting software, services, devices, and solutions.",
			website: "https://careers.microsoft.com",
			logoUrl: "",
			isVerified: true,
		},
		prefs: [
			{
				collegeTiers: JSON.stringify(["reach", "match", "likely"]),
				minGpa: "3.0",
				majorKeywords: JSON.stringify([
					"computer science",
					"software",
					"information technology",
					"engineering",
					"data science",
				]),
				roleType: "both",
				targetGradYear: null,
				isActive: true,
			},
		],
	},
	// ── Healthcare ───────────────────────────────────────────────────
	{
		employer: {
			name: "Kaiser Permanente",
			industry: "Healthcare",
			description:
				"Integrated managed care consortium — one of the largest nonprofit health plans in the United States.",
			website: "https://jobs.kaiserpermanente.org",
			logoUrl: "",
			isVerified: true,
		},
		prefs: [
			{
				collegeTiers: JSON.stringify(["reach", "match", "likely"]),
				minGpa: "3.0",
				majorKeywords: JSON.stringify([
					"nursing",
					"healthcare",
					"health science",
					"public health",
					"biology",
					"pre-med",
				]),
				roleType: "full_time",
				targetGradYear: null,
				isActive: true,
			},
		],
	},
	{
		employer: {
			name: "Mayo Clinic",
			industry: "Healthcare",
			description:
				"Nonprofit academic medical center focused on integrated clinical practice, education, and research.",
			website: "https://jobs.mayoclinic.org",
			logoUrl: "",
			isVerified: true,
		},
		prefs: [
			{
				collegeTiers: JSON.stringify(["reach", "match"]),
				minGpa: "3.5",
				majorKeywords: JSON.stringify([
					"nursing",
					"pre-med",
					"medical",
					"health science",
					"biology",
					"biochemistry",
				]),
				roleType: "both",
				targetGradYear: null,
				isActive: true,
			},
		],
	},
	// ── Finance ──────────────────────────────────────────────────────
	{
		employer: {
			name: "Goldman Sachs",
			industry: "Finance",
			description: "Global investment banking, securities, and investment management firm.",
			website: "https://www.goldmansachs.com/careers",
			logoUrl: "",
			isVerified: true,
		},
		prefs: [
			{
				collegeTiers: JSON.stringify(["reach"]),
				minGpa: "3.7",
				majorKeywords: JSON.stringify([
					"finance",
					"economics",
					"mathematics",
					"statistics",
					"computer science",
					"accounting",
				]),
				roleType: "both",
				targetGradYear: null,
				isActive: true,
			},
		],
	},
	{
		employer: {
			name: "JPMorgan Chase",
			industry: "Finance",
			description:
				"Global financial services firm and one of the largest banking institutions in the United States.",
			website: "https://careers.jpmorgan.com",
			logoUrl: "",
			isVerified: true,
		},
		prefs: [
			{
				collegeTiers: JSON.stringify(["reach", "match"]),
				minGpa: "3.3",
				majorKeywords: JSON.stringify([
					"finance",
					"economics",
					"accounting",
					"business",
					"mathematics",
					"computer science",
				]),
				roleType: "both",
				targetGradYear: null,
				isActive: true,
			},
		],
	},
	// ── Consulting ───────────────────────────────────────────────────
	{
		employer: {
			name: "McKinsey & Company",
			industry: "Consulting",
			description:
				"Global management consulting firm serving leading businesses, governments, and nonprofits.",
			website: "https://www.mckinsey.com/careers",
			logoUrl: "",
			isVerified: true,
		},
		prefs: [
			{
				collegeTiers: JSON.stringify(["reach"]),
				minGpa: "3.7",
				majorKeywords: JSON.stringify([]),
				roleType: "both",
				targetGradYear: null,
				isActive: true,
			},
		],
	},
	{
		employer: {
			name: "Deloitte",
			industry: "Consulting",
			description:
				"Professional services network providing audit, consulting, financial advisory, risk advisory, and tax services.",
			website: "https://www2.deloitte.com/us/en/careers.html",
			logoUrl: "",
			isVerified: true,
		},
		prefs: [
			{
				collegeTiers: JSON.stringify(["reach", "match", "likely"]),
				minGpa: "3.0",
				majorKeywords: JSON.stringify([]),
				roleType: "both",
				targetGradYear: null,
				isActive: true,
			},
		],
	},
	// ── Public Sector / Nonprofit ────────────────────────────────────
	{
		employer: {
			name: "Peace Corps",
			industry: "Public Sector / Nonprofit",
			description:
				"U.S. government program that places volunteers in communities worldwide to work on education, environment, health, and economic development.",
			website: "https://www.peacecorps.gov/volunteer",
			logoUrl: "",
			isVerified: true,
		},
		prefs: [
			{
				collegeTiers: JSON.stringify(["reach", "match", "likely"]),
				minGpa: "0.0",
				majorKeywords: JSON.stringify([]),
				roleType: "full_time",
				targetGradYear: null,
				isActive: true,
			},
		],
	},
	{
		employer: {
			name: "Teach For America",
			industry: "Public Sector / Nonprofit",
			description:
				"Nonprofit organization that recruits college graduates and professionals to teach for two years in low-income communities across the U.S.",
			website: "https://www.teachforamerica.org/join-tfa",
			logoUrl: "",
			isVerified: true,
		},
		prefs: [
			{
				collegeTiers: JSON.stringify(["reach", "match", "likely"]),
				minGpa: "2.5",
				majorKeywords: JSON.stringify([]),
				roleType: "full_time",
				targetGradYear: null,
				isActive: true,
			},
		],
	},
];
