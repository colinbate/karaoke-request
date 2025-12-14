-- Migration number: 0002 	 2025-12-14T02:02:59.513Z
DROP TABLE requests;

CREATE TABLE requests (
  id INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'done'
  event_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%FT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%FT%H:%M:%fZ', 'now')),
  FOREIGN KEY (event_code) REFERENCES events(code)
);
