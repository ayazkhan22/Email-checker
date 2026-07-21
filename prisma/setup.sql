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
    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);
