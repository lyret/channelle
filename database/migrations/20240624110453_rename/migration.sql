/*
  Warnings:

  - You are about to drop the `participant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "participant";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "online" BOOLEAN DEFAULT 'false'
);
