<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import EventStatus from '$lib/comp/event-status.svelte';

	let { data } = $props();

	let newEventName = $state('');
	let newEventDate = $state(new Date().toISOString().split('T')[0]);

	const statusOptions = ['upcoming', 'active', 'complete', 'cancelled'];
</script>

<div class="min-h-dvh p-4">
	<div class="mx-auto max-w-4xl">
		<header class="mb-6 flex items-center justify-between">
			<h1 class="text-2xl font-bold">Event Management</h1>
		</header>

		<!-- Create new event -->
		<form method="POST" action="?/create" use:enhance class="mb-8 rounded-lg bg-gray-900 p-4">
			<h2 class="mb-3 font-medium">Create New Event</h2>
			<div class="flex flex-wrap gap-3">
				<input
					type="text"
					name="name"
					bind:value={newEventName}
					placeholder="Event name"
					required
					class="flex-1 rounded bg-gray-800 px-3 py-2 placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
				/>
				<input
					type="date"
					name="eventDate"
					bind:value={newEventDate}
					class="rounded bg-gray-800 px-3 py-2 focus:ring-1 focus:ring-purple-500 focus:outline-none"
				/>
				<button
					type="submit"
					class="rounded bg-purple-600 px-4 py-2 font-medium hover:bg-purple-500"
				>
					Create
				</button>
			</div>
		</form>

		<!-- Events list -->
		<div class="space-y-3">
			{#each data.events as event (event.id)}
				<div class="flex items-center gap-4 rounded-lg bg-gray-900 p-4">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<span class="font-medium">{event.name}</span>
							<EventStatus {event} />
						</div>
						<div class="mt-1 text-sm text-gray-500">
							{event.eventDate} · <code class="text-gray-400">{event.code}</code>
						</div>
					</div>

					<form method="POST" action="?/updateStatus" use:enhance class="flex items-center gap-2">
						<input type="hidden" name="code" value={event.code} />
						<select
							name="status"
							class="rounded bg-gray-800 px-2 py-1 text-sm focus:ring-1 focus:ring-purple-500 focus:outline-none"
						>
							{#each statusOptions as status (status)}
								<option value={status} selected={event.status === status}>{status}</option>
							{/each}
						</select>
						<button type="submit" class="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600">
							Update
						</button>
					</form>

					<a
						href={resolve(`/admin/${event.code}`)}
						class="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600"
					>
						Queue →
					</a>
				</div>
			{/each}

			{#if data.events.length === 0}
				<p class="text-center text-gray-500">No events yet. Create one above.</p>
			{/if}
		</div>
	</div>
</div>
