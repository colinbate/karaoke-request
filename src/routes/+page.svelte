<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head>
	<title>Karaoke</title>
</svelte:head>
<div class="flex min-h-dvh flex-col items-center justify-center p-4">
	<div class="w-full max-w-md text-center">
		<svg class="mx-auto size-16 text-purple-500" viewBox="0 0 640 640" fill="currentColor"
			><path
				d="M499.7 70.8C507.5 76.8 512 86.1 512 96L512 192C512 206.7 502 219.5 487.8 223L384 249L384 464C384 517 333.9 560 272 560C210.1 560 160 517 160 464C160 411 210.1 368 272 368C289.2 368 305.5 371.3 320 377.2L320 128C320 113.3 330 100.5 344.2 97L472.2 65C481.8 62.6 491.9 64.8 499.7 70.8z"
			/></svg
		>
		<h1 class="relative mt-4 text-3xl font-bold">
			<span class="absolute bottom-full -translate-x-1/2 -rotate-12 text-xl text-purple-200"
				>Colin's</span
			>Karaoke
		</h1>

		{#if data.events.length > 0}
			<p class="mt-2 text-gray-400">Join an active event:</p>
			<div class="my-6 space-y-3">
				{#each data.events as event (event.id)}
					<a
						href={resolve(`/event/${event.code}`)}
						class="block rounded-lg bg-purple-600 px-6 py-4 text-lg font-medium hover:bg-purple-500"
					>
						{event.name}
					</a>
				{/each}
			</div>
			<p class="mt-2 text-sm text-gray-600">
				...or <a
					href={resolve('/event/browse')}
					class="text-purple-600 underline hover:text-purple-500">browse the song list</a
				>.
			</p>
		{:else}
			<p class="mt-6 text-gray-500">No active events right now.</p>
			<p class="mt-2 text-sm text-gray-600">
				Check back later or <a
					href={resolve('/event/browse')}
					class="text-purple-600 underline hover:text-purple-500">browse the song list</a
				>.
			</p>
		{/if}
	</div>
</div>
