CREATE TABLE users (
  id NUMBER PRIMARY KEY,
  email VARCHAR2(255) NOT NULL
);

CREATE TABLE posts (
  id NUMBER PRIMARY KEY,
  user_id NUMBER NOT NULL,
  title VARCHAR2(255) NOT NULL,
  CONSTRAINT fk_posts_user_id_users FOREIGN KEY (user_id) REFERENCES users (id)
);
