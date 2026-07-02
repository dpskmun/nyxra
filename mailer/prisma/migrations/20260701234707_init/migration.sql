-- CreateEnum
CREATE TYPE "emailType" AS ENUM ('BULK', 'TRANSACTIONAL', 'LIST', 'SPAM');

-- CreateEnum
CREATE TYPE "priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "icalMethod" AS ENUM ('PUBLISH', 'REQUEST', 'CANCEL');

-- CreateEnum
CREATE TYPE "status" AS ENUM ('DRAFT', 'VALIDATING', 'SCHEDULED', 'ONGOING', 'VERIFYING', 'SENT');

-- CreateEnum
CREATE TYPE "toSatus" AS ENUM ('PENDING', 'VALIDATING', 'VALIDATED', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "accessKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "configuration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "emailType" "emailType" NOT NULL,
    "status" "status" NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "isSes" BOOLEAN NOT NULL,
    "smtpId" TEXT,
    "sesConfigurationId" TEXT,
    "priority" "priority" NOT NULL,
    "fromName" TEXT,
    "fromEmail" TEXT NOT NULL,
    "cc" TEXT[],
    "bcc" TEXT[],
    "replyTo" TEXT,
    "subject" TEXT NOT NULL,
    "htmlTemplate" TEXT,
    "textTemplate" TEXT,
    "valueReplacer" BOOLEAN NOT NULL DEFAULT false,
    "valuesCsv" TEXT,
    "icalEventId" TEXT,
    "accessEndPoint" BOOLEAN NOT NULL DEFAULT false,
    "accessEndPointUri" TEXT,

    CONSTRAINT "configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "accessKeyStatus" "accessKeyStatus" NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "configurationId" TEXT NOT NULL,

    CONSTRAINT "accessKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toList" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "status" "toSatus" NOT NULL,
    "unsubscribe" BOOLEAN NOT NULL DEFAULT false,
    "analyticsId" TEXT,

    CONSTRAINT "toList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filelink" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMTP" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secure" BOOLEAN NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rateLimitMS" INTEGER NOT NULL,
    "inUse" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SMTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesConfiguration" (
    "id" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "rateLimitMS" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "inUse" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sesConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icalEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" "icalMethod" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "icalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mailHeader" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,

    CONSTRAINT "mailHeader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuration_slug_key" ON "configuration"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "accessKey_key_key" ON "accessKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "toList_email_configurationId_key" ON "toList"("email", "configurationId");

-- AddForeignKey
ALTER TABLE "configuration" ADD CONSTRAINT "configuration_smtpId_fkey" FOREIGN KEY ("smtpId") REFERENCES "SMTP"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration" ADD CONSTRAINT "configuration_sesConfigurationId_fkey" FOREIGN KEY ("sesConfigurationId") REFERENCES "sesConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration" ADD CONSTRAINT "configuration_icalEventId_fkey" FOREIGN KEY ("icalEventId") REFERENCES "icalEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessKey" ADD CONSTRAINT "accessKey_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "configuration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toList" ADD CONSTRAINT "toList_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "configuration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toList" ADD CONSTRAINT "toList_analyticsId_fkey" FOREIGN KEY ("analyticsId") REFERENCES "analytics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "configuration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailHeader" ADD CONSTRAINT "mailHeader_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "configuration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
