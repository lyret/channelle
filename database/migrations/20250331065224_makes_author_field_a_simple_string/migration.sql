-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "backstage" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participantId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Message" ("backstage", "createdAt", "id", "message", "participantId") SELECT "backstage", "createdAt", "id", "message", "participantId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
