"use client";

import { ExternalLink } from "lucide-react";
import type { CareerOption, CareerPathway, EducationStep } from "@/lib/career/pathways";
import type { BlsWageData } from "@/lib/integrations/bls";

interface CareerPathwayDisplayProps {
	pathway: CareerPathway;
	wageData: Record<string, Partial<BlsWageData>>;
}

function formatWageCompact(amount: number): string {
	return `$${(amount / 1000).toFixed(0)}k`;
}

function formatWageFull(amount: number): string {
	return `$${amount.toLocaleString()}`;
}

function outlookColor(outlook: CareerOption["jobOutlook"]): string {
	switch (outlook) {
		case "much_faster":
		case "faster":
			return "text-green-600";
		case "average":
			return "text-yellow-600";
		case "slower":
		case "declining":
			return "text-red-500";
	}
}

function outlookLabel(outlook: CareerOption["jobOutlook"]): string {
	switch (outlook) {
		case "much_faster":
			return "Much faster than average";
		case "faster":
			return "Faster than average";
		case "average":
			return "Average";
		case "slower":
			return "Slower than average";
		case "declining":
			return "Declining";
	}
}

function requirementLabel(req: CareerOption["entryRequirement"]): string {
	switch (req) {
		case "certificate":
			return "Certificate";
		case "associates":
			return "Associate's";
		case "bachelors":
			return "Bachelor's";
		case "masters":
			return "Master's";
	}
}

function CareerOptionCard({
	career,
	blsData,
}: {
	career: CareerOption;
	blsData?: Partial<BlsWageData>;
}) {
	const medianWage = blsData?.medianAnnualWage ?? career.typicalSalaryRange.median;
	const entryWage = blsData?.entryLevelWage ?? career.typicalSalaryRange.low;

	return (
		<div className="rounded-xl border p-4">
			<div className="flex items-start justify-between gap-2">
				<h4 className="font-semibold">{career.title}</h4>
				<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
					{requirementLabel(career.entryRequirement)}
				</span>
			</div>
			<p className="mt-1 text-sm text-muted-foreground">{career.description}</p>
			<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
				<span>
					Median: <span className="font-medium">{formatWageFull(medianWage)}</span>
				</span>
				<span>
					Entry: <span className="font-medium">{formatWageCompact(entryWage)}</span>
				</span>
				<span className={outlookColor(career.jobOutlook)}>
					{outlookLabel(career.jobOutlook)} ({career.outlookPercent > 0 ? "+" : ""}
					{career.outlookPercent}%)
				</span>
			</div>
		</div>
	);
}

function EducationStepCard({ step }: { step: EducationStep }) {
	const programs = step.examplePrograms.slice(0, 2);

	return (
		<div className="rounded-xl border p-4">
			<div className="flex items-start justify-between gap-2">
				<h4 className="font-semibold">{step.label}</h4>
				<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
					{step.type}
				</span>
			</div>
			<p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
			{step.avgStartingSalary !== null && (
				<p className="mt-2 text-sm">
					Avg starting salary:{" "}
					<span className="font-medium">{formatWageFull(step.avgStartingSalary)}</span>
				</p>
			)}
			{programs.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-2">
					{programs.map((p) => (
						<a
							key={`${p.school}-${p.programName}`}
							href={p.url}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
						>
							{p.school}: {p.programName}
							<ExternalLink className="size-3" />
						</a>
					))}
				</div>
			)}
		</div>
	);
}

export function CareerPathwayDisplay({ pathway, wageData }: CareerPathwayDisplayProps) {
	return (
		<div>
			<h2 className="text-xl font-semibold">{pathway.fieldTitle}</h2>
			<p className="mt-1 text-muted-foreground">{pathway.fieldDescription}</p>

			{pathway.firstGenNote && (
				<div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
					{pathway.firstGenNote}
				</div>
			)}

			<section className="mt-6">
				<h3 className="text-lg font-semibold mb-3">Career Options</h3>
				<div className="grid gap-4 sm:grid-cols-2">
					{pathway.careers.map((career) => (
						<CareerOptionCard
							key={career.blsOccupationCode}
							career={career}
							blsData={wageData[career.blsOccupationCode]}
						/>
					))}
				</div>
			</section>

			<section className="mt-8">
				<h3 className="text-lg font-semibold mb-3">Education Pathways</h3>
				<div className="space-y-4">
					{pathway.educationSteps.map((step) => (
						<EducationStepCard key={step.type} step={step} />
					))}
				</div>
			</section>

			{pathway.transferTip && (
				<div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
					<span className="font-medium">Transfer tip:</span> {pathway.transferTip}
				</div>
			)}
		</div>
	);
}
