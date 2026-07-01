CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  CONSTRAINT fk_posts_user_id_users FOREIGN KEY (user_id) REFERENCES users (id)
);
