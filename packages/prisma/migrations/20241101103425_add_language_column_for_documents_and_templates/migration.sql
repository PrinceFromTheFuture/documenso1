-- AlterTable
ALTER TABLE "DocumentMeta" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'he';

-- AlterTable
ALTER TABLE "TemplateMeta" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';
