-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "actor" BOOLEAN NOT NULL DEFAULT false,
    "manager" BOOLEAN NOT NULL DEFAULT false,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "producingVideo" BOOLEAN NOT NULL DEFAULT false,
    "producingAudio" BOOLEAN NOT NULL DEFAULT false,
    "allowedVideo" BOOLEAN NOT NULL DEFAULT true,
    "allowedAudio" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Participant" ("actor", "blocked", "id", "manager", "name", "online") SELECT "actor", "blocked", "id", "manager", "name", "online" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
