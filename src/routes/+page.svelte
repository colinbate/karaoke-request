<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<div class="flex min-h-dvh flex-col items-center justify-center p-4">
	<div class="w-full max-w-md text-center">
		<svg class="mx-auto h-16 w-16 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
			<path
				d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
			/>
		</svg>
		<h1 class="mt-4 text-3xl font-bold">Karaoke</h1>

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
