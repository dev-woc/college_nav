"use client";

import { HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FinancialAidSummary } from "@/types";

interface FinancialComparisonProps {
	summaries: FinancialAidSummary[];
}

function fmt(value: number | null): string {
	if (value === null) return "\u2014";
	return `$${value.toLocaleString()}`;
}

function findLowest(values: (number | null)[]): number | null {
	const nums = values.filter((v): v is number => v !== null);
	if (nums.length === 0) return null;
	return Math.min(...nums);
}

export function FinancialComparison({ summaries }: FinancialComparisonProps) {
	if (summaries.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				Run the Financial Aid Agent to see your cost comparison.
			</p>
		);
	}

	const lowestNetPrice = findLowest(summaries.map((s) => s.netPricePerYear));
	const lowestFourYear = findLowest(summaries.map((s) => s.fourYearNetCost));
	const lowestDebt = findLowest(summaries.map((s) => s.totalDebtEstimate));
	const lowestMonthly = findLowest(summaries.map((s) => s.monthlyPayment));

	return (
		<div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>School</TableHead>
						<TableHead>
							<span className="inline-flex items-center gap-1">
								Net Price/yr
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<HelpCircle className="size-3.5 text-muted-foreground" />
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-48">
												Net price = sticker price minus grants and scholarships. It&apos;s what you
												actually pay.
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</span>
						</TableHead>
						<TableHead>4-Year Cost</TableHead>
						<TableHead>Est. Debt</TableHead>
						<TableHead>Monthly Payment</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{summaries.map((s) => (
						<TableRow key={s.collegeId}>
							<TableCell className="font-medium">
								<span className="inline-flex items-center gap-2">
									{s.collegeName}
									{s.awardLetter !== null && (
										<Badge className="bg-green-100 text-green-800" variant="outline">
											Award letter &#x2713;
										</Badge>
									)}
								</span>
							</TableCell>
							<TableCell>
								{s.netPricePerYear !== null && s.netPricePerYear === lowestNetPrice ? (
									<Badge className="bg-green-100 text-green-800" variant="outline">
										{fmt(s.netPricePerYear)}/yr
									</Badge>
								) : (
									<span className={s.netPricePerYear === null ? "text-muted-foreground" : ""}>
										{s.netPricePerYear !== null ? `${fmt(s.netPricePerYear)}/yr` : "\u2014"}
									</span>
								)}
							</TableCell>
							<TableCell>
								{s.fourYearNetCost !== null && s.fourYearNetCost === lowestFourYear ? (
									<Badge className="bg-green-100 text-green-800" variant="outline">
										{fmt(s.fourYearNetCost)}
									</Badge>
								) : (
									<span className={s.fourYearNetCost === null ? "text-muted-foreground" : ""}>
										{fmt(s.fourYearNetCost)}
									</span>
								)}
							</TableCell>
							<TableCell>
								{s.totalDebtEstimate !== null && s.totalDebtEstimate === lowestDebt ? (
									<Badge className="bg-green-100 text-green-800" variant="outline">
										{fmt(s.totalDebtEstimate)}
									</Badge>
								) : (
									<span className={s.totalDebtEstimate === null ? "text-muted-foreground" : ""}>
										{fmt(s.totalDebtEstimate)}
									</span>
								)}
							</TableCell>
							<TableCell>
								{s.monthlyPayment !== null && s.monthlyPayment === lowestMonthly ? (
									<Badge className="bg-green-100 text-green-800" variant="outline">
										{fmt(s.monthlyPayment)}/mo
									</Badge>
								) : (
									<span className={s.monthlyPayment === null ? "text-muted-foreground" : ""}>
										{s.monthlyPayment !== null ? `${fmt(s.monthlyPayment)}/mo` : "\u2014"}
									</span>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<p className="mt-3 text-xs text-muted-foreground">
				Estimates based on College Scorecard data. Monthly payment assumes 6.8% federal loan rate
				over 10 years.
			</p>
		</div>
	);
}
