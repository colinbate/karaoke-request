<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { RandomListItem } from '$lib/random-lists';

	type Props = {
		title: string;
		items: readonly RandomListItem[];
		onCancel: () => void;
		onPick: (item: RandomListItem) => void;
		pickedLabel?: string;
	};

	type VisibleItem = {
		item: RandomListItem;
		offset: number;
	};

	let { title, items, onCancel, onPick, pickedLabel = 'Selected' }: Props = $props();

	let selectedIndex = $state(0);
	let pickedIndex = $state<number | null>(null);
	let timers: Array<ReturnType<typeof setTimeout>> = [];

	let visibleItems: VisibleItem[] = $derived.by(() => {
		if (items.length === 0) {
			return [];
		}

		return [-2, -1, 0, 1, 2].map((offset) => ({
			item: items[(selectedIndex + offset + items.length) % items.length],
			offset,
		}));
	});

	let status = $derived(pickedIndex === null ? 'Rolling...' : pickedLabel);

	function randomIndex(length: number) {
		return Math.floor(Math.random() * length);
	}

	function queue(callback: () => void, delay: number) {
		const timer = setTimeout(callback, delay);
		timers.push(timer);
	}

	function clearTimers() {
		for (const timer of timers) {
			clearTimeout(timer);
		}
		timers = [];
	}

	function finish(index: number) {
		const item = items[index] ?? items[0];
		if (!item) {
			onCancel();
			return;
		}

		selectedIndex = index;
		pickedIndex = index;
		queue(() => onPick(item), 700);
	}

	function roll() {
		if (items.length === 0) {
			onCancel();
			return;
		}

		const winningIndex = randomIndex(items.length);
		const totalTicks = 26 + randomIndex(8);
		let tick = 0;

		selectedIndex = randomIndex(items.length);

		const next = () => {
			if (tick >= totalTicks) {
				finish(winningIndex);
				return;
			}

			tick += 1;
			selectedIndex = (selectedIndex + 1) % items.length;
			const progress = tick / totalTicks;
			queue(next, 40 + Math.round(150 * progress * progress));
		};

		queue(next, 120);
	}

	onMount(() => {
		roll();
		return clearTimers;
	});
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
	role="presentation"
	transition:fade={{ duration: 120 }}
>
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="random-picker-title"
		class="w-full max-w-md overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-2xl shadow-black"
	>
		<div class="flex items-center justify-between border-b border-gray-800 px-4 py-3">
			<div>
				<h2 id="random-picker-title" class="font-semibold">{title}</h2>
				<p class="text-sm text-gray-400" aria-live="polite">{status}</p>
			</div>
			<button
				type="button"
				onclick={onCancel}
				class="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
				aria-label="Cancel random picker"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="size-6"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="relative h-64 overflow-hidden px-4 py-5">
			<div
				class="pointer-events-none absolute inset-x-0 top-1/2 z-10 mx-4 h-14 -translate-y-1/2 rounded border border-purple-500/60 bg-purple-500/10 shadow-lg shadow-purple-950/40"
			></div>
			<div class="grid h-full grid-rows-5 gap-2">
				{#each visibleItems as visible, index (`${visible.item.value}-${visible.offset}-${index}`)}
					<div
						class={[
							'flex min-w-0 flex-col justify-center rounded px-3 text-center transition-all duration-100',
							visible.offset === 0 ? 'scale-105 text-gray-50' : 'scale-95 text-gray-500 opacity-60',
						]}
					>
						<div class="truncate font-medium">{visible.item.label}</div>
						{#if visible.item.detail}
							<div class="truncate text-sm text-gray-400">{visible.item.detail}</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
