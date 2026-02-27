"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
	AgentRun,
	CollegeListEntryWithCollege,
	IncomeBracket,
	TieredCollegeList,
} from "@/types";
import { CollegeCard } from "./college-card";

interface CollegeListProps {
	list: TieredCollegeList;
	incomeBracket?: IncomeBracket | null;
	onRefresh: () => void;
}

interface TierSectionProps {
	title: string;
	description: string;
	entries: CollegeListEntryWithCollege[];
	incomeBracket?: IncomeBracket | null;
	defaultOpen?: boolean;
}

function TierSection({
	title,
	description,
	entries,
	incomeBracket,
	defaultOpen = true,
}: TierSectionProps) {
	const [open, setOpen] = useState(defaultOpen);

	if (entries.length === 0) return null;

	return (
		<div className="space-y-3">
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="flex w-full items-center justify-between text-left"
			>
				<div>
					<h2 className="text-lg font-semibold">
						{title}{" "}
						<span className="text-sm font-normal text-muted-foreground">({entries.length})</span>
					</h2>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>
				<span className="text-muted-foreground">{open ? "▲" : "▼"}</span>
			</button>

			{open && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{entries.map((entry) => (
						<CollegeCard key={entry.id} entry={entry} incomeBracket={incomeBracket} />
					))}
				</div>
			)}
		</div>
	);
}

function AgentRunStatus({ agentRun }: { agentRun: AgentRun | null }) {
	if (!agentRun) return null;

	const time = agentRun.completedAt
		? new Date(agentRun.completedAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
			})
		: null;

	return (
		<p className="text-xs text-muted-foreground">
			{agentRun.status === "completed" && time
				? `Last updated ${time} · ${agentRun.summary}`
				: agentRun.status === "failed"
					? `Last run failed: ${agentRun.errorMessage ?? "Unknown error"}`
					: "Agent running..."}
		</p>
	);
}

export function CollegeList({ list, incomeBracket, onRefresh }: CollegeListProps) {
	const [refreshing, setRefreshing] = useState(false);
	const totalCount = list.reach.length + list.match.length + list.likely.length;

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			const res = await fetch("/api/agents/discovery", { method: "POST" });
			if (!res.ok) {
				const json = await res.json();
				toast.error(json.error ?? "Failed to refresh your college list");
				return;
			}
			toast.success("College list updated!");
			onRefresh();
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setRefreshing(false);
		}
	};

	return (
		<div className="space-y-8">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold">Your College List</h1>
					{totalCount > 0 && (
						<p className="mt-1 text-muted-foreground">
							{totalCount} schools across{" "}
							{[
								list.likely.length > 0 && "likely",
								list.match.length > 0 && "match",
								list.reach.length > 0 && "reach",
							]
								.filter(Boolean)
								.join(", ")}{" "}
							tiers
						</p>
					)}
					<AgentRunStatus agentRun={list.agentRun} />
				</div>
				<Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
					{refreshing ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<RefreshCw className="mr-2 h-4 w-4" />
					)}
					Refresh List
				</Button>
			</div>

			<TierSection
				title="Likely"
				description="Schools where you have a strong chance of admission"
				entries={list.likely}
				incomeBracket={incomeBracket}
				defaultOpen={true}
			/>
			<TierSection
				title="Match"
				description="Schools where you're a competitive applicant"
				entries={list.match}
				incomeBracket={incomeBracket}
				defaultOpen={true}
			/>
			<TierSection
				title="Reach"
				description="More selective schools — worth applying if it's a great fit"
				entries={list.reach}
				incomeBracket={incomeBracket}
				defaultOpen={true}
			/>

			{totalCount === 0 && (
				<div className="flex flex-col items-center gap-3 py-16 text-center">
					<p className="text-muted-foreground">No colleges found.</p>
					<Button onClick={handleRefresh} disabled={refreshing}>
						{refreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Build My List
					</Button>
				</div>
			)}
		</div>
	);
}
