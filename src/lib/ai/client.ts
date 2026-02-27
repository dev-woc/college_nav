import Anthropic from "@anthropic-ai/sdk";

// Lazy-initialize to prevent build-time failures when ANTHROPIC_API_KEY is not set.
let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
	if (!_client) {
		if (!process.env.ANTHROPIC_API_KEY) {
			throw new Error("ANTHROPIC_API_KEY environment variable is required");
		}
		_client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
	}
	return _client;
}

export const anthropic = new Proxy({} as Anthropic, {
	get(_, prop: string) {
		return (getAnthropicClient() as unknown as Record<string, unknown>)[prop];
	},
});
