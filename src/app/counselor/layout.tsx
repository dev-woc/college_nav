import Link from "next/link";

export default function CounselorLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<header className="border-b px-6 py-4">
				<div className="mx-auto flex max-w-6xl items-center justify-between">
					<Link href="/counselor/dashboard" className="text-lg font-semibold">
						College Navigator — Counselor
					</Link>
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
		</div>
	);
}
