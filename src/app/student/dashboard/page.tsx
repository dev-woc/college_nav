"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CollegeList } from "@/components/student/college-list";
import { track } from "@/lib/analytics";
import type { IncomeBracket, TieredCollegeList, UserWithProfile } from "@/types";

export default function StudentDashboardPage() {
	const router = useRouter();
	const [userWithProfile, setUserWithProfile] = useState<UserWithProfile | null>(null);
	const [collegeList, setCollegeList] = useState<TieredCollegeList | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRunningAgent, setIsRunningAgent] = useState(false);

	const fetchCollegeList = useCallback(async () => {
		const res = await fetch("/api/student/college-list");
		if (res.ok) {
			const data: TieredCollegeList = await res.json();
			setCollegeList(data);
			return data;
		}
		return null;
	}, []);

	const runAgent = useCallback(async () => {
		setIsRunningAgent(true);
		track("agent_run_triggered", { agentType: "discovery" });
		try {
			const res = await fetch("/api/agents/discovery", { method: "POST" });
			if (!res.ok) {
				const json = await res.json();
				toast.error(json.error ?? "Failed to build college list");
				return;
			}
			await fetchCollegeList();
		} catch {
			toast.error("Something went wrong building your college list.");
		} finally {
			setIsRunningAgent(false);
		}
	}, [fetchCollegeList]);

	useEffect(() => {
		async function init() {
			setIsLoading(true);

			// Fetch user profile
			const userRes = await fetch("/api/user");
			if (!userRes.ok) {
				if (userRes.status === 401) {
					router.push("/login");
					return;
				}
				setIsLoading(false);
				return;
			}
			const userData: UserWithProfile = await userRes.json();

			// Redirect counselors to their dashboard
			if (userData.userProfile?.role === "counselor") {
				router.push("/counselor/dashboard");
				return;
			}

			// Redirect to onboarding if not completed
			if (!userData.userProfile?.onboardingCompleted) {
				router.push("/student/onboarding");
				return;
			}

			setUserWithProfile(userData);

			// Fetch college list
			const list = await fetchCollegeList();

			// Auto-run agent if no list exists
			const hasEntries =
				(list?.reach.length ?? 0) + (list?.match.length ?? 0) + (list?.likely.length ?? 0) > 0;

			if (!hasEntries) {
				setIsLoading(false);
				await runAgent();
			} else {
				setIsLoading(false);
			}
		}

		init();
	}, [router, fetchCollegeList, runAgent]);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-sm text-muted-foreground">Loading your dashboard...</p>
			</div>
		);
	}

	if (isRunningAgent) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
				<div>
					<h2 className="text-xl font-semibold">Building your college list...</h2>
					<p className="mt-1 text-muted-foreground">
						We're finding the best colleges for you based on your profile.
						<br />
						This takes about 20–30 seconds.
					</p>
				</div>
			</div>
		);
	}

	if (!collegeList) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<p className="text-muted-foreground">Unable to load college list. Please refresh.</p>
			</div>
		);
	}

	const sp = userWithProfile?.studentProfile;
	const incomeBracket = (sp?.incomeBracket as IncomeBracket | null) ?? null;

	const INCOME_LABELS: Record<IncomeBracket, string> = {
		"0_30k": "Under $30k",
		"30_48k": "$30k–$48k",
		"48_75k": "$48k–$75k",
		"75_110k": "$75k–$110k",
		"110k_plus": "Over $110k",
	};

	const LOCATION_LABELS: Record<string, string> = {
		in_state: "In-state only",
		regional: "Regional",
		anywhere: "Anywhere",
	};

	const profileChips = [
		sp?.gpa != null && `GPA ${sp.gpa.toFixed(1)}`,
		sp?.satScore != null && `SAT ${sp.satScore}`,
		sp?.actScore != null && `ACT ${sp.actScore}`,
		sp?.stateOfResidence && sp.stateOfResidence,
		incomeBracket && INCOME_LABELS[incomeBracket],
		sp?.intendedMajor && sp.intendedMajor,
		sp?.collegeTypePreference &&
			sp.collegeTypePreference !== "either" &&
			`${sp.collegeTypePreference[0].toUpperCase()}${sp.collegeTypePreference.slice(1)} colleges`,
		sp?.locationPreference && LOCATION_LABELS[sp.locationPreference],
		sp?.isFirstGen && "First-gen",
	].filter(Boolean) as string[];

	const navItems = [
		{
			n: "01",
			title: "Financial Aid",
			desc: "Net costs & scholarships",
			href: "/student/financial-aid",
		},
		{
			n: "02",
			title: "Applications",
			desc: "Track deadlines & requirements",
			href: "/student/applications",
		},
		{ n: "03", title: "FAFSA Guide", desc: "Step-by-step walkthrough", href: "/student/fafsa" },
		{ n: "04", title: "Career Paths", desc: "Where your major leads", href: "/student/career" },
	];

	return (
		<div className="mx-auto max-w-5xl">
			{/* Profile / search parameters */}
			<div className="mb-8 border border-black/[0.06] p-5">
				<div className="flex items-start justify-between gap-4 flex-wrap">
					<div>
						<p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">
							Your search
						</p>
						<div className="flex flex-wrap gap-2">
							{profileChips.map((chip) => (
								<span
									key={chip}
									className="text-xs font-medium px-3 py-1 border border-black/[0.1] bg-black/[0.02]"
								>
									{chip}
								</span>
							))}
						</div>
					</div>
					<Link
						href="/student/onboarding"
						className="shrink-0 text-xs text-muted-foreground border border-black/[0.1] px-3 py-1.5 hover:border-black/20 hover:text-foreground transition-colors"
					>
						Edit profile →
					</Link>
				</div>
			</div>

			<div className="mb-8 grid grid-cols-2 gap-px bg-black/[0.06] md:grid-cols-4">
				{navItems.map((item) => (
					<Link key={item.n} href={item.href}>
						<div className="bg-background p-6 hover:bg-black/[0.02] transition-colors group cursor-pointer min-h-[100px]">
							<span className="text-xs font-mono text-muted-foreground/40 group-hover:text-foreground/60 transition-colors">
								{item.n}
							</span>
							<h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
							<p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
						</div>
					</Link>
				))}
			</div>
			<CollegeList list={collegeList} incomeBracket={incomeBracket} onRefresh={fetchCollegeList} />
		</div>
	);
}
