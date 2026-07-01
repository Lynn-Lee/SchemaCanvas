CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) NOT NULL
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  CONSTRAINT fk_posts_user_id_users FOREIGN KEY (user_id) REFERENCES users (id)
);
