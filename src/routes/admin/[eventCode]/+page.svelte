<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import EventStatus from '$lib/comp/event-status.svelte';
	import { S, type Song } from '$lib/types';
	import { randomListBadgeLabel, type RandomListItem } from '$lib/random-lists';
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
	import {
		ChevronRight,
		CircleCheckBig,
		Image as ImageIcon,
		ListStart,
		Plus,
		RefreshCw,
		SquareArrowOutUpRight,
		X,
	} from '@lucide/svelte';

	let { data } = $props();

	type ManualSong = {
		title: string;
		artist: string;
	};

	const fallbackDisplayState = $derived(createDisplayState(data.eventinfo.code, data.requestUrl));
	let storedDisplayState = $state<DisplayState | null>(null);
	let channel: BroadcastChannel | null = null;
	let songs: Song[] = $state.raw([]);
	let manualName = $state('');
	let manualSearch = $state('');
	let selectedManualSong = $state<ManualSong | null>(null);
	let manualFormOpen = $state(false);
	let completedOpen = $state(false);
	let selectedManualListId = $state<number | null>(null);
	let listsDialog = $state<HTMLDialogElement>();

	const displayState = $derived(storedDisplayState ?? fallbackDisplayState);
	const activeListCount = $derived(data.randomLists.filter((list) => list.active).length);
	const currentSingers = $derived.by(() => {
		const names: string[] = [];
		const seen: string[] = [];

		for (const request of [...data.pending, ...data.done]) {
			const name = request.name.trim();
			const key = name.toLowerCase();
			if (name && !seen.includes(key)) {
				names.push(name);
				seen.push(key);
			}
		}

		return names;
	});
	const showSingerChips = $derived(currentSingers.length > 0 && currentSingers.length <= 6);
	const activeManualList = $derived(
		data.adminSongLists.find((list) => list.id === selectedManualListId) ?? null
	);
	const manualSearchResults = $derived.by(() => {
		const query = manualSearch.trim().toLowerCase();
		if (!query || selectedManualSong) {
			return [];
		}

		return songs
			.filter(
				(song) =>
					song[S.TITLE].toLowerCase().includes(query) ||
					song[S.ARTIST].toLowerCase().includes(query)
			)
			.slice(0, 6);
	});
	const manualTitle = $derived(selectedManualSong?.title ?? '');
	const manualArtist = $derived(selectedManualSong?.artist ?? '');
	const canAddManualRequest = $derived(!!manualName.trim() && !!selectedManualSong);

	onMount(() => {
		const stored = localStorage.getItem(displayStateKey(data.eventinfo.code));
		if (stored) {
			try {
				const parsed: unknown = JSON.parse(stored);
				if (isDisplayState(parsed) && parsed.eventCode === data.eventinfo.code) {
					storedDisplayState = {
						...parsed,
						requestUrl: parsed.requestUrl || data.requestUrl,
						showLogo: parsed.showLogo ?? false,
					};
				}
			} catch (err) {
				console.error(err);
			}
		}

		fetch('/songs.json')
			.then((response) => response.json<Song[]>())
			.then((loadedSongs) => {
				songs = loadedSongs;
			})
			.catch((err: unknown) => console.error(err));

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

	function selectSinger(name: string) {
		manualName = name;
	}

	function selectSingerOption(event: Event) {
		const select = event.currentTarget;
		if (!(select instanceof HTMLSelectElement) || !select.value) {
			return;
		}

		selectSinger(select.value);
		select.value = '';
	}

	function formatSong(song: ManualSong) {
		return `${song.title} - ${song.artist}`;
	}

	function selectManualSong(song: Song) {
		const nextSong = { title: song[S.TITLE], artist: song[S.ARTIST] };
		selectedManualSong = nextSong;
		manualSearch = formatSong(nextSong);
	}

	function parseListSong(item: RandomListItem): ManualSong | null {
		try {
			const parsed: unknown = JSON.parse(item.value);
			if (
				Array.isArray(parsed) &&
				parsed.length === 2 &&
				typeof parsed[0] === 'string' &&
				typeof parsed[1] === 'string' &&
				parsed[0].trim() &&
				parsed[1].trim()
			) {
				return { title: parsed[0].trim(), artist: parsed[1].trim() };
			}
		} catch {
			return null;
		}

		return null;
	}

	function selectManualListSong(item: RandomListItem) {
		const song = parseListSong(item);
		if (!song) {
			return;
		}

		selectedManualSong = song;
		manualSearch = formatSong(song);
	}

	function updateManualSearch(event: Event) {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) {
			return;
		}

		manualSearch = input.value;
		if (selectedManualSong && input.value !== formatSong(selectedManualSong)) {
			selectedManualSong = null;
		}
	}

	function clearManualSong() {
		selectedManualSong = null;
		manualSearch = '';
	}

	function openListsDialog() {
		listsDialog?.showModal();
	}

	function closeListsDialog() {
		listsDialog?.close();
	}

	function randomRequestLabel(request: (typeof data.pending)[number] | (typeof data.done)[number]) {
		if (!request.fromRandomList || !request.randomListKind || !request.randomListTitle) {
			return null;
		}

		return randomListBadgeLabel(request.randomListKind, request.randomListTitle);
	}

	function resetManualRequest() {
		manualName = '';
		clearManualSong();
		selectedManualListId = null;
		manualFormOpen = false;
	}

	function toggleManualForm() {
		manualFormOpen = !manualFormOpen;
		if (manualFormOpen) {
			selectedManualListId = null;
		}
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
			randomLabel: randomRequestLabel(request) ?? undefined,
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

	function toggleLogo() {
		publishDisplayPatch({ showLogo: !displayState.showLogo });
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
			<button
				type="button"
				onclick={openListsDialog}
				class="shrink-0 rounded border border-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800"
			>
				Lists
			</button>
		</div>
	</header>

	<dialog
		bind:this={listsDialog}
		class="m-4 w-[calc(100vw-2rem)] max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/60 sm:m-auto sm:w-full"
	>
		<div class="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3">
			<h2 class="font-semibold">Event Lists</h2>
			<button
				type="button"
				onclick={closeListsDialog}
				aria-label="Close lists"
				class="grid size-8 place-items-center rounded text-gray-400 hover:bg-gray-800 hover:text-gray-200"
			>
				<X class="size-5" />
			</button>
		</div>

		<div class="max-h-[70dvh] overflow-y-auto p-4">
			<div class="mb-3 flex items-center justify-between gap-3">
				<div class="text-sm text-gray-400">{activeListCount} active for this event</div>
				<a
					href={resolve('/admin/lists')}
					class="shrink-0 rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700"
				>
					Manage lists
				</a>
			</div>

			<div class="space-y-2">
				{#each data.randomLists as list (list.id)}
					<form method="POST" action={list.active ? '?/unlinkList' : '?/linkList'} use:enhance>
						<input type="hidden" name="listId" value={list.id} />
						<button
							type="submit"
							class={[
								'flex w-full items-center gap-3 rounded border px-3 py-2 text-left transition-colors',
								list.active
									? 'border-purple-600 bg-purple-950/40'
									: 'border-gray-800 bg-gray-950/60 hover:bg-gray-800/70',
							]}
						>
							<span
								class={[
									'grid size-5 shrink-0 place-items-center rounded border',
									list.active ? 'border-purple-400 bg-purple-600' : 'border-gray-600',
								]}
								aria-hidden="true"
							>
								{#if list.active}
									<CircleCheckBig class="size-4" />
								{/if}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-medium">{list.title}</span>
								<span class="block truncate text-xs text-gray-500">
									{list.entryCount} entries · {list.kind === 'song' ? 'Songs' : 'Artists'}
									{#if list.adminOnly}
										· Admin only
									{/if}
								</span>
							</span>
						</button>
					</form>
				{:else}
					<p
						class="rounded border border-gray-800 bg-gray-950/60 p-4 text-center text-sm text-gray-500"
					>
						No lists yet.
					</p>
				{/each}
			</div>
		</div>
	</dialog>

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
					onclick={toggleLogo}
					aria-label={displayState.showLogo ? 'Hide logo' : 'Show logo'}
					class={[
						'grid place-items-center rounded px-3 py-2 text-sm font-medium',
						displayState.showLogo
							? 'bg-fuchsia-700 hover:bg-fuchsia-600'
							: 'bg-gray-800 hover:bg-gray-700',
					]}
				>
					<ImageIcon class="size-5" />
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

	<div
		class="min-h-0 flex-1 overflow-y-auto py-4 pr-1.5 pl-4 [scrollbar-color:oklch(49.6%_0.265_301.924/0.3)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]"
	>
		<div class="mb-3 flex items-center justify-between gap-3">
			<h2 class="text-sm font-medium tracking-wide text-purple-300 uppercase">Pending Requests</h2>
			<button
				type="button"
				onclick={toggleManualForm}
				aria-label={manualFormOpen ? 'Close add request form' : 'Add request'}
				aria-expanded={manualFormOpen}
				class={[
					'grid size-8 shrink-0 place-items-center rounded text-sm font-medium transition-colors',
					manualFormOpen
						? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
						: 'bg-purple-700 text-white hover:bg-purple-600',
				]}
			>
				<Plus class="size-5 transition-transform {manualFormOpen ? 'rotate-45' : ''}" />
			</button>
		</div>

		{#if manualFormOpen}
			<section class="mb-6 rounded-lg border border-gray-800 bg-gray-900/70 p-3">
				<form
					method="POST"
					action="?/manualRequest"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success') {
								resetManualRequest();
							}
						};
					}}
					class="space-y-3"
				>
					<input type="hidden" name="title" value={manualTitle} />
					<input type="hidden" name="artist" value={manualArtist} />

					<label class="block">
						<span class="mb-1 block text-xs text-gray-400">Singer</span>
						<div
							class={currentSingers.length > 6
								? 'grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]'
								: ''}
						>
							<input
								name="name"
								type="text"
								data-1p-ignore
								bind:value={manualName}
								autocomplete="off"
								placeholder="Who is singing?"
								class="w-full rounded border-gray-700 bg-gray-800 text-sm placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
							/>
							{#if currentSingers.length > 6}
								<select
									aria-label="Current singers"
									onchange={selectSingerOption}
									class="rounded border-gray-700 bg-gray-800 text-sm text-gray-200 focus:border-purple-500 focus:ring-purple-500"
								>
									<option value="">Current singers</option>
									{#each currentSingers as singer (singer.toLowerCase())}
										<option value={singer}>{singer}</option>
									{/each}
								</select>
							{/if}
						</div>
					</label>
					{#if showSingerChips}
						<div class="flex flex-wrap gap-2">
							{#each currentSingers as singer (singer.toLowerCase())}
								<button
									type="button"
									onclick={() => selectSinger(singer)}
									class={[
										'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
										manualName.trim().toLowerCase() === singer.toLowerCase()
											? 'border-purple-500 bg-purple-700 text-white'
											: 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700',
									]}
								>
									{singer}
								</button>
							{/each}
						</div>
					{/if}

					<div class="relative">
						<label class="block">
							<span class="mb-1 block text-xs text-gray-400">Song</span>
							<div class="flex gap-2">
								<input
									type="search"
									value={manualSearch}
									oninput={updateManualSearch}
									autocomplete="off"
									placeholder="Search title or artist"
									class="min-w-0 flex-1 rounded border-gray-700 bg-gray-800 text-sm placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
								/>
								{#if selectedManualSong}
									<button
										type="button"
										onclick={clearManualSong}
										aria-label="Clear selected song"
										class="grid size-10 shrink-0 place-items-center rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
									>
										<X class="size-5" />
									</button>
								{/if}
							</div>
						</label>

						{#if manualSearchResults.length > 0}
							<div
								class="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-700 bg-gray-950 shadow-xl shadow-black/40"
							>
								{#each manualSearchResults as song (song[S.TITLE] + song[S.ARTIST])}
									<button
										type="button"
										onclick={() => selectManualSong(song)}
										class="block w-full border-b border-gray-800 px-3 py-2 text-left last:border-b-0 hover:bg-gray-900"
									>
										<span class="block truncate text-sm font-medium">{song[S.TITLE]}</span>
										<span class="block truncate text-xs text-gray-500">{song[S.ARTIST]}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>

					{#if data.adminSongLists.length > 0}
						<div class="rounded border border-gray-800 bg-gray-950/50 p-3">
							<div class="mb-2 flex items-center gap-2">
								<select
									aria-label="Active song list"
									value={activeManualList?.id ?? ''}
									onchange={(event) => {
										const select = event.currentTarget;
										if (select instanceof HTMLSelectElement) {
											selectedManualListId = select.value ? Number(select.value) : null;
										}
									}}
									class="min-w-0 flex-1 rounded border-gray-700 bg-gray-800 text-sm text-gray-200 focus:border-purple-500 focus:ring-purple-500"
								>
									<option value="">Choose a list</option>
									{#each data.adminSongLists as list (list.id)}
										<option value={list.id}>{list.title}</option>
									{/each}
								</select>
								{#if activeManualList}
									<span class="shrink-0 text-xs text-gray-500">
										{activeManualList.items.length} songs
									</span>
								{/if}
							</div>
							{#if activeManualList}
								<div class="max-h-40 space-y-1 overflow-y-auto pr-1">
									{#each activeManualList.items as item, i (i)}
										<button
											type="button"
											onclick={() => selectManualListSong(item)}
											class="block w-full rounded px-2 py-1.5 text-left hover:bg-gray-800"
										>
											<span class="block truncate text-sm font-medium">{item.label}</span>
											{#if item.detail}
												<span class="block truncate text-xs text-gray-500">{item.detail}</span>
											{/if}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					{#if selectedManualSong}
						<div class="rounded border border-purple-900/60 bg-purple-950/30 px-3 py-2 text-sm">
							<div class="truncate font-medium">{selectedManualSong.title}</div>
							<div class="truncate text-xs text-purple-200/70">{selectedManualSong.artist}</div>
						</div>
					{/if}

					<button
						type="submit"
						disabled={!canAddManualRequest}
						class="flex w-full items-center justify-center gap-2 rounded bg-purple-700 px-3 py-2 text-sm font-medium hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-45"
					>
						<Plus class="size-5" />
						Add to Pending
					</button>
				</form>
			</section>
		{/if}

		{#if data.pending.length === 0}
			<p class="rounded border border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-500">
				No pending requests
			</p>
		{:else}
			<div class="space-y-3">
				{#each data.pending as req (req.id)}
					{@const randomLabel = randomRequestLabel(req)}
					<article class="flex gap-3 rounded-lg border border-gray-800 bg-gray-900 p-3">
						<div class="min-w-0 flex-1">
							<div class="flex min-w-0 items-center gap-2">
								<div class="truncate font-medium">{req.title}</div>
								{#if randomLabel}
									<span
										class="shrink-0 rounded bg-cyan-900/70 px-1.5 py-0.5 text-[0.65rem] font-medium text-cyan-100"
									>
										{randomLabel}
									</span>
								{/if}
							</div>
							<div class="truncate text-sm text-gray-400">{req.artist}</div>
							<div class="mt-1 truncate text-xs text-gray-500">
								{req.name} · {formatTime(req.createdAt)}
							</div>
						</div>

						<div class="flex shrink-0 flex-row gap-2">
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
			<button
				type="button"
				onclick={() => (completedOpen = !completedOpen)}
				aria-expanded={completedOpen}
				class="mb-3 flex w-full items-center justify-between gap-3 rounded px-1 py-1 text-left hover:bg-gray-900/70"
			>
				<h2 class="text-sm font-medium tracking-wide text-gray-400 uppercase">
					Completed ({data.done.length})
				</h2>

				<ChevronRight
					class="size-5 text-gray-500 transition-transform {completedOpen ? 'rotate-90' : ''}"
				/>
			</button>

			{#if completedOpen}
				{#if data.done.length === 0}
					<p class="text-sm text-gray-600">None yet</p>
				{:else}
					<div class="space-y-2">
						{#each data.done as req (req.id)}
							{@const randomLabel = randomRequestLabel(req)}
							<article class="flex items-center gap-2 rounded bg-gray-900/60 p-2 text-sm">
								<div class="min-w-0 flex-1">
									<div class="flex min-w-0 items-center gap-2">
										<div class="truncate text-gray-300">{req.title}</div>
										{#if randomLabel}
											<span
												class="shrink-0 rounded bg-cyan-950 px-1.5 py-0.5 text-[0.6rem] font-medium text-cyan-100"
											>
												{randomLabel}
											</span>
										{/if}
									</div>
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
			{/if}
		</section>
	</div>
</div>
