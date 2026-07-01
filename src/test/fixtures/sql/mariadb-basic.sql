CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) NOT NULL
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  CONSTRAINT fk_posts_user_id_users FOREIGN KEY (user_id) REFERENCES users (id)
);
