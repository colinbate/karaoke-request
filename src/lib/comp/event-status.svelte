<script lang="ts">
	import type { KaraokeEvent } from '$lib/server/db/schema';
	import { EVENT_STATUS_COLORS } from '$lib/statuses';

	let { event }: { event: KaraokeEvent } = $props();
</script>

<span class="rounded px-2 py-0.5 text-xs {EVENT_STATUS_COLORS[event.status]}">
	{event.status}
</span>
