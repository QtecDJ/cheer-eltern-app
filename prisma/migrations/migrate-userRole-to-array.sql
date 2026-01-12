-- AlterTable: Ändere userRole von String zu String Array
-- Schritt 1: Erstelle temporäre Spalte
ALTER TABLE "Member" ADD COLUMN "userRole_new" TEXT[];

-- Schritt 2: Migriere existierende Daten
UPDATE "Member" 
SET "userRole_new" = CASE 
  WHEN "userRole" IS NULL THEN ARRAY['member']::TEXT[]
  ELSE ARRAY["userRole"]::TEXT[]
END;

-- Schritt 3: Lösche alte Spalte
ALTER TABLE "Member" DROP COLUMN "userRole";

-- Schritt 4: Benenne neue Spalte um
ALTER TABLE "Member" RENAME COLUMN "userRole_new" TO "userRole";

-- Schritt 5: Setze Default
ALTER TABLE "Member" ALTER COLUMN "userRole" SET DEFAULT ARRAY['member']::TEXT[];

-- Schritt 6: Setze NOT NULL
ALTER TABLE "Member" ALTER COLUMN "userRole" SET NOT NULL;
