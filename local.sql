PRAGMA defer_foreign_keys=TRUE;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Insert a test user (password is plain text; update if your backend expects a hash)
INSERT INTO users (username, password) VALUES ('testuser', 'testpassword');