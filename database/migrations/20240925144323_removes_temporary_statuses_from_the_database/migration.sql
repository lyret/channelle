/*
  Warnings:

  - You are about to drop the column `allowedAudio` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `allowedVideo` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `online` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `producingAudio` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `producingVideo` on the `Participant` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "actor" BOOLEAN NOT NULL DEFAULT false,
    "manager" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Participant" ("actor", "blocked", "id", "manager", "name") SELECT "actor", "blocked", "id", "manager", "name" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
