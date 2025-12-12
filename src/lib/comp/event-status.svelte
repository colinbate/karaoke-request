<script lang="ts">
	import type { KaraokeEvent } from '$lib/server/db/schema';

	const EVENT_STATUS_COLORS: Record<string, string> = {
		upcoming: 'bg-blue-600',
		active: 'bg-green-600',
		complete: 'bg-gray-600',
		cancelled: 'bg-red-900',
	};

	let { event }: { event: KaraokeEvent } = $props();
</script>

<span class="rounded px-2 py-0.5 text-xs {EVENT_STATUS_COLORS[event.status]}">
	{event.status}
</span>
