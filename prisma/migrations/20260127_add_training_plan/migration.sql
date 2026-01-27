-- Manual migration: add TrainingPlan table

CREATE TABLE IF NOT EXISTS "TrainingPlan" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TIMESTAMPTZ NOT NULL,
  "startAt" TIMESTAMPTZ,
  "endAt" TIMESTAMPTZ,
  "location" TEXT,
  "objectives" JSONB,
  "drills" JSONB,
  "materials" JSONB,
  "teamId" INTEGER,
  "creatorId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "trainingplan_date_idx" ON "TrainingPlan" ("date");
CREATE INDEX IF NOT EXISTS "trainingplan_creator_idx" ON "TrainingPlan" ("creatorId");
CREATE INDEX IF NOT EXISTS "trainingplan_team_idx" ON "TrainingPlan" ("teamId");

ALTER TABLE "TrainingPlan" ADD CONSTRAINT "trainingplan_creator_fkey" FOREIGN KEY ("creatorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "trainingplan_team_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
