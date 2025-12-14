<script lang="ts">
	import { S, type Song } from '$lib/types';
	import { innerHeight } from 'svelte/reactivity/window';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Debounced } from 'runed';

	let { data, form }: PageProps = $props();

	let search = $state('');
	let debouncedSearch = new Debounced(() => search, 150);
	let selectedStyle = $state('');
	let userName = $state('');
	let styles: string[] = $state.raw([]);
	let songs: Song[] = $state.raw([]);
	let loading = $state(true);
	// svelte-ignore non_reactive_update
	let ffield: HTMLInputElement | undefined;

	// Filter songs based on search and style
	let filtered = $derived.by(() => {
		const searchValue = debouncedSearch.current;

		if (!selectedStyle && !searchValue.trim()) {
			return songs;
		}
		let results = songs;

		if (selectedStyle) {
			results = results.filter((s) => s[S.STYLES].includes(selectedStyle));
		}

		if (searchValue.trim()) {
			const q = searchValue.toLowerCase();
			results = results.filter(
				(s) => s[S.TITLE].toLowerCase().includes(q) || s[S.ARTIST].toLowerCase().includes(q)
			);
		}

		return results.toSorted(
			(a, b) => a[S.ARTIST].localeCompare(b[S.ARTIST]) || a[S.TITLE].localeCompare(b[S.TITLE])
		);
	});

	// Pagination
	let page = $state(0);
	let rowHeight = 61;
	let headerHeight = $state(51);
	let filterFooterHeight = 150;

	let pageSize = $derived(
		Math.max(
			5,
			Math.floor(((innerHeight.current ?? 600) - (headerHeight + filterFooterHeight)) / rowHeight)
		)
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

	const STORED_NAME_KEY = 'my-name';
	onMount(() => {
		fetch('/songs.json')
			.then((r) => r.json<Song[]>())
			.catch((err) => (console.error(err), []))
			.then((arr) => ((songs = arr), (loading = false)));
		fetch('/styles.json')
			.then((r) => r.json<string[]>())
			.catch((err) => (console.error(err), []))
			.then((arr) => (styles = arr));
		const storedName = window && window.localStorage.getItem(STORED_NAME_KEY);
		if (storedName) {
			userName = storedName;
		}
	});

	function songKey(song: Song) {
		return JSON.stringify([song[S.TITLE], song[S.ARTIST]]);
	}

	function saveName() {
		if (userName && window && window.localStorage) {
			window.localStorage.setItem(STORED_NAME_KEY, userName);
		}
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
		<header
			class="flex items-center gap-3 border-b border-gray-800 px-4 py-2"
			bind:clientHeight={headerHeight}
		>
			<svg class="h-8 w-8 text-purple-500" viewBox="0 0 640 640" fill="currentColor"
				><path
					d="M499.7 70.8C507.5 76.8 512 86.1 512 96L512 192C512 206.7 502 219.5 487.8 223L384 249L384 464C384 517 333.9 560 272 560C210.1 560 160 517 160 464C160 411 210.1 368 272 368C289.2 368 305.5 371.3 320 377.2L320 128C320 113.3 330 100.5 344.2 97L472.2 65C481.8 62.6 491.9 64.8 499.7 70.8z"
				/></svg
			>
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
						onblur={saveName}
						placeholder="Your name"
						class="w-32 rounded bg-gray-800 px-2 py-1 text-base placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
					/>
					{#if form?.error && !userName}
						<div class="absolute top-full right-6 z-10 w-max rounded bg-rose-600 px-2 py-1">
							Please set your name to request ↑
						</div>
					{/if}
				</div>
			{/if}
		</header>

		<!-- Search and filters -->
		<div class="space-y-2 border-b border-gray-800 px-4 py-3">
			<div class="relative">
				<input
					bind:this={ffield}
					type="search"
					bind:value={search}
					placeholder="Search by title or artist..."
					class="w-full rounded bg-gray-800 py-2 pr-12 pl-3 placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
				/>
				{#if search}
					<button
						aria-label="Clear text"
						onclick={() => ((search = ''), ffield?.focus())}
						class="absolute inset-y-0 right-0 flex w-10 items-center justify-center"
						><svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="size-6"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
							/>
						</svg>
					</button>
				{/if}
			</div>
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
		<form method="POST" use:enhance class="flex-1">
			<input type="hidden" name="name" value={userName} />
			<div class="min-h-0 overflow-y-auto">
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
									{#if song[S.STYLES].includes('Christmas')}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 640 640"
											class="relative -top-0.5 inline size-5 text-emerald-700"
											fill="currentColor"
											><path
												d="M320 66.2C326.5 66.2 332.7 69.1 336.9 74.2L467.8 234.2L469.6 236.8C473.3 243 473.8 250.7 470.6 257.4C467 265 459.3 269.9 450.9 269.9L423.1 269.9L514.3 376.5C520.4 383.6 521.8 393.6 517.9 402.1C514 410.6 505.5 416.1 496.1 416.1L443.1 416.1L546.3 536.5L548.4 539.3C552.7 546.1 553.4 554.7 549.9 562.1C546 570.6 537.5 576.1 528.1 576.1L112 576C102.6 576 94.1 570.5 90.2 562C86.3 553.5 87.7 543.5 93.8 536.3L197 416L144 416C134.6 416 126.1 410.5 122.2 402C118.3 393.5 119.7 383.5 125.8 376.4L217 269.8L189.2 269.8C180.8 269.8 173.1 264.9 169.5 257.3C165.9 249.7 167 240.7 172.3 234.1L303.2 74.1L304.8 72.3C308.9 68.3 314.3 66.1 320 66.1zM384 456C370.7 456 360 466.7 360 480C360 493.3 370.7 504 384 504C397.3 504 408 493.3 408 480C408 466.7 397.3 456 384 456zM256 328C242.7 328 232 338.7 232 352C232 365.3 242.7 376 256 376C269.3 376 280 365.3 280 352C280 338.7 269.3 328 256 328zM352 200C338.7 200 328 210.7 328 224C328 237.3 338.7 248 352 248C365.3 248 376 237.3 376 224C376 210.7 365.3 200 352 200z"
											/></svg
										>
									{/if}
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
