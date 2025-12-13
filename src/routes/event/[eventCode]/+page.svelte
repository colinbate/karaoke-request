<script lang="ts">
	import { S, type Song } from '$lib/types';
	import { innerHeight } from 'svelte/reactivity/window';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let { data, form }: PageProps = $props();

	let search = $state('');
	let selectedStyle = $state('');
	let userName = $state('');
	let styles: string[] = $state([]);
	let songs: Song[] = $state([]);
	let loading = $state(true);

	// Filter songs based on search and style
	let filtered = $derived.by(() => {
		let results = songs;

		if (selectedStyle) {
			results = results.filter((s) => s[S.STYLES].includes(selectedStyle));
		}

		if (search.trim()) {
			const q = search.toLowerCase();
			results = results.filter(
				(s) => s[S.TITLE].toLowerCase().includes(q) || s[S.ARTIST].toLowerCase().includes(q)
			);
		}

		return results;
	});

	// Pagination
	let page = $state(0);
	let rowHeight = 61;
	let headerHeight = 200;

	let pageSize = $derived(
		Math.max(5, Math.floor(((innerHeight.current ?? 600) - headerHeight) / rowHeight))
	);

	let totalPages = $derived(Math.ceil(filtered.length / pageSize));
	let pageItems = $derived(filtered.slice(page * pageSize, (page + 1) * pageSize));

	// Reset page when filters change
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		search;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		selectedStyle;
		page = 0;
	});

	onMount(() => {
		fetch('/songs.json')
			.then((r) => r.json<Song[]>())
			.catch((err) => (console.error(err), []))
			.then((arr) => ((songs = arr), (loading = false)));
		fetch('/styles.json')
			.then((r) => r.json<string[]>())
			.catch((err) => (console.error(err), []))
			.then((arr) => (styles = arr));
	});

	function songKey(song: Song) {
		return JSON.stringify([song[S.TITLE], song[S.ARTIST]]);
	}
</script>

<svelte:head>
	<title>{data.eventName}</title>
</svelte:head>
<div
	class={['mx-auto flex h-dvh max-w-5xl flex-col', !data.isActive && 'items-center justify-center']}
>
	{#if !data.isActive}
		<div
			class="flex flex-col gap-6 rounded-2xl border border-purple-600 p-6 text-center shadow-md shadow-purple-400"
		>
			<h3 class="text-xl font-semibold">{data.eventName} is over.</h3>
			<span>Thanks for joining!</span>
			<a
				href={resolve('/')}
				class="rounded bg-purple-600 px-3 py-1 text-sm font-medium hover:bg-purple-500"
				>Return Home</a
			>
		</div>
	{:else}
		<!-- Header -->
		<header class="flex items-center gap-3 border-b border-gray-800 px-4 py-2">
			<svg class="h-8 w-8 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
				/>
			</svg>
			<h1 class="text-lg font-semibold">{data.eventName || 'Karaoke'}</h1>
			{#if data.readonly}
				<div class="ml-auto">
					<a href={resolve('/')} class="rounded border border-purple-600 px-3 py-1">Home</a>
				</div>
			{:else}
				<div class="relative ml-auto flex items-center gap-2">
					{#if data.requests.length > 0}
						<span class="rounded-full bg-purple-600 px-2 py-0.5 text-xs">
							{data.requests.length}
						</span>
					{/if}
					<input
						type="text"
						data-1p-ignore
						bind:value={userName}
						placeholder="Your name"
						class="w-32 rounded bg-gray-800 px-2 py-1 text-sm placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
					/>
					{#if form?.error && !userName}
						<div class="absolute top-full right-6 w-max rounded bg-rose-600 px-2 py-1">
							Please set your name to request ↑
						</div>
					{/if}
				</div>
			{/if}
		</header>

		<!-- Search and filters -->
		<div class="space-y-2 border-b border-gray-800 px-4 py-3">
			<input
				type="search"
				bind:value={search}
				placeholder="Search by title or artist..."
				class="w-full rounded bg-gray-800 px-3 py-2 placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
			/>
			<div class="flex items-center gap-2">
				<select
					bind:value={selectedStyle}
					class="rounded bg-gray-800 px-2 py-1 text-sm focus:ring-1 focus:ring-purple-500 focus:outline-none"
				>
					<option value="">All styles</option>
					{#each styles as style (style)}
						<option value={style}>{style}</option>
					{/each}
				</select>
				<span class="ml-auto text-sm text-gray-500">
					{filtered.length.toLocaleString()} songs
				</span>
			</div>
		</div>

		<!-- Song list -->
		<form method="POST" use:enhance>
			<input type="hidden" name="name" value={userName} />
			<div class="min-h-0 flex-1 overflow-y-auto">
				{#if loading}
					<div class="flex h-48 items-center justify-center text-purple-300">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 640 640"
							class="size-10 animate-bounce"
							fill="currentColor"
							><path
								d="M499.7 70.8C507.5 76.8 512 86.1 512 96L512 192C512 206.7 502 219.5 487.8 223L384 249L384 464C384 517 333.9 560 272 560C210.1 560 160 517 160 464C160 411 210.1 368 272 368C289.2 368 305.5 371.3 320 377.2L320 128C320 113.3 330 100.5 344.2 97L472.2 65C481.8 62.6 491.9 64.8 499.7 70.8z"
							/></svg
						>
					</div>
				{:else}
					{#each pageItems as song (song)}
						{@const key = songKey(song)}
						{@const alreadyRequested = data.requests.some(
							(r) => r.title === song[S.TITLE] && r.artist === song[S.ARTIST]
						)}
						<div class="flex items-center border-b border-gray-800/50 px-4 py-2">
							<div class="min-w-0 flex-1">
								<div class="truncate font-medium">
									{song[S.TITLE]}
									{#if song[S.EXPLICIT]}
										<span class="ml-1 text-xs text-red-400">E</span>
									{/if}
									{#if song[S.DUO]}
										<span class="ml-1 text-xs text-blue-400">Duet</span>
									{/if}
								</div>
								<div class="truncate text-sm text-gray-400">
									{song[S.ARTIST]}
									{#if song[S.YEAR]}
										<span class="text-gray-600">· {song[S.YEAR]}</span>
									{/if}
								</div>
							</div>
							{#if !data.readonly}
								{#if alreadyRequested}
									<span class="ml-2 shrink-0 rounded bg-gray-700 px-3 py-1 text-sm text-gray-400">
										Requested
									</span>
								{:else}
									<button
										type="submit"
										name="song"
										value={key}
										class="ml-2 shrink-0 rounded bg-purple-600 px-3 py-1 text-sm font-medium hover:bg-purple-500"
									>
										Request
									</button>
								{/if}
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</form>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex items-center justify-between border-t border-gray-800 px-4 py-2">
				<button
					onclick={() => (page = Math.max(0, page - 1))}
					disabled={page === 0}
					class="rounded bg-gray-800 px-3 py-1 text-sm disabled:opacity-40"
				>
					&larr; Prev
				</button>
				<span class="text-sm text-gray-400">
					{page + 1} / {totalPages}
				</span>
				<button
					onclick={() => (page = Math.min(totalPages - 1, page + 1))}
					disabled={page >= totalPages - 1}
					class="rounded bg-gray-800 px-3 py-1 text-sm disabled:opacity-40"
				>
					Next &rarr;
				</button>
			</div>
		{/if}
	{/if}
</div>
