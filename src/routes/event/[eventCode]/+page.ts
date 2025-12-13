import type { PageLoad } from './$types';
import type { KaraokeRequest } from '$lib/server/db/schema';

export const load: PageLoad = async ({ fetch, data }) => {
	if (!data.isActive)
		return {
			requests: [] as KaraokeRequest[],
			isActive: false,
			eventName: data.eventName,
			readonly: true,
		};

	return {
		requests: data.requests,
		isActive: data.isActive,
		eventName: data.eventName,
		readonly: data.readonly,
	};
};
