import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import type { AidComponent } from "@/types";

// To switch to Anthropic Claude: import { anthropic } from "@/lib/ai/client" and use anthropic("claude-sonnet-4-6")
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama-3.3-70b-versatile");

const PARSE_PROMPT = (
	text: string,
) => `You are a financial aid award letter parser helping first-generation college students understand their aid packages.

Parse the following award letter text and return a JSON array of aid components.

Rules:
- "grant" = free money from school or government (Pell Grant, institutional grants, state grants) — student does NOT repay
- "scholarship" = merit or outside scholarships — student does NOT repay
- "loan" = any loan (subsidized, unsubsidized, PLUS, private, Graduate PLUS) — student MUST repay
- "work_study" = work-study funds — student EARNS by working, not given outright
- mustRepay = true ONLY for loans
- renewable = true if letter indicates the award continues in future years
- amount must be an integer (remove $ and commas)

IMPORTANT: Some award letters disguise loans as "aid" without using the word "loan". If you see terms like "Direct Subsidized", "Direct Unsubsidized", "Federal PLUS", "Perkins", or any repayable amount — classify it as "loan".

Return ONLY valid JSON array, no markdown, no explanation, no code fences:
[{"name":"...","amount":0,"category":"grant","mustRepay":false,"renewable":true}]

Award letter text:
${text}`;

export interface ParsedAwardLetter {
	components: AidComponent[];
	freeMoneyTotal: number;
	loanTotal: number;
	workStudyTotal: number;
	outOfPocket: number; // approximate: costOfAttendance - freeMoneyTotal, if unknown use 0
}

/**
 * Parse award letter text using Groq LLM.
 * Returns categorized aid components and summary totals.
 */
export async function parseAwardLetter(
	rawText: string,
	costOfAttendance?: number | null,
): Promise<ParsedAwardLetter> {
	const fallback: ParsedAwardLetter = {
		components: [],
		freeMoneyTotal: 0,
		loanTotal: 0,
		workStudyTotal: 0,
		outOfPocket: 0,
	};

	if (!rawText.trim()) return fallback;

	try {
		const { text } = await generateText({
			model,
			prompt: PARSE_PROMPT(rawText),
			maxOutputTokens: 2048,
		});

		// Strip markdown code fences if model wraps output
		const cleaned = text
			.replace(/```json\n?/g, "")
			.replace(/```\n?/g, "")
			.trim();

		// Find the JSON array in the response
		const jsonStart = cleaned.indexOf("[");
		const jsonEnd = cleaned.lastIndexOf("]");
		if (jsonStart === -1 || jsonEnd === -1) return fallback;

		const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as AidComponent[];

		if (!Array.isArray(parsed)) return fallback;

		// Validate and sanitize each component
		const components: AidComponent[] = parsed
			.filter(
				(c) =>
					typeof c.name === "string" &&
					typeof c.amount === "number" &&
					["grant", "scholarship", "loan", "work_study"].includes(c.category),
			)
			.map((c) => ({
				name: String(c.name).trim(),
				amount: Math.round(Number(c.amount)),
				category: c.category,
				mustRepay: c.category === "loan",
				renewable: Boolean(c.renewable),
			}));

		// Calculate totals
		const freeMoneyTotal = components
			.filter((c) => c.category === "grant" || c.category === "scholarship")
			.reduce((sum, c) => sum + c.amount, 0);

		const loanTotal = components
			.filter((c) => c.category === "loan")
			.reduce((sum, c) => sum + c.amount, 0);

		const workStudyTotal = components
			.filter((c) => c.category === "work_study")
			.reduce((sum, c) => sum + c.amount, 0);

		const outOfPocket =
			costOfAttendance != null ? Math.max(0, costOfAttendance - freeMoneyTotal) : 0;

		return { components, freeMoneyTotal, loanTotal, workStudyTotal, outOfPocket };
	} catch {
		return fallback;
	}
}
