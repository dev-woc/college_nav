import { anthropic } from "@/lib/ai/client";
import type { CollegeScore, IncomeBracket, StudentProfile } from "@/types";
import { getNetPrice } from "./scoring";

function formatNetPrice(score: CollegeScore, bracket: IncomeBracket): string {
	const price = getNetPrice(score.college, bracket);
	return price ? `$${price.toLocaleString()}/year` : "net price data not available";
}

/**
 * Generate plain-language explanations for a batch of scored colleges via Claude.
 * Returns a Map<batchIndex, explanation>.
 * Batch size should be ≤ 10 to keep prompts manageable.
 */
export async function generateExplanations(
	scores: CollegeScore[],
	student: StudentProfile,
): Promise<Map<number, string>> {
	if (scores.length === 0) return new Map();

	const bracket = (student.incomeBracket ?? "48_75k") as IncomeBracket;

	const collegeDescriptions = scores
		.map((s, i) => {
			const admissionPct = s.admissionScore;
			const np = formatNetPrice(s, bracket);
			const completion = s.college.completionRate
				? `${Math.round(s.college.completionRate * 100)}% graduation rate`
				: "graduation rate unavailable";
			const earnings = s.college.medianEarnings10yr
				? `$${s.college.medianEarnings10yr.toLocaleString()} median earnings 10 years out`
				: "earnings data unavailable";

			return `${i + 1}. ${s.college.name} (${s.college.city}, ${s.college.state}): ${admissionPct}% acceptance rate, net price ${np} for your income bracket, ${completion}, ${earnings}. Tier: ${s.tier}.`;
		})
		.join("\n");

	const firstGenNote = student.isFirstGen
		? "This student is first-generation (neither parent has a 4-year degree)."
		: "";
	const majorNote = student.intendedMajor ? `Intended major: ${student.intendedMajor}.` : "";

	const prompt = `You are a friendly, encouraging college counselor writing personalized college list explanations for a high school student.

Student profile: Grade ${student.gradeLevel ?? "unknown"}, GPA ${student.gpa ?? "unknown"}, state ${student.stateOfResidence ?? "unknown"}. ${firstGenNote} ${majorNote}

Here are the colleges on their list with data:
${collegeDescriptions}

Write a 2–3 sentence plain-English explanation for EACH college, numbered to match. For each, explain:
- Why it appears on their list (admission likelihood, affordability, or strong outcomes)
- The single most compelling reason to consider it
- One caveat if relevant (highly competitive, missing net price data, etc.)

Rules:
- Use plain language. Never use jargon without explaining it.
- Address the student directly as "you."
- Each explanation must be under 65 words.
- Do not repeat the same opening phrase across explanations.

Format your response exactly as:
1. [explanation for college 1]
2. [explanation for college 2]
(continue for all colleges)`;

	const message = await anthropic.messages.create({
		model: "claude-sonnet-4-6",
		max_tokens: 2048,
		messages: [{ role: "user", content: prompt }],
	});

	const text = message.content[0].type === "text" ? message.content[0].text : "";

	// Parse numbered list into a map keyed by 0-based index
	const result = new Map<number, string>();
	const lines = text.split("\n");

	for (const line of lines) {
		const match = line.trim().match(/^(\d+)\.\s+(.+)/);
		if (match) {
			const index = parseInt(match[1]) - 1; // convert to 0-based
			if (index >= 0 && index < scores.length) {
				result.set(index, match[2].trim());
			}
		}
	}

	// Fallback for any missing explanations
	for (let i = 0; i < scores.length; i++) {
		if (!result.has(i)) {
			const s = scores[i];
			result.set(
				i,
				`${s.college.name} is a ${s.tier} school for you based on its ${s.admissionScore}% acceptance rate and affordability for your income bracket.`,
			);
		}
	}

	return result;
}
