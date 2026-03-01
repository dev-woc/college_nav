import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";
import { Separator } from "@/components/ui/separator";

export default function SignupPage() {
	if (process.env.SKIP_AUTH === "true") redirect("/api/dev/setup");
	return (
		<div className="space-y-8">
			<div>
				<p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">
					Free for every student
				</p>
				<h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Start building your personalized college list
				</p>
			</div>
			<div className="space-y-4">
				<GoogleButton />
				<div className="flex items-center gap-4">
					<Separator className="flex-1" />
					<span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
					<Separator className="flex-1" />
				</div>
				<Suspense>
					<SignupForm />
				</Suspense>
				<p className="text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link
						href="/login"
						className="text-foreground font-medium underline-offset-4 hover:underline"
					>
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
