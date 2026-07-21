-- Run this once in Supabase → SQL Editor if migrations were not applied
CREATE TABLE IF NOT EXISTS "Email" (
    "id" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "pixelLoads" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- If the table already exists, add the tracking column:
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "pixelLoads" INTEGER NOT NULL DEFAULT 0;
