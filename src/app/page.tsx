import Link from "next/link";

const devMode = process.env.SKIP_AUTH === "true";

const stats = [
	{ value: "15", suffix: "+", label: "Colleges matched per student" },
	{ value: "$0", suffix: "", label: "Cost to every student" },
	{ value: "54", suffix: "%", label: "Of undergrads are first-gen" },
	{ value: "24/7", suffix: "", label: "AI guidance, always on" },
];

const features = [
	{
		n: "01",
		title: "Real Net Prices",
		desc: "See what you'd actually pay — not the sticker price — based on your income and aid eligibility.",
	},
	{
		n: "02",
		title: "Personalized College List",
		desc: "AI-powered matching across Reach, Match, and Likely tiers. 15 schools built around your profile.",
	},
	{
		n: "03",
		title: "FAFSA Walkthrough",
		desc: "Step-by-step guidance through federal aid. Plain language. No prior college knowledge required.",
	},
	{
		n: "04",
		title: "Scholarship Matching",
		desc: "Automatically surfaced scholarships based on your background, major, and demographics.",
	},
	{
		n: "05",
		title: "Application Tracker",
		desc: "Unified checklist across every school. Deadlines, essays, requirements — nothing falls through.",
	},
	{
		n: "06",
		title: "Career Pathways",
		desc: "Explore majors, expected salaries, and employers actively hiring in your area.",
	},
];

export default function Home() {
	return (
		<div className="min-h-screen bg-[#0d0d12] text-[#f2f0eb] font-sans">
			{/* Nav */}
			<nav className="flex items-center justify-between px-6 py-5 md:px-12 border-b border-white/[0.06]">
				<span className="text-sm font-semibold tracking-wide">College Navigator</span>
				<div className="flex items-center gap-2">
					<Link
						href="/login"
						className="px-4 py-2 text-sm text-[#f2f0eb]/60 hover:text-[#f2f0eb] transition-colors"
					>
						Sign in
					</Link>
					{devMode ? (
						<a
							href="/api/dev/setup"
							className="px-4 py-2 text-sm font-medium bg-[#e2ff72] text-[#0d0d12] rounded-full hover:bg-[#d4f55a] transition-colors"
						>
							Dev Mode →
						</a>
					) : (
						<Link
							href="/signup"
							className="px-4 py-2 text-sm font-medium bg-[#e2ff72] text-[#0d0d12] rounded-full hover:bg-[#d4f55a] transition-colors"
						>
							Get Started
						</Link>
					)}
				</div>
			</nav>

			{/* Hero */}
			<section className="px-6 pt-20 pb-16 md:px-12 md:pt-28 md:pb-20 max-w-6xl mx-auto">
				<p className="text-xs font-medium tracking-[0.2em] uppercase text-[#e2ff72] mb-6">
					Free for every student
				</p>
				<h1 className="text-[2.6rem] md:text-[4.5rem] lg:text-[5.5rem] font-bold leading-[1.05] tracking-tight max-w-4xl">
					The college guidance wealthy families pay $16,000 for.
					<span className="text-[#f2f0eb]/30"> Free.</span>
				</h1>
				<p className="mt-6 text-base md:text-lg text-[#f2f0eb]/50 max-w-xl leading-relaxed">
					Personalized college lists with real net prices, scholarship matches, and plain-English
					guidance — built for first-generation students.
				</p>
				<div className="mt-10 flex flex-col sm:flex-row items-start gap-3">
					{devMode ? (
						<a
							href="/api/dev/setup"
							className="px-7 py-3.5 text-sm font-semibold bg-[#e2ff72] text-[#0d0d12] rounded-full hover:bg-[#d4f55a] transition-colors"
						>
							Enter App →
						</a>
					) : (
						<>
							<Link
								href="/signup"
								className="px-7 py-3.5 text-sm font-semibold bg-[#e2ff72] text-[#0d0d12] rounded-full hover:bg-[#d4f55a] transition-colors"
							>
								Get Started — It's Free
							</Link>
							<Link
								href="/signup?role=counselor"
								className="px-7 py-3.5 text-sm font-medium border border-white/10 text-[#f2f0eb]/70 rounded-full hover:border-white/20 hover:text-[#f2f0eb] transition-colors"
							>
								I'm a Counselor
							</Link>
						</>
					)}
				</div>
			</section>

			{/* Stats bar */}
			<section className="border-y border-white/[0.06] mx-6 md:mx-12">
				<div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
					{stats.map((s, i) => (
						<div
							key={s.label}
							className={`py-8 px-6 ${i < stats.length - 1 ? "border-r border-white/[0.06]" : ""}`}
						>
							<p className="text-3xl md:text-4xl font-bold tracking-tight">
								{s.value}
								<span className="text-[#e2ff72]">{s.suffix}</span>
							</p>
							<p className="mt-1.5 text-xs text-[#f2f0eb]/40 leading-snug">{s.label}</p>
						</div>
					))}
				</div>
			</section>

			{/* Features */}
			<section className="px-6 pt-20 pb-24 md:px-12 max-w-6xl mx-auto">
				<p className="text-xs font-medium tracking-[0.2em] uppercase text-[#f2f0eb]/30 mb-12">
					What's included
				</p>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06]">
					{features.map((f) => (
						<div
							key={f.n}
							className="bg-[#0d0d12] p-8 hover:bg-white/[0.02] transition-colors group"
						>
							<span className="text-xs font-mono text-[#f2f0eb]/20 group-hover:text-[#e2ff72] transition-colors">
								{f.n}
							</span>
							<h3 className="mt-4 text-base font-semibold text-[#f2f0eb]">{f.title}</h3>
							<p className="mt-2 text-sm text-[#f2f0eb]/40 leading-relaxed">{f.desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* Bottom CTA */}
			<section className="border-t border-white/[0.06] px-6 py-20 md:px-12">
				<div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
					<div>
						<h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight max-w-md">
							Start building your college list today.
						</h2>
						<p className="mt-4 text-sm text-[#f2f0eb]/40 max-w-sm">
							Takes 2 minutes. No credit card. No jargon.
						</p>
					</div>
					{!devMode && (
						<div className="flex flex-col sm:flex-row gap-3 shrink-0">
							<Link
								href="/signup"
								className="px-7 py-3.5 text-sm font-semibold bg-[#e2ff72] text-[#0d0d12] rounded-full hover:bg-[#d4f55a] transition-colors text-center"
							>
								Get Started — It's Free
							</Link>
							<Link
								href="/signup?role=counselor"
								className="px-7 py-3.5 text-sm font-medium border border-white/10 text-[#f2f0eb]/70 rounded-full hover:border-white/20 hover:text-[#f2f0eb] transition-colors text-center"
							>
								I'm a Counselor
							</Link>
						</div>
					)}
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-white/[0.06] px-6 py-8 md:px-12">
				<div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
					<span className="text-xs text-[#f2f0eb]/20">College Navigator</span>
					<div className="flex items-center gap-6">
						<Link href="/login" className="text-xs text-[#f2f0eb]/30 hover:text-[#f2f0eb]/60 transition-colors">
							Sign in
						</Link>
						<Link href="/signup" className="text-xs text-[#f2f0eb]/30 hover:text-[#f2f0eb]/60 transition-colors">
							Sign up
						</Link>
						<Link href="/signup?role=counselor" className="text-xs text-[#f2f0eb]/30 hover:text-[#f2f0eb]/60 transition-colors">
							For counselors
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
