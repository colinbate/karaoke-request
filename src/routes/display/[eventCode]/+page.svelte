<script lang="ts">
	import QRCode from 'qrcode';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import {
		DISPLAY_CHANNEL_NAME,
		createDisplayState,
		displayStateKey,
		isDisplayMessage,
		isDisplayState,
		type DisplayPatch,
		type DisplayState,
	} from '$lib/display';
	import { fade } from 'svelte/transition';

	let { data }: PageProps = $props();

	const fallbackState = $derived(createDisplayState(data.eventCode, data.requestUrl));
	let storedState = $state<DisplayState | null>(null);
	let qrCode = $state('');

	const displayState = $derived(storedState ?? fallbackState);
	const requestLabel = $derived(displayState.requestUrl.replace(/^https?:\/\//, ''));

	function persist(nextState: DisplayState) {
		localStorage.setItem(displayStateKey(data.eventCode), JSON.stringify(nextState));
	}

	function applyState(nextState: DisplayState) {
		const next = {
			...nextState,
			eventCode: data.eventCode,
			requestUrl: nextState.requestUrl || data.requestUrl,
		};
		storedState = next;
		persist(next);
	}

	function applyPatch(patch: DisplayPatch) {
		const next = {
			...displayState,
			...patch,
			eventCode: data.eventCode,
			updatedAt: Date.now(),
		};
		storedState = next;
		persist(next);
	}

	$effect(() => {
		const url = displayState.requestUrl;
		let cancelled = false;

		QRCode.toDataURL(url, {
			errorCorrectionLevel: 'M',
			margin: 2,
			scale: 8,
			color: {
				dark: '#111827',
				light: '#ffffff',
			},
		})
			.then((generated) => {
				if (!cancelled) {
					qrCode = generated;
				}
			})
			.catch((err: unknown) => console.error(err));

		return () => {
			cancelled = true;
		};
	});

	onMount(() => {
		const stored = localStorage.getItem(displayStateKey(data.eventCode));
		if (stored) {
			try {
				const parsed: unknown = JSON.parse(stored);
				if (isDisplayState(parsed) && parsed.eventCode === data.eventCode) {
					applyState(parsed);
				}
			} catch (err) {
				console.error(err);
			}
		}

		const channel = new BroadcastChannel(DISPLAY_CHANNEL_NAME);
		channel.onmessage = (event: MessageEvent<unknown>) => {
			const message = event.data;
			if (!isDisplayMessage(message) || message.eventCode !== data.eventCode) {
				return;
			}

			if (message.type === 'display:sync') {
				applyState(message.state);
				return;
			}

			if (message.type === 'display:patch') {
				applyPatch(message.patch);
				return;
			}
		};

		return () => {
			channel.close();
		};
	});
</script>

<svelte:head>
	<title>{data.eventName} Display</title>
</svelte:head>

<main
	class="relative h-dvh overflow-hidden bg-[#05050a] text-white"
	style:background={`radial-gradient(circle at 18% 16%, rgba(120, 60, 255, 0.24), transparent 34%),
		radial-gradient(circle at 82% 28%, rgba(0, 200, 255, 0.14), transparent 32%),
		radial-gradient(circle at 42% 95%, rgba(255, 80, 160, 0.12), transparent 36%),
		#05050a`}
>
	<div
		class="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.04),transparent_34%)]"
	></div>

	{#if displayState.showRequestUrl}
		<div
			transition:fade
			class="absolute top-6 left-6 max-w-[34vw] rounded-md border border-white/35 bg-black/35 px-5 py-3 text-white/80 shadow-2xl backdrop-blur-md"
		>
			<div class="text-[0.8vmin] tracking-[0.18em] text-white/45 uppercase">Requests</div>
			<div class="mt-1 truncate text-[2vmin] font-semibold">{requestLabel}</div>
		</div>
	{/if}

	{#if displayState.showQr}
		<section
			transition:fade
			class="absolute top-1/2 left-8 flex w-[min(32vw,max-content)] -translate-y-1/2 flex-col items-start gap-5 rounded-lg border border-white/35 bg-black/55 p-7 shadow-2xl backdrop-blur-xl"
		>
			<div>
				<div class="text-[1vmin] tracking-[0.2em] text-cyan-100/65 uppercase">Want to sing?</div>
				{#if qrCode}
					<div class="my-[1vmin] text-[2vmin] leading-tight font-semibold text-white">
						Scan to request a song
					</div>
					<img
						src={qrCode}
						alt="QR code for song requests"
						class="aspect-square w-[17vmin] rounded bg-white p-3"
					/>
				{/if}
			</div>
			<div class="max-w-full truncate text-[1vmin] text-white/70">{requestLabel}</div>
		</section>
	{/if}

	{#if displayState.upNext}
		<section
			transition:fade
			class="absolute bottom-8 left-8 max-w-[34vw] rounded-lg border border-white/35 bg-black/55 px-6 py-5 shadow-2xl backdrop-blur-xl"
		>
			<div class="text-[0.8vmin] tracking-[0.2em] text-purple-100/80 uppercase">Up next</div>
			<div class="mt-2 truncate text-[5vmin] leading-none font-semibold">
				{displayState.upNext.singer}
			</div>
			{#if displayState.upNext.title}
				<div class="mt-4 truncate text-[2vmin] text-white/80">{displayState.upNext.title}</div>
			{/if}
			{#if displayState.upNext.artist}
				<div class="mt-1 truncate text-[1.5vmin] text-white/50">{displayState.upNext.artist}</div>
			{/if}
		</section>
	{/if}
</main>
