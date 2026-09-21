ALTER TABLE courses ADD COLUMN login_required INTEGER NOT NULL DEFAULT 1 CHECK (login_required IN (0,1));
