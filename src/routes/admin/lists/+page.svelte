<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data } = $props();

	let newTitle = $state('');
	let newNote = $state('');
	let newKind = $state<'song' | 'artist'>('song');
</script>

<svelte:head>
	<title>Random Lists - Karaoke Admin</title>
</svelte:head>

<div class="min-h-dvh p-4">
	<div class="mx-auto max-w-5xl">
		<header class="mb-6 flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<a href={resolve('/admin')} class="text-gray-400 hover:text-gray-200">&larr;</a>
				<h1 class="text-2xl font-bold">Random Lists</h1>
			</div>
		</header>

		<form method="POST" action="?/createList" use:enhance class="mb-6 rounded-lg bg-gray-900 p-4">
			<h2 class="mb-3 font-medium">Create List</h2>
			<div class="grid gap-3 md:grid-cols-[1fr_auto_auto]">
				<input
					type="text"
					name="title"
					bind:value={newTitle}
					placeholder="List title"
					required
					class="rounded bg-gray-800 px-3 py-2 placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
				/>
				<select
					name="kind"
					bind:value={newKind}
					class="rounded bg-gray-800 px-3 py-2 focus:ring-1 focus:ring-purple-500 focus:outline-none"
				>
					<option value="song">Songs</option>
					<option value="artist">Artists</option>
				</select>
				<button
					type="submit"
					class="rounded bg-purple-600 px-4 py-2 font-medium hover:bg-purple-500"
				>
					Create
				</button>
			</div>
			<textarea
				name="note"
				bind:value={newNote}
				placeholder="Admin note"
				rows="2"
				class="mt-3 w-full rounded bg-gray-800 px-3 py-2 placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
			></textarea>
		</form>

		<div class="space-y-4">
			{#each data.lists as list (list.id)}
				<details class="group rounded-lg bg-gray-900" open>
					<summary class="cursor-pointer list-none p-4 marker:hidden">
						<div class="flex items-center gap-3">
							<div class="min-w-0 flex-1">
								<div class="flex min-w-0 items-center gap-2">
									<span class="truncate font-medium">{list.title}</span>
									<span
										class={[
											'shrink-0 rounded px-2 py-1 text-xs font-medium',
											list.kind === 'song' ? 'bg-purple-700' : 'bg-blue-700',
										]}
									>
										{list.kind === 'song' ? 'Songs' : 'Artists'}
									</span>
								</div>
								<div class="mt-1 truncate text-sm text-gray-500">
									{list.entries.length} entries{#if list.note}
										· {list.note}{/if}
								</div>
							</div>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								class="size-5 shrink-0 text-gray-500 transition-transform group-open:rotate-180"
								aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
							</svg>
						</div>
					</summary>

					<div
						class="grid gap-4 border-t border-gray-800 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]"
					>
						<div class="min-w-0">
							<form method="POST" action="?/updateList" use:enhance class="space-y-3">
								<input type="hidden" name="id" value={list.id} />

								<input
									type="text"
									name="title"
									value={list.title}
									class="w-full rounded bg-gray-800 px-3 py-2 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
								/>
								<textarea
									name="note"
									rows="2"
									class="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
									placeholder="Admin note">{list.note}</textarea
								>
								<div class="flex gap-2">
									<button
										type="submit"
										class="rounded bg-gray-700 px-3 py-1.5 text-sm hover:bg-gray-600"
									>
										Save
									</button>
									<button
										type="submit"
										formaction="?/deleteList"
										class="rounded bg-rose-800 px-3 py-1.5 text-sm hover:bg-rose-700"
									>
										Delete
									</button>
								</div>
							</form>

							<div class="mt-4 max-h-72 space-y-2 overflow-y-auto">
								{#each list.entries as entry (entry.id)}
									<div class="flex items-center gap-2 rounded bg-gray-800/70 px-3 py-2 text-sm">
										<div class="min-w-0 flex-1">
											<div class="truncate text-gray-200">{entry.title}</div>
											{#if entry.artist}
												<div class="truncate text-xs text-gray-500">{entry.artist}</div>
											{/if}
										</div>
										<form method="POST" action="?/deleteEntry" use:enhance>
											<input type="hidden" name="id" value={entry.id} />
											<button
												type="submit"
												class="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-200"
											>
												Delete
											</button>
										</form>
									</div>
								{:else}
									<p class="text-sm text-gray-500">No entries yet.</p>
								{/each}
							</div>
						</div>

						<form method="POST" action="?/addEntries" use:enhance class="space-y-3">
							<input type="hidden" name="listId" value={list.id} />
							<label class="block text-sm font-medium text-gray-300" for={`entries-${list.id}`}>
								Add Entries
							</label>
							<textarea
								id={`entries-${list.id}`}
								name="entries"
								rows="8"
								placeholder={list.kind === 'song'
									? 'Song Title by Artist\nSong Title - Artist'
									: 'Artist name\nAnother artist'}
								class="w-full rounded bg-gray-800 px-3 py-2 text-sm placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
							></textarea>
							<button
								type="submit"
								class="rounded bg-purple-600 px-3 py-2 text-sm font-medium hover:bg-purple-500"
							>
								Add Entries
							</button>
						</form>
					</div>
				</details>
			{:else}
				<p class="rounded-lg bg-gray-900 p-6 text-center text-gray-500">No lists yet.</p>
			{/each}
		</div>
	</div>
</div>
