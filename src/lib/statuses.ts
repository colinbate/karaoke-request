export const EVENT_STATUS_COLORS = {
	upcoming: 'bg-blue-600',
	active: 'bg-green-600',
	complete: 'bg-gray-600',
	cancelled: 'bg-red-900',
} as const;
export type EventStatus = keyof typeof EVENT_STATUS_COLORS;
export const isEventStatus = (s: string): s is EventStatus => {
	return s in EVENT_STATUS_COLORS;
};
