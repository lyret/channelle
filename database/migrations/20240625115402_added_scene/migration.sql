/*
  Warnings:

  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Test";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Scene" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "layout" TEXT NOT NULL
);
