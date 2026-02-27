import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy-initialize to prevent build-time failures when DATABASE_URL is not set.
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
	if (!_db) {
		const sql = neon(process.env.DATABASE_URL!);
		_db = drizzle(sql, { schema });
	}
	return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_, prop: string) {
		return (getDb() as unknown as Record<string, unknown>)[prop];
	},
});
