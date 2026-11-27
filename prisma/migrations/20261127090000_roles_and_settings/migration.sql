-- Roles: the account that already exists (created from ADMIN_EMAIL) is the
-- developer's, so it becomes the super admin. New accounts default to owner.
CREATE TYPE "Role" AS ENUM ('super_admin', 'owner');

ALTER TABLE "admins"
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN "role" "Role" NOT NULL DEFAULT 'owner';

UPDATE "admins" SET "role" = 'super_admin';

-- The business name moves from the admin row to one shared settings row.
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "business_name" TEXT NOT NULL DEFAULT 'রেন্ট এ কার',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "settings" ("id", "business_name", "updated_at")
SELECT 1, COALESCE((SELECT "business_name" FROM "admins" ORDER BY "created_at" LIMIT 1), 'রেন্ট এ কার'), NOW();

ALTER TABLE "admins" DROP COLUMN "business_name";
