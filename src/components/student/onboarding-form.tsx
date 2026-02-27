"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IncomeBracket, StudentOnboardingData } from "@/types";

type Step = 0 | 1 | 2;

interface FormErrors {
	gradeLevel?: string;
	gpa?: string;
	satScore?: string;
	actScore?: string;
	stateOfResidence?: string;
	incomeBracket?: string;
	general?: string;
}

const INCOME_BRACKET_LABELS: Record<IncomeBracket, string> = {
	"0_30k": "Under $30,000/year",
	"30_48k": "$30,000 – $48,000/year",
	"48_75k": "$48,000 – $75,000/year",
	"75_110k": "$75,000 – $110,000/year",
	"110k_plus": "Over $110,000/year",
};

const US_STATES = [
	"AL",
	"AK",
	"AZ",
	"AR",
	"CA",
	"CO",
	"CT",
	"DE",
	"FL",
	"GA",
	"HI",
	"ID",
	"IL",
	"IN",
	"IA",
	"KS",
	"KY",
	"LA",
	"ME",
	"MD",
	"MA",
	"MI",
	"MN",
	"MS",
	"MO",
	"MT",
	"NE",
	"NV",
	"NH",
	"NJ",
	"NM",
	"NY",
	"NC",
	"ND",
	"OH",
	"OK",
	"OR",
	"PA",
	"RI",
	"SC",
	"SD",
	"TN",
	"TX",
	"UT",
	"VT",
	"VA",
	"WA",
	"WV",
	"WI",
	"WY",
	"DC",
];

const STEP_TITLES: Record<Step, string> = {
	0: "Academic Profile",
	1: "Financial Background",
	2: "College Preferences",
};

const STEP_SUBTITLES: Record<Step, string> = {
	0: "Tell us about your grades and test scores",
	1: "This helps us find schools where you can afford to go",
	2: "What kind of college experience are you looking for?",
};

