<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EventStatus from '$lib/comp/event-status.svelte';
	import { partition } from '$lib/utils.js';

	let { data } = $props();

	// Poll for updates every 5 seconds
	$effect(() => {
		const interval = setInterval(() => {
			invalidateAll();
		}, 5000);

		return () => clearInterval(interval);
	});

	function formatTime(dateStr: string) {
		const date = new Date(dateStr); // Assume UTC
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	let [pending, done] = $derived(partition(data.eventRequests, (x) => x.status === 'pending'));
</script>

<div class="flex min-h-dvh flex-col">
	<!-- Header -->
	<header class="border-b border-gray-800 px-4 py-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<a href={resolve('/admin')}>&larr;</a>
				<h1 class="text-xl font-semibold">{data.eventinfo.name} Queue</h1>
				<EventStatus event={data.eventinfo} />
				<span>({data.eventinfo.eventDate})</span>
			</div>
			<div class="text-sm text-gray-500">
				{pending.length} pending · {done.length} done
			</div>
		</div>
	</header>

	<div class="flex flex-1">
		<!-- Main pending list -->
		<form class="flex-1 p-4" method="POST" use:enhance>
			<input type="hidden" name="status" value="done" />
			<h2 class="mb-3 text-lg font-medium text-purple-400">Pending Requests</h2>

			{#if pending.length === 0}
				<p class="text-gray-500">No pending requests</p>
			{:else}
				<div class="space-y-2">
					{#each pending as req (req.id)}
						<div class="flex items-center gap-3 rounded-lg bg-gray-900 p-3 pr-6">
							<div class="min-w-0 flex-1">
								<div class="font-medium">{req.title}</div>
								<div class="text-sm text-gray-400">{req.artist}</div>
								<div class="mt-1 text-xs text-gray-500">
									{req.name} · {formatTime(req.createdAt)}
								</div>
							</div>

							<button
								type="submit"
								name="id"
								value={req.id}
								class="rounded bg-green-600 px-3 py-1.5 text-sm font-medium hover:bg-green-500"
							>
								Done
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</form>
		<!-- Done sidebar -->
		<div class="w-72 border-l border-gray-800 bg-gray-900/50 p-4">
			<h2 class="mb-3 text-sm font-medium text-gray-400">Completed ({done.length})</h2>

			{#if done.length === 0}
				<p class="text-sm text-gray-600">None yet</p>
			{:else}
				<form class="space-y-2" method="POST" use:enhance>
					<input type="hidden" name="status" value="pending" />
					{#each done as req (req.id)}
						<div class="group flex items-start gap-2 rounded bg-gray-800/50 p-2 text-sm">
							<div class="min-w-0 flex-1">
								<div class="truncate text-gray-300">{req.title}</div>
								<div class="truncate text-xs text-gray-500">{req.artist} · {req.name}</div>
							</div>

							<button
								type="submit"
								name="id"
								value={req.id}
								class="text-xs text-gray-600 opacity-0 group-hover:opacity-100 hover:text-gray-400"
								title="Move back to pending"
							>
								↩
							</button>
						</div>
					{/each}
				</form>
			{/if}
		</div>
	</div>
</div>
