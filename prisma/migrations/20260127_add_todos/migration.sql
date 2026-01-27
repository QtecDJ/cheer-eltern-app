-- Create ToDo table (additive)
CREATE TABLE "ToDo" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(50) NOT NULL DEFAULT 'open',
  "priority" VARCHAR(50) NOT NULL DEFAULT 'normal',
  "dueDate" TIMESTAMP(3),
  "creatorId" INTEGER NOT NULL,
  "assigneeId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "todo_status_idx" ON "ToDo" ("status");
CREATE INDEX IF NOT EXISTS "todo_priority_idx" ON "ToDo" ("priority");
CREATE INDEX IF NOT EXISTS "todo_assignee_idx" ON "ToDo" ("assigneeId");
CREATE INDEX IF NOT EXISTS "todo_creator_idx" ON "ToDo" ("creatorId");

-- Foreign keys
ALTER TABLE "ToDo" ADD CONSTRAINT "todo_creator_fkey" FOREIGN KEY ("creatorId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToDo" ADD CONSTRAINT "todo_assignee_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
