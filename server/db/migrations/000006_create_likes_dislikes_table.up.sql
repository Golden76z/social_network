CREATE TABLE IF NOT EXISTS likes_dislikes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  post_id INTEGER,
  comment_id INTEGER,
  group_post_id INTEGER,
  group_comment_id INTEGER,
  type VARCHAR(7) NOT NULL CHECK (type IN ('like', 'dislike')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (group_post_id) REFERENCES group_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (group_comment_id) REFERENCES group_comments(id) ON DELETE CASCADE
);