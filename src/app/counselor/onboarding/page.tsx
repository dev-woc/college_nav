import { CounselorOnboardingWizard } from "@/components/counselor/onboarding-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CounselorOnboardingPage() {
	return (
		<div className="flex min-h-[70vh] items-center justify-center">
			<div className="w-full max-w-lg">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Set up your school</CardTitle>
						<CardDescription>
							This takes 2 minutes. You'll get a school code your students use to connect to you.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<CounselorOnboardingWizard />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
