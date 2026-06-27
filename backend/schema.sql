CREATE TABLE IF NOT EXISTS blobs (
  userId           TEXT NOT NULL,
  collection       TEXT NOT NULL,
  clientMutationId TEXT NOT NULL,
  ciphertext       TEXT NOT NULL,
  updatedAt        INTEGER NOT NULL,
  PRIMARY KEY (userId, collection, clientMutationId)
);

CREATE INDEX IF NOT EXISTS idx_blobs_user_collection
  ON blobs (userId, collection, updatedAt);
