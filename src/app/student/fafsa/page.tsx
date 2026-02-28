"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FafsaGuide } from "@/components/student/fafsa-guide";
import type { UserWithProfile } from "@/types";

interface FafsaStepData {
	step: number;
	title: string;
	description: string;
	documents: string[];
	tips: string[];
	url?: string;
	isCompleted: boolean;
}

interface FafsaData {
	steps: FafsaStepData[];
	currentStep: number;
	completedCount: number;
	totalSteps: number;
}

export default function FafsaPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [fafsaData, setFafsaData] = useState<FafsaData | null>(null);

	const fetchFafsa = useCallback(async () => {
		const res = await fetch("/api/fafsa");
		if (res.ok) {
			const data: FafsaData = await res.json();
			setFafsaData(data);
		}
	}, []);

	useEffect(() => {
		async function init() {
			setIsLoading(true);

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

			if (userData.userProfile?.role === "counselor") {
				router.push("/counselor/dashboard");
				return;
			}

			if (!userData.userProfile?.onboardingCompleted) {
				router.push("/student/onboarding");
				return;
			}

			await fetchFafsa();
			setIsLoading(false);
		}

		init();
	}, [router, fetchFafsa]);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-sm text-muted-foreground">Loading FAFSA guide...</p>
			</div>
		);
	}

	return (
		<div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">FAFSA Walkthrough</h1>
				<p className="text-muted-foreground">
					12 steps to unlock your federal aid. Take them one at a time.
				</p>
			</div>
			{fafsaData && (
				<FafsaGuide
					steps={fafsaData.steps}
					currentStep={fafsaData.currentStep}
					completedCount={fafsaData.completedCount}
					totalSteps={fafsaData.totalSteps}
					onStepToggled={fetchFafsa}
				/>
			)}
		</div>
	);
}
