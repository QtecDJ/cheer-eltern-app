-- Add ToDoComment table for todo replies
CREATE TABLE IF NOT EXISTS "ToDoComment" (
  "id" SERIAL PRIMARY KEY,
  "todoId" INTEGER NOT NULL,
  "authorId" INTEGER NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT now()
);

ALTER TABLE "ToDoComment" ADD CONSTRAINT "ToDoComment_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "ToDo"(id) ON DELETE CASCADE;
ALTER TABLE "ToDoComment" ADD CONSTRAINT "ToDoComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Member"(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "ToDoComment_todoId_idx" ON "ToDoComment" ("todoId");
CREATE INDEX IF NOT EXISTS "ToDoComment_authorId_idx" ON "ToDoComment" ("authorId");
