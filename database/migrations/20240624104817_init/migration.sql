-- CreateTable
CREATE TABLE "participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "online" BOOLEAN DEFAULT 'false'
);
