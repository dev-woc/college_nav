"use client";

import { ExternalLink } from "lucide-react";
import type { EmployerMatch } from "@/types";

interface EmployerListProps {
	employers: EmployerMatch[];
}

export function EmployerList({ employers }: EmployerListProps) {
	if (employers.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No employers found for your profile yet. Check back after your college list is built.
			</p>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{employers.map((m) => (
				<div key={m.employer.id} className="rounded-xl border p-4">
					<div className="flex items-start justify-between gap-2">
						<h4 className="font-semibold">{m.employer.name}</h4>
						<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
							{m.employer.industry}
						</span>
					</div>
					<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
						{m.employer.description}
					</p>
					<div className="mt-3 flex flex-wrap gap-2">
						<span className="rounded-full bg-muted px-2 py-0.5 text-xs">{m.pref.roleType}</span>
						{m.pref.minGpa !== null && Number(m.pref.minGpa) > 0 && (
							<span className="rounded-full bg-muted px-2 py-0.5 text-xs">
								Min GPA: {m.pref.minGpa}
							</span>
						)}
						{m.matchedMajor && (
							<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
								Major match
							</span>
						)}
					</div>
					<div className="mt-2 flex flex-wrap gap-1">
						{m.matchedTiers.map((tier) => (
							<span
								key={tier}
								className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
							>
								{tier}
							</span>
						))}
					</div>
					{m.employer.website && (
						<a
							href={m.employer.website}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
						>
							Website
							<ExternalLink className="size-3" />
						</a>
					)}
				</div>
			))}
		</div>
	);
}
