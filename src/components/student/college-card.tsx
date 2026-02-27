import type { CollegeListEntryWithCollege, IncomeBracket } from "@/types";

interface CollegeCardProps {
	entry: CollegeListEntryWithCollege;
	incomeBracket?: IncomeBracket | null;
}

const TIER_STYLES = {
	reach: {
		badge: "bg-red-100 text-red-700 border-red-200",
		label: "Reach",
	},
	match: {
		badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
		label: "Match",
	},
	likely: {
		badge: "bg-green-100 text-green-700 border-green-200",
		label: "Likely",
	},
};

function ScoreBar({ label, score }: { label: string; score: number }) {
	const pct = Math.round(score);
	const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-400";

	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>{label}</span>
				<span className="font-medium">{pct}</span>
			</div>
			<div className="h-1.5 w-full rounded-full bg-muted">
				<div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
			</div>
		</div>
	);
}

function getNetPriceForBracket(
	entry: CollegeListEntryWithCollege,
	bracket?: IncomeBracket | null,
): number | null {
	if (!bracket) return null;
	const c = entry.college;
	const map: Record<IncomeBracket, number | null> = {
		"0_30k": c.netPrice0_30k,
		"30_48k": c.netPrice30_48k,
		"48_75k": c.netPrice48_75k,
		"75_110k": c.netPrice75_110k,
		"110k_plus": c.netPrice110kPlus,
	};
	return map[bracket];
}

export function CollegeCard({ entry, incomeBracket }: CollegeCardProps) {
	const { college } = entry;
	const tier = TIER_STYLES[entry.tier];
	const netPrice = getNetPriceForBracket(entry, incomeBracket);
	const admissionRate = college.admissionRate
		? `${Math.round(college.admissionRate * 100)}%`
		: "N/A";

	return (
		<div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-semibold">{college.name}</h3>
					<p className="text-sm text-muted-foreground">
						{college.city}, {college.state}
					</p>
				</div>
				<span
					className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tier.badge}`}
				>
					{tier.label}
				</span>
			</div>

			{/* Net price highlight */}
			{netPrice !== null && (
				<div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
					<p className="text-xs text-muted-foreground">Est. net price for your income</p>
					<p className="text-lg font-bold">
						${netPrice.toLocaleString()}
						<span className="text-sm font-normal text-muted-foreground">/year</span>
					</p>
				</div>
			)}

			{/* Score bars */}
			<div className="mt-4 space-y-2">
				<ScoreBar label="Admission Fit" score={entry.admissionScore} />
				<ScoreBar label="Affordability" score={entry.netPriceScore} />
				<ScoreBar label="Outcomes" score={entry.outcomeScore} />
			</div>

			{/* Claude explanation */}
			{entry.explanation && (
				<p className="mt-4 text-sm text-muted-foreground leading-relaxed italic">
					{entry.explanation}
				</p>
			)}

			{/* Quick stats */}
			<div className="mt-3 flex gap-4 border-t pt-3 text-xs text-muted-foreground">
				<span>Acceptance: {admissionRate}</span>
				{college.medianEarnings10yr && (
					<span>Earnings (10yr): ${(college.medianEarnings10yr / 1000).toFixed(0)}k</span>
				)}
			</div>
		</div>
	);
}
