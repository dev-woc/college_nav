export interface FafsaStep {
	step: number;
	title: string;
	description: string;
	documents: string[];
	tips: string[];
	url?: string;
}

export const FAFSA_STEPS: FafsaStep[] = [
	{
		step: 1,
		title: "Create Your FSA ID",
		description:
			"You and one parent (if dependent) each need a separate FSA ID — a username and password that serves as your legal signature.",
		documents: ["Social Security Number", "Email address"],
		tips: [
			"Each person must have their OWN email address — you cannot share one.",
			"It can take up to 3 days to verify your SSN. Do this first, before anything else.",
		],
		url: "https://studentaid.gov/fsa-id/create-account/launch",
	},
	{
		step: 2,
		title: "Gather Your Documents",
		description:
			"Collect everything you'll need before starting the FAFSA form. Having documents ready prevents errors.",
		documents: [
			"Your Social Security Number",
			"Your parent's Social Security Number (if dependent)",
			"Federal tax returns (yours + parents' from 2 years ago)",
			"W-2 forms and records of other income",
			"Bank statements and investment records",
		],
		tips: [
			"The FAFSA uses tax info from 2 years ago ('prior-prior year'). For 2026-27 FAFSA, use 2024 tax returns.",
			"If your family's finances changed significantly, you can appeal for a professional judgment review.",
		],
	},
	{
		step: 3,
		title: "Start Your FAFSA at studentaid.gov",
		description: "Log in with your FSA ID and select 'Start New FAFSA' for the correct award year.",
		documents: [],
		tips: [
			"Make sure you select the right award year — for fall 2026 enrollment, choose 2026-27.",
			"Save your progress as you go — the form times out after 45 minutes.",
		],
		url: "https://studentaid.gov/h/apply-for-aid/fafsa",
	},
	{
		step: 4,
		title: "Enter Your Student Information",
		description:
			"Provide your personal information exactly as it appears on your Social Security card.",
		documents: ["Social Security card", "Driver's license or state ID"],
		tips: [
			"Your name must match your Social Security card exactly.",
			"If you're not a U.S. citizen, check eligible non-citizen categories carefully.",
		],
	},
	{
		step: 5,
		title: "Determine Your Dependency Status",
		description:
			"Answer questions to determine if you're a dependent or independent student. Most high school seniors are dependent.",
		documents: [],
		tips: [
			"If you're under 24, not married, not a veteran, and not emancipated, you're almost certainly dependent.",
			"Being financially independent from your parents does NOT make you independent by FAFSA rules.",
		],
	},
	{
		step: 6,
		title: "Enter Parent Information",
		description:
			"Provide your parent's information. Which parent to include depends on your family situation.",
		documents: [
			"Parent's Social Security Number",
			"Parent's FSA ID login",
			"Parent's tax returns and W-2s",
		],
		tips: [
			"If your parents are divorced, report info for the parent you lived with most in the past 12 months.",
			"If your custodial parent remarried, include stepparent's income too.",
		],
	},
	{
		step: 7,
		title: "Link IRS Tax Data (IRS DRT)",
		description:
			"Use the IRS Direct Data Exchange to pull tax info directly — this reduces errors and processing time.",
		documents: [],
		tips: [
			"Using the IRS DRT significantly speeds up processing and reduces chances of verification.",
			"If your family had a major income change (job loss), manually enter corrected numbers and explain in the additional info section.",
		],
	},
	{
		step: 8,
		title: "Enter Financial Information",
		description:
			"Report savings accounts, investments, and other assets. Do NOT include retirement accounts or your primary home.",
		documents: [
			"Bank account balances (as of date you sign)",
			"Investment account balances",
			"529 plan balances",
		],
		tips: [
			"529 plans owned by a parent count as a parental asset (assessed at 5.64% max).",
			"529 plans owned by a grandparent do NOT need to be reported on the FAFSA.",
			"Report asset values as of the day you sign, not December 31.",
		],
	},
	{
		step: 9,
		title: "Add Your School Codes",
		description:
			"Enter the Federal School Code for each college you're considering. You can list up to 20 schools.",
		documents: [],
		tips: [
			"Add ALL schools you're applying to — you can remove them later.",
			"List your state's flagship university first — some state aid uses the first school listed.",
		],
		url: "https://studentaid.gov/fafsa/school-search",
	},
	{
		step: 10,
		title: "Sign and Submit",
		description: "You and your parent (if dependent) each sign with your FSA IDs and submit.",
		documents: [],
		tips: [
			"Both signatures are required — the FAFSA will not submit with only one.",
			"You'll get an email confirmation with a confirmation number — save it.",
		],
	},
	{
		step: 11,
		title: "Review Your Student Aid Report (SAR)",
		description:
			"Within 3-5 days, you'll receive a SAR summarizing your FAFSA. Review it carefully for errors.",
		documents: [],
		tips: [
			"A 'C flag' on your SAR means a school needs to verify your information — respond promptly.",
			"Your Student Aid Index (SAI) is not what you'll pay — schools use it to determine your aid package.",
		],
	},
	{
		step: 12,
		title: "Respond to Verification Requests",
		description:
			"Some students are selected for verification. Submit required documents to your school's financial aid office promptly.",
		documents: [
			"Verification worksheet (from school)",
			"Tax transcripts (IRS.gov)",
			"Identity and statement of educational purpose",
		],
		tips: [
			"Verification is not an accusation of fraud — about 30% of students are selected.",
			"Missing verification deadlines can result in losing all aid.",
		],
	},
];

export const TOTAL_FAFSA_STEPS = FAFSA_STEPS.length; // 12
