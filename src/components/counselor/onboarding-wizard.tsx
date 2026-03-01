"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";

type Step = 0 | 1 | 2;

interface FormErrors {
	schoolName?: string;
	stateCode?: string;
	general?: string;
}

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
	0: "Confirm your school details",
	1: "Your school code",
	2: "Invite your students",
};

const STEP_SUBTITLES: Record<Step, string> = {
	0: "We captured this at signup — verify and update if needed.",
	1: "Share this with students so they can connect to your caseload.",
	2: "We'll email them a signup link that auto-connects them to your caseload.",
};

export function CounselorOnboardingWizard() {
	const router = useRouter();
	const [step, setStep] = useState<Step>(0);
	const [loading, setLoading] = useState(false);

	// School profile (Step 0)
	const [schoolName, setSchoolName] = useState("");
	const [district, setDistrict] = useState("");
	const [stateCode, setStateCode] = useState("");
	const [errors, setErrors] = useState<FormErrors>({});

	// School code (Step 1)
	const [schoolCode, setSchoolCode] = useState("");
	const [copied, setCopied] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);

	// Invites (Step 2)
	const [emailsText, setEmailsText] = useState("");
	const [inviteLoading, setInviteLoading] = useState(false);
	const [inviteError, setInviteError] = useState("");
	const [invitesSent, setInvitesSent] = useState<number | null>(null);

	// Load current counselor data to pre-populate Step 0
	useEffect(() => {
		fetch("/api/user")
			.then((r) => r.json())
			.then((data) => {
				if (data.counselorProfile) {
					setSchoolCode(data.counselorProfile.schoolCode ?? "");
					setSchoolName(data.counselorProfile.schoolName ?? "");
					setDistrict(data.counselorProfile.district ?? "");
					setStateCode(data.counselorProfile.stateCode ?? "");
				}
			})
			.catch(() => {});
	}, []);

	const validateStep0 = (): boolean => {
		const newErrors: FormErrors = {};
		if (!schoolName.trim()) newErrors.schoolName = "School name is required";
		if (!stateCode.trim() || stateCode.trim().length !== 2) {
			newErrors.stateCode = "Select your state";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleStep0Next = () => {
		if (validateStep0()) setStep(1);
	};

	const handleCopy = async (text: string, which: "code" | "link") => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// Fallback for non-HTTPS environments
			const el = document.createElement("input");
			el.value = text;
			document.body.appendChild(el);
			el.select();
			// biome-ignore lint: execCommand clipboard fallback for non-HTTPS environments
			document.execCommand("copy");
			document.body.removeChild(el);
		}
		if (which === "code") {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} else {
			setCopiedLink(true);
			setTimeout(() => setCopiedLink(false), 2000);
		}
	};

	const parseEmails = (text: string): string[] => {
		return text
			.split(/[\n,;]+/)
			.map((e) => e.trim())
			.filter((e) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
	};

	const completeOnboarding = async () => {
		setLoading(true);
		setErrors({});
		try {
			const res = await fetch("/api/counselor/onboarding", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					schoolName: schoolName.trim(),
					district: district.trim(),
					stateCode: stateCode.trim().toUpperCase(),
				}),
			});
			if (!res.ok) {
				const json = await res.json();
				setErrors({ general: json.error ?? "Failed to save. Please try again." });
				setLoading(false);
				return;
			}
			track("counselor_onboarding_completed", { schoolCode });
			router.push("/counselor/dashboard");
		} catch {
			setErrors({ general: "Something went wrong. Please try again." });
			setLoading(false);
		}
	};

	const handleSendInvites = async () => {
		const emails = parseEmails(emailsText);
		if (emails.length === 0) {
			setInviteError("Enter at least one valid email address");
			return;
		}
		setInviteLoading(true);
		setInviteError("");
		try {
			const res = await fetch("/api/counselor/invite", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ emails }),
			});
			const json = await res.json();
			if (!res.ok) {
				setInviteError(json.error ?? "Failed to send invitations");
				setInviteLoading(false);
				return;
			}
			setInvitesSent(json.sent);
			track("student_invites_sent", { count: json.sent });
		} catch {
			setInviteError("Something went wrong. Please try again.");
		} finally {
			setInviteLoading(false);
		}
	};

	const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
	const shareLink = `${appUrl}/signup?code=${schoolCode}`;

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

			{/* Step 0: Confirm School Profile */}
			{step === 0 && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="schoolName">School Name</Label>
						<Input
							id="schoolName"
							placeholder="Lincoln High School"
							value={schoolName}
							onChange={(e) => setSchoolName(e.target.value)}
						/>
						{errors.schoolName && <p className="text-sm text-destructive">{errors.schoolName}</p>}
					</div>

					<div className="space-y-2">
						<Label htmlFor="district">District (optional)</Label>
						<Input
							id="district"
							placeholder="Unified School District"
							value={district}
							onChange={(e) => setDistrict(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="stateCode">State</Label>
						<select
							id="stateCode"
							value={stateCode}
							onChange={(e) => setStateCode(e.target.value)}
							className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">Select state...</option>
							{US_STATES.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
						{errors.stateCode && <p className="text-sm text-destructive">{errors.stateCode}</p>}
					</div>

					{errors.general && (
						<p className="text-sm text-destructive text-center">{errors.general}</p>
					)}

					<Button className="w-full" onClick={handleStep0Next}>
						Confirm School Details →
					</Button>
				</div>
			)}

			{/* Step 1: School Code */}
			{step === 1 && (
				<div className="space-y-4">
					<div className="rounded-xl border-2 border-primary bg-primary/5 p-6 text-center space-y-2">
						<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
							Your School Code
						</p>
						<p className="text-3xl font-mono font-bold tracking-widest text-primary">
							{schoolCode}
						</p>
						<Button variant="outline" size="sm" onClick={() => handleCopy(schoolCode, "code")}>
							{copied ? "Copied!" : "Copy Code"}
						</Button>
					</div>

					<div className="rounded-lg border bg-muted/40 p-4 space-y-2">
						<p className="text-sm font-medium">Or share a direct signup link:</p>
						<p className="text-xs text-muted-foreground break-all font-mono">{shareLink}</p>
						<Button variant="outline" size="sm" onClick={() => handleCopy(shareLink, "link")}>
							{copiedLink ? "Copied!" : "Copy Link"}
						</Button>
					</div>

					<p className="text-xs text-muted-foreground">
						Students who sign up using your link are automatically connected to your caseload.
					</p>

					<div className="flex gap-3">
						<Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
							Skip
						</Button>
						<Button className="flex-1" onClick={() => setStep(2)}>
							Next: Invite Students →
						</Button>
					</div>
				</div>
			)}

			{/* Step 2: Invite Students */}
			{step === 2 && (
				<div className="space-y-4">
					{invitesSent !== null ? (
						<div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-800 dark:text-green-400">
							✓ Sent {invitesSent} invitation{invitesSent !== 1 ? "s" : ""}! Students will receive
							an email with a signup link.
						</div>
					) : (
						<>
							<div className="space-y-2">
								<Label htmlFor="emails">Student email addresses</Label>
								<p className="text-xs text-muted-foreground">
									One per line, or comma-separated. Up to 100 at a time.
								</p>
								<Textarea
									id="emails"
									rows={6}
									placeholder={"student1@school.edu\nstudent2@school.edu"}
									value={emailsText}
									onChange={(e) => setEmailsText(e.target.value)}
								/>
								{inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
							</div>

							<Button className="w-full" onClick={handleSendInvites} disabled={inviteLoading}>
								{inviteLoading ? "Sending..." : "Send Invitations"}
							</Button>
						</>
					)}

					<Button
						variant="outline"
						className="w-full"
						onClick={completeOnboarding}
						disabled={loading}
					>
						{loading
							? "Setting up..."
							: invitesSent !== null
								? "Go to Dashboard →"
								: "Skip for now — Go to Dashboard"}
					</Button>

					{errors.general && (
						<p className="text-sm text-destructive text-center">{errors.general}</p>
					)}
				</div>
			)}
		</div>
	);
}
