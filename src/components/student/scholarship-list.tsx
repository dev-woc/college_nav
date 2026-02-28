"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScholarshipMatch } from "@/types";

interface ScholarshipListProps {
	matches: ScholarshipMatch[];
}

function getDeadlineBadge(days: number | null) {
	if (days === null) {
		return <Badge variant="secondary">Rolling deadline</Badge>;
	}
	if (days <= 3) {
		return <Badge variant="destructive">{days} days left</Badge>;
	}
	if (days <= 7) {
		return <Badge className="bg-yellow-100 text-yellow-800">{days} days left</Badge>;
	}
	return <Badge variant="secondary">{days} days left</Badge>;
}

function getMatchBadge(score: number) {
	const pct = Math.round(score);
	if (score >= 80) {
		return <Badge className="bg-green-100 text-green-800">{pct}% match</Badge>;
	}
	if (score >= 50) {
		return <Badge className="bg-blue-100 text-blue-800">{pct}% match</Badge>;
	}
	return <Badge variant="secondary">{pct}% match</Badge>;
}

function getAmountDisplay(scholarship: ScholarshipMatch["scholarship"]) {
	if (scholarship.amount !== null) {
		return `$${scholarship.amount.toLocaleString()}`;
	}
	if (scholarship.amountMin !== null && scholarship.amountMax !== null) {
		return `$${scholarship.amountMin.toLocaleString()} \u2013 $${scholarship.amountMax.toLocaleString()}`;
	}
	return "Varies";
}

function SkeletonCard() {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-5 w-20" />
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-8 w-24" />
			</CardContent>
		</Card>
	);
}

export function ScholarshipList({ matches }: ScholarshipListProps) {
	if (matches.length === 0) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Running scholarship matching... This can take a moment.
				</p>
				<SkeletonCard />
				<SkeletonCard />
				<SkeletonCard />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{matches.map((m) => (
				<Card key={m.scholarship.id}>
					<CardHeader>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<h3 className="font-semibold">{m.scholarship.name}</h3>
								<p className="mt-1 text-sm text-muted-foreground">
									{getAmountDisplay(m.scholarship)}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								{getMatchBadge(m.matchScore)}
								{getDeadlineBadge(m.daysUntilDeadline)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">{m.scholarship.description}</p>
						{m.matchReasons.length > 0 && (
							<p className="mt-2 text-sm">
								<span className="font-medium">Why you qualify:</span> {m.matchReasons.join(", ")}
							</p>
						)}
						<div className="mt-3">
							<Button size="sm" asChild>
								<a href={m.scholarship.applicationUrl} target="_blank" rel="noopener noreferrer">
									Apply Now
									<ExternalLink className="size-3.5" />
								</a>
							</Button>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
