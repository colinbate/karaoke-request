export const DISPLAY_CHANNEL_NAME = 'karaoke-display';
export const DISPLAY_STATE_KEY = 'karaoke-display-state';

export type DisplayMode = 'idle' | 'singing' | 'betweenSongs' | 'break';

export type DisplayUpNext = {
	requestId?: number;
	singer: string;
	title?: string;
	artist?: string;
	randomLabel?: string;
};

export type DisplayState = {
	eventCode: string;
	mode: DisplayMode;
	upNext: DisplayUpNext | null;
	showRequestUrl: boolean;
	requestUrl: string;
	showQr: boolean;
	showLogo: boolean;
	topMessagesEnabled: boolean;
	topMessages: string[];
	pinnedMessage: string | null;
	updatedAt: number;
};

export type DisplayPatch = Partial<DisplayState>;

export type DisplayMessage =
	| {
			type: 'display:patch';
			eventCode: string;
			patch: DisplayPatch;
			at: number;
	  }
	| {
			type: 'display:sync';
			eventCode: string;
			state: DisplayState;
			at: number;
	  }
	| {
			type: 'display:showQr';
			eventCode: string;
			durationMs: number;
			at: number;
	  };

export function displayStateKey(eventCode: string) {
	return `${DISPLAY_STATE_KEY}:${eventCode}`;
}

export function createDisplayState(eventCode: string, requestUrl: string): DisplayState {
	return {
		eventCode,
		mode: 'idle',
		upNext: null,
		showRequestUrl: true,
		requestUrl,
		showQr: false,
		showLogo: false,
		topMessagesEnabled: false,
		topMessages: [],
		pinnedMessage: null,
		updatedAt: Date.now(),
	};
}

export function isDisplayState(value: unknown): value is DisplayState {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const state = value as Record<string, unknown>;
	return (
		typeof state.eventCode === 'string' &&
		typeof state.mode === 'string' &&
		(state.upNext === null || typeof state.upNext === 'object') &&
		typeof state.showRequestUrl === 'boolean' &&
		typeof state.showQr === 'boolean' &&
		(state.showLogo === undefined || typeof state.showLogo === 'boolean') &&
		typeof state.requestUrl === 'string' &&
		typeof state.topMessagesEnabled === 'boolean' &&
		Array.isArray(state.topMessages) &&
		(state.pinnedMessage === null || typeof state.pinnedMessage === 'string') &&
		typeof state.updatedAt === 'number'
	);
}

export function isDisplayMessage(value: unknown): value is DisplayMessage {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const message = value as Record<string, unknown>;
	if (typeof message.eventCode !== 'string' || typeof message.at !== 'number') {
		return false;
	}

	if (message.type === 'display:patch') {
		return !!message.patch && typeof message.patch === 'object';
	}

	if (message.type === 'display:sync') {
		return isDisplayState(message.state);
	}

	if (message.type === 'display:showQr') {
		return typeof message.durationMs === 'number';
	}

	return false;
}
