/**
 * Fire-and-forget analytics wrapper.
 * No-op if NEXT_PUBLIC_POSTHOG_KEY is not set.
 * Only executes in the browser — safe to import anywhere.
 */
export function track(event: string, properties?: Record<string, unknown>): void {
	if (typeof window === "undefined") return;
	const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	if (!key) return;

	// Lazy import prevents posthog-js from running server-side
	import("posthog-js")
		.then(({ default: posthog }) => {
			posthog.capture(event, properties);
		})
		.catch(() => {
			// Silently ignore — analytics must never break the app
		});
}
