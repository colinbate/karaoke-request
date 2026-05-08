-- Migration number: 0004 	 2026-05-07T00:00:00.000Z
ALTER TABLE requests ADD COLUMN from_random_list INTEGER NOT NULL DEFAULT 0;
ALTER TABLE requests ADD COLUMN random_list_title TEXT;
ALTER TABLE requests ADD COLUMN random_list_kind TEXT;
