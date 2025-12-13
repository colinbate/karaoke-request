import type { PageLoad } from './$types';
import type { Song } from '$lib/types';
import type { KaraokeRequest } from '$lib/server/db/schema';

export const load: PageLoad = async ({ fetch, data }) => {
	if (!data.isActive)
		return {
			songs: [] as Song[],
			styles: [] as string[],
			requests: [] as KaraokeRequest[],
			isActive: false,
			eventName: data.eventName,
			readonly: true,
		};
	const [styles, songs] = await Promise.all([
		fetch('/styles.json')
			.then((r) => r.json())
			.catch((err) => (console.error(err), [])) as Promise<string[]>,
		fetch('/songs.json')
			.then((r) => r.json())
			.catch((err) => (console.error(err), [])) as Promise<Song[]>,
	]);

	return {
		songs,
		styles,
		requests: data.requests,
		isActive: data.isActive,
		eventName: data.eventName,
		readonly: data.readonly,
	};
};
