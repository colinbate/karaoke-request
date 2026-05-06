export type RandomListItem = {
	label: string;
	value: string;
	detail?: string;
};

function songValue(title: string, artist: string) {
	return JSON.stringify([title, artist]);
}

export const RANDOM_ARTISTS: readonly RandomListItem[] = [
	{ label: 'The Beatles', value: 'The Beatles' },
	{ label: 'The Beach Boys', value: 'The Beach Boys' },
	{ label: 'Elvis Presley', value: 'Elvis Presley' },
	{ label: 'Barenaked Ladies', value: 'Barenaked Ladies' },
	{ label: 'Great Big Sea', value: 'Great Big Sea' },
	{ label: 'Backstreet Boys', value: 'Backstreet Boys' },
	{ label: 'Britney Spears', value: 'Britney Spears' },
	{ label: 'Madonna', value: 'Madonna' },
	{ label: 'ABBA', value: 'ABBA' },
	{ label: 'Queen', value: 'Queen' },
	{ label: 'Elton John', value: 'Elton John' },
	{ label: 'Billy Joel', value: 'Billy Joel' },
	{ label: 'Bon Jovi', value: 'Bon Jovi' },
	{ label: 'Dolly Parton', value: 'Dolly Parton' },
	{ label: 'Lady Gaga', value: 'Lady Gaga' },
	{ label: 'Katy Perry', value: 'Katy Perry' },
	{ label: 'Bruno Mars', value: 'Bruno Mars' },
	{ label: 'Taylor Swift', value: 'Taylor Swift' },
	{ label: 'Shania Twain', value: 'Shania Twain' },
	{ label: 'Simon & Garfunkel', value: 'Simon & Garfunkel' },
] as const;

export const CHAOS_SONGS: readonly RandomListItem[] = [
	{
		label: 'Oh Pretty Woman',
		detail: 'Roy Orbison',
		value: songValue('Oh Pretty Woman', 'Roy Orbison'),
	},
	{
		label: 'Mrs. Robinson',
		detail: 'Simon & Garfunkel',
		value: songValue('Mrs. Robinson', 'Simon & Garfunkel'),
	},
	{ label: 'Barbie Girl', detail: 'Aqua', value: songValue('Barbie Girl', 'Aqua') },
	{
		label: 'I Want It That Way',
		detail: 'Backstreet Boys',
		value: songValue('I Want It That Way', 'Backstreet Boys'),
	},
	{
		label: "Livin' on a Prayer",
		detail: 'Bon Jovi',
		value: songValue("Livin' on a Prayer", 'Bon Jovi'),
	},
	{
		label: 'Never Gonna Give You Up',
		detail: 'Rick Astley',
		value: songValue('Never Gonna Give You Up', 'Rick Astley'),
	},
	{
		label: 'Baby One More Time',
		detail: 'Britney Spears',
		value: songValue('Baby One More Time', 'Britney Spears'),
	},
	{ label: 'Jolene', detail: 'Dolly Parton', value: songValue('Jolene', 'Dolly Parton') },
	{
		label: 'Mustang Sally',
		detail: 'The Commitments',
		value: songValue('Mustang Sally', 'The Commitments'),
	},
	{ label: 'Crazy', detail: 'Gnarls Barkley', value: songValue('Crazy', 'Gnarls Barkley') },
	{ label: 'Let It Be', detail: 'The Beatles', value: songValue('Let It Be', 'The Beatles') },
	{ label: 'Let It Go', detail: 'Frozen', value: songValue('Let It Go', 'Frozen') },
	{
		label: 'Sweet Dreams Are Made of This',
		detail: 'Eurythmics',
		value: songValue('Sweet Dreams Are Made of This', 'Eurythmics'),
	},
	{
		label: 'How You Remind Me',
		detail: 'Nickelback',
		value: songValue('How You Remind Me', 'Nickelback'),
	},
	{ label: 'Firework', detail: 'Katy Perry', value: songValue('Firework', 'Katy Perry') },
	{
		label: "Don't Want to Miss a Thing",
		detail: 'Aerosmith',
		value: songValue("Don't Want to Miss a Thing", 'Aerosmith'),
	},
	{ label: 'Grenade', detail: 'Bruno Mars', value: songValue('Grenade', 'Bruno Mars') },
	{ label: 'All Star', detail: 'Smash Mouth', value: songValue('All Star', 'Smash Mouth') },
	{ label: 'Wonderwall', detail: 'Oasis', value: songValue('Wonderwall', 'Oasis') },
	{ label: 'This Love', detail: 'Maroon 5', value: songValue('This Love', 'Maroon 5') },
	{
		label: 'Everybody',
		detail: 'Backstreet Boys',
		value: songValue('Everybody', 'Backstreet Boys'),
	},
	{
		label: 'Oops! I Did It Again',
		detail: 'Britney Spears',
		value: songValue('Oops! I Did It Again', 'Britney Spears'),
	},
	{ label: 'Ice Ice Baby', detail: 'Vanilla Ice', value: songValue('Ice Ice Baby', 'Vanilla Ice') },
	{
		label: 'Girls Just Wanna Have Fun',
		detail: 'Cyndi Lauper',
		value: songValue('Girls Just Wanna Have Fun', 'Cyndi Lauper'),
	},
	{
		label: 'I Will Survive',
		detail: 'Gloria Gaynor',
		value: songValue('I Will Survive', 'Gloria Gaynor'),
	},
	{
		label: "Summer of '69",
		detail: 'Bryan Adams',
		value: songValue("Summer of '69", 'Bryan Adams'),
	},
	{
		label: 'These Eyes',
		detail: 'The Guess Who',
		value: songValue('These Eyes', 'The Guess Who'),
	},
	{
		label: 'Call Me Maybe',
		detail: 'Carly Rae Jepsen',
		value: songValue('Call Me Maybe', 'Carly Rae Jepsen'),
	},
	{
		label: 'Summer Breeze',
		detail: 'Seals & Croft',
		value: songValue('Summer Breeze', 'Seals & Croft'),
	},
	{
		label: "I Just Can't Wait to Be King",
		detail: 'The Lion King',
		value: songValue("I Just Can't Wait to Be King", 'The Lion King'),
	},
] as const;
