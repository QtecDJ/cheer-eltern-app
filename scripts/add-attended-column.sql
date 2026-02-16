-- Add attended column to AnnouncementRSVP table
-- This allows recording whether someone who RSVPed actually attended

ALTER TABLE "AnnouncementRSVP" 
ADD COLUMN IF NOT EXISTS "attended" BOOLEAN;

-- The column is nullable by default:
-- null = not confirmed
-- true = attended
-- false = did not attend