export function OnboardingForm() {
	const router = useRouter();
	const [step, setStep] = useState<Step>(0);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});

	// Step 0 — Academic
	const [gradeLevel, setGradeLevel] = useState<string>("11");
	const [gpa, setGpa] = useState<string>("");
	const [satScore, setSatScore] = useState<string>("");
	const [actScore, setActScore] = useState<string>("");

	// Step 1 — Financial
	const [stateOfResidence, setStateOfResidence] = useState<string>("");
	const [incomeBracket, setIncomeBracket] = useState<IncomeBracket | "">("");
	const [isFirstGen, setIsFirstGen] = useState<boolean>(false);

	// Step 2 — Preferences
	const [intendedMajor, setIntendedMajor] = useState<string>("");
	const [collegeTypePreference, setCollegeTypePreference] = useState<
		"public" | "private" | "either"
	>("either");
	const [locationPreference, setLocationPreference] = useState<
		"in_state" | "anywhere" | "regional"
	>("anywhere");

	const validateStep = (s: Step): boolean => {
		const newErrors: FormErrors = {};

		if (s === 0) {
			const grade = parseInt(gradeLevel);
			if (!gradeLevel || grade < 9 || grade > 12) {
				newErrors.gradeLevel = "Select your grade level (9–12)";
			}
			const gpaNum = parseFloat(gpa);
			if (!gpa || isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
				newErrors.gpa = "Enter your GPA (0.0 – 4.0)";
			}
			if (satScore) {
				const sat = parseInt(satScore);
				if (isNaN(sat) || sat < 400 || sat > 1600) {
					newErrors.satScore = "SAT score must be between 400 and 1600";
				}
			}
			if (actScore) {
				const act = parseInt(actScore);
				if (isNaN(act) || act < 1 || act > 36) {
					newErrors.actScore = "ACT score must be between 1 and 36";
				}
			}
		}

		if (s === 1) {
			if (!stateOfResidence) {
				newErrors.stateOfResidence = "Select your state";
			}
			if (!incomeBracket) {
				newErrors.incomeBracket = "Select your household income range";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleNext = () => {
		if (validateStep(step)) {
			setStep((prev) => (prev + 1) as Step);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateStep(2)) return;

		setLoading(true);
		setErrors({});

		const data: StudentOnboardingData = {
			gradeLevel: parseInt(gradeLevel),
			gpa: parseFloat(gpa),
			satScore: satScore ? parseInt(satScore) : null,
			actScore: actScore ? parseInt(actScore) : null,
			stateOfResidence: stateOfResidence.toUpperCase(),
			incomeBracket: incomeBracket as IncomeBracket,
			isFirstGen,
			intendedMajor: intendedMajor.trim(),
			collegeTypePreference,
			locationPreference,
		};

		try {
			const res = await fetch("/api/onboarding", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!res.ok) {
				const json = await res.json();
				setErrors({ general: json.error || "Failed to save. Please try again." });
				setLoading(false);
				return;
			}

			router.push("/student/dashboard");
		} catch {
			setErrors({ general: "Something went wrong. Please try again." });
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Step indicator */}
			<div className="flex items-center gap-2">
				{([0, 1, 2] as Step[]).map((s) => (
					<div key={s} className="flex items-center gap-2">
						<div
							className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
								s < step
									? "bg-primary text-primary-foreground"
									: s === step
										? "border-2 border-primary text-primary"
										: "border border-muted-foreground text-muted-foreground"
							}`}
						>
							{s + 1}
						</div>
						{s < 2 && <div className="h-px w-8 bg-border" />}
					</div>
				))}
			</div>

			<div>
				<h2 className="text-xl font-semibold">{STEP_TITLES[step]}</h2>
				<p className="text-sm text-muted-foreground">{STEP_SUBTITLES[step]}</p>
			</div>

			<form
				onSubmit={
					step === 2
						? handleSubmit
						: (e) => {
								e.preventDefault();
								handleNext();
							}
				}
				className="space-y-4"
			>
				{/* Step 0: Academic */}
				{step === 0 && (
					<>
						<div className="space-y-2">
							<Label htmlFor="gradeLevel">Current Grade Level</Label>
							<select
								id="gradeLevel"
								value={gradeLevel}
								onChange={(e) => setGradeLevel(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<option value="">Select grade...</option>
								<option value="9">9th Grade (Freshman)</option>
								<option value="10">10th Grade (Sophomore)</option>
								<option value="11">11th Grade (Junior)</option>
								<option value="12">12th Grade (Senior)</option>
							</select>
							{errors.gradeLevel && <p className="text-sm text-destructive">{errors.gradeLevel}</p>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="gpa">Unweighted GPA (0.0 – 4.0)</Label>
							<Input
								id="gpa"
								type="number"
								step="0.01"
								min="0"
								max="4.0"
								placeholder="3.5"
								value={gpa}
								onChange={(e) => setGpa(e.target.value)}
							/>
							{errors.gpa && <p className="text-sm text-destructive">{errors.gpa}</p>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="satScore">SAT Score (optional)</Label>
							<Input
								id="satScore"
								type="number"
								min="400"
								max="1600"
								placeholder="1200"
								value={satScore}
								onChange={(e) => setSatScore(e.target.value)}
							/>
							{errors.satScore && <p className="text-sm text-destructive">{errors.satScore}</p>}
						</div>

						<div className="space-y-2">
							<Label htmlFor="actScore">ACT Score (optional)</Label>
							<Input
								id="actScore"
								type="number"
								min="1"
								max="36"
								placeholder="24"
								value={actScore}
								onChange={(e) => setActScore(e.target.value)}
							/>
							{errors.actScore && <p className="text-sm text-destructive">{errors.actScore}</p>}
						</div>
					</>
				)}

				{/* Step 1: Financial */}
				{step === 1 && (
					<>
						<div className="space-y-2">
							<Label htmlFor="state">State of Residence</Label>
							<select
								id="state"
								value={stateOfResidence}
								onChange={(e) => setStateOfResidence(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<option value="">Select state...</option>
								{US_STATES.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
							{errors.stateOfResidence && (
								<p className="text-sm text-destructive">{errors.stateOfResidence}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label>Household Income</Label>
							<p className="text-xs text-muted-foreground">
								This helps us show you the actual cost you'd pay — not just the sticker price.
							</p>
							<div className="space-y-2">
								{(Object.entries(INCOME_BRACKET_LABELS) as [IncomeBracket, string][]).map(
									([value, label]) => (
										<label
											key={value}
											className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
												incomeBracket === value
													? "border-primary bg-primary/5"
													: "border-border hover:border-primary/50"
											}`}
										>
											<input
												type="radio"
												name="incomeBracket"
												value={value}
												checked={incomeBracket === value}
												onChange={() => setIncomeBracket(value)}
												className="sr-only"
											/>
											<div
												className={`h-4 w-4 rounded-full border-2 ${
													incomeBracket === value
														? "border-primary bg-primary"
														: "border-muted-foreground"
												}`}
											/>
											<span className="text-sm">{label}</span>
										</label>
									),
								)}
							</div>
							{errors.incomeBracket && (
								<p className="text-sm text-destructive">{errors.incomeBracket}</p>
							)}
						</div>

						<label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
							<input
								type="checkbox"
								checked={isFirstGen}
								onChange={(e) => setIsFirstGen(e.target.checked)}
								className="mt-0.5 h-4 w-4 rounded"
							/>
							<div>
								<p className="text-sm font-medium">I am a first-generation college student</p>
								<p className="text-xs text-muted-foreground">
									Neither of my parents completed a 4-year college degree.
								</p>
							</div>
						</label>
					</>
				)}

				{/* Step 2: Preferences */}
				{step === 2 && (
					<>
						<div className="space-y-2">
							<Label htmlFor="major">Intended Major (optional)</Label>
							<Input
								id="major"
								placeholder="e.g. Computer Science, Nursing, Business"
								value={intendedMajor}
								onChange={(e) => setIntendedMajor(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label>Type of College</Label>
							<div className="grid grid-cols-3 gap-2">
								{(
									[
										["public", "Public"],
										["private", "Private"],
										["either", "Either"],
									] as const
								).map(([value, label]) => (
									<button
										key={value}
										type="button"
										onClick={() => setCollegeTypePreference(value)}
										className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
											collegeTypePreference === value
												? "border-primary bg-primary/5 text-primary"
												: "border-border hover:border-primary/50"
										}`}
									>
										{label}
									</button>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<Label>Location Preference</Label>
							<div className="space-y-2">
								{(
									[
										["in_state", "In-state only", "Focus on schools in my state (often cheaper)"],
										["regional", "Regional", "My state + neighboring states"],
										["anywhere", "Anywhere", "Open to colleges nationwide"],
									] as const
								).map(([value, label, desc]) => (
									<label
										key={value}
										className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
											locationPreference === value
												? "border-primary bg-primary/5"
												: "border-border hover:border-primary/50"
										}`}
									>
										<input
											type="radio"
											name="locationPreference"
											value={value}
											checked={locationPreference === value}
											onChange={() => setLocationPreference(value)}
											className="sr-only"
										/>
										<div
											className={`h-4 w-4 shrink-0 rounded-full border-2 ${
												locationPreference === value
													? "border-primary bg-primary"
													: "border-muted-foreground"
											}`}
										/>
										<div>
											<p className="text-sm font-medium">{label}</p>
											<p className="text-xs text-muted-foreground">{desc}</p>
										</div>
									</label>
								))}
							</div>
						</div>
					</>
				)}

				{errors.general && <p className="text-sm text-destructive text-center">{errors.general}</p>}

				<div className="flex gap-3 pt-2">
					{step > 0 && (
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => setStep((prev) => (prev - 1) as Step)}
						>
							Back
						</Button>
					)}
					<Button type="submit" className="flex-1" disabled={loading}>
						{step < 2 ? "Continue" : loading ? "Saving..." : "Find My Colleges"}
					</Button>
				</div>
			</form>
		</div>
	);
}
