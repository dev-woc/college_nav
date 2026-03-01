import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<nav className="flex items-center justify-between px-6 py-5 md:px-12 border-b border-black/[0.06]">
				<Link href="/" className="text-sm font-semibold tracking-wide">
					College Navigator
				</Link>
			</nav>
			<div className="flex items-start justify-center px-6 py-16 md:px-12">
				<div className="w-full max-w-md">{children}</div>
			</div>
		</div>
	);
}
