/**
 * Career pathway maps: intended major → career options → educational paths.
 *
 * Each pathway shows:
 * - Target jobs with BLS occupation codes and salary ranges
 * - Educational routes: 2-year A.S./A.A. → certificate → 4-year B.S.
 * - Time to entry-level employment at each stage
 * - Example programs (like Valencia College's Building Construction Technology)
 *
 * BLS occupation codes: https://www.bls.gov/oes/current/oes_stru.htm
 */

export interface CareerOption {
	title: string;
	blsOccupationCode: string; // e.g. "17-2051"
	typicalSalaryRange: { low: number; median: number; high: number };
	jobOutlook: "much_faster" | "faster" | "average" | "slower" | "declining";
	outlookPercent: number; // 10-year growth %
	entryRequirement: "certificate" | "associates" | "bachelors" | "masters";
	description: string;
}

export interface EducationStep {
	type: "certificate" | "associates" | "bachelors" | "masters";
	label: string;
	typicalDuration: string; // e.g. "18 months", "2 years"
	credits: number | null;
	description: string;
	examplePrograms: Array<{
		school: string;
		programName: string;
		url: string;
		state: string;
	}>;
	jobsUnlocked: string[]; // job titles accessible at this level
	avgStartingSalary: number | null;
}

export interface CareerPathway {
	majorKeywords: string[]; // match against student.intendedMajor (case-insensitive)
	fieldTitle: string;
	fieldDescription: string;
	careers: CareerOption[];
	educationSteps: EducationStep[];
	transferTip: string | null; // tip for community college → 4-year transfer
	firstGenNote: string | null; // specific guidance for first-gen students
}

