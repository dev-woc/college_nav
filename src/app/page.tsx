import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="flex flex-col items-center gap-8 text-center max-w-2xl">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
					<BookOpen className="h-8 w-8" />
				</div>

				<div className="space-y-3">
					<h1 className="text-4xl font-bold tracking-tight">College Navigator</h1>
					<p className="text-xl text-muted-foreground">
						Your personal college counselor — available 24/7, free for every student.
					</p>
					<p className="text-base text-muted-foreground max-w-md mx-auto">
						Get a personalized college list with real net prices, scholarship matches, and
						plain-English guidance designed for first-generation students.
					</p>
				</div>

				<div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
					<Button asChild size="lg" className="w-full sm:w-auto">
						<Link href="/signup">Get Started — It's Free</Link>
					</Button>
					<Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
						<Link href="/signup?role=counselor">I'm a Counselor</Link>
					</Button>
				</div>

				<p className="text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link href="/login" className="text-primary underline-offset-4 hover:underline">
						Sign in
					</Link>
				</p>

				{/* Feature highlights */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4 w-full text-left">
					{[
						{
							title: "Real Net Prices",
							desc: "See what you'd actually pay — not the sticker price — based on your family income.",
						},
						{
							title: "Personalized List",
							desc: "AI-powered college matching across Reach, Match, and Likely tiers.",
						},
						{
							title: "Built for First-Gen",
							desc: "No prior college knowledge required. Plain language, always.",
						},
					].map((f) => (
						<div key={f.title} className="rounded-xl border p-4 text-left">
							<h3 className="font-semibold">{f.title}</h3>
							<p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
