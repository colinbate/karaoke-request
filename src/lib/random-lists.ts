export type RandomListKind = 'song' | 'artist';

export type RandomListItem = {
	label: string;
	value: string;
	detail?: string;
};

export type RandomPickerList = {
	id: number;
	title: string;
	note: string;
	kind: RandomListKind;
	items: RandomListItem[];
};

export function songValue(title: string, artist: string) {
	return JSON.stringify([title, artist]);
}

export function randomListBadgeLabel(kind: RandomListKind, title: string) {
	return kind === 'song' ? `Random song: ${title}` : `Random artist: ${title}`;
}