export const CAREER_PATHWAYS: CareerPathway[] = [
	// ── Civil Engineering / Construction ──────────────────────────────
	{
		majorKeywords: [
			"civil engineering",
			"construction",
			"building technology",
			"building construction",
			"surveying",
			"engineering technology",
			"construction management",
		],
		fieldTitle: "Civil Engineering & Construction Technology",
		fieldDescription:
			"Civil engineers and construction managers design, build, and oversee the infrastructure we all rely on — roads, bridges, water systems, buildings, and more. This field has consistent demand, strong salaries, and clear pathways from 2-year programs to professional licensure.",
		careers: [
			{
				title: "Civil Engineering Technologist",
				blsOccupationCode: "17-3022",
				typicalSalaryRange: { low: 42_000, median: 57_000, high: 78_000 },
				jobOutlook: "average",
				outlookPercent: 3,
				entryRequirement: "associates",
				description:
					"Support civil engineers in planning and designing infrastructure projects. Entry-level role achievable with an A.S. in Engineering Technology.",
			},
			{
				title: "Construction Manager",
				blsOccupationCode: "11-9021",
				typicalSalaryRange: { low: 65_000, median: 104_000, high: 169_000 },
				jobOutlook: "faster",
				outlookPercent: 8,
				entryRequirement: "bachelors",
				description:
					"Plan, coordinate, and supervise construction projects. One of the most in-demand careers in the field with strong salary growth.",
			},
			{
				title: "Civil Engineer",
				blsOccupationCode: "17-2051",
				typicalSalaryRange: { low: 60_000, median: 95_000, high: 144_000 },
				jobOutlook: "average",
				outlookPercent: 6,
				entryRequirement: "bachelors",
				description:
					"Design and oversee infrastructure projects including roads, bridges, dams, and water systems. Requires a P.E. license for senior roles.",
			},
			{
				title: "Surveying & Mapping Technician",
				blsOccupationCode: "17-3031",
				typicalSalaryRange: { low: 35_000, median: 48_000, high: 67_000 },
				jobOutlook: "average",
				outlookPercent: 3,
				entryRequirement: "associates",
				description:
					"Measure and map land, buildings, and other structures. Entry-level roles available immediately after an 18-month certificate or 2-year A.S.",
			},
			{
				title: "Building Inspector",
				blsOccupationCode: "47-4011",
				typicalSalaryRange: { low: 42_000, median: 62_000, high: 92_000 },
				jobOutlook: "average",
				outlookPercent: 3,
				entryRequirement: "certificate",
				description:
					"Inspect buildings and construction sites for code compliance. Certificate programs can get you working in under a year.",
			},
			{
				title: "Construction Estimator",
				blsOccupationCode: "13-1051",
				typicalSalaryRange: { low: 50_000, median: 73_000, high: 112_000 },
				jobOutlook: "average",
				outlookPercent: 5,
				entryRequirement: "associates",
				description:
					"Estimate the costs of construction projects. Strong demand in residential and commercial construction.",
			},
		],
		educationSteps: [
			{
				type: "certificate",
				label: "Career Certificate (1–1.5 years)",
				typicalDuration: "12–18 months",
				credits: 18,
				description:
					"Fastest path to employment. Certificates in Construction Specialist or Field Survey Technician get you working in under 1.5 years. Ideal if you want income while continuing your education.",
				examplePrograms: [
					{
						school: "Valencia College",
						programName: "Construction Specialist Certificate",
						url: "https://catalog.valenciacollege.edu/degrees/associateinscience/engineeringtechnology/buildingconstructiontechnology/#certificatetext",
						state: "FL",
					},
					{
						school: "Valencia College",
						programName: "Field Survey Technician Certificate",
						url: "https://catalog.valenciacollege.edu/degrees/associateinscience/engineeringtechnology/buildingconstructiontechnology/#certificatetext",
						state: "FL",
					},
				],
				jobsUnlocked: ["Building Inspector", "Construction Laborer", "Survey Technician"],
				avgStartingSalary: 38_000,
			},
			{
				type: "associates",
				label: "Associate in Science — Engineering Technology (2 years)",
				typicalDuration: "2 years",
				credits: 60,
				description:
					"The A.S. in Building Construction Technology covers construction management, surveying, CAD, statics, and materials. Earns you entry-level roles as a technician, estimator, or assistant project manager — while keeping the door open to transfer for a B.S.",
				examplePrograms: [
					{
						school: "Valencia College",
						programName: "A.S. Building Construction Technology",
						url: "https://catalog.valenciacollege.edu/degrees/associateinscience/engineeringtechnology/buildingconstructiontechnology/",
						state: "FL",
					},
					{
						school: "Central Piedmont Community College",
						programName: "A.A.S. Civil Engineering Technology",
						url: "https://www.cpcc.edu/academics/areas-of-study/stem-technologies/civil-engineering-technology",
						state: "NC",
					},
				],
				jobsUnlocked: [
					"Civil Engineering Technologist",
					"Surveying & Mapping Technician",
					"Construction Estimator",
					"Building Inspector",
				],
				avgStartingSalary: 48_000,
			},
			{
				type: "bachelors",
				label: "Bachelor of Science — Civil Engineering (4 years / 2 more after A.S.)",
				typicalDuration: "4 years total (2 if transferring from A.S.)",
				credits: 120,
				description:
					"A B.S. unlocks the full career spectrum including Professional Engineer (P.E.) licensure, project management, and senior roles. Many community college A.S. programs have articulation agreements with state universities — credits transfer cleanly.",
				examplePrograms: [
					{
						school: "University of Central Florida",
						programName: "B.S. Civil Engineering",
						url: "https://www.ucf.edu/degree/civil-engineering-bsce/",
						state: "FL",
					},
					{
						school: "Arizona State University",
						programName: "B.S. Civil, Environmental and Sustainable Engineering",
						url: "https://engineering.asu.edu/undergraduate/",
						state: "AZ",
					},
					{
						school: "Texas A&M University",
						programName: "B.S. Civil Engineering",
						url: "https://engineering.tamu.edu/civil/academics/degrees/bachelors.html",
						state: "TX",
					},
				],
				jobsUnlocked: [
					"Civil Engineer",
					"Construction Manager",
					"Project Manager",
					"Structural Engineer",
					"Transportation Engineer",
				],
				avgStartingSalary: 65_000,
			},
		],
		transferTip:
			"Many Florida community college A.S. programs have 2+2 articulation agreements with UCF, USF, and FAMU. Complete your A.S. at Valencia or similar, then transfer with junior standing. This cuts your 4-year tuition bill roughly in half.",
		firstGenNote:
			"Construction and civil engineering are hands-on fields where experience matters as much as credentials. Many professionals start with a certificate or A.S., work for 1-2 years, and then pursue their B.S. part-time while earning $45k+. You don't have to take on 4 years of debt upfront.",
	},

	// ── Computer Science / Software ───────────────────────────────────
	{
		majorKeywords: [
			"computer science",
			"software engineering",
			"software development",
			"programming",
			"information technology",
			"cybersecurity",
			"data science",
			"computer information",
		],
		fieldTitle: "Computer Science & Software Engineering",
		fieldDescription:
			"Software engineers, data scientists, and cybersecurity professionals are among the highest-paid and fastest-growing careers. Strong remote work options mean location matters less than skills.",
		careers: [
			{
				title: "Software Developer",
				blsOccupationCode: "15-1252",
				typicalSalaryRange: { low: 70_000, median: 127_000, high: 200_000 },
				jobOutlook: "much_faster",
				outlookPercent: 25,
				entryRequirement: "bachelors",
				description:
					"Design and build software applications. The most common CS career path with strong salary progression.",
			},
			{
				title: "IT Support Specialist",
				blsOccupationCode: "15-1232",
				typicalSalaryRange: { low: 38_000, median: 57_000, high: 86_000 },
				jobOutlook: "average",
				outlookPercent: 5,
				entryRequirement: "associates",
				description: "Entry-level IT role achievable with an A.A.S. or CompTIA certifications.",
			},
			{
				title: "Cybersecurity Analyst",
				blsOccupationCode: "15-1212",
				typicalSalaryRange: { low: 65_000, median: 112_000, high: 174_000 },
				jobOutlook: "much_faster",
				outlookPercent: 32,
				entryRequirement: "bachelors",
				description: "Protect organizations from digital attacks. Fastest-growing tech specialty.",
			},
			{
				title: "Data Analyst",
				blsOccupationCode: "15-2051",
				typicalSalaryRange: { low: 55_000, median: 95_000, high: 150_000 },
				jobOutlook: "much_faster",
				outlookPercent: 35,
				entryRequirement: "bachelors",
				description: "Analyze data to help organizations make better decisions.",
			},
		],
		educationSteps: [
			{
				type: "certificate",
				label: "CompTIA / Industry Certifications (3–6 months)",
				typicalDuration: "3–6 months",
				credits: null,
				description:
					"CompTIA A+, Network+, Security+ certifications can lead to entry IT support roles quickly. No degree required.",
				examplePrograms: [
					{
						school: "CompTIA",
						programName: "A+ Certification",
						url: "https://www.comptia.org/certifications/a",
						state: "National (online)",
					},
				],
				jobsUnlocked: ["IT Support Specialist", "Help Desk Technician", "Network Technician"],
				avgStartingSalary: 40_000,
			},
			{
				type: "associates",
				label: "Associate in Science — Computer Information Technology (2 years)",
				typicalDuration: "2 years",
				credits: 60,
				description:
					"Covers programming fundamentals, networking, and systems administration. Strong foundation for transfer to a 4-year CS program.",
				examplePrograms: [
					{
						school: "Valencia College",
						programName: "A.S. Computer Information Technology",
						url: "https://catalog.valenciacollege.edu",
						state: "FL",
					},
				],
				jobsUnlocked: ["IT Support Specialist", "Junior Developer", "QA Tester"],
				avgStartingSalary: 50_000,
			},
			{
				type: "bachelors",
				label: "Bachelor of Science — Computer Science (4 years)",
				typicalDuration: "4 years total",
				credits: 120,
				description:
					"Opens the full spectrum of software engineering, data science, and cybersecurity roles at top employers.",
				examplePrograms: [
					{
						school: "University of Central Florida",
						programName: "B.S. Computer Science",
						url: "https://www.cs.ucf.edu",
						state: "FL",
					},
					{
						school: "Arizona State University",
						programName: "B.S. Computer Science",
						url: "https://engineering.asu.edu",
						state: "AZ",
					},
				],
				jobsUnlocked: [
					"Software Developer",
					"Cybersecurity Analyst",
					"Data Analyst",
					"Machine Learning Engineer",
				],
				avgStartingSalary: 80_000,
			},
		],
		transferTip:
			"Strong articulation agreements exist between Florida community colleges and state universities. An A.S. from Valencia often transfers directly to UCF with junior standing.",
		firstGenNote:
			"Self-taught developers and bootcamp graduates are hired regularly. A CS degree significantly raises your ceiling, but don't wait 4 years to start building and applying. Build projects, use GitHub, and start applying for internships after your second year.",
	},

	// ── Healthcare / Nursing ──────────────────────────────────────────
	{
		majorKeywords: [
			"nursing",
			"healthcare",
			"medical",
			"health science",
			"radiology",
			"dental hygiene",
			"physical therapy",
		],
		fieldTitle: "Healthcare & Nursing",
		fieldDescription:
			"Healthcare is the fastest-growing job sector in the U.S. Registered nurses, healthcare technologists, and allied health professionals are in high demand with strong wages and job security.",
		careers: [
			{
				title: "Registered Nurse (RN)",
				blsOccupationCode: "29-1141",
				typicalSalaryRange: { low: 60_000, median: 81_000, high: 120_000 },
				jobOutlook: "faster",
				outlookPercent: 6,
				entryRequirement: "associates",
				description:
					"Provide patient care. An A.D.N. qualifies you for RN licensure; a B.S.N. is increasingly preferred by hospitals.",
			},
			{
				title: "Medical and Clinical Lab Technologist",
				blsOccupationCode: "29-2011",
				typicalSalaryRange: { low: 48_000, median: 60_000, high: 80_000 },
				jobOutlook: "faster",
				outlookPercent: 7,
				entryRequirement: "bachelors",
				description: "Perform laboratory tests that help diagnose diseases.",
			},
			{
				title: "Radiologic Technologist",
				blsOccupationCode: "29-2034",
				typicalSalaryRange: { low: 48_000, median: 67_000, high: 94_000 },
				jobOutlook: "faster",
				outlookPercent: 6,
				entryRequirement: "associates",
				description: "Operate imaging equipment for patient diagnosis.",
			},
		],
		educationSteps: [
			{
				type: "certificate",
				label: "CNA / Medical Assistant Certificate (3–6 months)",
				typicalDuration: "3–6 months",
				credits: null,
				description:
					"Certified Nursing Assistant and Medical Assistant certificates get you working in healthcare quickly while you pursue your RN or other degree.",
				examplePrograms: [],
				jobsUnlocked: ["CNA", "Medical Assistant", "Patient Care Technician"],
				avgStartingSalary: 32_000,
			},
			{
				type: "associates",
				label: "Associate Degree in Nursing (A.D.N.) — 2 years",
				typicalDuration: "2 years",
				credits: 60,
				description:
					"Qualifies you to sit for the NCLEX-RN exam and work as a Registered Nurse. Many nurses start here and complete a B.S.N. online while working.",
				examplePrograms: [],
				jobsUnlocked: ["Registered Nurse (RN)"],
				avgStartingSalary: 60_000,
			},
			{
				type: "bachelors",
				label: "Bachelor of Science in Nursing (B.S.N.) — 4 years",
				typicalDuration: "4 years",
				credits: 120,
				description:
					"Required for management and specialty nursing roles. Many RNs complete RN-to-BSN bridge programs online while working.",
				examplePrograms: [],
				jobsUnlocked: ["RN (higher pay)", "Nurse Manager", "Specialty RN"],
				avgStartingSalary: 70_000,
			},
		],
		transferTip:
			"RN-to-BSN bridge programs are widely available online and can be completed while working full-time. Many employers offer tuition reimbursement.",
		firstGenNote:
			"Healthcare is one of the most reliable paths from community college to a middle-class income. An A.D.N. can get you to $60k+ in under 3 years. Hospitals often pay for your B.S.N. after you're hired.",
	},

	// ── Business / Entrepreneurship ────────────────────────────────────
	{
		majorKeywords: [
			"business",
			"business administration",
			"entrepreneurship",
			"management",
			"marketing",
			"accounting",
			"finance",
			"economics",
		],
		fieldTitle: "Business Administration & Management",
		fieldDescription:
			"Business degrees open doors across every industry. Specializations in accounting, finance, and marketing offer the strongest starting salaries.",
		careers: [
			{
				title: "Financial Analyst",
				blsOccupationCode: "13-2051",
				typicalSalaryRange: { low: 55_000, median: 96_000, high: 166_000 },
				jobOutlook: "faster",
				outlookPercent: 9,
				entryRequirement: "bachelors",
				description: "Analyze financial data to guide investment and business decisions.",
			},
			{
				title: "Accountant",
				blsOccupationCode: "13-2011",
				typicalSalaryRange: { low: 48_000, median: 78_000, high: 128_000 },
				jobOutlook: "average",
				outlookPercent: 4,
				entryRequirement: "bachelors",
				description:
					"Prepare and examine financial records. CPA certification significantly increases earning potential.",
			},
			{
				title: "Marketing Specialist",
				blsOccupationCode: "13-1161",
				typicalSalaryRange: { low: 40_000, median: 68_000, high: 120_000 },
				jobOutlook: "faster",
				outlookPercent: 8,
				entryRequirement: "bachelors",
				description: "Develop and implement marketing campaigns and strategies.",
			},
		],
		educationSteps: [
			{
				type: "associates",
				label: "Associate in Arts — Business (2 years)",
				typicalDuration: "2 years",
				credits: 60,
				description:
					"A.A. in Business provides the foundation for transfer to a B.S.B.A. program. Can qualify you for entry-level administrative and sales roles.",
				examplePrograms: [],
				jobsUnlocked: ["Administrative Assistant", "Sales Associate", "Bookkeeper"],
				avgStartingSalary: 38_000,
			},
			{
				type: "bachelors",
				label: "Bachelor of Science in Business Administration (4 years)",
				typicalDuration: "4 years",
				credits: 120,
				description:
					"Opens doors to management, financial analysis, marketing, and accounting careers across all industries.",
				examplePrograms: [],
				jobsUnlocked: [
					"Financial Analyst",
					"Accountant",
					"Marketing Manager",
					"Operations Manager",
				],
				avgStartingSalary: 55_000,
			},
		],
		transferTip:
			"Community college A.A. programs in Business transfer cleanly to most state universities with junior standing.",
		firstGenNote:
			"An accounting or finance degree gives you the most predictable path to a middle-class income. Consider adding a CPA exam study plan — the certification pays back fast.",
	},
];

/**
 * Find the most relevant career pathway for a student's intended major.
 * Matches against majorKeywords using partial string matching.
 */
export function findPathwayForMajor(intendedMajor: string): CareerPathway | null {
	if (!intendedMajor?.trim()) return null;

	const major = intendedMajor.toLowerCase();

	for (const pathway of CAREER_PATHWAYS) {
		const matches = pathway.majorKeywords.some(
			(keyword) => major.includes(keyword) || keyword.includes(major),
		);
		if (matches) return pathway;
	}

	return null;
}
