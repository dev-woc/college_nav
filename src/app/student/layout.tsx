import Link from "next/link";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<header className="border-b px-6 py-4">
				<div className="mx-auto flex max-w-5xl items-center justify-between">
					<Link href="/student/dashboard" className="text-lg font-semibold">
						College Navigator
					</Link>
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
		</div>
	);
}
