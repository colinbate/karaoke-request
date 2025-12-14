<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EventStatus from '$lib/comp/event-status.svelte';

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
</script>

<svelte:head>
	<title>{data.eventinfo.name} - Request Queue</title>
</svelte:head>
<div class="flex h-dvh flex-col overflow-hidden">
	<!-- Header -->
	<header class="border-b border-gray-800 px-4 py-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<a href={resolve('/admin')}>&larr;</a>
				<h1 class="text-xl font-semibold">{data.eventinfo.name} Queue</h1>
				<EventStatus event={data.eventinfo} />
			</div>
			<div class="text-sm text-gray-500">
				{data.pending.length} pending · {data.done.length} done
			</div>
		</div>
	</header>

	<div class="flex flex-1 flex-col overflow-hidden md:flex-row">
		<!-- Main pending list -->
		<div class="flex h-2/3 flex-col overflow-hidden p-4 md:h-full md:flex-1">
			<form class="flex h-full flex-col" method="POST" use:enhance>
				<input type="hidden" name="status" value="done" />
				<h2 class="mb-3 text-lg font-medium text-purple-400">Pending Requests</h2>

				{#if data.pending.length === 0}
					<p class="text-gray-500">No pending requests</p>
				{:else}
					<div class="flex-1 space-y-2 overflow-y-auto">
						{#each data.pending as req (req.id)}
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
		</div>
		<!-- Done sidebar -->
		<div
			class="flex h-1/3 flex-col overflow-hidden border-t border-gray-800 bg-gray-900/50 p-4 md:h-full md:w-96 md:border-t-0 md:border-l"
		>
			<h2 class="mb-3 text-sm font-medium text-gray-400">Completed ({data.done.length})</h2>

			{#if data.done.length === 0}
				<p class="text-sm text-gray-600">None yet</p>
			{:else}
				<form class="flex flex-1 flex-col overflow-hidden" method="POST" use:enhance>
					<div class="flex-1 space-y-2 overflow-y-auto">
						<input type="hidden" name="status" value="pending" />
						{#each data.done as req (req.id)}
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
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 640 640"
										class="size-5"
										fill="currentColor"
										><path
											d="M71.1 209C61.7 199.6 61.7 184.4 71.1 175.1L191.1 55C200.5 45.6 215.7 45.6 225 55C234.3 64.4 234.4 79.6 225 88.9L146 168L388 168C491.8 168 576 252.2 576 356C576 459.8 491.8 544 388 544L152 544L149.5 543.9C137.5 542.6 128 532.4 128 520C128 507.6 137.4 497.4 149.5 496.1L152 496L388 496C465.3 496 528 433.3 528 356C528 278.7 465.3 216 388 216L145.9 216L224.9 295L226.6 296.8C234.3 306.2 233.7 320.1 224.9 328.9C216.1 337.7 202.2 338.2 192.8 330.6L191 328.9L71 208.9z"
										/></svg
									>
								</button>
							</div>
						{/each}
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
