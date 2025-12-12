export function partition<T>(arr: T[], criteria: (x: T) => boolean) {
	return arr.reduce((acc, i) => (acc[criteria(i) ? 0 : 1].push(i), acc), [[], []] as [T[], T[]]);
}
