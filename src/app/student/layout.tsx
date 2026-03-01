import Link from "next/link";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-black/[0.06] px-6 py-5 md:px-12">
				<div className="mx-auto flex max-w-5xl items-center justify-between">
					<Link href="/student/dashboard" className="text-sm font-semibold tracking-wide">
						College Navigator
					</Link>
					<nav className="hidden md:flex items-center gap-6">
						<Link
							href="/student/financial-aid"
							className="text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Financial Aid
						</Link>
						<Link
							href="/student/applications"
							className="text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Applications
						</Link>
						<Link
							href="/student/fafsa"
							className="text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							FAFSA
						</Link>
						<Link
							href="/student/career"
							className="text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Career
						</Link>
					</nav>
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-6 py-8 md:px-12">{children}</main>
		</div>
	);
}
