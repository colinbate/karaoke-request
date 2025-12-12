<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<div class="flex min-h-dvh flex-col items-center justify-center p-4">
	<div class="w-full max-w-md text-center">
		<svg class="mx-auto h-16 w-16 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
			<path
				d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
			/>
		</svg>
		<h1 class="mt-4 text-3xl font-bold">
			<span class="absolute bottom-full -translate-x-1/2 -rotate-12 text-xl text-purple-200"
				>Colin's</span
			>Karaoke
		</h1>

		<p class="mt-6 text-lg">Error ({page.status})</p>
		<p class="mt-6 text-lg">{page.error?.message ?? 'Unknown error'}</p>
		<p class="mt-6 text-base text-gray-400">
			Try <a href={resolve('/')} class="text-purple-600 underline hover:text-purple-500">home</a> or
			<a href={resolve('/event/browse')} class="text-purple-600 underline hover:text-purple-500"
				>browse the song list</a
			>.
		</p>
	</div>
</div>
