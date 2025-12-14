<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<div class="flex min-h-dvh flex-col items-center justify-center p-4">
	<div class="w-full max-w-md text-center">
		<svg class="mx-auto size-16 text-purple-500" viewBox="0 0 640 640" fill="currentColor"
			><path
				d="M499.7 70.8C507.5 76.8 512 86.1 512 96L512 192C512 206.7 502 219.5 487.8 223L384 249L384 464C384 517 333.9 560 272 560C210.1 560 160 517 160 464C160 411 210.1 368 272 368C289.2 368 305.5 371.3 320 377.2L320 128C320 113.3 330 100.5 344.2 97L472.2 65C481.8 62.6 491.9 64.8 499.7 70.8z"
			/></svg
		>
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
