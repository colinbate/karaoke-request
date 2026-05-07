<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import EventStatus from '$lib/comp/event-status.svelte';
	import {
		DISPLAY_CHANNEL_NAME,
		createDisplayState,
		displayStateKey,
		isDisplayState,
		type DisplayPatch,
		type DisplayState,
		type DisplayUpNext,
	} from '$lib/display';
	import CopyText from './copy-text.svelte';
	import { CircleCheckBig, ListStart, RefreshCw, SquareArrowOutUpRight } from '@lucide/svelte';

	let { data } = $props();

	const fallbackDisplayState = $derived(createDisplayState(data.eventinfo.code, data.requestUrl));
	let storedDisplayState = $state<DisplayState | null>(null);
	let channel: BroadcastChannel | null = null;

	const displayState = $derived(storedDisplayState ?? fallbackDisplayState);
	const activeListCount = $derived(data.randomLists.filter((list) => list.active).length);

	onMount(() => {
		const stored = localStorage.getItem(displayStateKey(data.eventinfo.code));
		if (stored) {
			try {
				const parsed: unknown = JSON.parse(stored);
				if (isDisplayState(parsed) && parsed.eventCode === data.eventinfo.code) {
					storedDisplayState = {
						...parsed,
						requestUrl: parsed.requestUrl || data.requestUrl,
					};
				}
			} catch (err) {
				console.error(err);
			}
		}

		channel = new BroadcastChannel(DISPLAY_CHANNEL_NAME);
		const interval = setInterval(() => {
			invalidateAll();
		}, 5000);

		return () => {
			clearInterval(interval);
			channel?.close();
		};
	});

	function formatTime(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function persistDisplayState(nextState: DisplayState) {
		localStorage.setItem(displayStateKey(data.eventinfo.code), JSON.stringify(nextState));
	}

	function publishDisplayPatch(patch: DisplayPatch) {
		const at = Date.now();
		const nextState = {
			...displayState,
			...patch,
			eventCode: data.eventinfo.code,
			updatedAt: at,
		};
		storedDisplayState = nextState;
		persistDisplayState(nextState);
		channel?.postMessage({
			type: 'display:patch',
			eventCode: data.eventinfo.code,
			patch,
			at,
		});
	}

	function setUpNext(request: (typeof data.pending)[number]) {
		const upNext: DisplayUpNext = {
			requestId: request.id,
			singer: request.name,
			title: request.title,
			artist: request.artist,
		};

		publishDisplayPatch({ upNext });
	}

	function clearUpNext() {
		publishDisplayPatch({ upNext: null });
	}

	function toggleRequestUrl() {
		publishDisplayPatch({ showRequestUrl: !displayState.showRequestUrl });
	}

	function toggleQr() {
		publishDisplayPatch({ showQr: !displayState.showQr });
	}

	function syncDisplay() {
		const at = Date.now();
		const nextState = {
			...displayState,
			eventCode: data.eventinfo.code,
			requestUrl: data.requestUrl,
			updatedAt: at,
		};
		storedDisplayState = nextState;
		persistDisplayState(nextState);
		channel?.postMessage({
			type: 'display:sync',
			eventCode: data.eventinfo.code,
			state: nextState,
			at,
		});
	}
</script>

<svelte:head>
	<title>{data.eventinfo.name} - KJ Queue</title>
</svelte:head>

<div class="mx-auto flex h-dvh max-w-xl flex-col overflow-hidden">
	<header class="shrink-0 border-b border-gray-800 px-4 py-3">
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0">
				<div class="flex items-center gap-3">
					<a href={resolve('/admin')} aria-label="Back to admin">&larr;</a>
					<h1 class="truncate text-lg font-semibold">{data.eventinfo.name}</h1>
					<EventStatus event={data.eventinfo} />
				</div>
				<div class="mt-1 text-xs text-gray-500">
					{data.pending.length} pending · {data.done.length} done · {activeListCount} lists active
				</div>
			</div>
			<a
				href={resolve(`/admin/lists`)}
				class="shrink-0 rounded border border-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800"
			>
				Lists
			</a>
		</div>
	</header>

	<section class="shrink-0 space-y-3 border-b border-gray-800 bg-gray-950/95 px-4 py-3">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<div class="text-xs tracking-wide text-purple-300 uppercase">Display</div>
			</div>

			<div class="flex gap-2">
				<button
					type="button"
					onclick={toggleQr}
					class="rounded bg-cyan-700 px-3 py-2 text-sm font-medium hover:bg-cyan-600"
				>
					{displayState.showQr ? 'Hide QR' : 'Show QR'}
				</button>
				<button
					type="button"
					onclick={toggleRequestUrl}
					class="rounded bg-gray-800 px-3 py-2 text-sm font-medium hover:bg-gray-700"
				>
					{displayState.showRequestUrl ? 'Hide URL' : 'Show URL'}
				</button>
				<button
					type="button"
					onclick={syncDisplay}
					aria-label="Sync"
					class="rounded bg-purple-700 px-3 py-2 text-sm font-medium hover:bg-purple-600"
				>
					<RefreshCw class="size-5" />
				</button>
				<a
					href={resolve(`/display/${data.eventinfo.code}`)}
					target="_blank"
					rel="noreferrer"
					aria-label="Open"
					class="grid place-items-center rounded border border-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800"
				>
					<SquareArrowOutUpRight class="size-5" />
				</a>
			</div>
		</div>

		<div class="rounded border border-gray-800 bg-gray-900/70 p-3">
			<div class="mb-2 flex items-center justify-between gap-2">
				<div class="text-xs tracking-wide text-gray-400 uppercase">Up next</div>
				{#if displayState.upNext}
					<button
						type="button"
						onclick={clearUpNext}
						class="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
					>
						Clear
					</button>
				{/if}
			</div>
			{#if displayState.upNext}
				<div class="truncate font-medium">{displayState.upNext.singer}</div>
				{#if displayState.upNext.title}
					<div class="truncate text-sm text-gray-400">
						{displayState.upNext.title}
						{#if displayState.upNext.artist}
							<span class="text-gray-600"> · {displayState.upNext.artist}</span>
						{/if}
					</div>
				{/if}
			{:else}
				<div class="text-sm text-gray-500">Nothing set</div>
			{/if}
		</div>
	</section>

	<div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
		<h2 class="mb-3 text-sm font-medium tracking-wide text-purple-300 uppercase">
			Pending Requests
		</h2>

		{#if data.pending.length === 0}
			<p class="rounded border border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-500">
				No pending requests
			</p>
		{:else}
			<div class="space-y-3">
				{#each data.pending as req (req.id)}
					<article class="flex justify-between rounded-lg border border-gray-800 bg-gray-900 p-3">
						<div class="min-w-0">
							<div class="truncate font-medium">{req.title}</div>
							<div class="truncate text-sm text-gray-400">{req.artist}</div>
							<div class="mt-1 truncate text-xs text-gray-500">
								{req.name} · {formatTime(req.createdAt)}
							</div>
						</div>

						<div class=" flex flex-row gap-2">
							<CopyText text={`${req.title} ${req.artist}`} />
							<button
								type="button"
								aria-label="Up Next"
								onclick={() => setUpNext(req)}
								class="grid size-8 place-items-center rounded bg-purple-700 text-sm font-medium hover:bg-purple-600"
							>
								<ListStart class="size-5" />
							</button>
							<form method="POST" action="?/updateStatus" use:enhance class="w-8 min-w-0">
								<input type="hidden" name="status" value="done" />
								<button
									type="submit"
									aria-label="Done"
									name="id"
									value={req.id}
									class="grid size-8 w-full place-items-center rounded bg-green-700 text-sm font-medium hover:bg-green-600"
								>
									<CircleCheckBig class="size-5" />
								</button>
							</form>
						</div>
					</article>
				{/each}
			</div>
		{/if}

		<section class="mt-6">
			<h2 class="mb-3 text-sm font-medium tracking-wide text-gray-400 uppercase">
				Completed ({data.done.length})
			</h2>

			{#if data.done.length === 0}
				<p class="text-sm text-gray-600">None yet</p>
			{:else}
				<div class="space-y-2">
					{#each data.done as req (req.id)}
						<article class="flex items-center gap-2 rounded bg-gray-900/60 p-2 text-sm">
							<div class="min-w-0 flex-1">
								<div class="truncate text-gray-300">{req.title}</div>
								<div class="truncate text-xs text-gray-500">{req.artist} · {req.name}</div>
							</div>
							<form method="POST" action="?/updateStatus" use:enhance>
								<input type="hidden" name="status" value="pending" />
								<button
									type="submit"
									name="id"
									value={req.id}
									class="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
								>
									Undo
								</button>
							</form>
						</article>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>
