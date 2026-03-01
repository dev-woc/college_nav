"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { slugSchema } from "@/lib/validations";
import { SlugInput } from "./slug-input";

interface FormErrors {
	name?: string;
	email?: string;
	password?: string;
	slug?: string;
	schoolName?: string;
	general?: string;
}

export function SignupForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const roleParam = searchParams.get("role");
	const codeParam = searchParams.get("code");
	const isCounselor = roleParam === "counselor";

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [slug, setSlug] = useState("");
	const [schoolName, setSchoolName] = useState("");
	const [district, setDistrict] = useState("");
	const [stateCode, setStateCode] = useState("");
	const [errors, setErrors] = useState<FormErrors>({});
	const [loading, setLoading] = useState(false);

	const validate = (): boolean => {
		const newErrors: FormErrors = {};

		if (!name.trim()) newErrors.name = "Name is required";
		if (!email.trim()) newErrors.email = "Email is required";
		if (password.length < 8) newErrors.password = "Password must be at least 8 characters";

		const slugResult = slugSchema.safeParse(slug);
		if (!slugResult.success) {
			newErrors.slug = slugResult.error.issues[0]?.message ?? "Invalid username";
		}

		if (isCounselor && !schoolName.trim()) {
			newErrors.schoolName = "School name is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setLoading(true);
		setErrors({});

		try {
			// 1. Create Neon Auth user
			const { error } = await authClient.signUp.email({
				email,
				password,
				name,
			});

			if (error) {
				setErrors({ general: error.message || "Failed to create account" });
				setLoading(false);
				return;
			}

			// 2. Create user profile with role
			const profileRes = await fetch("/api/user", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					slug,
					displayName: name,
					role: isCounselor ? "counselor" : "student",
					...(isCounselor && {
						schoolName: schoolName.trim(),
						district: district.trim(),
						stateCode: stateCode.trim().toUpperCase(),
					}),
				}),
			});

			if (!profileRes.ok) {
				const data = await profileRes.json();
				setErrors({ general: data.error || "Failed to create profile" });
				setLoading(false);
				return;
			}

			// 3. Redirect based on role
			router.push(
				isCounselor
					? "/counselor/dashboard"
					: `/student/onboarding${codeParam ? `?code=${codeParam}` : ""}`,
			);
		} catch {
			setErrors({ general: "Something went wrong. Please try again." });
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{isCounselor && (
				<div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
					Creating a <strong>counselor account</strong>. Your students will connect to your caseload
					using your username.
				</div>
			)}

			<div className="space-y-2">
				<Label htmlFor="name">Full Name</Label>
				<Input
					id="name"
					placeholder="Your name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					aria-label="Name"
				/>
				{errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
			</div>

			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					type="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					aria-label="Email"
				/>
				{errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
			</div>

			<div className="space-y-2">
				<Label htmlFor="password">Password</Label>
				<Input
					id="password"
					type="password"
					placeholder="At least 8 characters"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					aria-label="Password"
				/>
				{errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
			</div>

			<SlugInput value={slug} onChange={setSlug} error={errors.slug} />

			{isCounselor && (
				<>
					<div className="space-y-2">
						<Label htmlFor="schoolName">School Name</Label>
						<Input
							id="schoolName"
							placeholder="Lincoln High School"
							value={schoolName}
							onChange={(e) => setSchoolName(e.target.value)}
						/>
						{errors.schoolName && <p className="text-sm text-destructive">{errors.schoolName}</p>}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label htmlFor="district">District (optional)</Label>
							<Input
								id="district"
								placeholder="Unified School District"
								value={district}
								onChange={(e) => setDistrict(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="stateCode">State</Label>
							<Input
								id="stateCode"
								placeholder="AZ"
								maxLength={2}
								value={stateCode}
								onChange={(e) => setStateCode(e.target.value)}
							/>
						</div>
					</div>
				</>
			)}

			{errors.general && <p className="text-sm text-destructive text-center">{errors.general}</p>}

			<Button type="submit" className="w-full" disabled={loading}>
				{loading
					? "Creating Account..."
					: isCounselor
						? "Create Counselor Account"
						: "Create Account"}
			</Button>
		</form>
	);
}
