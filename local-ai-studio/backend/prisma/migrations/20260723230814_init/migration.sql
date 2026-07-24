-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'wallet');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "imageCredits" INTEGER NOT NULL DEFAULT 9,
    "videoCredits" INTEGER NOT NULL DEFAULT 42,
    "maxImageCredits" INTEGER NOT NULL DEFAULT 0,
    "maxVideoCredits" INTEGER NOT NULL DEFAULT 0,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "role" "Role" NOT NULL DEFAULT 'user',
    "legacyOdooUserId" INTEGER,
    "needsPasswordReset" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymobOrderId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "creditsPackage" JSONB NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'card',
    "rawCallback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generationType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT,
    "inputFileUrl" TEXT,
    "outputUrl" TEXT,
    "creditsSpent" INTEGER NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'queued',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Credit Configuration',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "daily_trial_image_credits" INTEGER NOT NULL DEFAULT 9,
    "daily_trial_video_credits" INTEGER NOT NULL DEFAULT 42,
    "default_image_deduction" INTEGER NOT NULL DEFAULT 1,
    "default_video_deduction" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditDeduction" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "generation_type" TEXT NOT NULL,
    "image_credits" INTEGER NOT NULL DEFAULT 0,
    "video_credits" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "description" TEXT,

    CONSTRAINT "CreditDeduction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyOdooUserId_key" ON "User"("legacyOdooUserId");

-- CreateIndex
CREATE INDEX "User_legacyOdooUserId_idx" ON "User"("legacyOdooUserId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Generation_userId_idx" ON "Generation"("userId");

-- CreateIndex
CREATE INDEX "CreditConfig_active_idx" ON "CreditConfig"("active");

-- CreateIndex
CREATE INDEX "CreditDeduction_configId_generation_type_idx" ON "CreditDeduction"("configId", "generation_type");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditDeduction" ADD CONSTRAINT "CreditDeduction_configId_fkey" FOREIGN KEY ("configId") REFERENCES "CreditConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

