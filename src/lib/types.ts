// Song array indices
export const S = {
	TITLE: 0,
	ARTIST: 1,
	YEAR: 2,
	DUO: 3,
	EXPLICIT: 4,
	STYLES: 5,
} as const;

// [title, artist, year, duo, explicit, styles]
export type Song = [string, string, number, 0 | 1, 0 | 1, string];

// Session ID helpers
export const SESSION_KEY = 'karaoke_session_id';

export const CODE_REGEX = /^[A-Z0-9]{10}$/;
