import { describe, expect, it } from "vitest";
import type { Employer, EmployerRecruitingPref } from "@/types";
import { matchEmployers } from "../employer-matcher";

function makeEmployer(overrides: Partial<Employer> = {}): Employer {
	return {
		id: "emp-uuid-1",
		name: "Acme Corp",
		industry: "Technology",
		description: "",
		website: "https://acme.com",
		logoUrl: "",
		isVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

function makePref(overrides: Partial<EmployerRecruitingPref> = {}): EmployerRecruitingPref {
	return {
		id: "pref-uuid-1",
		employerId: "emp-uuid-1",
		collegeTiers: JSON.stringify(["reach", "match", "likely"]),
		minGpa: "3.0",
		majorKeywords: JSON.stringify(["computer science", "software"]),
		roleType: "both",
		targetGradYear: null,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

describe("matchEmployers", () => {
	it("returns match when student has overlapping tier", () => {
		const emp = { ...makeEmployer(), recruitingPrefs: [makePref()] };
		const results = matchEmployers([emp], ["match"], "Computer Science");
		expect(results).toHaveLength(1);
		expect(results[0].matchedTiers).toContain("match");
	});

	it("returns empty when no tier overlap", () => {
		const pref = makePref({ collegeTiers: JSON.stringify(["reach"]) });
		const emp = { ...makeEmployer(), recruitingPrefs: [pref] };
		const results = matchEmployers([emp], ["match", "likely"], "Computer Science");
		expect(results).toHaveLength(0);
	});

	it("sets matchedMajor true when major keyword is substring of student major", () => {
		const emp = { ...makeEmployer(), recruitingPrefs: [makePref()] };
		const results = matchEmployers([emp], ["reach", "match"], "Computer Science and Engineering");
		expect(results[0].matchedMajor).toBe(true);
	});

	it("sets matchedMajor false when no keyword matches", () => {
		const pref = makePref({ majorKeywords: JSON.stringify(["nursing", "healthcare"]) });
		const emp = { ...makeEmployer(), recruitingPrefs: [pref] };
		const results = matchEmployers([emp], ["match"], "Computer Science");
		expect(results[0].matchedMajor).toBe(false);
	});

	it("sets matchedMajor true when majorKeywords is empty array (all majors welcome)", () => {
		const pref = makePref({ majorKeywords: JSON.stringify([]) });
		const emp = { ...makeEmployer(), recruitingPrefs: [pref] };
		const results = matchEmployers([emp], ["match"], "Anything at All");
		expect(results[0].matchedMajor).toBe(true);
	});

	it("skips inactive prefs", () => {
		const pref = makePref({ isActive: false });
		const emp = { ...makeEmployer(), recruitingPrefs: [pref] };
		const results = matchEmployers([emp], ["match"], "Computer Science");
		expect(results).toHaveLength(0);
	});

	it("sorts major-match employers before non-major-match employers", () => {
		const empA = {
			...makeEmployer({ id: "emp-a", name: "Zebra Corp" }),
			recruitingPrefs: [makePref({ id: "pref-a", employerId: "emp-a" })],
		};
		const empB = {
			...makeEmployer({ id: "emp-b", name: "Alpha Inc" }),
			recruitingPrefs: [
				makePref({
					id: "pref-b",
					employerId: "emp-b",
					majorKeywords: JSON.stringify(["nursing"]),
				}),
			],
		};
		const results = matchEmployers([empA, empB], ["match"], "Computer Science");
		expect(results[0].employer.name).toBe("Zebra Corp");
		expect(results[1].employer.name).toBe("Alpha Inc");
	});

	it("sorts alphabetically within same matchedMajor tier", () => {
		const empA = {
			...makeEmployer({ id: "emp-a", name: "Zebra Corp" }),
			recruitingPrefs: [
				makePref({ id: "pref-a", employerId: "emp-a", majorKeywords: JSON.stringify([]) }),
			],
		};
		const empB = {
			...makeEmployer({ id: "emp-b", name: "Alpha Inc" }),
			recruitingPrefs: [
				makePref({ id: "pref-b", employerId: "emp-b", majorKeywords: JSON.stringify([]) }),
			],
		};
		const results = matchEmployers([empA, empB], ["match"], "Computer Science");
		expect(results[0].employer.name).toBe("Alpha Inc");
		expect(results[1].employer.name).toBe("Zebra Corp");
	});
});
