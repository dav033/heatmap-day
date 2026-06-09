-- CreateTable
CREATE TABLE "DayEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "score" REAL,
    "note" TEXT,
    "predictedScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DayEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tracker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT,
    "target" REAL,
    "expectedPolarity" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "categoryId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" DATETIME,
    CONSTRAINT "Tracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tracker_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrackerValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayEntryId" TEXT NOT NULL,
    "trackerId" TEXT NOT NULL,
    "boolValue" BOOLEAN,
    "numericValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrackerValue_dayEntryId_fkey" FOREIGN KEY ("dayEntryId") REFERENCES "DayEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrackerValue_trackerId_fkey" FOREIGN KEY ("trackerId") REFERENCES "Tracker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DayTag" (
    "dayEntryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("dayEntryId", "tagId"),
    CONSTRAINT "DayTag_dayEntryId_fkey" FOREIGN KEY ("dayEntryId") REFERENCES "DayEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DayTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DayEntry_userId_date_idx" ON "DayEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DayEntry_userId_date_key" ON "DayEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "Tracker_userId_idx" ON "Tracker"("userId");

-- CreateIndex
CREATE INDEX "Tracker_userId_archivedAt_idx" ON "Tracker"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "TrackerValue_trackerId_idx" ON "TrackerValue"("trackerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackerValue_dayEntryId_trackerId_key" ON "TrackerValue"("dayEntryId", "trackerId");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE INDEX "DayTag_tagId_idx" ON "DayTag"("tagId");
