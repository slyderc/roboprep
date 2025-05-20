-- AlterTable to add userId to Response
ALTER TABLE "Response" ADD COLUMN "userId" TEXT;

-- Add foreign key constraint
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "userId" TEXT,
    "responseText" TEXT NOT NULL,
    "modelUsed" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "createdAt" DATETIME NOT NULL,
    "lastEdited" DATETIME,
    "variablesUsed" TEXT,
    CONSTRAINT "Response_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Response_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Response" ("id", "promptId", "responseText", "modelUsed", "promptTokens", "completionTokens", "totalTokens", "createdAt", "lastEdited", "variablesUsed", "userId")
SELECT "id", "promptId", "responseText", "modelUsed", "promptTokens", "completionTokens", "totalTokens", "createdAt", "lastEdited", "variablesUsed", NULL
FROM "Response";

DROP TABLE "Response";
ALTER TABLE "new_Response" RENAME TO "Response";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- Update the _prisma_migrations table to mark removed tables as applied
INSERT OR IGNORE INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES ('47d77070-0000-0000-0000-000000000000', 'removed_deprecated_tables', datetime('now'), '20250520000000_remove_deprecated_tables', NULL, NULL, datetime('now'), 1);