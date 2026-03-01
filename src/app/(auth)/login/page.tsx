import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
	if (process.env.SKIP_AUTH === "true") redirect("/api/dev/setup");
	return (
		<div className="space-y-8">
			<div>
				<p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">
					Welcome back
				</p>
				<h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
			</div>
			<div className="space-y-4">
				<GoogleButton />
				<div className="flex items-center gap-4">
					<Separator className="flex-1" />
					<span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
					<Separator className="flex-1" />
				</div>
				<LoginForm />
				<p className="text-sm text-muted-foreground">
					Don&apos;t have an account?{" "}
					<Link
						href="/signup"
						className="text-foreground font-medium underline-offset-4 hover:underline"
					>
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
