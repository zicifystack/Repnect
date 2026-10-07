import { env } from 'cloudflare:workers';
import { beforeEach } from 'vitest';
import postgres from 'postgres';

beforeEach(async () => {
	const sql = postgres(env.HYPERDRIVE.connectionString, { max: 1, fetch_types: false });
	try {
		await sql`TRUNCATE "user", "session", "account", "verification", "rate_limit", "webhook_event", "newsletter_subscriber", "two_factor", "passkey", "notification" RESTART IDENTITY CASCADE`;
	} finally {
		await sql.end();
	}
});
