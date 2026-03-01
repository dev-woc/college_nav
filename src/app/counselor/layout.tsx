import Link from "next/link";

export default function CounselorLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-black/[0.06] px-6 py-5 md:px-12">
				<div className="mx-auto flex max-w-6xl items-center justify-between">
					<div className="flex items-center gap-3">
						<Link href="/counselor/dashboard" className="text-sm font-semibold tracking-wide">
							College Navigator
						</Link>
						<span className="text-xs text-muted-foreground border border-black/[0.1] px-2 py-0.5 rounded-full">
							Counselor
						</span>
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-6 py-8 md:px-12">{children}</main>
		</div>
	);
}
