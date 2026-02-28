"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { AidComponent } from "@/types";

interface AwardLetterUploaderProps {
	collegeList: Array<{ collegeId: string; collegeName: string }>;
	onUploaded: () => void;
}

interface ParsedResult {
	components: AidComponent[];
	summary: {
		freeMoneyTotal: number;
		loanTotal: number;
		workStudyTotal: number;
		outOfPocket: number;
	};
}

const CATEGORY_STYLES: Record<AidComponent["category"], string> = {
	grant: "text-green-600",
	scholarship: "text-green-600",
	loan: "text-red-600",
	work_study: "text-blue-600",
};

const CATEGORY_LABELS: Record<AidComponent["category"], string> = {
	grant: "Grant",
	scholarship: "Scholarship",
	loan: "Loan",
	work_study: "Work-Study",
};

export function AwardLetterUploader({ collegeList, onUploaded }: AwardLetterUploaderProps) {
	const [selectedCollegeId, setSelectedCollegeId] = useState("");
	const [text, setText] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<ParsedResult | null>(null);

	const selectedCollege = collegeList.find((c) => c.collegeId === selectedCollegeId);

	async function handleSubmit() {
		if (!selectedCollegeId || !text.trim()) {
			toast.error("Please select a college and paste your award letter text.");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/financial-aid/award-letter", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: text.trim(),
					collegeName: selectedCollege?.collegeName ?? "",
					collegeId: selectedCollegeId,
				}),
			});

			if (!res.ok) {
				toast.error("Failed to parse award letter.");
				return;
			}

			const data: ParsedResult = await res.json();
			setResult(data);
			toast.success("Award letter parsed!");
			onUploaded();
		} catch {
			toast.error("Failed to parse award letter.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Upload Award Letter</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<label htmlFor="college-select" className="text-sm font-medium">
						College
					</label>
					<select
						id="college-select"
						value={selectedCollegeId}
						onChange={(e) => setSelectedCollegeId(e.target.value)}
						className="mt-1 flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs"
					>
						<option value="">Select a college...</option>
						{collegeList.map((c) => (
							<option key={c.collegeId} value={c.collegeId}>
								{c.collegeName}
							</option>
						))}
					</select>
				</div>

				<div>
					<label htmlFor="award-text" className="text-sm font-medium">
						Award Letter Text
					</label>
					<Textarea
						id="award-text"
						placeholder="Paste your award letter text here"
						value={text}
						onChange={(e) => setText(e.target.value)}
						rows={8}
						className="mt-1"
					/>
				</div>

				<Button
					onClick={handleSubmit}
					disabled={isSubmitting || !selectedCollegeId || !text.trim()}
				>
					{isSubmitting && <Loader2 className="size-4 animate-spin" />}
					{isSubmitting ? "Parsing..." : "Parse Award Letter"}
				</Button>

				{result && (
					<div className="mt-4 space-y-3 rounded-lg border p-4">
						<h4 className="text-sm font-semibold">Parsed Breakdown</h4>
						<ul className="space-y-1">
							{result.components.map((comp) => (
								<li key={comp.name} className="flex items-center justify-between text-sm">
									<span>
										<span className={CATEGORY_STYLES[comp.category]}>
											[{CATEGORY_LABELS[comp.category]}]
										</span>{" "}
										{comp.name}
									</span>
									<span className={CATEGORY_STYLES[comp.category]}>
										${comp.amount.toLocaleString()}
									</span>
								</li>
							))}
						</ul>
						<div className="border-t pt-2 text-sm font-medium">
							Free money: ${result.summary.freeMoneyTotal.toLocaleString()} | Loans: $
							{result.summary.loanTotal.toLocaleString()} | You pay: $
							{result.summary.outOfPocket.toLocaleString()}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
