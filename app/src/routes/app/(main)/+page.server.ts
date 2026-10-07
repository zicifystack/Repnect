import { createCtx } from '$lib/server/ctx';
import { listDirectoryItems } from '$lib/server/directory/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, parent }) => {
	const { user } = await parent();
	const ctx = createCtx(platform);

	let directoryCount = 0;
	try {
		const items = await listDirectoryItems(ctx);
		directoryCount = items.length;
	} catch {}

	return { user, directoryCount };
};
