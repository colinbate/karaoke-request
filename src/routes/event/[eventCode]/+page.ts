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
	const [songs, styles] = await Promise.all([
		fetch('/songs.json').then((r) => r.json()) as Promise<Song[]>,
		fetch('/styles.json').then((r) => r.json()) as Promise<string[]>,
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
