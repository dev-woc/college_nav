"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";

interface FafsaStepData {
	step: number;
	title: string;
	description: string;
	documents: string[];
	tips: string[];
	url?: string;
	isCompleted: boolean;
}

interface FafsaGuideProps {
	steps: FafsaStepData[];
	currentStep: number;
	completedCount: number;
	totalSteps: number;
	onStepToggled: () => void;
	readOnly?: boolean;
}

export function FafsaGuide({
	steps,
	currentStep,
	completedCount,
	totalSteps,
	onStepToggled,
	readOnly = false,
}: FafsaGuideProps) {
	const firstUncompleted = steps.findIndex((s) => !s.isCompleted);
	const [activeStep, setActiveStep] = useState<number | null>(
		firstUncompleted >= 0 ? steps[firstUncompleted].step : null,
	);
	const [toggling, setToggling] = useState<number | null>(null);

	const progressPct = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

	async function toggleStep(step: FafsaStepData) {
		if (readOnly) return;
		setToggling(step.step);
		try {
			await fetch("/api/fafsa/progress", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ step: step.step, completed: !step.isCompleted }),
			});
			onStepToggled();
		} finally {
			setToggling(null);
		}
	}

	function getStepIcon(step: FafsaStepData, index: number): string {
		if (step.isCompleted) return "\u2705";
		if (index === firstUncompleted) return "\u25B6";
		return "\u25CB";
	}

	return (
		<div className="space-y-4">
			{/* Header + Progress */}
			<div className="space-y-2">
				<p className="text-sm font-medium">
					FAFSA Progress: {completedCount}/{totalSteps} steps complete
				</p>
				<div className="h-2 w-full rounded-full bg-muted">
					<div
						className="h-2 rounded-full bg-green-500 transition-all"
						style={{ width: `${progressPct}%` }}
					/>
				</div>
			</div>

			{/* Steps */}
			<div className="space-y-2">
				{steps.map((step, index) => {
					const isOpen = activeStep === step.step;
					return (
						<div key={step.step} className="rounded-xl border">
							<button
								type="button"
								className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
								onClick={() => setActiveStep(isOpen ? null : step.step)}
							>
								<span className="text-lg">{getStepIcon(step, index)}</span>
								<span className="text-sm font-medium">
									Step {step.step}: {step.title}
								</span>
							</button>

							{isOpen && (
								<div className="border-t px-4 py-3 space-y-3">
									<p className="text-sm text-muted-foreground">{step.description}</p>

									{step.documents.length > 0 && (
										<div>
											<p className="text-sm font-medium">Documents needed:</p>
											<ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
												{step.documents.map((doc) => (
													<li key={doc}>{doc}</li>
												))}
											</ul>
										</div>
									)}

									{step.tips.length > 0 && (
										<div>
											<p className="text-sm font-medium">Tips:</p>
											<ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
												{step.tips.map((tip) => (
													<li key={tip}>{tip}</li>
												))}
											</ul>
										</div>
									)}

									<div className="flex items-center gap-3">
										{!readOnly && (
											<button
												type="button"
												disabled={toggling === step.step}
												onClick={() => toggleStep(step)}
												className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
											>
												{toggling === step.step
													? "..."
													: step.isCompleted
														? "Mark Incomplete"
														: "Mark Complete"}
											</button>
										)}
										{step.url && (
											<a
												href={step.url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 text-sm text-primary underline"
											>
												Go to studentaid.gov
												<ExternalLink className="size-3.5" />
											</a>
										)}
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
