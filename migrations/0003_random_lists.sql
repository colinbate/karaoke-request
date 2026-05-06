-- Migration number: 0003 	 2026-05-06T00:00:00.000Z
CREATE TABLE random_lists (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE random_list_entries (
  id INTEGER PRIMARY KEY,
  list_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (list_id) REFERENCES random_lists(id) ON DELETE CASCADE
);

CREATE TABLE event_random_lists (
  event_code TEXT NOT NULL,
  list_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (event_code, list_id),
  FOREIGN KEY (event_code) REFERENCES events(code) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES random_lists(id) ON DELETE CASCADE
);

CREATE INDEX idx_random_list_entries_list ON random_list_entries(list_id);
CREATE INDEX idx_event_random_lists_event ON event_random_lists(event_code);
CREATE INDEX idx_event_random_lists_list ON event_random_lists(list_id);

INSERT INTO random_lists (id, title, note, kind)
VALUES
  (1, 'Chaos List', 'Seeded list of preselected chaos songs for random requests.', 'song'),
  (2, 'Random Artists', 'Seeded list of familiar catalog artists for random artist searches.', 'artist');

INSERT INTO random_list_entries (list_id, title, artist, sort_order)
VALUES
  (1, 'Oh Pretty Woman', 'Roy Orbison', 1),
  (1, 'Mrs. Robinson', 'Simon & Garfunkel', 2),
  (1, 'Barbie Girl', 'Aqua', 3),
  (1, 'I Want It That Way', 'Backstreet Boys', 4),
  (1, 'Livin'' on a Prayer', 'Bon Jovi', 5),
  (1, 'Never Gonna Give You Up', 'Rick Astley', 6),
  (1, 'Baby One More Time', 'Britney Spears', 7),
  (1, 'Jolene', 'Dolly Parton', 8),
  (1, 'Mustang Sally', 'The Commitments', 9),
  (1, 'Crazy', 'Gnarls Barkley', 10),
  (1, 'Let It Be', 'The Beatles', 11),
  (1, 'Let It Go', 'Frozen', 12),
  (1, 'Sweet Dreams Are Made of This', 'Eurythmics', 13),
  (1, 'How You Remind Me', 'Nickelback', 14),
  (1, 'Firework', 'Katy Perry', 15),
  (1, 'Don''t Want to Miss a Thing', 'Aerosmith', 16),
  (1, 'Grenade', 'Bruno Mars', 17),
  (1, 'All Star', 'Smash Mouth', 18),
  (1, 'Wonderwall', 'Oasis', 19),
  (1, 'This Love', 'Maroon 5', 20),
  (1, 'Everybody', 'Backstreet Boys', 21),
  (1, 'Oops! I Did It Again', 'Britney Spears', 22),
  (1, 'Ice Ice Baby', 'Vanilla Ice', 23),
  (1, 'Girls Just Wanna Have Fun', 'Cyndi Lauper', 24),
  (1, 'I Will Survive', 'Gloria Gaynor', 25),
  (1, 'Summer of ''69', 'Bryan Adams', 26),
  (1, 'These Eyes', 'The Guess Who', 27),
  (1, 'Call Me Maybe', 'Carly Rae Jepsen', 28),
  (1, 'Summer Breeze', 'Seals & Croft', 29),
  (1, 'I Just Can''t Wait to Be King', 'The Lion King', 30),
  (2, 'The Beatles', NULL, 1),
  (2, 'The Beach Boys', NULL, 2),
  (2, 'Elvis Presley', NULL, 3),
  (2, 'Barenaked Ladies', NULL, 4),
  (2, 'Great Big Sea', NULL, 5),
  (2, 'Backstreet Boys', NULL, 6),
  (2, 'Britney Spears', NULL, 7),
  (2, 'Madonna', NULL, 8),
  (2, 'ABBA', NULL, 9),
  (2, 'Queen', NULL, 10),
  (2, 'Elton John', NULL, 11),
  (2, 'Billy Joel', NULL, 12),
  (2, 'Bon Jovi', NULL, 13),
  (2, 'Dolly Parton', NULL, 14),
  (2, 'Weird Al Yankovic', NULL, 15),
  (2, 'Katy Perry', NULL, 16),
  (2, 'Bruno Mars', NULL, 17),
  (2, 'Taylor Swift', NULL, 18),
  (2, 'Shania Twain', NULL, 19),
  (2, 'Simon & Garfunkel', NULL, 20);
