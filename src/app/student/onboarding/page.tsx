import { Suspense } from "react";
import { OnboardingForm } from "@/components/student/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
	return (
		<div className="flex min-h-[70vh] items-center justify-center">
			<div className="w-full max-w-lg">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Tell us about yourself</CardTitle>
						<CardDescription>
							This takes about 2 minutes. We'll use this to build a personalized college list with
							real cost estimates — not just sticker prices.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Suspense>
							<OnboardingForm />
						</Suspense>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
