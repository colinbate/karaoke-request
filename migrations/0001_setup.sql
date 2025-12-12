-- Migration number: 0001 	 2025-12-12T03:02:17.132Z
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'active' | 'cancelled' | 'complete'
  event_date TEXT NOT NULL DEFAULT (DATE('now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%FT%H:%M:%fZ', 'now'))
);


CREATE TABLE requests (
  id INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'done'
  event_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%FT%H:%M:%fZ', 'now')),
  FOREIGN KEY (event_code) REFERENCES events(code)
);

CREATE INDEX idx_requests_event_code ON requests(event_code);
CREATE INDEX idx_requests_session ON requests(session_id);
CREATE INDEX idx_events_code ON events(code);
CREATE INDEX idx_events_status ON events(status);
